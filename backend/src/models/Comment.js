const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    type: String,
    required: [true, 'Comment content required'],
    trim: true,
    maxlength: 2000,
  },
  // Can attach to different entities
  targetType: {
    type: String,
    enum: ['trip', 'day', 'activity'],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // threaded replies
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, maxlength: 10 },
  }],
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

commentSchema.index({ trip: 1, targetType: 1, targetId: 1, createdAt: 1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', commentSchema);