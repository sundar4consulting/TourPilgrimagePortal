const mongoose = require('mongoose');
const Tour = require('./models/Tour');
const Destination = require('./models/Destination');
const User = require('./models/User');
const Expense = require('./models/Expense');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pilgrimage-portal');

const sampleDestinations = [
  {
    name: "Tirupati",
    state: "Andhra Pradesh",
    region: "south-india",
    description: "Famous for the Tirupati Balaji Temple, one of the most visited pilgrimage sites in the world.",
    coordinates: { latitude: 13.6288, longitude: 79.4192 },
    attractions: ["Sri Venkateswara Temple", "TTD Gardens", "Akasa Ganga"],
    nearestAirport: "Tirupati Airport",
    nearestRailway: "Tirupati Main Railway Station"
  },
  {
    name: "Madurai",
    state: "Tamil Nadu", 
    region: "south-india",
    description: "Home to the magnificent Meenakshi Amman Temple with its stunning architecture.",
    coordinates: { latitude: 9.9252, longitude: 78.1198 },
    attractions: ["Meenakshi Amman Temple", "Thirumalai Nayakkar Palace", "Gandhi Memorial Museum"],
    nearestAirport: "Madurai Airport",
    nearestRailway: "Madurai Junction"
  },
  {
    name: "Rameswaram",
    state: "Tamil Nadu",
    region: "south-india", 
    description: "One of the Char Dham pilgrimage sites, famous for Ramanathaswamy Temple.",
    coordinates: { latitude: 9.2881, longitude: 79.3129 },
    attractions: ["Ramanathaswamy Temple", "Pamban Bridge", "Dhanushkodi"],
    nearestAirport: "Madurai Airport",
    nearestRailway: "Rameswaram Railway Station"
  },
  {
    name: "Haridwar",
    state: "Uttarakhand",
    region: "north-india",
    description: "Gateway to the Char Dham, famous for Ganga Aarti at Har Ki Pauri.",
    coordinates: { latitude: 29.9457, longitude: 78.1642 },
    attractions: ["Har Ki Pauri", "Chandi Devi Temple", "Mansa Devi Temple"],
    nearestAirport: "Dehradun Airport",
    nearestRailway: "Haridwar Junction"
  },
  {
    name: "Rishikesh",
    state: "Uttarakhand",
    region: "north-india",
    description: "Yoga capital of the world and gateway to the Himalayas.",
    coordinates: { latitude: 30.0869, longitude: 78.2676 },
    attractions: ["Laxman Jhula", "Ram Jhula", "Triveni Ghat"],
    nearestAirport: "Dehradun Airport", 
    nearestRailway: "Rishikesh Railway Station"
  },
  {
    name: "Varanasi",
    state: "Uttar Pradesh",
    region: "north-india",
    description: "One of the oldest cities in the world, spiritual capital of India.",
    coordinates: { latitude: 25.3176, longitude: 82.9739 },
    attractions: ["Kashi Vishwanath Temple", "Dashashwamedh Ghat", "Sarnath"],
    nearestAirport: "Varanasi Airport",
    nearestRailway: "Varanasi Junction"
  }
];

