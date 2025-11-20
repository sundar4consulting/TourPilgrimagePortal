const express = require('express');
const Parts = require('../models/Parts');
const router = express.Router();

// GET all PARTS
router.get('/', async (req, res) => {
  try {
    const parts = await Parts.find();
    res.json(parts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// (Optional) POST, PUT, DELETE can be added for admin CRUD

module.exports = router;
