const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user bookings
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('tour', 'title startDate endDate destinations duration pricing')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('tour user', 'title startDate endDate destinations firstName lastName email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create booking (express interest)
router.post('/', auth, [
  body('tourId').notEmpty().withMessage('Tour ID is required'),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
  body('participants.*.name').trim().notEmpty().withMessage('Participant name is required'),
  body('participants.*.age').isInt({ min: 0, max: 120 }).withMessage('Valid age is required'),
  body('participants.*.aadharNumber').matches(/^[0-9]{12}$/).withMessage('Valid Aadhar number is required'),
  body('participants.*.priceCategory').isIn(['adult', 'child', 'senior']).withMessage('Valid price category is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tourId, participants, specialRequests, emergencyContact } = req.body;

    // Check if tour exists and is available
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (tour.status !== 'active') {
      return res.status(400).json({ message: 'Tour is not available for booking' });
    }

    if (tour.currentParticipants + participants.length > tour.maxParticipants) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Calculate pricing
    let subtotal = 0;
    participants.forEach(participant => {
      subtotal += tour.pricing[participant.priceCategory] || tour.pricing.adult;
    });

    const taxes = subtotal * 0.18; // 18% GST
    const total = subtotal + taxes;

    // Generate booking ID
    const bookingId = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Add type field to participants (first one is primary, rest are family)
    const processedParticipants = participants.map((participant, index) => ({
      ...participant,
      type: index === 0 ? 'primary' : 'family'
    }));

    // Create booking
    const booking = new Booking({
      bookingId,
      user: req.user._id,
      tour: tourId,
      participants: processedParticipants,
      totalParticipants: processedParticipants.length,
      pricing: {
        subtotal,
        taxes,
        total
      },
      specialRequests,
      emergencyContact
    });

    await booking.save();

    // Update tour participant count
    tour.currentParticipants += processedParticipants.length;
    await tour.save();

    await booking.populate('tour', 'title startDate endDate destinations');

    res.status(201).json({
      message: 'Interest expressed successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error during booking creation' });
  }
});

// Update booking status
router.put('/:id/status', auth, [
  body('status').isIn(['interested', 'confirmed', 'paid', 'cancelled']).withMessage('Valid status is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    if (status === 'confirmed') {
      booking.confirmationDate = new Date();
    } else if (status === 'cancelled') {
      booking.cancellationDate = new Date();
      
      // Reduce tour participant count
      const tour = await Tour.findById(booking.tour);
      tour.currentParticipants -= booking.totalParticipants;
      await tour.save();
    }

    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error during status update' });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, [
  body('reason').optional().trim(),
], async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    booking.cancellationDate = new Date();
    booking.cancellationReason = req.body.reason;

    // Reduce tour participant count
    const tour = await Tour.findById(booking.tour);
    tour.currentParticipants -= booking.totalParticipants;
    await tour.save();

    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error during booking cancellation' });
  }
});

// ADMIN BOOKING MANAGEMENT ROUTES

