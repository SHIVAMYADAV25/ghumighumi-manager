const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, setCookies, clearCookies } = require('../utils/jwt');
const { sendEmail, emailTemplates } = require('../utils/email');

// Helper to send auth response
const sendAuthResponse = (user, res, statusCode = 200) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  setCookies(res, accessToken, refreshToken);

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toPublicJSON(),
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('Email already registered.', 409));

  const user = await User.create({ name, email, password });

  // Email verification
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  await sendEmail({
    to: user.email,
    ...emailTemplates.verifyEmail(user.name, verifyUrl),
  });

  sendAuthResponse(user, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated.', 403));
  }

  user.lastActive = Date.now();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(user, res);
});

exports.logout = catchAsync(async (req, res) => {
  clearCookies(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return next(new AppError('No refresh token.', 401));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (_) {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) return next(new AppError('User not found.', 401));

  const accessToken = signAccessToken(user._id);
  res.json({ success: true, accessToken });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token invalid or expired.', 400));

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully.' });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // Always return success to prevent user enumeration
  if (user) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      ...emailTemplates.resetPassword(user.name, resetUrl),
    });
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token invalid or expired.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendAuthResponse(user, res);
});

exports.getMe = catchAsync(async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { name, bio, timezone, preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, bio, timezone, preferences },
    { new: true, runValidators: true }
  );

  res.json({ success: true, user: user.toPublicJSON() });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendAuthResponse(user, res);
});

exports.uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: { url: req.file.path, publicId: req.file.filename } },
    { new: true }
  );

  res.json({ success: true, user: user.toPublicJSON() });
});