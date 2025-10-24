const express = require('express');
const Destination = require('../models/Destination');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all destinations (public)
router.get('/', async (req, res) => {
  try {
    const { region, state } = req.query;
    
    const filter = { isActive: true };
    if (region) filter.region = region;
    if (state) filter.state = state;

    const destinations = await Destination.find(filter)
      .sort({ region: 1, state: 1, name: 1 });

    res.json(destinations);
  } catch (error) {
    console.error('Get destinations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get destinations by region (public)
router.get('/region/:region', async (req, res) => {
  try {
    const destinations = await Destination.find({
      region: req.params.region,
      isActive: true
    }).sort({ state: 1, name: 1 });

    res.json(destinations);
  } catch (error) {
    console.error('Get destinations by region error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get destination by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.json(destination);
  } catch (error) {
    console.error('Get destination error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create destination (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const destination = new Destination(req.body);
    await destination.save();

    res.status(201).json({
      message: 'Destination created successfully',
      destination
    });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({ message: 'Server error during destination creation' });
  }
});

// Update destination (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.json({
      message: 'Destination updated successfully',
      destination
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({ message: 'Server error during destination update' });
  }
});

// Delete destination (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.json({ message: 'Destination deactivated successfully' });
  } catch (error) {
    console.error('Delete destination error:', error);
    res.status(500).json({ message: 'Server error during destination deletion' });
  }
});

module.exports = router;