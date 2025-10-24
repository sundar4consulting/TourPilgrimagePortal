const express = require('express');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTours,
      totalBookings,
      totalRevenue,
      pendingExpenses,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      Tour.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Expense.countDocuments({ isApproved: false }),
      Booking.find()
        .populate('user', 'firstName lastName email')
        .populate('tour', 'title destinations')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const monthlyBookings = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const tourStatistics = await Tour.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statistics: {
        totalUsers,
        totalTours,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingExpenses
      },
      recentBookings,
      monthlyBookings,
      tourStatistics
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userBookings = await Booking.find({ user: req.params.id })
      .populate('tour', 'title destinations startDate endDate');

    res.json({
      user,
      bookings: userBookings
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, tourId } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (tourId) filter.tour = tourId;

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('tour', 'title destinations startDate endDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status
router.put('/bookings/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'confirmed' && { confirmationDate: new Date() })
      },
      { new: true }
    ).populate('user tour');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense management data
router.get('/expenses', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, tourId, category, isApproved } = req.query;
    
    const filter = {};
    if (tourId) filter.tour = tourId;
    if (category) filter.category = category;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const expenses = await Expense.find(filter)
      .populate('tour', 'title destinations')
      .populate('addedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ expenseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;