const mongoose = require('mongoose');

const personalInfoSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Widowed', 'Divorced'],
    default: 'Single'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', '']
  },
  occupation: String,
  education: String
}, { _id: false });

const addressInfoSchema = new mongoose.Schema({
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true,
    match: /^[0-9]{6}$/
  },
  country: {
    type: String,
    default: 'India'
  }
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  }
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
  primaryPhone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  alternatePhone: {
    type: String,
    match: /^[0-9]{10}$/
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  whatsappNumber: {
    type: String,
    match: /^[0-9]{10}$/
  },
  emergencyContact: {
    type: emergencyContactSchema,
    required: true
  }
}, { _id: false });

const spiritualInfoSchema = new mongoose.Schema({
  gothra: {
    type: String,
    required: true
  },
  nakshatra: {
    type: String,
    required: true
  },
  rashi: String,
  acharyanName: String,
  guruName: String,
  initiationDate: Date,
  spiritualLineage: String
}, { _id: false });

const templePreferencesSchema = new mongoose.Schema({
  preferredDeity: [{
    type: String
  }],
  preferredUtsavams: [{
    type: String
  }],
  visitFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Occasionally'],
    default: 'Monthly'
  },
  preferredTemples: [{
    type: String
  }],
  volunteerInterest: {
    type: Boolean,
    default: false
  },
  donationPreference: {
    type: String,
    enum: ['Anna Dhanam', 'Temple Maintenance', 'Festivals', 'General', '']
  }
}, { _id: false });

const religiousActivitiesSchema = new mongoose.Schema({
  dailyPuja: {
    type: Boolean,
    default: false
  },
  vedicChanting: {
    type: Boolean,
    default: false
  },
  bhajansInterest: {
    type: Boolean,
    default: false
  },
  scriptureStudy: {
    type: Boolean,
    default: false
  },
  meditationPractice: {
    type: Boolean,
    default: false
  },
  yogaPractice: {
    type: Boolean,
    default: false
  },
  participatesInSatsang: {
    type: Boolean,
    default: false
  },
  languagesKnown: [{
    type: String
  }]
}, { _id: false });

const pilgrimageHistorySchema = new mongoose.Schema({
  templeVisited: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  visitDate: {
    type: Date,
    required: true
  },
  tourPackage: String,
  notes: String
}, { _id: false });

const memberContactSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  personalInfo: {
    type: personalInfoSchema,
    required: true
  },
  addressInfo: {
    type: addressInfoSchema,
    required: true
  },
  contactInfo: {
    type: contactInfoSchema,
    required: true
  },
  spiritualInfo: {
    type: spiritualInfoSchema,
    required: true
  },
  templePreferences: {
    type: templePreferencesSchema,
    required: true
  },
  religiousActivities: {
    type: religiousActivitiesSchema,
    required: true
  },
  pilgrimageHistory: [pilgrimageHistorySchema],
  dietaryRestrictions: [{
    type: String
  }],
  specialNeeds: String,
  membershipType: {
    type: String,
    enum: ['Regular', 'Premium', 'Lifetime', 'Family'],
    default: 'Regular',
    required: true
  },
  membershipStartDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
memberContactSchema.index({ memberId: 1 });
memberContactSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
memberContactSchema.index({ 'contactInfo.email': 1 });
memberContactSchema.index({ 'contactInfo.primaryPhone': 1 });
memberContactSchema.index({ 'spiritualInfo.gothra': 1 });
memberContactSchema.index({ 'spiritualInfo.nakshatra': 1 });
memberContactSchema.index({ membershipType: 1 });
memberContactSchema.index({ status: 1 });
memberContactSchema.index({ 'templePreferences.volunteerInterest': 1 });

// Virtual for full name
memberContactSchema.virtual('fullName').get(function() {
  if (this.personalInfo.middleName) {
    return `${this.personalInfo.firstName} ${this.personalInfo.middleName} ${this.personalInfo.lastName}`;
  }
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Method to calculate age from date of birth
memberContactSchema.methods.calculateAge = function() {
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Pre-save middleware to update age
memberContactSchema.pre('save', function(next) {
  if (this.personalInfo.dateOfBirth) {
    this.personalInfo.age = this.calculateAge();
  }
  next();
});

// Ensure virtual fields are included in JSON output
memberContactSchema.set('toJSON', { virtuals: true });
memberContactSchema.set('toObject', { virtuals: true });

const MemberContact = mongoose.model('MemberContact', memberContactSchema);

module.exports = MemberContact;
