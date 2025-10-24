const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'triple', 'family', 'dormitory', 'suite'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  facilities: [{
    type: String,
    enum: ['heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv', 'refrigerator', 'balcony']
  }],
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  bookings: [{
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    checkIn: {
      type: Date,
      required: true
    },
    checkOut: {
      type: Date,
      required: true
    },
    guests: [{
      name: String,
      age: Number,
      relation: String
    }]
  }]
}, { _id: true });

const accommodationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['hotel', 'cottage', 'guest-house', 'marriage-hall', 'apartment', 'lodge'],
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      required: true,
      maxlength: 500
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },

  // Contact Information
  contact: {
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    website: {
      type: String,
      trim: true
    }
  },

  // Owner/Manager Information
  owner: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  },

  // Accommodation Facilities
  facilities: [{
    type: String,
    enum: [
      'heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv', 'refrigerator', 
      'parking', 'restaurant', 'room-service', 'laundry', 'power-backup',
      'elevator', 'gym', 'swimming-pool', 'conference-hall', 'garden',
      'temple-nearby', 'market-nearby', 'medical-nearby'
    ]
  }],

  // Rooms in this accommodation
  rooms: [roomSchema],

  // Tours this accommodation is associated with
  associatedTours: [{
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1
    },
    checkInTime: {
      type: String,
      default: '14:00'
    },
    checkOutTime: {
      type: String,
      default: '11:00'
    }
  }],

  // Pricing and Policies
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    seasonalRates: [{
      season: {
        type: String,
        enum: ['peak', 'normal', 'off-season'],
        required: true
      },
      multiplier: {
        type: Number,
        required: true,
        min: 0.1,
        max: 5.0
      },
      startDate: Date,
      endDate: Date
    }],
    extraPersonCharge: {
      type: Number,
      default: 0
    }
  },

  policies: {
    cancellationPolicy: {
      type: String,
      maxlength: 500
    },
    checkInPolicy: {
      type: String,
      maxlength: 300
    },
    childPolicy: {
      type: String,
      maxlength: 300
    }
  },

  // Ratings and Reviews
  rating: {
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    cleanliness: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    service: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    location: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },

  // Images
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // Status and Verification
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
accommodationSchema.index({ 'location.city': 1, 'location.state': 1 });
accommodationSchema.index({ category: 1 });
accommodationSchema.index({ 'associatedTours.tour': 1 });
accommodationSchema.index({ isActive: 1, isVerified: 1 });
accommodationSchema.index({ 'contact.phone': 1 });
accommodationSchema.index({ 'rating.overall': -1 });

// Virtual for total number of rooms
accommodationSchema.virtual('totalRooms').get(function() {
  return this.rooms.length;
});

// Virtual for available rooms count
accommodationSchema.virtual('availableRooms').get(function() {
  return this.rooms.filter(room => room.isAvailable).length;
});

// Virtual for full address
accommodationSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} - ${this.location.pincode}`;
});

// Method to check room availability for specific dates
accommodationSchema.methods.checkRoomAvailability = function(checkIn, checkOut, roomType = null) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  return this.rooms.filter(room => {
    // Filter by room type if specified
    if (roomType && room.roomType !== roomType) return false;
    
    // Check if room is generally available
    if (!room.isAvailable) return false;
    
    // Check for booking conflicts
    const hasConflict = room.bookings.some(booking => {
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      
      return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn);
    });
    
    return !hasConflict;
  });
};

// Method to get accommodation capacity
accommodationSchema.methods.getTotalCapacity = function() {
  return this.rooms.reduce((total, room) => total + room.capacity, 0);
};

// Method to get average price per night
accommodationSchema.methods.getAveragePrice = function() {
  if (this.rooms.length === 0) return this.pricing.basePrice;
  
  const totalPrice = this.rooms.reduce((sum, room) => sum + room.pricePerNight, 0);
  return totalPrice / this.rooms.length;
};

// Static method to find accommodations by tour
accommodationSchema.statics.findByTour = function(tourId, destination = null) {
  const query = { 'associatedTours.tour': tourId };
  if (destination) {
    query['associatedTours.destination'] = { $regex: destination, $options: 'i' };
  }
  return this.find(query).populate('associatedTours.tour', 'title destinations');
};

// Static method to find accommodations by location
accommodationSchema.statics.findByLocation = function(city, state = null) {
  const query = { 'location.city': { $regex: city, $options: 'i' } };
  if (state) {
    query['location.state'] = { $regex: state, $options: 'i' };
  }
  return this.find(query);
};

// Pre-save middleware to ensure only one primary image
accommodationSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Set only the first one as primary
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    } else if (primaryImages.length === 0) {
      // Set the first image as primary if none is set
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Pre-save middleware to update room availability based on current bookings
accommodationSchema.pre('save', function(next) {
  const currentDate = new Date();
  
  this.rooms.forEach(room => {
    // Remove expired bookings
    room.bookings = room.bookings.filter(booking => 
      new Date(booking.checkOut) > currentDate
    );
    
    // Update room availability based on current bookings
    const hasActiveBooking = room.bookings.some(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return currentDate >= checkIn && currentDate < checkOut;
    });
    
    // Room is available if no active booking
    room.isAvailable = !hasActiveBooking;
  });
  
  next();
});

const Accommodation = mongoose.model('Accommodation', accommodationSchema);

module.exports = Accommodation;