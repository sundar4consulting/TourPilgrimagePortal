const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Tour = require('../models/Tour');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get expense categories (public for form dropdowns)
router.get('/categories', (req, res) => {
  const categories = [
    { value: 'transportation', label: 'Transportation', icon: '🚗' },
    { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
    { value: 'meals', label: 'Meals & Food', icon: '🍽️' },
    { value: 'temple-donations', label: 'Temple Donations', icon: '🕉️' },
    { value: 'guide-fees', label: 'Guide Fees', icon: '👨‍🏫' },
    { value: 'entrance-fees', label: 'Entrance Fees', icon: '🎫' },
    { value: 'photography', label: 'Photography', icon: '📸' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'medical', label: 'Medical', icon: '💊' },
    { value: 'emergency', label: 'Emergency', icon: '🚨' },
    { value: 'miscellaneous', label: 'Miscellaneous', icon: '📋' }
  ];
  res.json(categories);
});

// Get expense statistics (admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { tourId, startDate, endDate } = req.query;
    
    const matchFilter = {};
    if (tourId) matchFilter.tour = mongoose.Types.ObjectId(tourId);
    if (startDate || endDate) {
      matchFilter.expenseDate = {};
      if (startDate) matchFilter.expenseDate.$gte = new Date(startDate);
      if (endDate) matchFilter.expenseDate.$lte = new Date(endDate);
    }

    const stats = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          approvedExpenses: {
            $sum: { $cond: [{ $eq: ['$isApproved', true] }, '$amount', 0] }
          },
          pendingExpenses: {
            $sum: { $cond: [{ $eq: ['$isApproved', false] }, '$amount', 0] }
          },
          avgExpense: { $avg: '$amount' }
        }
      }
    ]);

    const categoryStats = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      summary: stats[0] || {
        totalExpenses: 0,
        totalCount: 0,
        approvedExpenses: 0,
        pendingExpenses: 0,
        avgExpense: 0
      },
      byCategory: categoryStats
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expenses (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { 
      tourId, 
      category, 
      startDate, 
      endDate, 
      isApproved,
      addedBy,
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = {};
    
    // Regular users can only see their own expenses
    if (req.user.role !== 'admin') {
      filter.addedBy = req.user._id;
    } else if (addedBy) {
      filter.addedBy = addedBy;
    }

    if (tourId) filter.tour = tourId;
    if (category) filter.category = category;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('tour', 'title destinations startDate endDate')
      .populate('addedBy', 'firstName lastName email')
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

// Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Regular users can only see their own expenses
    if (req.user.role !== 'admin') {
      filter.addedBy = req.user._id;
    }

    const expense = await Expense.findOne(filter)
      .populate('tour', 'title destinations')
      .populate('addedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add expense
router.post('/', auth, [
  body('tour').notEmpty().withMessage('Tour ID is required'),
  body('category').isIn([
    'transportation', 'accommodation', 'meals', 'temple-donations',
    'guide-fees', 'entrance-fees', 'photography', 'shopping',
    'medical', 'emergency', 'miscellaneous'
  ]).withMessage('Valid category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be 0 or more'),
  body('expenseDate').isISO8601().withMessage('Valid expense date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify tour exists
    const tour = await Tour.findById(req.body.tour);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const expense = new Expense({
      ...req.body,
      addedBy: req.user._id
    });

    await expense.save();

    await expense.populate([
      { path: 'tour', select: 'title destinations' },
      { path: 'addedBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error during expense creation' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Regular users can only update their own expenses
    if (req.user.role !== 'admin') {
      filter.addedBy = req.user._id;
    }

    const expense = await Expense.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'tour', select: 'title destinations' },
      { path: 'addedBy', select: 'firstName lastName' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error during expense update' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Regular users can only delete their own expenses
    if (req.user.role !== 'admin') {
      filter.addedBy = req.user._id;
    }

    const expense = await Expense.findOneAndDelete(filter);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error during expense deletion' });
  }
});

// Approve expense (admin only)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        approvedBy: req.user._id,
        approvalDate: new Date()
      },
      { new: true }
    ).populate([
      { path: 'tour', select: 'title destinations' },
      { path: 'addedBy', select: 'firstName lastName' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({
      message: 'Expense approved successfully',
      expense
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ message: 'Server error during expense approval' });
  }
});

// Get expense reports (admin only)
router.get('/reports/summary', adminAuth, async (req, res) => {
  try {
    const { tourId, startDate, endDate } = req.query;

    const matchFilter = {};
    if (tourId) matchFilter.tour = mongoose.Types.ObjectId(tourId);
    if (startDate || endDate) {
      matchFilter.expenseDate = {};
      if (startDate) matchFilter.expenseDate.$gte = new Date(startDate);
      if (endDate) matchFilter.expenseDate.$lte = new Date(endDate);
    }

    const summary = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          totalApproved: {
            $sum: {
              $cond: [{ $eq: ['$isApproved', true] }, '$amount', 0]
            }
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ['$isApproved', false] }, '$amount', 0]
            }
          },
          expenseCount: { $sum: 1 },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ['$isApproved', true] }, 1, 0]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$isApproved', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryBreakdown = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$isApproved', true] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const tourBreakdown = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$tour',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'tours',
          localField: '_id',
          foreignField: '_id',
          as: 'tourDetails'
        }
      },
      { $unwind: '$tourDetails' },
      {
        $project: {
          tourTitle: '$tourDetails.title',
          total: 1,
          count: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      summary: summary[0] || {
        totalExpenses: 0,
        totalApproved: 0,
        totalPending: 0,
        expenseCount: 0,
        approvedCount: 0,
        pendingCount: 0
      },
      categoryBreakdown,
      tourBreakdown
    });
  } catch (error) {
    console.error('Get expense reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk approve expenses (admin only)
router.put('/bulk/approve', adminAuth, async (req, res) => {
  try {
    const { expenseIds } = req.body;
    
    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({ message: 'Expense IDs array is required' });
    }

    const result = await Expense.updateMany(
      { _id: { $in: expenseIds }, isApproved: false },
      {
        isApproved: true,
        approvedBy: req.user._id,
        approvalDate: new Date()
      }
    );

    res.json({
      message: `${result.modifiedCount} expenses approved successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approve expenses error:', error);
    res.status(500).json({ message: 'Server error during bulk approval' });
  }
});

// Bulk delete expenses (admin only)
router.delete('/bulk/delete', adminAuth, async (req, res) => {
  try {
    const { expenseIds } = req.body;
    
    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({ message: 'Expense IDs array is required' });
    }

    const result = await Expense.deleteMany({ _id: { $in: expenseIds } });

    res.json({
      message: `${result.deletedCount} expenses deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete expenses error:', error);
    res.status(500).json({ message: 'Server error during bulk deletion' });
  }
});

// Get expense analytics (admin only)
router.get('/analytics/dashboard', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Monthly trends
    const monthlyTrends = await Expense.aggregate([
      {
        $match: {
          expenseDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$isApproved', true] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top spending categories
    const topCategories = await Expense.aggregate([
      {
        $match: {
          expenseDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Recent activity
    const recentActivity = await Expense.find({
      createdAt: { $gte: startDate }
    })
      .populate('tour', 'title')
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      monthlyTrends,
      topCategories,
      recentActivity
    });
  } catch (error) {
    console.error('Get expense analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN EXPENSE MANAGEMENT ROUTES

// Create expense (Admin only)
router.post('/admin/create', adminAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('category').notEmpty().withMessage('Category is required'),
  body('expenseDate').isISO8601().withMessage('Valid expense date is required'),
  body('tour').optional().isMongoId().withMessage('Valid tour ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expenseData = {
      ...req.body,
      addedBy: req.user._id,
      isApproved: true, // Admin expenses are auto-approved
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    // Validate tour if provided
    if (expenseData.tour) {
      const tour = await Tour.findById(expenseData.tour);
      if (!tour) {
        return res.status(404).json({ message: 'Tour not found' });
      }
    }

    const expense = new Expense(expenseData);
    await expense.save();

    await expense.populate([
      { path: 'tour', select: 'title' },
      { path: 'addedBy', select: 'firstName lastName' }
    ]);

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense (Admin only)
router.put('/admin/:id', adminAuth, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('expenseDate').optional().isISO8601().withMessage('Valid expense date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'addedBy' && key !== 'createdAt') {
        expense[key] = req.body[key];
      }
    });

    expense.updatedAt = new Date();
    expense.updatedBy = req.user._id;

    await expense.save();
    await expense.populate([
      { path: 'tour', select: 'title' },
      { path: 'addedBy', select: 'firstName lastName' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense (Admin only)
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expenses (Admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      tour, 
      isApproved, 
      startDate, 
      endDate,
      search 
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (tour) filter.tour = tour;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const expenses = await Expense.find(filter)
      .populate('tour', 'title')
      .populate('addedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get admin expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject expense (Admin only)
router.patch('/admin/:id/approval', adminAuth, [
  body('isApproved').isBoolean().withMessage('Approval status is required'),
  body('rejectionReason').optional().trim().notEmpty().withMessage('Rejection reason cannot be empty'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isApproved, rejectionReason } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.isApproved = isApproved;
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();
    
    if (!isApproved && rejectionReason) {
      expense.rejectionReason = rejectionReason;
    }

    await expense.save();
    await expense.populate([
      { path: 'tour', select: 'title' },
      { path: 'addedBy', select: 'firstName lastName' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    res.json(expense);
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;