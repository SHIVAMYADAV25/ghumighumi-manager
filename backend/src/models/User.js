const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  avatar: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  bio: { type: String, maxlength: 200, default: '' },
  timezone: { type: String, default: 'UTC' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: String,
  emailVerifyExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{ type: String }], // stored hashed
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    currency: { type: String, default: 'USD' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  },
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ emailVerifyToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update lastActive
userSchema.pre('save', function (next) {
  if (this.isNew) return next();
  this.lastActive = Date.now();
  next();
});

// Methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    timezone: this.timezone,
    isEmailVerified: this.isEmailVerified,
    preferences: this.preferences,
    lastActive: this.lastActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);