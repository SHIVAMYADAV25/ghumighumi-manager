const Reservation = require('../models/Reservation');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { logActivity } = require('../utils/activityLog');
const { getIO } = require('../socket/socketManager');

exports.getReservations = catchAsync(async (req, res) => {
  const { type, status } = req.query;
  const query = { trip: req.trip._id };
  if (type) query.type = type;
  if (status) query.status = status;

  const reservations = await Reservation.find(query)
    .populate('createdBy', 'name avatar')
    .sort({ departureTime: 1, checkIn: 1 });

  res.json({ success: true, data: reservations });
});

exports.createReservation = catchAsync(async (req, res) => {
  const reservation = await Reservation.create({
    ...req.body,
    trip: req.trip._id,
    createdBy: req.user._id,
  });

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'reservation_added',
    entityId: reservation._id,
    description: `Added ${reservation.type} reservation: "${reservation.title}"`,
  });

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('reservation:created', { reservation });

  res.status(201).json({ success: true, data: reservation });
});

exports.updateReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!reservation) return next(new AppError('Reservation not found.', 404));

  Object.assign(reservation, req.body);
  await reservation.save();

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'reservation_updated',
    description: `Updated reservation "${reservation.title}"`,
  });

  res.json({ success: true, data: reservation });
});

exports.deleteReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!reservation) return next(new AppError('Reservation not found.', 404));

  if (reservation.createdBy.toString() !== req.user._id.toString() && req.userRole !== 'owner') {
    return next(new AppError('Not authorized.', 403));
  }

  await Reservation.findByIdAndDelete(reservation._id);
  res.json({ success: true, message: 'Reservation deleted.' });
});