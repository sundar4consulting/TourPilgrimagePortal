const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pilgrimage-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// PARTS Schema
const Parts = require('./models/Parts');

// Data for PARTS
const partsData = [
  // PART-A
  { section: 'A', sectionDescription: 'PART-A Rs. 38700/- 1st Advance Rs.20700/-', memberName: 'V Krishnan', noOfPersons: 2, sradam: '', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'G L Narasimhan', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'R Kannan', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'C Srinivasan', noOfPersons: 2, sradam: '', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'SBI Srinivasan', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'Varadarajan Ref SLN', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'Suresh S', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'R Srinivasa Raghavan,Kpm', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'R Seshadri S/o U R', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'S L Narasimhan', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'Thaligai Swamigal', noOfPersons: 5, sradam: '', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'Sri Raman & Sudharsan', noOfPersons: 3, sradam: '2', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'V Sundarajan', noOfPersons: 1, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'R Jayalakshmi', noOfPersons: 1, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'Padma C/o Srinivasa Desikan', noOfPersons: 1, sradam: '1', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'Cancelled - Refer Tr to PART D S No 8', noOfPersons: null, sradam: '', notes: '' },
  { section: 'A', sectionDescription: '', memberName: 'D Vijayakumar', noOfPersons: 4, sradam: '2', notes: '' },

  // PART-B
  { section: 'B', sectionDescription: 'PART- B Rs. 34475/- 1st Advance Rs.16475/-', memberName: 'S T Ranganathan', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'B', sectionDescription: '', memberName: 'E R Bakthisaran', noOfPersons: 4, sradam: '2', notes: '' },
  { section: 'B', sectionDescription: '', memberName: 'T G Krishnakumar', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'B', sectionDescription: '', memberName: 'Rukmani Krishnan V K', noOfPersons: 1, sradam: '', notes: '' },

  // PART-D
  { section: 'D', sectionDescription: 'PART- D Rs. 29300/- 1st Advance Rs.14300/-', memberName: 'Hema Pattabiraman', noOfPersons: 1, sradam: '', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'K Srinivasan', noOfPersons: 2, sradam: '', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'Ramesh Thiruvennamiyr', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'A P Madhavan 3 Plus R Sridharan 2', noOfPersons: 5, sradam: '', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'D Srinivasan SBI', noOfPersons: 2, sradam: 'Nil', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'Revathi Desikan group', noOfPersons: 5, sradam: '', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'N Sandhya', noOfPersons: 1, sradam: '', notes: '' },
  { section: 'D', sectionDescription: '', memberName: 'Singanoor S Varadhan', noOfPersons: 2, sradam: '', notes: '' },

  // PART-C
  { section: 'C', sectionDescription: 'PART- C Rs. 2200/- in Full during 1st Week Oct 2025', memberName: 'V Bakthavatchalam', noOfPersons: 1, sradam: '1', notes: '' },
  { section: 'C', sectionDescription: '', memberName: 'E R Raghunathan', noOfPersons: 2, sradam: '1', notes: '' },
  { section: 'C', sectionDescription: '', memberName: 'Hyd Srinivasan & Kumutha', noOfPersons: 2, sradam: '1', notes: '' },

  // (No Grand Totals or Subtotals)
];

const seedParts = async () => {
  try {
    await Parts.deleteMany({});
    console.log('Cleared existing PARTS');
    // Default noOfPersons to 1 if missing/null
    const cleanedParts = partsData.map((p) => ({
      ...p,
      noOfPersons: (p.noOfPersons == null || isNaN(p.noOfPersons)) ? 1 : p.noOfPersons
    }));
    const result = await Parts.insertMany(cleanedParts);
    console.log(`✅ Successfully added ${result.length} PARTS records!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding PARTS:', error);
    process.exit(1);
  }
};

seedParts();
