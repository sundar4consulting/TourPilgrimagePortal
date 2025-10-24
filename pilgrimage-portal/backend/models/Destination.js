const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  description: String,
  significance: String,
  famousTemples: [String],
  bestTimeToVisit: String,
  nearbyAttractions: [String],
  images: [String],
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  transportation: {
    nearestRailway: String,
    nearestAirport: String,
    roadConnectivity: String
  },
  accommodation: {
    available: Boolean,
    types: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for location-based queries
destinationSchema.index({ region: 1, state: 1 });
destinationSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Destination', destinationSchema);