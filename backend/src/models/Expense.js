const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  // Converted amount in trip's base currency
  amountInBaseCurrency: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 1 },
  category: {
    type: String,
    enum: ['accommodation', 'transport', 'food', 'activities', 'shopping', 'health', 'visa', 'insurance', 'other'],
    required: true,
  },
  date: { type: Date, default: Date.now },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: {
    type: String,
    enum: ['equal', 'exact', 'percentage', 'none'],
    default: 'equal',
  },
  splits: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    percentage: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
  }],
  receipt: {
    url: String,
    publicId: String,
  },
  linkedActivity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  notes: { type: String, maxlength: 500, default: '' },
  isReimbursed: { type: Boolean, default: false },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

expenseSchema.index({ trip: 1, date: -1 });
expenseSchema.index({ trip: 1, paidBy: 1 });
expenseSchema.index({ trip: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);