// Get all bookings (Admin only)
router.get('/admin/all', async (req, res) => {
  try {
    // Import adminAuth middleware
    const { adminAuth } = require('../middleware/auth');
    await adminAuth(req, res, async () => {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        tour, 
        startDate, 
        endDate,
        search 
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (tour) filter.tour = tour;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      if (search) {
        filter.$or = [
          { bookingId: { $regex: search, $options: 'i' } },
          { 'participants.name': { $regex: search, $options: 'i' } }
        ];
      }

      const bookings = await Booking.find(filter)
        .populate('tour', 'title startDate endDate destinations')
        .populate('user', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments(filter);

      res.json({
        bookings,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (Admin only)
router.patch('/admin/:id/status', async (req, res) => {
  try {
    const { adminAuth } = require('../middleware/auth');
    await adminAuth(req, res, async () => {
      const errors = validationResult([
        body('status').isIn(['pending', 'approved', 'rejected', 'cancelled', 'completed']).withMessage('Valid status is required'),
        body('notes').optional().trim().notEmpty().withMessage('Notes cannot be empty'),
      ](req, res, () => {}));

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const oldStatus = booking.status;
      booking.status = req.body.status;
      booking.adminNotes = req.body.notes;
      booking.statusUpdatedBy = req.user._id;
      booking.statusUpdatedAt = new Date();

      // Update tour participant count based on status change
      const tour = await Tour.findById(booking.tour);
      
      if (oldStatus === 'pending' && req.body.status === 'approved') {
        tour.currentParticipants += booking.totalParticipants;
      } else if (oldStatus === 'approved' && ['rejected', 'cancelled'].includes(req.body.status)) {
        tour.currentParticipants -= booking.totalParticipants;
      } else if (['pending', 'rejected'].includes(oldStatus) && req.body.status === 'approved') {
        tour.currentParticipants += booking.totalParticipants;
      }

      await tour.save();
      await booking.save();
      
      await booking.populate([
        { path: 'tour', select: 'title startDate endDate' },
        { path: 'user', select: 'firstName lastName email' },
        { path: 'statusUpdatedBy', select: 'firstName lastName' }
      ]);

      res.json(booking);
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete booking (Admin only)
router.delete('/admin/:id', async (req, res) => {
  try {
    const { adminAuth } = require('../middleware/auth');
    await adminAuth(req, res, async () => {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update tour participant count if booking was approved
      if (booking.status === 'approved') {
        const tour = await Tour.findById(booking.tour);
        tour.currentParticipants -= booking.totalParticipants;
        await tour.save();
      }

      await Booking.findByIdAndDelete(req.params.id);
      res.json({ message: 'Booking deleted successfully' });
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add family member to booking (Admin or User)
router.post('/:id/add-family', async (req, res) => {
  try {
    await auth(req, res, async () => {
      const errors = validationResult([
        body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
        body('participants.*.name').trim().notEmpty().withMessage('Participant name is required'),
        body('participants.*.age').isInt({ min: 0, max: 120 }).withMessage('Valid age is required'),
        body('participants.*.aadharNumber').matches(/^[0-9]{12}$/).withMessage('Valid Aadhar number is required'),
        body('participants.*.priceCategory').isIn(['adult', 'child', 'senior']).withMessage('Valid price category is required'),
      ](req, res, () => {}));

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const booking = await Booking.findById(req.params.id)
        .populate('tour');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if user owns booking or is admin
      const isAdmin = req.user.role === 'admin';
      if (!isAdmin && booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { participants } = req.body;

      // Validate tour capacity
      const newParticipantCount = participants.length;
      if (booking.tour.currentParticipants + newParticipantCount > booking.tour.maxParticipants) {
        return res.status(400).json({ message: 'Not enough seats available in tour' });
      }

      // Calculate additional pricing
      let additionalSubtotal = 0;
      participants.forEach(participant => {
        additionalSubtotal += booking.tour.pricing[participant.priceCategory] || booking.tour.pricing.adult;
      });

      const additionalTaxes = additionalSubtotal * 0.18; // 18% GST
      const additionalTotal = additionalSubtotal + additionalTaxes;

      // Add participants with family type
      const newParticipants = participants.map(participant => ({
        ...participant,
        type: 'family',
        addedAt: new Date(),
        addedBy: req.user._id
      }));

      booking.participants.push(...newParticipants);
      booking.totalParticipants += newParticipantCount;
      
      // Update pricing
      booking.pricing.subtotal += additionalSubtotal;
      booking.pricing.taxes += additionalTaxes;
      booking.pricing.total += additionalTotal;

      // Update tour participant count if booking is approved
      if (booking.status === 'approved') {
        booking.tour.currentParticipants += newParticipantCount;
        await booking.tour.save();
      }

      await booking.save();
      
      await booking.populate([
        { path: 'tour', select: 'title startDate endDate' },
        { path: 'user', select: 'firstName lastName email' }
      ]);

      res.json(booking);
    });
  } catch (error) {
    console.error('Add family member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin create booking on behalf of user
router.post('/admin/create', async (req, res) => {
  try {
    const { adminAuth } = require('../middleware/auth');
    await adminAuth(req, res, async () => {
      const errors = validationResult([
        body('userId').isMongoId().withMessage('Valid user ID is required'),
        body('tourId').isMongoId().withMessage('Valid tour ID is required'),
        body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
        body('participants.*.name').trim().notEmpty().withMessage('Participant name is required'),
        body('participants.*.age').isInt({ min: 0, max: 120 }).withMessage('Valid age is required'),
        body('participants.*.aadharNumber').matches(/^[0-9]{12}$/).withMessage('Valid Aadhar number is required'),
        body('participants.*.priceCategory').isIn(['adult', 'child', 'senior']).withMessage('Valid price category is required'),
      ](req, res, () => {}));

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, tourId, participants, specialRequests, emergencyContact, autoApprove = true } = req.body;

      // Validate user exists
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if tour exists and is available
      const tour = await Tour.findById(tourId);
      if (!tour) {
        return res.status(404).json({ message: 'Tour not found' });
      }

      if (tour.currentParticipants + participants.length > tour.maxParticipants) {
        return res.status(400).json({ message: 'Not enough seats available' });
      }

      // Calculate pricing
      let subtotal = 0;
      participants.forEach(participant => {
        subtotal += tour.pricing[participant.priceCategory] || tour.pricing.adult;
      });

      const taxes = subtotal * 0.18; // 18% GST
      const total = subtotal + taxes;

      // Generate booking ID
      const bookingId = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Add type field to participants
      const processedParticipants = participants.map((participant, index) => ({
        ...participant,
        type: index === 0 ? 'primary' : 'family'
      }));

      // Create booking
      const booking = new Booking({
        bookingId,
        user: userId,
        tour: tourId,
        participants: processedParticipants,
        totalParticipants: processedParticipants.length,
        pricing: { subtotal, taxes, total },
        specialRequests,
        emergencyContact,
        status: autoApprove ? 'approved' : 'pending',
        adminNotes: `Created by admin: ${req.user.firstName} ${req.user.lastName}`,
        createdBy: req.user._id
      });

      if (autoApprove) {
        booking.statusUpdatedBy = req.user._id;
        booking.statusUpdatedAt = new Date();
        // Update tour participant count
        tour.currentParticipants += processedParticipants.length;
        await tour.save();
      }

      await booking.save();
      
      await booking.populate([
        { path: 'tour', select: 'title startDate endDate destinations' },
        { path: 'user', select: 'firstName lastName email phone' }
      ]);

      res.status(201).json(booking);
    });
  } catch (error) {
    console.error('Admin create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;