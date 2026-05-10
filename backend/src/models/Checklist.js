const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 200 },
  isCompleted: { type: Boolean, default: false },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  order: { type: Number, default: 0 },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { _id: true, timestamps: true });

const checklistSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  type: {
    type: String,
    enum: ['packing', 'todo', 'documents', 'custom'],
    default: 'custom',
  },
  items: [checklistItemSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isShared: { type: Boolean, default: true }, // visible to all collaborators
  color: { type: String, default: '#E8E3DC' }, // hex color for UI
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

checklistSchema.virtual('completionRate').get(function () {
  if (!this.items.length) return 0;
  const done = this.items.filter(i => i.isCompleted).length;
  return Math.round((done / this.items.length) * 100);
});

checklistSchema.index({ trip: 1, createdAt: -1 });

module.exports = mongoose.model('Checklist', checklistSchema);