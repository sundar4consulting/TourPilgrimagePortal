const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['primary', 'family'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  relationship: {
    type: String,
    enum: ['self', 'spouse', 'child', 'parent', 'sibling', 'other']
  },
  aadharNumber: {
    type: String,
    required: true,
    match: /^[0-9]{12}$/
  },
  priceCategory: {
    type: String,
    enum: ['adult', 'child', 'senior'],
    required: true
  }
});

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  participants: [participantSchema],
  totalParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['interested', 'confirmed', 'paid', 'cancelled', 'completed'],
    default: 'interested'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    method: String,
    transactionId: String,
    amount: Number,
    date: Date
  },
  specialRequests: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  confirmationDate: Date,
  cancellationDate: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const count = await this.constructor.countDocuments();
    this.bookingId = `PIL${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for booking reference
bookingSchema.virtual('reference').get(function() {
  return `${this.bookingId}-${this.createdAt.getFullYear()}`;
});

module.exports = mongoose.model('Booking', bookingSchema);