const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Expense = require('../models/Expense');
const Checklist = require('../models/Checklist');
const Reservation = require('../models/Reservation');
const ActivityLog = require('../models/ActivityLog');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { logActivity } = require('../utils/activityLog');
const { createNotification, createBulkNotifications } = require('../utils/notifications');
const { getIO } = require('../socket/socketManager');

// GET /trips - user's trips
exports.getMyTrips = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 12, search, sort = '-createdAt' } = req.query;
  const userId = req.user._id;

  const query = {
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
    isArchived: false,
  };

  if (status) query.status = status;
  if (search) query.title = { $regex: search, $options: 'i' };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [trips, total] = await Promise.all([
    Trip.find(query)
      .populate('owner', 'name avatar email')
      .populate('collaborators.user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Trip.countDocuments(query),
  ]);

  // Attach user role to each trip
  const tripsWithRole = trips.map((trip) => {
    let role = 'viewer';
    if (trip.owner._id.toString() === userId.toString()) {
      role = 'owner';
    } else {
      const collab = trip.collaborators?.find(
        (c) => c.user._id.toString() === userId.toString()
      );
      if (collab) role = collab.role;
    }
    return { ...trip, userRole: role };
  });

  res.json({
    success: true,
    data: tripsWithRole,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /trips/:id
exports.getTrip = catchAsync(async (req, res) => {
  const trip = req.trip;

  // Update last viewed
  const collab = trip.collaborators.find(
    (c) => c.user._id.toString() === req.user._id.toString()
  );
  if (collab) {
    collab.lastViewed = new Date();
    await trip.save();
  }

  res.json({ success: true, data: { ...trip.toJSON(), userRole: req.userRole } });
});

// POST /trips
exports.createTrip = catchAsync(async (req, res) => {
  const { title, description, destination, startDate, endDate, travelers, budget, tags, visibility } = req.body;

  const trip = await Trip.create({
    title,
    description,
    destination,
    startDate,
    endDate,
    travelers,
    budget,
    tags,
    visibility,
    owner: req.user._id,
    collaborators: [],
  });

  // Auto-generate day itineraries
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const itineraries = Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return { trip: trip._id, dayNumber: i + 1, date, createdBy: req.user._id };
  });

  await Itinerary.insertMany(itineraries);

  await logActivity({
    trip: trip._id,
    user: req.user._id,
    action: 'trip_created',
    entityType: 'trip',
    entityId: trip._id,
    description: `Created trip "${trip.title}"`,
  });

  const populated = await Trip.findById(trip._id)
    .populate('owner', 'name avatar email')
    .lean({ virtuals: true });

  res.status(201).json({
    success: true,
    data: { ...populated, userRole: 'owner' },
  });
});

// PUT /trips/:id
exports.updateTrip = catchAsync(async (req, res, next) => {
  const { title, description, destination, startDate, endDate, travelers, budget, tags, visibility, status, settings, coverImage } = req.body;

  const trip = req.trip;

  // If dates changed, regenerate itineraries
  const datesChanged = (startDate && startDate !== trip.startDate.toISOString()) ||
    (endDate && endDate !== trip.endDate.toISOString());

  Object.assign(trip, {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(destination && { destination }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(travelers && { travelers }),
    ...(budget && { budget }),
    ...(tags && { tags }),
    ...(visibility && { visibility }),
    ...(status && { status }),
    ...(settings && { settings }),
    ...(coverImage && { coverImage }),
  });

  await trip.save();

  if (datesChanged) {
    await Itinerary.deleteMany({ trip: trip._id });
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const itineraries = Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return { trip: trip._id, dayNumber: i + 1, date, createdBy: req.user._id };
    });
    await Itinerary.insertMany(itineraries);
  }

  await logActivity({
    trip: trip._id,
    user: req.user._id,
    action: 'trip_updated',
    entityType: 'trip',
    entityId: trip._id,
    description: `Updated trip details`,
  });

  // Broadcast to collaborators
  const io = getIO();
  io?.to(`trip:${trip._id}`).emit('trip:updated', { trip: trip.toJSON() });

  res.json({ success: true, data: trip.toJSON() });
});

// DELETE /trips/:id
exports.deleteTrip = catchAsync(async (req, res) => {
  const trip = req.trip;

  // Cascade delete everything
  await Promise.all([
    Itinerary.deleteMany({ trip: trip._id }),
    Activity.deleteMany({ trip: trip._id }),
    Expense.deleteMany({ trip: trip._id }),
    Checklist.deleteMany({ trip: trip._id }),
    Reservation.deleteMany({ trip: trip._id }),
    ActivityLog.deleteMany({ trip: trip._id }),
  ]);

  await Trip.findByIdAndDelete(trip._id);

  res.json({ success: true, message: 'Trip deleted successfully.' });
});

// POST /trips/:id/cover
exports.uploadCover = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));

  const trip = await Trip.findByIdAndUpdate(
    req.trip._id,
    { coverImage: { url: req.file.path, publicId: req.file.filename } },
    { new: true }
  );

  res.json({ success: true, data: { coverImage: trip.coverImage } });
});

// GET /trips/:id/stats
exports.getTripStats = catchAsync(async (req, res) => {
  const tripId = req.trip._id;

  const [activities, expenses, checklists, reservations] = await Promise.all([
    Activity.aggregate([
      { $match: { trip: tripId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { trip: tripId } },
      { $group: { _id: '$category', total: { $sum: '$amountInBaseCurrency' }, count: { $sum: 1 } } },
    ]),
    Checklist.find({ trip: tripId }).lean({ virtuals: true }),
    Reservation.countDocuments({ trip: tripId, status: 'confirmed' }),
  ]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.total, 0);
  const checklistStats = checklists.map((cl) => ({
    title: cl.title,
    completion: cl.completionRate,
  }));

  res.json({
    success: true,
    data: {
      activities: activities.reduce((acc, a) => ({ ...acc, [a._id]: a.count }), {}),
      expenses: { byCategory: expenses, totalSpent },
      checklists: checklistStats,
      confirmedReservations: reservations,
      budgetUsed: req.trip.budget.total
        ? Math.round((totalSpent / req.trip.budget.total) * 100)
        : 0,
    },
  });
});

// GET /trips/:id/activity-log
exports.getActivityLog = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    ActivityLog.find({ trip: req.trip._id })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    ActivityLog.countDocuments({ trip: req.trip._id }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) },
  });
});

// POST /trips/:id/archive
exports.archiveTrip = catchAsync(async (req, res) => {
  await Trip.findByIdAndUpdate(req.trip._id, { isArchived: true });
  res.json({ success: true, message: 'Trip archived.' });
});

// POST /trips/:id/duplicate
exports.duplicateTrip = catchAsync(async (req, res) => {
  const original = req.trip;

  const newTrip = await Trip.create({
    title: `${original.title} (Copy)`,
    description: original.description,
    destination: original.destination,
    startDate: req.body.startDate || original.startDate,
    endDate: req.body.endDate || original.endDate,
    travelers: original.travelers,
    budget: { total: original.budget.total, currency: original.budget.currency, spent: 0 },
    tags: original.tags,
    visibility: 'private',
    owner: req.user._id,
  });

  // Copy itineraries
  const itineraries = await Itinerary.find({ trip: original._id });
  await Itinerary.insertMany(
    itineraries.map((i) => ({
      trip: newTrip._id,
      dayNumber: i.dayNumber,
      date: i.date,
      title: i.title,
      theme: i.theme,
      notes: i.notes,
      createdBy: req.user._id,
    }))
  );

  res.status(201).json({ success: true, data: newTrip });
});