const sampleTours = [
  {
    title: "South India Temple Circuit",
    description: "Experience the divine architecture and spiritual atmosphere of South India's most famous temples including Tirupati, Madurai, and Rameswaram.",
    shortDescription: "A comprehensive temple tour covering the most sacred sites of South India.",
    destinations: [
      { 
        name: "Tirupati", 
        state: "Andhra Pradesh",
        region: "south-india",
        significance: "Famous for Sri Venkateswara Temple",
        temples: ["Sri Venkateswara Temple"],
        coordinates: { latitude: 13.6288, longitude: 79.4192 }
      },
      { 
        name: "Madurai", 
        state: "Tamil Nadu",
        region: "south-india", 
        significance: "Home to Meenakshi Amman Temple",
        temples: ["Meenakshi Amman Temple"],
        coordinates: { latitude: 9.9252, longitude: 78.1198 }
      },
      { 
        name: "Rameswaram", 
        state: "Tamil Nadu",
        region: "south-india",
        significance: "One of the Char Dham pilgrimage sites",
        temples: ["Ramanathaswamy Temple"],
        coordinates: { latitude: 9.2881, longitude: 79.3129 }
      }
    ],
    duration: { days: 7, nights: 6 },
    pricing: {
      adult: 25000,
      child: 18000,
      senior: 22000
    },
    inclusions: [
      "Accommodation in 3-star hotels",
      "Daily breakfast and dinner",
      "AC transportation",
      "Professional guide",
      "All temple entry fees"
    ],
    exclusions: [
      "Flight tickets", 
      "Lunch",
      "Personal expenses",
      "Tips and gratuities"
    ],
    startDate: new Date('2024-11-15'),
    endDate: new Date('2024-11-21'),
    maxParticipants: 25,
    currentBookings: 12,
    status: 'active',
    featured: true,
    images: [
      "https://example.com/tirupati.jpg",
      "https://example.com/madurai.jpg"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Chennai - Transfer to Tirupati",
        activities: ["Airport pickup", "Drive to Tirupati", "Hotel check-in"],
        meals: ["Dinner"],
        accommodationText: "Hotel in Tirupati"
      },
      {
        day: 2,
        title: "Tirupati Temple Visit",
        activities: ["Early morning temple visit", "Balaji darshan", "TTD gardens visit"],
        meals: ["Breakfast", "Dinner"],
        accommodationText: "Hotel in Tirupati"
      }
    ]
  },
  {
    title: "Char Dham Yatra",
    description: "Embark on the most sacred pilgrimage journey of the four holy sites in Uttarakhand - Yamunotri, Gangotri, Kedarnath, and Badrinath.",
    shortDescription: "Complete Char Dham pilgrimage covering all four sacred sites in Uttarakhand.",
    destinations: [
      { 
        name: "Haridwar", 
        state: "Uttarakhand",
        region: "north-india",
        significance: "Gateway to Char Dham",
        temples: ["Har Ki Pauri", "Chandi Devi Temple"],
        coordinates: { latitude: 29.9457, longitude: 78.1642 }
      },
      { 
        name: "Rishikesh", 
        state: "Uttarakhand",
        region: "north-india",
        significance: "Spiritual preparation",
        temples: ["Triveni Ghat", "Parmarth Niketan"],
        coordinates: { latitude: 30.0869, longitude: 78.2676 }
      }
    ],
    duration: { days: 12, nights: 11 },
    pricing: {
      adult: 45000,
      child: 35000,
      senior: 40000
    },
    inclusions: [
      "Accommodation in guesthouses/hotels",
      "All meals during the tour",
      "Transportation including helicopter (if needed)",
      "Professional guide and porter services",
      "All temple entry fees and donations"
    ],
    exclusions: [
      "Flight tickets to/from Dehradun",
      "Personal expenses",
      "Medical expenses",
      "Tips and gratuities"
    ],
    startDate: new Date('2024-05-15'),
    endDate: new Date('2024-05-26'),
    maxParticipants: 20,
    currentBookings: 8,
    status: 'active',
    featured: true,
    images: [
      "https://example.com/kedarnath.jpg",
      "https://example.com/badrinath.jpg"
    ]
  },
  {
    title: "Kashi Vishwanath Express Tour",
    description: "Experience the spiritual capital of India with visits to the famous Kashi Vishwanath Temple, Ganga Aarti, and other sacred sites in Varanasi.",
    shortDescription: "Quick spiritual tour of Varanasi covering major temples and ghats.",
    destinations: [
      { 
        name: "Varanasi", 
        state: "Uttar Pradesh",
        region: "north-india",
        significance: "Spiritual capital of India",
        temples: ["Kashi Vishwanath Temple", "Sankat Mochan Hanuman Temple"],
        coordinates: { latitude: 25.3176, longitude: 82.9739 }
      }
    ],
    duration: { days: 4, nights: 3 },
    pricing: {
      adult: 15000,
      child: 12000,
      senior: 14000
    },
    inclusions: [
      "3-star hotel accommodation",
      "Daily breakfast",
      "Airport/railway transfers",
      "Boat ride on Ganges",
      "Professional guide"
    ],
    exclusions: [
      "Flight/train tickets",
      "Lunch and dinner",
      "Personal expenses",
      "Tips"
    ],
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-04'),
    maxParticipants: 30,
    currentBookings: 5,
    status: 'active',
    featured: true,
    images: [
      "https://example.com/varanasi-ghat.jpg",
      "https://example.com/kashi-temple.jpg"
    ]
  }
];

