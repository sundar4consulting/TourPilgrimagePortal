const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET /api/misc
// @desc    Get all members with filters and pagination
// @access  Private/Admin
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      section,
      gender,
      minAge,
      maxAge,
      search,
      page = 1,
      limit = 20,
      sortBy = 's_no',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (section) {
      filter.section = section;
    }

    if (gender) {
      filter.gender = gender;
    }

    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }

    if (search) {
      filter.$or = [
        { name_aadhar: { $regex: search, $options: 'i' } },
        { section_desc: { $regex: search, $options: 'i' } },
        { aadhar_no: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      Member.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email'),
      Member.countDocuments(filter)
    ]);

    res.json({
      members,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

// @route   GET /api/misc/stats/summary
// @desc    Get member statistics
// @access  Private/Admin
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const [
      totalMembers,
      maleCount,
      femaleCount,
      sectionStats,
      avgAge
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ gender: 'M' }),
      Member.countDocuments({ gender: 'F' }),
      Member.aggregate([
        {
          $group: {
            _id: '$section',
            count: { $sum: 1 },
            avgAge: { $avg: '$age' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]),
      Member.aggregate([
        {
          $group: {
            _id: null,
            avgAge: { $avg: '$age' }
          }
        }
      ])
    ]);

    res.json({
      summary: {
        totalMembers,
        maleCount,
        femaleCount,
        averageAge: avgAge.length > 0 ? avgAge[0].avgAge : 0
      },
      sectionStats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// @route   GET /api/misc/:id
// @desc    Get single member by ID
// @access  Private/Admin
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ message: 'Error fetching member', error: error.message });
  }
});

// @route   POST /api/misc
// @desc    Create new member
// @access  Private/Admin
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      section,
      section_desc,
      s_no,
      mob_s_no,
      group_s_no,
      name_aadhar,
      gender,
      age,
      aadhar_no
    } = req.body;

    // Validate required fields
    if (!section || !section_desc || !s_no || !mob_s_no || !group_s_no || !name_aadhar || !gender) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if member with same section and s_no already exists
    const existingMember = await Member.findOne({ section, s_no });
    if (existingMember) {
      return res.status(400).json({ 
        message: `Member with section ${section} and serial number ${s_no} already exists` 
      });
    }

    const member = new Member({
      section,
      section_desc,
      s_no,
      mob_s_no,
      group_s_no,
      name_aadhar,
      gender,
      age: age || null,
      aadhar_no: aadhar_no || null,
      createdBy: req.user._id
    });

    await member.save();

    res.status(201).json({
      message: 'Member created successfully',
      member
    });
  } catch (error) {
    console.error('Error creating member:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error creating member', error: error.message });
  }
});

// @route   PUT /api/misc/:id
// @desc    Update member
// @access  Private/Admin
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const {
      section,
      section_desc,
      s_no,
      mob_s_no,
      group_s_no,
      name_aadhar,
      gender,
      age,
      aadhar_no
    } = req.body;

    // Check if updating to a section/s_no combination that already exists
    if (section && s_no && (section !== member.section || s_no !== member.s_no)) {
      const existingMember = await Member.findOne({ 
        section, 
        s_no,
        _id: { $ne: req.params.id }
      });
      if (existingMember) {
        return res.status(400).json({ 
          message: `Member with section ${section} and serial number ${s_no} already exists` 
        });
      }
    }

    // Update fields
    if (section !== undefined) member.section = section;
    if (section_desc !== undefined) member.section_desc = section_desc;
    if (s_no !== undefined) member.s_no = s_no;
    if (mob_s_no !== undefined) member.mob_s_no = mob_s_no;
    if (group_s_no !== undefined) member.group_s_no = group_s_no;
    if (name_aadhar !== undefined) member.name_aadhar = name_aadhar;
    if (gender !== undefined) member.gender = gender;
    if (age !== undefined) member.age = age || null;
    if (aadhar_no !== undefined) member.aadhar_no = aadhar_no || null;
    
    member.updatedBy = req.user._id;

    await member.save();

    res.json({
      message: 'Member updated successfully',
      member
    });
  } catch (error) {
    console.error('Error updating member:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error updating member', error: error.message });
  }
});

// @route   DELETE /api/misc/:id
// @desc    Delete member
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await member.deleteOne();

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Error deleting member', error: error.message });
  }
});

module.exports = router;
