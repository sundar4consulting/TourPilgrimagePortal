const express = require('express');
const { body, validationResult } = require('express-validator');
const Tour = require('../models/Tour');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all tours (public)
router.get('/', async (req, res) => {
  try {
    const { region, status, featured, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (region) filter['destinations.region'] = region;
    if (status) filter.status = status;
    if (featured) filter.featured = featured === 'true';
    
    const tours = await Tour.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tour.countDocuments(filter);

    res.json({
      tours,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tours error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured tours (public)
router.get('/featured', async (req, res) => {
  try {
    const tours = await Tour.find({ 
      status: 'active',
      featured: true 
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(tours);
  } catch (error) {
    console.error('Get featured tours error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tour by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    res.json(tour);
  } catch (error) {
    console.error('Get tour error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create tour (admin only)
router.post('/', adminAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('shortDescription').trim().isLength({ max: 200 }).withMessage('Short description must be under 200 characters'),
  body('destinations').isArray({ min: 1 }).withMessage('At least one destination is required'),
  body('duration.days').isInt({ min: 1 }).withMessage('Duration days must be at least 1'),
  body('duration.nights').isInt({ min: 0 }).withMessage('Duration nights must be 0 or more'),
  body('pricing.adult').isFloat({ min: 0 }).withMessage('Adult price must be 0 or more'),
  body('pricing.child').isFloat({ min: 0 }).withMessage('Child price must be 0 or more'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tourData = {
      ...req.body,
      createdBy: req.user._id
    };

    const tour = new Tour(tourData);
    await tour.save();

    await tour.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Tour created successfully',
      tour
    });
  } catch (error) {
    console.error('Create tour error:', error);
    res.status(500).json({ message: 'Server error during tour creation' });
  }
});

// Update tour (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    res.json({
      message: 'Tour updated successfully',
      tour
    });
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({ message: 'Server error during tour update' });
  }
});

// Delete tour (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    console.error('Delete tour error:', error);
    res.status(500).json({ message: 'Server error during tour deletion' });
  }
});

// Get tours by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const tours = await Tour.find({
      'destinations.region': region,
      status: 'active'
    }).populate('createdBy', 'firstName lastName');

    res.json(tours);
  } catch (error) {
    console.error('Get tours by region error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured tours
router.get('/featured/list', async (req, res) => {
  try {
    const tours = await Tour.find({
      featured: true,
      status: 'active'
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(6);

    res.json(tours);
  } catch (error) {
    console.error('Get featured tours error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN TOUR MANAGEMENT ROUTES

// Update tour (admin only)
router.put('/:id', adminAuth, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('shortDescription').optional().trim().isLength({ max: 200 }).withMessage('Short description must be under 200 characters'),
  body('destinations').optional().isArray({ min: 1 }).withMessage('At least one destination is required'),
  body('duration.days').optional().isInt({ min: 1 }).withMessage('Duration days must be at least 1'),
  body('duration.nights').optional().isInt({ min: 0 }).withMessage('Duration nights must be 0 or more'),
  body('pricing.adult').optional().isFloat({ min: 0 }).withMessage('Adult price must be 0 or more'),
  body('pricing.child').optional().isFloat({ min: 0 }).withMessage('Child price must be 0 or more'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
        tour[key] = req.body[key];
      }
    });

    tour.updatedAt = new Date();
    tour.updatedBy = req.user._id;

    await tour.save();
    await tour.populate('createdBy', 'firstName lastName');

    res.json(tour);
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete tour (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Check if tour has bookings
    const Booking = require('../models/Booking');
    const bookingCount = await Booking.countDocuments({ tour: req.params.id });
    
    if (bookingCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tour with existing bookings. Please cancel all bookings first.' 
      });
    }

    await Tour.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    console.error('Delete tour error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tours for admin (includes inactive tours)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      region, 
      featured, 
      search,
      startDate,
      endDate
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (region) filter['destinations.region'] = region;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'destinations.name': { $regex: search, $options: 'i' } }
      ];
    }

    const tours = await Tour.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tour.countDocuments(filter);

    res.json({
      tours,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get admin tours error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle tour status (admin only)
router.patch('/:id/status', adminAuth, [
  body('status').isIn(['active', 'inactive', 'completed']).withMessage('Valid status is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    tour.status = req.body.status;
    tour.updatedAt = new Date();
    tour.updatedBy = req.user._id;

    await tour.save();
    await tour.populate('createdBy', 'firstName lastName');

    res.json(tour);
  } catch (error) {
    console.error('Update tour status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle featured status (admin only)
router.patch('/:id/featured', adminAuth, [
  body('featured').isBoolean().withMessage('Featured status is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    tour.featured = req.body.featured;
    tour.updatedAt = new Date();
    tour.updatedBy = req.user._id;

    await tour.save();
    await tour.populate('createdBy', 'firstName lastName');

    res.json(tour);
  } catch (error) {
    console.error('Update tour featured status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Duplicate tour (admin only)
router.post('/:id/duplicate', adminAuth, async (req, res) => {
  try {
    const originalTour = await Tour.findById(req.params.id);
    if (!originalTour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const tourData = originalTour.toObject();
    delete tourData._id;
    delete tourData.createdAt;
    delete tourData.updatedAt;
    
    tourData.title = `${tourData.title} (Copy)`;
    tourData.createdBy = req.user._id;
    tourData.status = 'inactive'; // Set as inactive by default
    tourData.featured = false;
    tourData.currentParticipants = 0;

    const newTour = new Tour(tourData);
    await newTour.save();
    await newTour.populate('createdBy', 'firstName lastName');

    res.status(201).json(newTour);
  } catch (error) {
    console.error('Duplicate tour error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;