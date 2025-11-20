const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  // section and section_desc removed; now in PARTS schema
  s_no: {
    type: Number,
    required: [true, 'Serial number is required'],
    min: [1, 'Serial number must be at least 1']
  },
  mob_s_no: {
    type: Number,
    required: [true, 'Mob S No is required'],
    min: [1, 'Mob S No must be at least 1']
  },
  group_s_no: {
    type: Number,
    required: [true, 'Group serial number is required'],
    min: [1, 'Group serial number must be at least 1']
  },
  name_aadhar: {
    type: String,
    required: [true, 'Name as per AADAR CARD is required'],
    trim: true,
    maxlength: [15, 'Name cannot exceed 15 characters']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['M', 'F'],
      message: 'Gender must be M or F'
    }
  },
  age: {
    type: Number,
    default: null,
    min: [1, 'Age must be at least 1'],
    max: [150, 'Age cannot exceed 150']
  },
  aadhar_no: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values
    validate: {
      validator: function(v) {
        // If provided, validate it's 12 digits
        return !v || /^\d{12}$/.test(v);
      },
      message: 'AADAR number must be 12 digits'
    }
  },
  persons: {
    type: Number,
    default: null
  },
  sram: {
    type: String,
    trim: true,
    default: ''
  },
  fwdJny: {
    type: String,
    trim: true,
    default: ''
  },
  rtnJny: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'members'
});

// Indexes for better query performance
memberSchema.index({ section: 1, s_no: 1 });
memberSchema.index({ mob_s_no: 1 });
memberSchema.index({ group_s_no: 1 });
memberSchema.index({ name_aadhar: 1 });
memberSchema.index({ aadhar_no: 1 }, { sparse: true });

// Compound index for section-based queries
memberSchema.index({ section: 1, group_s_no: 1, s_no: 1 });

// Virtual for display name
memberSchema.virtual('displayInfo').get(function() {
  return `${this.section}-${this.s_no}: ${this.name_aadhar}`;
});

// Ensure virtuals are included in JSON
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
