const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const familyMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['spouse', 'child', 'parent', 'sibling', 'other']
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 120
  },
  aadharNumber: {
    type: String,
    required: true,
    match: /^[0-9]{12}$/
  },
  phoneNumber: {
    type: String,
    match: /^[0-9]{10}$/
  }
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{12}$/
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: /^[0-9]{6}$/
    }
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  familyMembers: [familyMemberSchema],
  isVerified: {
    type: Boolean,
    default: false
  },
  profileImage: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);