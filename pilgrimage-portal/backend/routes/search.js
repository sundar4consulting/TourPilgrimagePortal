const express = require('express');
const { auth } = require('../middleware/auth');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const Destination = require('../models/Destination');

const router = express.Router();

// Helper function to create text search query
const createTextSearchQuery = (searchTerm) => {
  const regex = new RegExp(searchTerm, 'i');
  return {
    $or: [
      { name: regex },
      { description: regex },
      { category: regex },
      { destinations: { $in: [regex] } }
    ]
  };
};

// Helper function to apply filters
const applyFilters = (query, filters) => {
  // Category filter
  if (filters.category && filters.category !== '') {
    query.category = filters.category;
  }
  
  // Status filter
  if (filters.status && filters.status !== '') {
    query.status = filters.status;
  }
  
  // Price range filter
  if (filters.priceRange && filters.priceRange !== '') {
    const [min, max] = filters.priceRange.split('-');
    if (max === '+') {
      query.price = { $gte: parseInt(min) };
    } else {
      query.price = { $gte: parseInt(min), $lte: parseInt(max) };
    }
  }
  
  // Date range filter
  if (filters.dateRange && filters.dateRange !== '') {
    const now = new Date();
    let startDate, endDate;
    
    switch (filters.dateRange) {
      case 'upcoming':
        startDate = now;
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        break;
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'next-month':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }
    
    if (startDate && endDate) {
      query.startDate = { $gte: startDate, $lte: endDate };
    }
  }
  
  return query;
};

// Helper function to apply sorting
const applySorting = (aggregateQuery, sortBy) => {
  let sortStage = {};
  
  switch (sortBy) {
    case 'price-low':
      sortStage = { price: 1 };
      break;
    case 'price-high':
      sortStage = { price: -1 };
      break;
    case 'duration':
      sortStage = { duration: 1 };
      break;
    case 'date':
      sortStage = { startDate: 1 };
      break;
    case 'popularity':
      sortStage = { currentParticipants: -1 };
      break;
    case 'featured':
    default:
      sortStage = { featured: -1, createdAt: -1 };
      break;
  }
  
  return aggregateQuery.sort(sortStage);
};

