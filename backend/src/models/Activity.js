const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: 150,
  },
  description: { type: String, maxlength: 1000, default: '' },
  category: {
    type: String,
    enum: ['transport', 'accommodation', 'food', 'attraction', 'activity', 'shopping', 'health', 'other'],
    default: 'other',
  },
  location: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    coordinates: { lat: Number, lng: Number },
    placeId: String,
    mapsUrl: String,
  },
  startTime: { type: String, default: '' },  // "HH:MM" format
  endTime: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // minutes
  cost: {
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPaid: { type: Boolean, default: false },
  },
  bookingInfo: {
    reference: { type: String, default: '' },
    url: { type: String, default: '' },
    confirmationNumber: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_booked', 'pending', 'confirmed', 'cancelled'],
      default: 'not_booked',
    },
  },
  order: { type: Number, default: 0 }, // for drag-and-drop reordering
  status: {
    type: String,
    enum: ['planned', 'confirmed', 'completed', 'cancelled', 'skipped'],
    default: 'planned',
  },
  images: [{
    url: String,
    publicId: String,
    caption: String,
  }],
  votes: {
    up: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    down: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

activitySchema.virtual('voteScore').get(function () {
  return (this.votes?.up?.length || 0) - (this.votes?.down?.length || 0);
});

activitySchema.index({ trip: 1, itinerary: 1, order: 1 });
activitySchema.index({ trip: 1, category: 1 });

module.exports = mongoose.model('Activity', activitySchema);