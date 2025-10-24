const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'transportation',
      'accommodation',
      'meals',
      'temple-donations',
      'guide-fees',
      'entrance-fees',
      'photography',
      'shopping',
      'medical',
      'emergency',
      'miscellaneous'
    ]
  },
  subcategory: String,
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  expenseDate: {
    type: Date,
    required: true
  },
  location: {
    city: String,
    state: String,
    place: String
  },
  vendor: {
    name: String,
    contact: String,
    address: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank-transfer', 'cheque'],
    default: 'cash'
  },
  receiptNumber: String,
  participants: {
    type: Number,
    min: 1
  },
  perPersonCost: {
    type: Number,
    min: 0
  },
  isReimbursable: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  notes: String,
  attachments: [String], // file paths for receipts/bills
  tags: [String]
}, {
  timestamps: true
});

// Calculate per person cost before saving
expenseSchema.pre('save', function(next) {
  if (this.participants && this.amount) {
    this.perPersonCost = this.amount / this.participants;
  }
  next();
});

// Index for better query performance
expenseSchema.index({ tour: 1, category: 1, expenseDate: 1 });
expenseSchema.index({ addedBy: 1, createdAt: -1 });
expenseSchema.index({ isApproved: 1, expenseDate: -1 });

module.exports = mongoose.model('Expense', expenseSchema);