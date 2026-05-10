const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  dayNumber: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true },
  title: { type: String, trim: true, maxlength: 100, default: '' },
  theme: { type: String, maxlength: 200, default: '' }, // e.g. "Beach Day", "Museum Crawl"
  notes: { type: String, maxlength: 2000, default: '' },
  weather: {
    condition: String,
    temp: Number,
    icon: String,
    fetchedAt: Date,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Compound index: one day per trip
itinerarySchema.index({ trip: 1, dayNumber: 1 }, { unique: true });
itinerarySchema.index({ trip: 1, date: 1 });

module.exports = mongoose.model('Itinerary', itinerarySchema);