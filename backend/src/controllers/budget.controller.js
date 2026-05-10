const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { logActivity } = require('../utils/activityLog');
const { createNotification } = require('../utils/notifications');
const { getIO } = require('../socket/socketManager');

// GET /trips/:tripId/budget
exports.getBudgetSummary = catchAsync(async (req, res) => {
  const tripId = req.trip._id;

  const [expenses, categoryBreakdown, dailyBreakdown] = await Promise.all([
    Expense.find({ trip: tripId })
      .populate('paidBy', 'name avatar')
      .sort('-date'),
    Expense.aggregate([
      { $match: { trip: tripId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amountInBaseCurrency' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: { trip: tripId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amountInBaseCurrency' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalSpent = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);

  // Per-person balance calculation
  const balances = calculateBalances(expenses, req.trip.collaborators, req.trip.owner);

  res.json({
    success: true,
    data: {
      budget: req.trip.budget,
      totalSpent,
      remaining: (req.trip.budget.total || 0) - totalSpent,
      percentUsed: req.trip.budget.total
        ? Math.round((totalSpent / req.trip.budget.total) * 100)
        : 0,
      categoryBreakdown,
      dailyBreakdown,
      expenses,
      balances,
    },
  });
});

// POST /trips/:tripId/budget/expenses
exports.addExpense = catchAsync(async (req, res) => {
  const { title, amount, currency, category, date, paidBy, splitType, splits, notes, tags, linkedActivity } = req.body;

  // Calculate splits
  let calculatedSplits = [];
  const allMembers = [
    req.trip.owner._id,
    ...req.trip.collaborators.map((c) => c.user._id),
  ];

  if (splitType === 'equal' && allMembers.length > 1) {
    const share = amount / allMembers.length;
    calculatedSplits = allMembers
      .filter((id) => id.toString() !== paidBy)
      .map((id) => ({ user: id, amount: share, isPaid: false }));
  } else if (splitType === 'exact' && splits) {
    calculatedSplits = splits;
  } else if (splitType === 'percentage' && splits) {
    calculatedSplits = splits.map((s) => ({
      ...s,
      amount: (amount * s.percentage) / 100,
    }));
  }

  const expense = await Expense.create({
    trip: req.trip._id,
    title,
    amount,
    currency: currency || req.trip.budget.currency,
    amountInBaseCurrency: amount, // simplified; could use exchange rate API
    category,
    date: date || new Date(),
    paidBy,
    splitType: splitType || 'none',
    splits: calculatedSplits,
    notes,
    tags,
    linkedActivity,
    createdBy: req.user._id,
  });

  // Update trip spent
  await recalculateTripSpent(req.trip._id);

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'expense_added',
    entityId: expense._id,
    description: `Added expense "${title}" (${currency || req.trip.budget.currency} ${amount})`,
  });

  // Notify people who owe money
  if (calculatedSplits.length) {
    const notifications = calculatedSplits.map((s) => ({
      recipient: s.user,
      sender: req.user._id,
      type: 'expense_added',
      title: 'New shared expense',
      message: `${req.user.name} added "${title}" — you owe ${(s.amount).toFixed(2)}`,
      trip: req.trip._id,
      link: `/trips/${req.trip._id}/budget`,
      data: { amount: s.amount, currency },
    }));

    const { createBulkNotifications } = require('../utils/notifications');
    await createBulkNotifications(notifications);
  }

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('expense:added', { expense });

  res.status(201).json({ success: true, data: expense });
});

// PATCH /trips/:tripId/budget/expenses/:id
exports.updateExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!expense) return next(new AppError('Expense not found.', 404));

  // Only creator or owner can edit
  if (expense.createdBy.toString() !== req.user._id.toString() && req.userRole !== 'owner') {
    return next(new AppError('Not authorized to edit this expense.', 403));
  }

  Object.assign(expense, req.body);
  await expense.save();
  await recalculateTripSpent(req.trip._id);

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('expense:updated', { expense });

  res.json({ success: true, data: expense });
});

// DELETE /trips/:tripId/budget/expenses/:id
exports.deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!expense) return next(new AppError('Expense not found.', 404));

  if (expense.createdBy.toString() !== req.user._id.toString() && req.userRole !== 'owner') {
    return next(new AppError('Not authorized.', 403));
  }

  await Expense.findByIdAndDelete(expense._id);
  await recalculateTripSpent(req.trip._id);

  res.json({ success: true, message: 'Expense deleted.' });
});

// PATCH /trips/:tripId/budget/expenses/:id/settle
exports.settleExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!expense) return next(new AppError('Expense not found.', 404));

  const split = expense.splits.find(
    (s) => s.user.toString() === req.user._id.toString()
  );

  if (!split) return next(new AppError('No split found for you.', 404));

  split.isPaid = true;
  split.paidAt = new Date();
  await expense.save();

  // Notify the payer
  await createNotification({
    recipient: expense.paidBy,
    sender: req.user._id,
    type: 'expense_settled',
    title: 'Expense settled',
    message: `${req.user.name} settled their share of "${expense.title}"`,
    trip: req.trip._id,
  });

  res.json({ success: true, data: expense });
});

// PATCH /trips/:tripId/budget
exports.updateBudget = catchAsync(async (req, res) => {
  const { total, currency } = req.body;
  await Trip.findByIdAndUpdate(req.trip._id, {
    'budget.total': total,
    'budget.currency': currency,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('budget:updated', { total, currency });

  res.json({ success: true, message: 'Budget updated.' });
});

// Helper: recalculate total spent
const recalculateTripSpent = async (tripId) => {
  const result = await Expense.aggregate([
    { $match: { trip: tripId } },
    { $group: { _id: null, total: { $sum: '$amountInBaseCurrency' } } },
  ]);
  await Trip.findByIdAndUpdate(tripId, { 'budget.spent': result[0]?.total || 0 });
};

// Helper: calculate who owes whom
const calculateBalances = (expenses, collaborators, owner) => {
  const balances = {};
  
  expenses.forEach((expense) => {
    if (!expense.splits || expense.splits.length === 0) return;
    
    expense.splits.forEach((split) => {
      if (split.isPaid) return;
      const key = `${split.user}_${expense.paidBy}`;
      if (!balances[key]) balances[key] = { from: split.user, to: expense.paidBy, amount: 0 };
      balances[key].amount += split.amount;
    });
  });

  return Object.values(balances).filter((b) => b.amount > 0.01);
};