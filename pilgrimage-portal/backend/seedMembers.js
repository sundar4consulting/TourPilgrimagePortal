const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pilgrimage-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Member Schema
const memberSchema = new mongoose.Schema({
  section: String,
  section_desc: String,
  s_no: Number,
  mob_s_no: Number,
  group_s_no: Number,
  name_aadhar: String,
  gender: String,
  age: Number,
  aadhar_no: String,
}, {
  timestamps: true,
  collection: 'members'
});

const Member = mongoose.model('Member', memberSchema);

// Sample member data
const sampleMembers = [
  {
    section: 'A',
    section_desc: 'Group A - North Region',
    s_no: 1,
    mob_s_no: 101,
    group_s_no: 1,
    name_aadhar: 'RAJESH KUMAR',
    gender: 'M',
    age: 45,
    aadhar_no: '123456789012'
  },
  {
    section: 'A',
    section_desc: 'Group A - North Region',
    s_no: 2,
    mob_s_no: 102,
    group_s_no: 1,
    name_aadhar: 'PRIYA SHARMA',
    gender: 'F',
    age: 38,
    aadhar_no: '234567890123'
  },
  {
    section: 'A',
    section_desc: 'Group A - North Region',
    s_no: 3,
    mob_s_no: 103,
    group_s_no: 1,
    name_aadhar: 'AMIT PATEL',
    gender: 'M',
    age: 52,
    aadhar_no: '345678901234'
  },
  {
    section: 'B',
    section_desc: 'Group B - South Region',
    s_no: 1,
    mob_s_no: 201,
    group_s_no: 2,
    name_aadhar: 'LAKSHMI DEVI',
    gender: 'F',
    age: 42,
    aadhar_no: '456789012345'
  },
  {
    section: 'B',
    section_desc: 'Group B - South Region',
    s_no: 2,
    mob_s_no: 202,
    group_s_no: 2,
    name_aadhar: 'SURESH REDDY',
    gender: 'M',
    age: 48,
    aadhar_no: '567890123456'
  },
  {
    section: 'B',
    section_desc: 'Group B - South Region',
    s_no: 3,
    mob_s_no: 203,
    group_s_no: 2,
    name_aadhar: 'MEENA IYER',
    gender: 'F',
    age: 35,
    aadhar_no: '678901234567'
  },
  {
    section: 'C',
    section_desc: 'Group C - East Region',
    s_no: 1,
    mob_s_no: 301,
    group_s_no: 3,
    name_aadhar: 'ARUN DAS',
    gender: 'M',
    age: 40,
    aadhar_no: '789012345678'
  },
  {
    section: 'C',
    section_desc: 'Group C - East Region',
    s_no: 2,
    mob_s_no: 302,
    group_s_no: 3,
    name_aadhar: 'RINA GHOSH',
    gender: 'F',
    age: 33,
    aadhar_no: '890123456789'
  },
  {
    section: 'D',
    section_desc: 'Group D - West Region',
    s_no: 1,
    mob_s_no: 401,
    group_s_no: 4,
    name_aadhar: 'VIJAY DESAI',
    gender: 'M',
    age: 55,
    aadhar_no: '901234567890'
  },
  {
    section: 'D',
    section_desc: 'Group D - West Region',
    s_no: 2,
    mob_s_no: 402,
    group_s_no: 4,
    name_aadhar: 'KAVITA JOSHI',
    gender: 'F',
    age: 29,
    aadhar_no: '012345678901'
  },
  {
    section: 'A',
    section_desc: 'Group A - North Region',
    s_no: 4,
    mob_s_no: 104,
    group_s_no: 1,
    name_aadhar: 'DEEPAK VERMA',
    gender: 'M',
    age: 44,
    aadhar_no: '112233445566'
  },
  {
    section: 'B',
    section_desc: 'Group B - South Region',
    s_no: 4,
    mob_s_no: 204,
    group_s_no: 2,
    name_aadhar: 'ANITA NAIR',
    gender: 'F',
    age: 37,
    aadhar_no: '223344556677'
  },
  {
    section: 'C',
    section_desc: 'Group C - East Region',
    s_no: 3,
    mob_s_no: 303,
    group_s_no: 3,
    name_aadhar: 'MOHAN SEN',
    gender: 'M',
    age: 50,
    aadhar_no: '334455667788'
  },
  {
    section: 'D',
    section_desc: 'Group D - West Region',
    s_no: 3,
    mob_s_no: 403,
    group_s_no: 4,
    name_aadhar: 'SUNITA SHAH',
    gender: 'F',
    age: 41,
    aadhar_no: '445566778899'
  },
  {
    section: 'A',
    section_desc: 'Group A - North Region',
    s_no: 5,
    mob_s_no: 105,
    group_s_no: 1,
    name_aadhar: 'RAMESH GUPTA',
    gender: 'M',
    age: 60,
    aadhar_no: '556677889900'
  }
];

// Seed function
const seedMembers = async () => {
  try {
    // Clear existing members
    await Member.deleteMany({});
    console.log('Cleared existing members');

    // Insert sample members
    const result = await Member.insertMany(sampleMembers);
    console.log(`✅ Successfully added ${result.length} sample members!`);

    // Display summary
    const stats = await Member.aggregate([
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Members by Section:');
    stats.forEach(stat => {
      console.log(`   Section ${stat._id}: ${stat.count} members`);
    });

    console.log('\n✨ Sample members have been added to the database!');
    console.log('🔄 Refresh your browser to see the members in the Misc page.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding members:', error);
    process.exit(1);
  }
};

// Run the seed
seedMembers();
