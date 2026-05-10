const Trip = require('../models/Trip');
const { AppError } = require('./errorHandler');
const catchAsync = require('../utils/catchAsync');

// Attach trip to req, check basic access
exports.loadTrip = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripId)
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar');

  if (!trip || trip.isArchived) {
    return next(new AppError('Trip not found.', 404));
  }

  // Check access
  const userId = req.user._id.toString();
  const role = trip.getUserRole(userId);

  if (!role && trip.visibility !== 'public') {
    return next(new AppError('You do not have access to this trip.', 403));
  }

  req.trip = trip;
  req.userRole = role;
  next();
});

// Must have at minimum view access
exports.requireAccess = (req, res, next) => {
  if (!req.userRole) {
    return next(new AppError('Access denied.', 403));
  }
  next();
};

// Must be owner or editor
exports.requireEditor = (req, res, next) => {
  if (!['owner', 'editor'].includes(req.userRole)) {
    return next(new AppError('Editor access required for this action.', 403));
  }
  next();
};

// Must be owner
exports.requireOwner = (req, res, next) => {
  if (req.userRole !== 'owner') {
    return next(new AppError('Only the trip owner can perform this action.', 403));
  }
  next();
};