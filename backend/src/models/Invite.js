const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['editor', 'viewer'], default: 'viewer' },
  token: { type: String, unique: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'revoked'],
    default: 'pending',
  },
  expiresAt: { type: Date, required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: Date,
  message: { type: String, maxlength: 500 },
}, {
  timestamps: true,
});

inviteSchema.pre('save', function (next) {
  if (this.isNew) {
    this.token = crypto.randomBytes(32).toString('hex');
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

inviteSchema.index({ token: 1 });
inviteSchema.index({ trip: 1, email: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-expire

module.exports = mongoose.model('Invite', inviteSchema);