// Global search endpoint
router.get('/global', auth, async (req, res) => {
  try {
    const { query: searchQuery, category, status, priceRange, dateRange, tab } = req.query;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json({
        tours: [],
        destinations: [],
        users: [],
        bookings: [],
        expenses: []
      });
    }
    
    const results = {
      tours: [],
      destinations: [],
      users: [],
      bookings: [],
      expenses: []
    };
    
    const filters = { category, status, priceRange, dateRange };
    
    // Search tours
    if (!tab || tab === 'all' || tab === 'tours') {
      let tourQuery = createTextSearchQuery(searchQuery);
      tourQuery = applyFilters(tourQuery, filters);
      
      results.tours = await Tour.find(tourQuery)
        .select('name description category destinations price startDate duration maxParticipants currentParticipants images')
        .limit(tab === 'tours' ? 50 : 10)
        .lean();
    }
    
    // Search destinations
    if (!tab || tab === 'all' || tab === 'destinations') {
      const destinationQuery = {
        $or: [
          { name: new RegExp(searchQuery, 'i') },
          { description: new RegExp(searchQuery, 'i') },
          { country: new RegExp(searchQuery, 'i') },
          { state: new RegExp(searchQuery, 'i') },
          { category: new RegExp(searchQuery, 'i') }
        ]
      };
      
      if (filters.category) {
        destinationQuery.category = filters.category;
      }
      
      results.destinations = await Destination.find(destinationQuery)
        .select('name description country state category significance images')
        .limit(tab === 'destinations' ? 50 : 10)
        .lean();
    }
    
    // Search users (admin only)
    if (req.user.role === 'admin' && (!tab || tab === 'all' || tab === 'users')) {
      const userQuery = {
        $or: [
          { name: new RegExp(searchQuery, 'i') },
          { email: new RegExp(searchQuery, 'i') },
          { phone: new RegExp(searchQuery, 'i') }
        ]
      };
      
      if (filters.status) {
        userQuery.isActive = filters.status === 'active';
      }
      
      results.users = await User.find(userQuery)
        .select('name email phone role isActive createdAt')
        .limit(tab === 'users' ? 50 : 10)
        .lean();
    }
    
    // Search bookings
    if (!tab || tab === 'all' || tab === 'bookings') {
      const bookingQuery = {};
      
      if (filters.status) {
        bookingQuery.status = filters.status;
      }
      
      // For non-admin users, only show their own bookings
      if (req.user.role !== 'admin') {
        bookingQuery.user = req.user.id;
      }
      
      results.bookings = await Booking.find(bookingQuery)
        .populate({
          path: 'tour',
          select: 'name destinations startDate',
          match: createTextSearchQuery(searchQuery)
        })
        .populate({
          path: 'user',
          select: 'name email',
          match: req.user.role === 'admin' ? {
            $or: [
              { name: new RegExp(searchQuery, 'i') },
              { email: new RegExp(searchQuery, 'i') }
            ]
          } : undefined
        })
        .select('participants totalAmount status createdAt')
        .limit(tab === 'bookings' ? 50 : 10)
        .lean();
      
      // Filter out bookings where populated fields don't match
      results.bookings = results.bookings.filter(booking => 
        booking.tour && (req.user.role !== 'admin' || booking.user)
      );
    }
    
    // Search expenses
    if (!tab || tab === 'all' || tab === 'expenses') {
      const expenseQuery = {
        $or: [
          { description: new RegExp(searchQuery, 'i') },
          { category: new RegExp(searchQuery, 'i') }
        ]
      };
      
      if (filters.category) {
        expenseQuery.category = filters.category;
      }
      
      if (filters.status) {
        expenseQuery.status = filters.status;
      }
      
      // For non-admin users, only show their own expenses
      if (req.user.role !== 'admin') {
        expenseQuery.user = req.user.id;
      }
      
      results.expenses = await Expense.find(expenseQuery)
        .populate('user', 'name email')
        .select('description amount category date status createdAt')
        .limit(tab === 'expenses' ? 50 : 10)
        .lean();
    }
    
    res.json(results);
    
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Advanced tour search with filters and sorting
router.get('/tours', async (req, res) => {
  try {
    const {
      query: searchQuery,
      category,
      priceRange,
      duration,
      difficulty,
      sortBy,
      page = 1,
      limit = 12
    } = req.query;
    
    let query = {};
    
    // Text search
    if (searchQuery && searchQuery.length >= 2) {
      query = createTextSearchQuery(searchQuery);
    }
    
    // Apply filters
    query = applyFilters(query, { category, priceRange });
    
    // Duration filter
    if (duration && duration !== '') {
      if (duration.includes('-')) {
        const [min, max] = duration.split('-').map(d => parseInt(d));
        query.duration = { $gte: min, $lte: max };
      } else if (duration.includes('+')) {
        const min = parseInt(duration.replace('+', ''));
        query.duration = { $gte: min };
      } else {
        query.duration = parseInt(duration);
      }
    }
    
    // Difficulty filter
    if (difficulty && difficulty !== '') {
      query.difficulty = difficulty;
    }
    
    // Build aggregation pipeline
    let aggregateQuery = Tour.aggregate([
      { $match: query },
      {
        $addFields: {
          availableSpots: { $subtract: ['$maxParticipants', { $ifNull: ['$currentParticipants', 0] }] },
          isUpcoming: { $gt: ['$startDate', new Date()] }
        }
      }
    ]);
    
    // Apply sorting
    aggregateQuery = applySorting(aggregateQuery, sortBy);
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    aggregateQuery = aggregateQuery.skip(skip).limit(parseInt(limit));
    
    const tours = await aggregateQuery;
    
    // Get total count for pagination
    const totalCount = await Tour.countDocuments(query);
    
    res.json({
      tours,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: parseInt(page) * parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Tour search error:', error);
    res.status(500).json({ message: 'Tour search failed', error: error.message });
  }
});

// Quick search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { query: searchQuery } = req.query;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const regex = new RegExp(searchQuery, 'i');
    
    // Get tour suggestions
    const tourSuggestions = await Tour.find(
      { name: regex },
      { name: 1, category: 1 }
    ).limit(5).lean();
    
    // Get destination suggestions
    const destinationSuggestions = await Destination.find(
      { name: regex },
      { name: 1, country: 1, state: 1 }
    ).limit(5).lean();
    
    const suggestions = [
      ...tourSuggestions.map(tour => ({
        type: 'tour',
        text: tour.name,
        category: tour.category,
        id: tour._id
      })),
      ...destinationSuggestions.map(dest => ({
        type: 'destination',
        text: dest.name,
        location: `${dest.state}, ${dest.country}`,
        id: dest._id
      }))
    ];
    
    res.json({ suggestions: suggestions.slice(0, 10) });
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
});

// Search analytics (admin only)
router.get('/analytics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Most searched terms (this would require implementing search logging)
    const searchStats = {
      totalSearches: 0, // Implement search logging to track this
      popularTerms: [
        { term: 'kedarnath', count: 45 },
        { term: 'varanasi', count: 38 },
        { term: 'char dham', count: 32 },
        { term: 'golden temple', count: 28 },
        { term: 'tirupati', count: 25 }
      ],
      searchCategories: {
        tours: 65,
        destinations: 25,
        users: 6,
        bookings: 3,
        expenses: 1
      },
      noResultsQueries: [
        'luxury tours',
        'international pilgrimage',
        'group discounts'
      ]
    };
    
    res.json(searchStats);
    
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({ message: 'Failed to get search analytics', error: error.message });
  }
});

module.exports = router;