// Sample expenses for the tours
const createSampleExpenses = (tours, adminUser) => [
  // South India Temple Circuit expenses
  {
    tour: tours[0]._id,
    addedBy: adminUser._id,
    category: 'transportation',
    subcategory: 'Bus fare',
    description: 'AC Bus from Chennai to Tirupati',
    amount: 15000,
    currency: 'INR',
    expenseDate: new Date('2024-11-16'),
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      place: 'Central Bus Station'
    },
    vendor: {
      name: 'Tamil Nadu State Transport',
      contact: '9876543210',
      address: 'Central Bus Station, Chennai'
    },
    paymentMethod: 'bank-transfer',
    receiptNumber: 'TNST-001',
    participants: 25,
    isReimbursable: true,
    isApproved: true,
    approvedBy: adminUser._id,
    approvalDate: new Date(),
    notes: 'Advance booking for 25 passengers'
  },
  {
    tour: tours[0]._id,
    addedBy: adminUser._id,
    category: 'accommodation',
    subcategory: 'Hotel booking',
    description: 'Hotel accommodation in Tirupati for 2 nights',
    amount: 30000,
    currency: 'INR',
    expenseDate: new Date('2024-11-16'),
    location: {
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      place: 'Near Temple'
    },
    vendor: {
      name: 'Balaji Grand Hotel',
      contact: '9876543211',
      address: 'Temple Road, Tirupati'
    },
    paymentMethod: 'card',
    receiptNumber: 'BGH-2024-001',
    participants: 25,
    isReimbursable: true,
    isApproved: true,
    approvedBy: adminUser._id,
    approvalDate: new Date(),
    notes: 'Twin sharing rooms for all participants'
  },
  {
    tour: tours[0]._id,
    addedBy: adminUser._id,
    category: 'temple-donations',
    description: 'Donations at Sri Venkateswara Temple',
    amount: 10001,
    currency: 'INR',
    expenseDate: new Date('2024-11-17'),
    location: {
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      place: 'Sri Venkateswara Temple'
    },
    paymentMethod: 'cash',
    receiptNumber: 'SVT-DON-001',
    participants: 25,
    isReimbursable: false,
    isApproved: true,
    approvedBy: adminUser._id,
    approvalDate: new Date(),
    notes: 'Group donation for special darshan'
  },
  {
    tour: tours[0]._id,
    addedBy: adminUser._id,
    category: 'meals',
    subcategory: 'Lunch',
    description: 'Lunch at local restaurant in Madurai',
    amount: 5000,
    currency: 'INR',
    expenseDate: new Date('2024-11-18'),
    location: {
      city: 'Madurai',
      state: 'Tamil Nadu',
      place: 'Near Meenakshi Temple'
    },
    vendor: {
      name: 'Meenakshi Restaurant',
      contact: '9876543212'
    },
    paymentMethod: 'cash',
    participants: 25,
    isReimbursable: true,
    isApproved: false,
    notes: 'Traditional South Indian meals'
  },
  
  // Char Dham Yatra expenses
  {
    tour: tours[1]._id,
    addedBy: adminUser._id,
    category: 'transportation',
    subcategory: 'Helicopter booking',
    description: 'Helicopter service to Kedarnath',
    amount: 80000,
    currency: 'INR',
    expenseDate: new Date('2024-05-18'),
    location: {
      city: 'Phata',
      state: 'Uttarakhand',
      place: 'Helicopter Base'
    },
    vendor: {
      name: 'Himalayan Heli Services',
      contact: '9876543213',
      address: 'Phata Helipad, Rudraprayag'
    },
    paymentMethod: 'bank-transfer',
    receiptNumber: 'HHS-2024-001',
    participants: 20,
    isReimbursable: true,
    isApproved: true,
    approvedBy: adminUser._id,
    approvalDate: new Date(),
    notes: 'Round trip for 20 passengers'
  },
  {
    tour: tours[1]._id,
    addedBy: adminUser._id,
    category: 'guide-fees',
    description: 'Local guide fees for Char Dham tour',
    amount: 15000,
    currency: 'INR',
    expenseDate: new Date('2024-05-16'),
    location: {
      city: 'Haridwar',
      state: 'Uttarakhand'
    },
    vendor: {
      name: 'Pandit Raj Kumar',
      contact: '9876543214'
    },
    paymentMethod: 'cash',
    participants: 20,
    isReimbursable: true,
    isApproved: true,
    approvedBy: adminUser._id,
    approvalDate: new Date(),
    notes: 'Experienced guide for entire Char Dham circuit'
  },
  {
    tour: tours[1]._id,
    addedBy: adminUser._id,
    category: 'medical',
    subcategory: 'First aid',
    description: 'Medical kit and oxygen cylinders',
    amount: 8000,
    currency: 'INR',
    expenseDate: new Date('2024-05-15'),
    location: {
      city: 'Rishikesh',
      state: 'Uttarakhand'
    },
    vendor: {
      name: 'Himalayan Medical Store',
      contact: '9876543215'
    },
    paymentMethod: 'card',
    receiptNumber: 'HMS-001',
    participants: 20,
    isReimbursable: true,
    isApproved: false,
    notes: 'Emergency medical supplies for high altitude'
  },

  // Kashi Vishwanath Express Tour expenses
  {
    tour: tours[2]._id,
    addedBy: adminUser._id,
    category: 'accommodation',
    description: 'Hotel booking near Kashi Vishwanath Temple',
    amount: 18000,
    currency: 'INR',
    expenseDate: new Date('2024-12-01'),
    location: {
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      place: 'Dashashwamedh Ghat'
    },
    vendor: {
      name: 'Ganga View Hotel',
      contact: '9876543216',
      address: 'Near Dashashwamedh Ghat, Varanasi'
    },
    paymentMethod: 'upi',
    receiptNumber: 'GVH-2024-001',
    participants: 30,
    isReimbursable: true,
    isApproved: true,
    approvedBy: adminUser._id,
    approvalDate: new Date(),
    notes: '3 nights accommodation for 30 people'
  },
  {
    tour: tours[2]._id,
    addedBy: adminUser._id,
    category: 'transportation',
    subcategory: 'Boat ride',
    description: 'Boat ride on Ganges for Ganga Aarti',
    amount: 6000,
    currency: 'INR',
    expenseDate: new Date('2024-12-02'),
    location: {
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      place: 'Dashashwamedh Ghat'
    },
    vendor: {
      name: 'Ganga Boat Service',
      contact: '9876543217'
    },
    paymentMethod: 'cash',
    participants: 30,
    isReimbursable: true,
    isApproved: false,
    notes: 'Evening Ganga Aarti boat ride'
  },
  {
    tour: tours[2]._id,
    addedBy: adminUser._id,
    category: 'shopping',
    description: 'Religious items and souvenirs',
    amount: 4500,
    currency: 'INR',
    expenseDate: new Date('2024-12-03'),
    location: {
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      place: 'Vishwanath Lane'
    },
    paymentMethod: 'cash',
    participants: 30,
    isReimbursable: false,
    isApproved: false,
    notes: 'Rudraksha, holy books, and souvenirs for group'
  }
];

async function seedData() {
  try {
    console.log('Clearing existing data...');
    await Tour.deleteMany({});
    await Destination.deleteMany({});
    await User.deleteMany({});
    await Expense.deleteMany({});
    
    console.log('Creating admin user...');
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@srivishnu-yatra.com',
      password: 'admin123',
      phoneNumber: '9999999999',
      aadharNumber: '999999999999',
      role: 'admin'
    });
    await adminUser.save();
    
    console.log('Adding destinations...');
    await Destination.insertMany(sampleDestinations);
    
    console.log('Adding tours...');
    const toursWithUser = sampleTours.map(tour => ({
      ...tour,
      createdBy: adminUser._id
    }));
    const savedTours = await Tour.insertMany(toursWithUser);
    
    console.log('Adding sample expenses...');
    const sampleExpenses = createSampleExpenses(savedTours, adminUser);
    await Expense.insertMany(sampleExpenses);
    
    console.log('✅ Sample data seeded successfully!');
    console.log(`Added ${sampleDestinations.length} destinations and ${sampleTours.length} tours`);
    console.log(`Added ${sampleExpenses.length} sample expenses`);
    console.log(`Admin user created: ${adminUser.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();