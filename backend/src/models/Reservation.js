const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  type: {
    type: String,
    enum: ['flight', 'hotel', 'car_rental', 'train', 'bus', 'ferry', 'tour', 'restaurant', 'other'],
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  provider: { type: String, trim: true, maxlength: 100 },
  confirmationNumber: { type: String, trim: true, maxlength: 100 },
  bookingReference: { type: String, trim: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  // For flights / transport
  from: { type: String, trim: true },
  to: { type: String, trim: true },
  departureTime: { type: Date },
  arrivalTime: { type: Date },
  seatInfo: { type: String },
  // Cost
  totalCost: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'USD' },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  // Documents
  attachments: [{
    name: String,
    url: String,
    publicId: String,
    type: String, // mime type
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  notes: { type: String, maxlength: 1000, default: '' },
  reminderSet: { type: Boolean, default: false },
  reminderDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

reservationSchema.virtual('duration').get(function () {
  if (this.checkIn && this.checkOut) {
    const diff = this.checkOut - this.checkIn;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  if (this.departureTime && this.arrivalTime) {
    const diff = this.arrivalTime - this.departureTime;
    return Math.round(diff / (1000 * 60)); // minutes
  }
  return null;
});

reservationSchema.index({ trip: 1, type: 1 });
reservationSchema.index({ trip: 1, checkIn: 1 });
reservationSchema.index({ trip: 1, departureTime: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);