const User = require('../models/User');
const Trip = require('../models/Trip');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');

exports.searchUsers = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, data: [] });

  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user._id },
    isActive: true,
  })
    .select('name email avatar bio')
    .limit(10);

  res.json({ success: true, data: users });
});

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('name avatar bio lastActive createdAt');
  if (!user) return next(new AppError('User not found.', 404));

  res.json({ success: true, data: user });
});

exports.getArchivedTrips = catchAsync(async (req, res) => {
  const trips = await Trip.find({
    $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }],
    isArchived: true,
  })
    .populate('owner', 'name avatar')
    .sort('-updatedAt')
    .lean({ virtuals: true });

  res.json({ success: true, data: trips });
});