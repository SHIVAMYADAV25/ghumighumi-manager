const Activity = require('../models/Activity');
const Itinerary = require('../models/Itinerary');
const Expense = require('../models/Expense');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { logActivity } = require('../utils/activityLog');
const { createBulkNotifications } = require('../utils/notifications');
const { getIO } = require('../socket/socketManager');

// GET /trips/:tripId/activities
exports.getActivities = catchAsync(async (req, res) => {
  const { itineraryId, category, status } = req.query;

  const query = { trip: req.trip._id };
  if (itineraryId) query.itinerary = itineraryId;
  if (category) query.category = category;
  if (status) query.status = status;

  const activities = await Activity.find(query)
    .populate('createdBy', 'name avatar')
    .populate('lastEditedBy', 'name avatar')
    .populate('cost.paidBy', 'name avatar')
    .sort({ itinerary: 1, order: 1 });

  res.json({ success: true, data: activities });
});

// POST /trips/:tripId/activities
exports.createActivity = catchAsync(async (req, res, next) => {
  const { itineraryId, title, description, category, location, startTime, endTime, duration, cost, bookingInfo, order } = req.body;

  // Verify itinerary belongs to trip
  const itinerary = await Itinerary.findOne({ _id: itineraryId, trip: req.trip._id });
  if (!itinerary) return next(new AppError('Itinerary not found.', 404));

  // Get max order for this itinerary
  const maxOrder = await Activity.findOne({ itinerary: itineraryId })
    .sort('-order')
    .select('order');

  const activity = await Activity.create({
    trip: req.trip._id,
    itinerary: itineraryId,
    title,
    description,
    category,
    location,
    startTime,
    endTime,
    duration,
    cost,
    bookingInfo,
    order: order ?? (maxOrder ? maxOrder.order + 1 : 0),
    createdBy: req.user._id,
  });

  // Update trip budget if cost provided
  if (cost?.amount) {
    await updateTripSpent(req.trip._id);
  }

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'activity_created',
    entityType: 'activity',
    entityId: activity._id,
    description: `Added activity "${title}" on Day ${itinerary.dayNumber}`,
  });

  // Notify collaborators
  const collaboratorIds = req.trip.collaborators
    .filter((c) => c.user._id.toString() !== req.user._id.toString())
    .map((c) => ({
      recipient: c.user._id,
      sender: req.user._id,
      type: 'activity_added',
      title: 'New Activity Added',
      message: `${req.user.name} added "${title}" to Day ${itinerary.dayNumber}`,
      trip: req.trip._id,
      link: `/trips/${req.trip._id}/itinerary`,
    }));

  if (collaboratorIds.length) await createBulkNotifications(collaboratorIds);

  const populated = await activity.populate('createdBy', 'name avatar');

  // Real-time broadcast
  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('activity:created', { activity: populated });

  res.status(201).json({ success: true, data: populated });
});

// PUT /trips/:tripId/activities/:id
exports.updateActivity = catchAsync(async (req, res, next) => {
  const activity = await Activity.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!activity) return next(new AppError('Activity not found.', 404));

  const updatable = ['title', 'description', 'category', 'location', 'startTime', 'endTime', 'duration', 'cost', 'bookingInfo', 'status', 'images'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) activity[field] = req.body[field];
  });
  activity.lastEditedBy = req.user._id;

  await activity.save();

  if (req.body.cost?.amount !== undefined) {
    await updateTripSpent(req.trip._id);
  }

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'activity_updated',
    entityType: 'activity',
    entityId: activity._id,
    description: `Updated activity "${activity.title}"`,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('activity:updated', { activity });

  res.json({ success: true, data: activity });
});

// DELETE /trips/:tripId/activities/:id
exports.deleteActivity = catchAsync(async (req, res, next) => {
  const activity = await Activity.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!activity) return next(new AppError('Activity not found.', 404));

  await Activity.findByIdAndDelete(activity._id);
  await updateTripSpent(req.trip._id);

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'activity_deleted',
    description: `Deleted activity "${activity.title}"`,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('activity:deleted', { activityId: activity._id });

  res.json({ success: true, message: 'Activity deleted.' });
});

// PATCH /trips/:tripId/activities/reorder
exports.reorderActivities = catchAsync(async (req, res) => {
  // req.body.activities = [{ id, order }]
  const { activities } = req.body;

  const bulkOps = activities.map(({ id, order }) => ({
    updateOne: { filter: { _id: id, trip: req.trip._id }, update: { $set: { order } } },
  }));

  await Activity.bulkWrite(bulkOps);

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'activity_reordered',
    description: 'Reordered activities',
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('activity:reordered', { activities });

  res.json({ success: true, message: 'Activities reordered.' });
});

// POST /trips/:tripId/activities/:id/vote
exports.voteActivity = catchAsync(async (req, res, next) => {
  const { type } = req.body; // 'up' or 'down'
  if (!['up', 'down'].includes(type)) return next(new AppError('Invalid vote type.', 400));

  const activity = await Activity.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!activity) return next(new AppError('Activity not found.', 404));

  const userId = req.user._id;
  const opposite = type === 'up' ? 'down' : 'up';

  // Toggle vote
  const hasVoted = activity.votes[type].some((id) => id.toString() === userId.toString());

  if (hasVoted) {
    activity.votes[type].pull(userId);
  } else {
    activity.votes[type].addToSet(userId);
    activity.votes[opposite].pull(userId);
  }

  await activity.save();

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('activity:voted', {
    activityId: activity._id,
    votes: activity.votes,
    voteScore: activity.voteScore,
  });

  res.json({ success: true, data: { votes: activity.votes, voteScore: activity.voteScore } });
});

// Helper: update trip's total spent from activities
const updateTripSpent = async (tripId) => {
  const Trip = require('../models/Trip');
  const result = await Activity.aggregate([
    { $match: { trip: tripId } },
    { $group: { _id: null, total: { $sum: '$cost.amount' } } },
  ]);
  const spent = result[0]?.total || 0;
  await Trip.findByIdAndUpdate(tripId, { 'budget.spent': spent });
};