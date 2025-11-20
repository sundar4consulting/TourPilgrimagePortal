const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pilgrimage-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Member Schema (minimal, no section/desc/persons/sram)
const memberSchema = new mongoose.Schema({
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

// No sampleMembers for PARTS data here; use seedParts.js for PARTS
const sampleMembers = [];

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
