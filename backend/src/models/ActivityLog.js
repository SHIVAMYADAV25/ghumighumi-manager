const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'trip_created', 'trip_updated', 'trip_deleted',
      'collaborator_added', 'collaborator_removed', 'role_changed',
      'itinerary_created', 'itinerary_updated',
      'activity_created', 'activity_updated', 'activity_deleted', 'activity_reordered',
      'comment_added', 'comment_deleted',
      'checklist_created', 'checklist_item_completed', 'checklist_item_added',
      'expense_added', 'expense_updated', 'expense_deleted',
      'reservation_added', 'reservation_updated',
      'attachment_uploaded', 'attachment_deleted',
      'invite_sent', 'invite_accepted',
    ],
    required: true,
  },
  entityType: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, maxlength: 500 },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

activityLogSchema.index({ trip: 1, createdAt: -1 });
activityLogSchema.index({ trip: 1, user: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);