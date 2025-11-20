const express = require('express');
const router = express.Router();
const MemberContact = require('../models/MemberContact');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/member-contacts - Get all member contacts with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search filter (name, email, member ID)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { memberId: searchRegex },
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'contactInfo.email': searchRegex },
        { 'contactInfo.primaryPhone': searchRegex }
      ];
    }

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Membership type filter
    if (req.query.membershipType) {
      filter.membershipType = req.query.membershipType;
    }

    // Spiritual filters
    if (req.query.gothra) {
      filter['spiritualInfo.gothra'] = req.query.gothra;
    }

    if (req.query.nakshatra) {
      filter['spiritualInfo.nakshatra'] = req.query.nakshatra;
    }

    // Execute query with pagination
    const members = await MemberContact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MemberContact.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    res.json({
      members,
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching member contacts:', error);
    res.status(500).json({ message: 'Error fetching member contacts', error: error.message });
  }
});

// GET /api/member-contacts/stats/summary - Get statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalMembers = await MemberContact.countDocuments();
    const activeMembers = await MemberContact.countDocuments({ status: 'Active' });
    const volunteers = await MemberContact.countDocuments({ 'templePreferences.volunteerInterest': true });
    const lifetimeMembers = await MemberContact.countDocuments({ membershipType: 'Lifetime' });

    // Get membership type distribution
    const membershipTypes = await MemberContact.aggregate([
      {
        $group: {
          _id: '$membershipType',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get gothra distribution (top 10)
    const gothraCounts = await MemberContact.aggregate([
      {
        $group: {
          _id: '$spiritualInfo.gothra',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          gothra: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      totalMembers,
      activeMembers,
      volunteers,
      lifetimeMembers,
      membershipTypes,
      gothraCounts
    });
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// GET /api/member-contacts/volunteers - Get all volunteers
router.get('/volunteers', auth, async (req, res) => {
  try {
    const volunteers = await MemberContact.find({
      'templePreferences.volunteerInterest': true,
      status: 'Active'
    }).sort({ 'personalInfo.firstName': 1 });

    res.json({ volunteers });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
  }
});

// GET /api/member-contacts/search/spiritual - Search by spiritual preferences
router.get('/search/spiritual', auth, async (req, res) => {
  try {
    const filter = {};

    if (req.query.gothra) {
      filter['spiritualInfo.gothra'] = req.query.gothra;
    }

    if (req.query.nakshatra) {
      filter['spiritualInfo.nakshatra'] = req.query.nakshatra;
    }

    if (req.query.deity) {
      filter['templePreferences.preferredDeity'] = req.query.deity;
    }

    if (req.query.utsavam) {
      filter['templePreferences.preferredUtsavams'] = req.query.utsavam;
    }

    const members = await MemberContact.find(filter)
      .sort({ 'personalInfo.firstName': 1 });

    res.json({ members });
  } catch (error) {
    console.error('Error searching by spiritual preferences:', error);
    res.status(500).json({ message: 'Error searching members', error: error.message });
  }
});

// GET /api/member-contacts/:id - Get single member contact
router.get('/:id', auth, async (req, res) => {
  try {
    const member = await MemberContact.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member contact not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Error fetching member contact:', error);
    res.status(500).json({ message: 'Error fetching member contact', error: error.message });
  }
});

// POST /api/member-contacts - Create new member contact (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    // Check if member ID already exists
    const existingMember = await MemberContact.findOne({ memberId: req.body.memberId });
    if (existingMember) {
      return res.status(400).json({ message: 'Member ID already exists' });
    }

    // Check if email already exists
    const existingEmail = await MemberContact.findOne({ 'contactInfo.email': req.body.contactInfo.email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const member = new MemberContact(req.body);
    await member.save();

    res.status(201).json({
      message: 'Member contact created successfully',
      member
    });
  } catch (error) {
    console.error('Error creating member contact:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating member contact', error: error.message });
  }
});

// PUT /api/member-contacts/:id - Update member contact (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    // If updating email, check if new email already exists
    if (req.body.contactInfo?.email) {
      const existingEmail = await MemberContact.findOne({
        'contactInfo.email': req.body.contactInfo.email,
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const member = await MemberContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Member contact not found' });
    }

    res.json({
      message: 'Member contact updated successfully',
      member
    });
  } catch (error) {
    console.error('Error updating member contact:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating member contact', error: error.message });
  }
});

// DELETE /api/member-contacts/:id - Delete member contact (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const member = await MemberContact.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member contact not found' });
    }

    res.json({ message: 'Member contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting member contact:', error);
    res.status(500).json({ message: 'Error deleting member contact', error: error.message });
  }
});

// PATCH /api/member-contacts/:id/status - Update member status (Admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const member = await MemberContact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Member contact not found' });
    }

    res.json({
      message: 'Member status updated successfully',
      member
    });
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// POST /api/member-contacts/:id/pilgrimage - Add pilgrimage history (Admin only)
router.post('/:id/pilgrimage', adminAuth, async (req, res) => {
  try {
    const member = await MemberContact.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member contact not found' });
    }

    member.pilgrimageHistory.push(req.body);
    await member.save();

    res.json({
      message: 'Pilgrimage history added successfully',
      member
    });
  } catch (error) {
    console.error('Error adding pilgrimage history:', error);
    res.status(400).json({ message: 'Error adding pilgrimage history', error: error.message });
  }
});

module.exports = router;
