const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Accommodation = require('../models/Accommodation');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const accommodationValidation = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required and must be less than 200 characters'),
  body('category').isIn(['hotel', 'cottage', 'guest-house', 'marriage-hall', 'apartment', 'lodge']).withMessage('Invalid category'),
  body('location.address').trim().isLength({ min: 1, max: 500 }).withMessage('Address is required'),
  body('location.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('location.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('location.pincode').matches(/^[0-9]{6}$/).withMessage('Valid 6-digit pincode is required'),
  body('contact.phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('contact.email').optional().isEmail().withMessage('Valid email is required'),
  body('owner.name').trim().isLength({ min: 1 }).withMessage('Owner name is required'),
  body('owner.phone').matches(/^[0-9]{10}$/).withMessage('Valid owner phone number is required'),
  body('pricing.basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number')
];

const roomValidation = [
  body('roomNumber').trim().isLength({ min: 1 }).withMessage('Room number is required'),
  body('roomType').isIn(['single', 'double', 'triple', 'family', 'dormitory', 'suite']).withMessage('Invalid room type'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Price per night must be positive')
];

// Get all accommodations with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      city,
      state,
      tourId,
      destination,
      isActive = true,
      isVerified,
      minRating,
      minPrice,
      maxPrice,
      facilities,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (category) filter.category = category;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (state) filter['location.state'] = { $regex: state, $options: 'i' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (minRating) filter['rating.overall'] = { $gte: parseFloat(minRating) };
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }
    
    // Facilities filter
    if (facilities) {
      const facilitiesArray = Array.isArray(facilities) ? facilities : [facilities];
      filter.facilities = { $in: facilitiesArray };
    }
    
    // Tour and destination filter
    if (tourId) {
      filter['associatedTours.tour'] = tourId;
      if (destination) {
        filter['associatedTours.destination'] = { $regex: destination, $options: 'i' };
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const accommodations = await Accommodation.find(filter)
      .populate('associatedTours.tour', 'title destinations startDate endDate')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Accommodation.countDocuments(filter);

    res.json({
      accommodations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Get accommodations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accommodation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id)
      .populate('associatedTours.tour', 'title destinations startDate endDate duration')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('rooms.bookings.bookingId', 'bookingReference customerName');

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json(accommodation);
  } catch (error) {
    console.error('Get accommodation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new accommodation (Admin only)
router.post('/', adminAuth, accommodationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const accommodationData = {
      ...req.body,
      createdBy: req.user._id
    };

    const accommodation = new Accommodation(accommodationData);
    await accommodation.save();

    const populatedAccommodation = await Accommodation.findById(accommodation._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Accommodation created successfully',
      accommodation: populatedAccommodation
    });
  } catch (error) {
    console.error('Create accommodation error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Accommodation with this name already exists in this location' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update accommodation (Admin only)
router.put('/:id', adminAuth, accommodationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy' && key !== 'createdAt') {
        accommodation[key] = req.body[key];
      }
    });
    
    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    const updatedAccommodation = await Accommodation.findById(accommodation._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.json({
      message: 'Accommodation updated successfully',
      accommodation: updatedAccommodation
    });
  } catch (error) {
    console.error('Update accommodation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete accommodation (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    // Check if accommodation has active bookings
    const hasActiveBookings = accommodation.rooms.some(room => 
      room.bookings.some(booking => new Date(booking.checkOut) > new Date())
    );

    if (hasActiveBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete accommodation with active bookings' 
      });
    }

    await Accommodation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add room to accommodation (Admin only)
router.post('/:id/rooms', adminAuth, roomValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    // Check if room number already exists
    const existingRoom = accommodation.rooms.find(
      room => room.roomNumber === req.body.roomNumber
    );
    if (existingRoom) {
      return res.status(400).json({ 
        message: 'Room number already exists in this accommodation' 
      });
    }

    accommodation.rooms.push(req.body);
    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    res.status(201).json({
      message: 'Room added successfully',
      room: accommodation.rooms[accommodation.rooms.length - 1]
    });
  } catch (error) {
    console.error('Add room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room in accommodation (Admin only)
router.put('/:id/rooms/:roomId', adminAuth, roomValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const room = accommodation.rooms.id(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if new room number conflicts with existing rooms
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = accommodation.rooms.find(
        r => r.roomNumber === req.body.roomNumber && r._id.toString() !== req.params.roomId
      );
      if (existingRoom) {
        return res.status(400).json({ 
          message: 'Room number already exists in this accommodation' 
        });
      }
    }

    // Update room fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'bookings') { // Don't allow direct booking updates here
        room[key] = req.body[key];
      }
    });

    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    res.json({
      message: 'Room updated successfully',
      room: room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete room from accommodation (Admin only)
router.delete('/:id/rooms/:roomId', adminAuth, async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const room = accommodation.rooms.id(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has active bookings
    const hasActiveBookings = room.bookings.some(
      booking => new Date(booking.checkOut) > new Date()
    );
    if (hasActiveBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active bookings' 
      });
    }

    accommodation.rooms.pull(req.params.roomId);
    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Associate accommodation with tour (Admin only)
router.post('/:id/tours', adminAuth, async (req, res) => {
  try {
    const { tourId, destination, dayNumber, checkInTime, checkOutTime } = req.body;

    if (!tourId || !destination || !dayNumber) {
      return res.status(400).json({ 
        message: 'Tour ID, destination, and day number are required' 
      });
    }

    const [accommodation, tour] = await Promise.all([
      Accommodation.findById(req.params.id),
      Tour.findById(tourId)
    ]);

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Check if association already exists
    const existingAssociation = accommodation.associatedTours.find(
      assoc => assoc.tour.toString() === tourId && 
               assoc.destination === destination &&
               assoc.dayNumber === dayNumber
    );

    if (existingAssociation) {
      return res.status(400).json({ 
        message: 'This accommodation is already associated with this tour for the specified destination and day' 
      });
    }

    accommodation.associatedTours.push({
      tour: tourId,
      destination,
      dayNumber,
      checkInTime: checkInTime || '14:00',
      checkOutTime: checkOutTime || '11:00'
    });

    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    const updatedAccommodation = await Accommodation.findById(accommodation._id)
      .populate('associatedTours.tour', 'title destinations');

    res.status(201).json({
      message: 'Tour association added successfully',
      accommodation: updatedAccommodation
    });
  } catch (error) {
    console.error('Associate tour error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove tour association (Admin only)
router.delete('/:id/tours/:tourId', adminAuth, async (req, res) => {
  try {
    const { destination, dayNumber } = req.query;

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    // Find and remove the specific association
    const associationIndex = accommodation.associatedTours.findIndex(
      assoc => assoc.tour.toString() === req.params.tourId &&
               (!destination || assoc.destination === destination) &&
               (!dayNumber || assoc.dayNumber === parseInt(dayNumber))
    );

    if (associationIndex === -1) {
      return res.status(404).json({ message: 'Tour association not found' });
    }

    accommodation.associatedTours.splice(associationIndex, 1);
    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    res.json({ message: 'Tour association removed successfully' });
  } catch (error) {
    console.error('Remove tour association error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book room for specific booking ID (Admin only)
router.post('/:id/rooms/:roomId/book', adminAuth, async (req, res) => {
  try {
    const { bookingId, checkIn, checkOut, guests } = req.body;

    if (!bookingId || !checkIn || !checkOut) {
      return res.status(400).json({ 
        message: 'Booking ID, check-in, and check-out dates are required' 
      });
    }

    const [accommodation, booking] = await Promise.all([
      Accommodation.findById(req.params.id),
      Booking.findById(bookingId)
    ]);

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const room = accommodation.rooms.id(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check room availability for the specified dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const hasConflict = room.bookings.some(booking => {
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn);
    });

    if (hasConflict) {
      return res.status(400).json({ 
        message: 'Room is not available for the specified dates' 
      });
    }

    // Add booking to room
    room.bookings.push({
      bookingId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guests || []
    });

    accommodation.updatedBy = req.user._id;
    await accommodation.save();

    res.status(201).json({
      message: 'Room booked successfully',
      booking: room.bookings[room.bookings.length - 1]
    });
  } catch (error) {
    console.error('Book room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check room availability
router.get('/:id/availability', auth, async (req, res) => {
  try {
    const { checkIn, checkOut, roomType } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ 
        message: 'Check-in and check-out dates are required' 
      });
    }

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const availableRooms = accommodation.checkRoomAvailability(checkIn, checkOut, roomType);

    res.json({
      accommodationId: accommodation._id,
      accommodationName: accommodation.name,
      checkIn,
      checkOut,
      totalRooms: accommodation.rooms.length,
      availableRooms: availableRooms.length,
      rooms: availableRooms.map(room => ({
        _id: room._id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        pricePerNight: room.pricePerNight,
        facilities: room.facilities
      }))
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accommodations by tour (itinerary-wise)
router.get('/tour/:tourId', auth, async (req, res) => {
  try {
    const { destination, dayNumber } = req.query;

    const filter = { 'associatedTours.tour': req.params.tourId };
    if (destination) {
      filter['associatedTours.destination'] = { $regex: destination, $options: 'i' };
    }
    if (dayNumber) {
      filter['associatedTours.dayNumber'] = parseInt(dayNumber);
    }

    const accommodations = await Accommodation.find(filter)
      .populate('associatedTours.tour', 'title destinations duration')
      .sort({ 'associatedTours.dayNumber': 1 });

    // Group by day number and destination
    const itineraryAccommodations = accommodations.reduce((acc, accommodation) => {
      accommodation.associatedTours.forEach(tourAssoc => {
        if (tourAssoc.tour._id.toString() === req.params.tourId) {
          const key = `day-${tourAssoc.dayNumber}-${tourAssoc.destination}`;
          if (!acc[key]) {
            acc[key] = {
              dayNumber: tourAssoc.dayNumber,
              destination: tourAssoc.destination,
              accommodations: []
            };
          }
          acc[key].accommodations.push({
            ...accommodation.toObject(),
            tourAssociation: tourAssoc
          });
        }
      });
      return acc;
    }, {});

    res.json({
      tourId: req.params.tourId,
      itinerary: Object.values(itineraryAccommodations).sort((a, b) => a.dayNumber - b.dayNumber)
    });
  } catch (error) {
    console.error('Get tour accommodations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accommodation statistics (Admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, category, city } = req.query;

    const matchFilter = { isActive: true };
    if (category) matchFilter.category = category;
    if (city) matchFilter['location.city'] = { $regex: city, $options: 'i' };

    const stats = await Accommodation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAccommodations: { $sum: 1 },
          totalRooms: { $sum: { $size: '$rooms' } },
          averageRating: { $avg: '$rating.overall' },
          totalCapacity: { 
            $sum: { 
              $sum: '$rooms.capacity' 
            } 
          },
          categoryBreakdown: {
            $push: '$category'
          },
          averagePrice: { $avg: '$pricing.basePrice' }
        }
      }
    ]);

    // Get category distribution
    const categoryStats = await Accommodation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating.overall' },
          averagePrice: { $avg: '$pricing.basePrice' }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalAccommodations: 0,
        totalRooms: 0,
        averageRating: 0,
        totalCapacity: 0,
        averagePrice: 0
      },
      categories: categoryStats
    });
  } catch (error) {
    console.error('Get accommodation stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Room booking assignment endpoints

// Assign room to booking
router.post('/:id/rooms/:roomId/assign-booking', auth, async (req, res) => {
  try {
    const { id, roomId } = req.params;
    const { bookingId, checkIn, checkOut, guests } = req.body;

    if (!bookingId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Booking ID, check-in, and check-out dates are required' });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const room = accommodation.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check for booking conflicts
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const conflictingBooking = room.bookings.find(booking => {
      const existingCheckIn = new Date(booking.checkIn);
      const existingCheckOut = new Date(booking.checkOut);
      
      return (checkInDate < existingCheckOut && checkOutDate > existingCheckIn);
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'Room is already booked for the selected dates',
        conflictingBooking: conflictingBooking
      });
    }

    // Add booking to room
    room.bookings.push({
      bookingId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guests || []
    });

    // Update room availability if currently booked
    const now = new Date();
    room.isAvailable = !room.bookings.some(booking => {
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      return now >= bookingCheckIn && now < bookingCheckOut;
    });

    await accommodation.save();

    res.json({
      message: 'Room successfully assigned to booking',
      room: room
    });
  } catch (error) {
    console.error('Assign room to booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room bookings for a specific booking ID
router.get('/bookings/:bookingId/rooms', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const accommodations = await Accommodation.find({
      'rooms.bookings.bookingId': bookingId
    }).populate('associatedTours.tour', 'title destinations');

    const roomAssignments = [];
    
    accommodations.forEach(accommodation => {
      accommodation.rooms.forEach(room => {
        const booking = room.bookings.find(b => b.bookingId.toString() === bookingId);
        if (booking) {
          roomAssignments.push({
            accommodationId: accommodation._id,
            accommodationName: accommodation.name,
            accommodationCategory: accommodation.category,
            location: accommodation.location,
            roomId: room._id,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            capacity: room.capacity,
            facilities: room.facilities,
            pricePerNight: room.pricePerNight,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests
          });
        }
      });
    });

    res.json({
      bookingId,
      roomAssignments,
      totalRooms: roomAssignments.length
    });
  } catch (error) {
    console.error('Get booking room assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accommodations by itinerary/tour
router.get('/itinerary/:tourId', auth, async (req, res) => {
  try {
    const { tourId } = req.params;
    const { destination, date } = req.query;

    let filter = {
      'associatedTours.tour': tourId,
      isActive: true
    };

    if (destination) {
      filter['associatedTours.destination'] = { $regex: destination, $options: 'i' };
    }

    const accommodations = await Accommodation.find(filter)
      .populate('associatedTours.tour', 'title destinations startDate endDate duration')
      .sort({ 'location.city': 1, name: 1 });

    // If date is provided, check room availability for that date
    if (date) {
      const checkDate = new Date(date);
      accommodations.forEach(accommodation => {
        accommodation.rooms.forEach(room => {
          const isOccupied = room.bookings.some(booking => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            return checkDate >= checkIn && checkDate < checkOut;
          });
          room.isAvailableOnDate = !isOccupied;
        });
      });
    }

    res.json({
      tourId,
      destination: destination || 'All destinations',
      accommodations,
      totalAccommodations: accommodations.length,
      totalRooms: accommodations.reduce((sum, acc) => sum + acc.rooms.length, 0)
    });
  } catch (error) {
    console.error('Get itinerary accommodations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove room booking assignment
router.delete('/:id/rooms/:roomId/bookings/:bookingId', auth, async (req, res) => {
  try {
    const { id, roomId, bookingId } = req.params;

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const room = accommodation.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const bookingIndex = room.bookings.findIndex(booking => 
      booking.bookingId.toString() === bookingId
    );

    if (bookingIndex === -1) {
      return res.status(404).json({ message: 'Booking assignment not found' });
    }

    room.bookings.splice(bookingIndex, 1);

    // Update room availability
    const now = new Date();
    room.isAvailable = !room.bookings.some(booking => {
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      return now >= bookingCheckIn && now < bookingCheckOut;
    });

    await accommodation.save();

    res.json({
      message: 'Room booking assignment removed successfully',
      room: room
    });
  } catch (error) {
    console.error('Remove room booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available rooms for specific dates
router.get('/:id/available-rooms', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, capacity } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const availableRooms = accommodation.rooms.filter(room => {
      // Check capacity if specified
      if (capacity && room.capacity < parseInt(capacity)) {
        return false;
      }

      // Check for booking conflicts
      const hasConflict = room.bookings.some(booking => {
        const existingCheckIn = new Date(booking.checkIn);
        const existingCheckOut = new Date(booking.checkOut);
        return (checkInDate < existingCheckOut && checkOutDate > existingCheckIn);
      });

      return !hasConflict;
    });

    res.json({
      accommodationId: id,
      accommodationName: accommodation.name,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      availableRooms,
      totalAvailable: availableRooms.length,
      totalRooms: accommodation.rooms.length
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;