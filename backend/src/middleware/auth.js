const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token.', 401));
  }

  const user = await User.findById(decoded.id).select('+password');
  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive.', 401));
  }

  req.user = user;
  next();
});

exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch (_) {
    // ignore
  }
  next();
});