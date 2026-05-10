const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'trip_invite', 'trip_update', 'collaborator_joined', 'collaborator_left',
      'comment_added', 'comment_mention', 'activity_added', 'activity_updated',
      'checklist_completed', 'expense_added', 'expense_settled',
      'reservation_reminder', 'trip_starts_soon', 'budget_alert',
      'role_changed', 'system',
    ],
    required: true,
  },
  title: { type: String, required: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 500 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  link: { type: String }, // frontend route
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, trip: 1 });

module.exports = mongoose.model('Notification', notificationSchema);