
const Checklist = require('../models/Checklist');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { logActivity } = require('../utils/activityLog');
const { getIO } = require('../socket/socketManager');

exports.getChecklists = catchAsync(async (req, res) => {
  const checklists = await Checklist.find({ trip: req.trip._id })
    .populate('createdBy', 'name avatar')
    .populate('items.completedBy', 'name avatar')
    .populate('items.assignedTo', 'name avatar')
    .sort('createdAt')
    .lean({ virtuals: true });

  res.json({ success: true, data: checklists });
});

exports.createChecklist = catchAsync(async (req, res) => {
  const { title, type, items, color } = req.body;

  const checklist = await Checklist.create({
    trip: req.trip._id,
    title,
    type: type || 'custom',
    items: items || [],
    color,
    createdBy: req.user._id,
  });

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'checklist_created',
    entityId: checklist._id,
    description: `Created checklist "${title}"`,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('checklist:created', { checklist });

  res.status(201).json({ success: true, data: checklist });
});

exports.updateChecklist = catchAsync(async (req, res, next) => {
  const checklist = await Checklist.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!checklist) return next(new AppError('Checklist not found.', 404));

  const { title, color, items } = req.body;
  if (title) checklist.title = title;
  if (color) checklist.color = color;
  if (items) checklist.items = items;

  await checklist.save();

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('checklist:updated', { checklist });

  res.json({ success: true, data: checklist });
});

exports.deleteChecklist = catchAsync(async (req, res, next) => {
  const checklist = await Checklist.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!checklist) return next(new AppError('Checklist not found.', 404));

  await Checklist.findByIdAndDelete(checklist._id);
  res.json({ success: true, message: 'Checklist deleted.' });
});

exports.addItem = catchAsync(async (req, res, next) => {
  const checklist = await Checklist.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!checklist) return next(new AppError('Checklist not found.', 404));

  const { text, assignedTo, dueDate, priority } = req.body;
  const maxOrder = checklist.items.length;

  checklist.items.push({ text, assignedTo, dueDate, priority, order: maxOrder });
  await checklist.save();

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('checklist:itemAdded', { checklistId: checklist._id, item: checklist.items.at(-1) });

  res.json({ success: true, data: checklist });
});

exports.toggleItem = catchAsync(async (req, res, next) => {
  const checklist = await Checklist.findOne({ _id: req.params.checklistId, trip: req.trip._id });
  if (!checklist) return next(new AppError('Checklist not found.', 404));

  const item = checklist.items.id(req.params.itemId);
  if (!item) return next(new AppError('Item not found.', 404));

  item.isCompleted = !item.isCompleted;
  if (item.isCompleted) {
    item.completedBy = req.user._id;
    item.completedAt = new Date();
  } else {
    item.completedBy = undefined;
    item.completedAt = undefined;
  }

  await checklist.save();

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'checklist_item_completed',
    description: `${item.isCompleted ? 'Checked' : 'Unchecked'} "${item.text}"`,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('checklist:itemToggled', {
    checklistId: checklist._id,
    itemId: item._id,
    isCompleted: item.isCompleted,
    completedBy: req.user._id,
  });

  res.json({ success: true, data: { item, completionRate: checklist.completionRate } });
});

exports.deleteItem = catchAsync(async (req, res, next) => {
  const checklist = await Checklist.findOne({ _id: req.params.checklistId, trip: req.trip._id });
  if (!checklist) return next(new AppError('Checklist not found.', 404));

  checklist.items = checklist.items.filter((i) => i._id.toString() !== req.params.itemId);
  await checklist.save();

  res.json({ success: true, data: checklist });
});