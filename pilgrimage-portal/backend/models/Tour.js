const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  activities: [String],
  meals: {
    breakfast: Boolean,
    lunch: Boolean,
    dinner: Boolean
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation'
  },
  accommodationText: String // For backward compatibility with existing text descriptions
});

const transportationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['bus', 'train', 'flight', 'car', 'van', 'boat']
  },
  class: String,
  description: String,
  duration: String,
  cost: Number
});

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  destinations: [{
    name: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true,
      enum: ['south-india', 'north-india', 'east-india', 'west-india', 'central-india', 'northeast-india']
    },
    significance: String,
    temples: [String],
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  duration: {
    days: {
      type: Number,
      required: true,
      min: 1
    },
    nights: {
      type: Number,
      required: true,
      min: 0
    }
  },
  itinerary: [itinerarySchema],
  transportation: [transportationSchema],
  pricing: {
    adult: {
      type: Number,
      required: true,
      min: 0
    },
    child: {
      type: Number,
      required: true,
      min: 0
    },
    senior: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  inclusions: [String],
  exclusions: [String],
  images: [String],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging'],
    default: 'easy'
  },
  category: {
    type: String,
    enum: ['pilgrimage', 'spiritual', 'cultural', 'heritage'],
    default: 'pilgrimage'
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for availability
tourSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         this.currentParticipants < this.maxParticipants &&
         this.startDate > new Date();
});

// Virtual for duration string
tourSchema.virtual('durationString').get(function() {
  return `${this.duration.days} Days / ${this.duration.nights} Nights`;
});

// Index for better search performance
tourSchema.index({ 'destinations.region': 1, status: 1 });
tourSchema.index({ startDate: 1, endDate: 1 });
tourSchema.index({ featured: -1, createdAt: -1 });

module.exports = mongoose.model('Tour', tourSchema);