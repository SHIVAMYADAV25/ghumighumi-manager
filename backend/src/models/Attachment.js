const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }, // bytes
  category: {
    type: String,
    enum: ['ticket', 'passport', 'insurance', 'hotel', 'transport', 'map', 'photo', 'document', 'other'],
    default: 'other',
  },
  linkedTo: {
    type: { type: String, enum: ['trip', 'activity', 'reservation', 'itinerary'] },
    id: mongoose.Schema.Types.ObjectId,
  },
  description: { type: String, maxlength: 500, default: '' },
  tags: [String],
  isShared: { type: Boolean, default: true },
}, {
  timestamps: true,
});

attachmentSchema.index({ trip: 1, category: 1 });
attachmentSchema.index({ trip: 1, uploadedBy: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);