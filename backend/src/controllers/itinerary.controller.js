
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { logActivity } = require('../utils/activityLog');
const { getIO } = require('../socket/socketManager');

exports.getItineraries = catchAsync(async (req, res) => {
  const itineraries = await Itinerary.find({ trip: req.trip._id })
    .populate('createdBy', 'name avatar')
    .sort('dayNumber');

  // Attach activities
  const activities = await Activity.find({ trip: req.trip._id })
    .populate('createdBy', 'name avatar')
    .populate('cost.paidBy', 'name')
    .sort({ order: 1 });

  const result = itineraries.map((day) => ({
    ...day.toJSON(),
    activities: activities.filter(
      (a) => a.itinerary.toString() === day._id.toString()
    ),
  }));

  res.json({ success: true, data: result });
});

exports.updateItinerary = catchAsync(async (req, res, next) => {
  const itinerary = await Itinerary.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!itinerary) return next(new AppError('Itinerary day not found.', 404));

  const { title, theme, notes } = req.body;
  if (title !== undefined) itinerary.title = title;
  if (theme !== undefined) itinerary.theme = theme;
  if (notes !== undefined) itinerary.notes = notes;

  await itinerary.save();

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'itinerary_updated',
    entityId: itinerary._id,
    description: `Updated Day ${itinerary.dayNumber} notes`,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('itinerary:updated', { itinerary });

  res.json({ success: true, data: itinerary });
});