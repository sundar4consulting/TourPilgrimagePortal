const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const Tour = require('./models/Tour');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pilgrimage-portal');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedExpenses = async () => {
  try {
    // Get existing tours and admin user
    const tours = await Tour.find();
    const adminUser = await User.findOne({ email: 'admin@srivishnu-yatra.com' });
    
    if (!tours.length || !adminUser) {
      console.log('Please ensure tours and admin user exist first');
      return;
    }

    // Clear existing expenses
    await Expense.deleteMany({});
    console.log('Cleared existing expenses');

    // Sample expenses for different tours
    const sampleExpenses = [
      // South India Temple Circuit expenses
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'transportation',
        subcategory: 'Bus Charter',
        description: 'AC Bus rental for Chennai to Tirupati journey',
        amount: 25000,
        currency: 'INR',
        expenseDate: new Date('2024-11-16'),
        location: {
          city: 'Chennai',
          state: 'Tamil Nadu',
          place: 'Koyambedu Bus Terminal'
        },
        vendor: {
          name: 'Sri Vishnu Travels',
          contact: '+91-9876543210',
          address: 'Anna Nagar, Chennai'
        },
        paymentMethod: 'bank-transfer',
        receiptNumber: 'SVT001',
        participants: 25,
        isReimbursable: true,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'AC sleeper bus with comfortable seating',
        tags: ['transport', 'group-travel']
      },
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'accommodation',
        subcategory: 'Hotel Stay',
        description: 'Hotel accommodation in Tirupati - 2 nights',
        amount: 37500,
        currency: 'INR',
        expenseDate: new Date('2024-11-16'),
        location: {
          city: 'Tirupati',
          state: 'Andhra Pradesh',
          place: 'Tirumala Hills'
        },
        vendor: {
          name: 'Balaji Grand Hotel',
          contact: '+91-8772345678',
          address: 'Car Street, Tirupati'
        },
        paymentMethod: 'card',
        receiptNumber: 'BGH2024001',
        participants: 25,
        isReimbursable: true,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'Twin sharing rooms with breakfast included',
        tags: ['accommodation', 'breakfast-included']
      },
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'meals',
        subcategory: 'Group Lunch',
        description: 'Traditional South Indian lunch for all participants',
        amount: 6250,
        currency: 'INR',
        expenseDate: new Date('2024-11-17'),
        location: {
          city: 'Madurai',
          state: 'Tamil Nadu',
          place: 'Near Meenakshi Temple'
        },
        vendor: {
          name: 'Annapoorna Restaurant',
          contact: '+91-9443556677',
          address: 'West Masi Street, Madurai'
        },
        paymentMethod: 'cash',
        receiptNumber: 'ANP171124',
        participants: 25,
        isReimbursable: true,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'Vegetarian thali with traditional items',
        tags: ['meals', 'vegetarian', 'traditional']
      },
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'temple-donations',
        subcategory: 'Special Darshan',
        description: 'Special darshan tickets for Sri Venkateswara Temple',
        amount: 12500,
        currency: 'INR',
        expenseDate: new Date('2024-11-17'),
        location: {
          city: 'Tirupati',
          state: 'Andhra Pradesh',
          place: 'Tirumala Temple'
        },
        vendor: {
          name: 'TTD Counter',
          contact: '+91-8772233445',
          address: 'Tirumala Temple Complex'
        },
        paymentMethod: 'card',
        receiptNumber: 'TTD20241117001',
        participants: 25,
        isReimbursable: false,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'Special darshan for quick access',
        tags: ['temple', 'darshan', 'spiritual']
      },
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'guide-fees',
        subcategory: 'Local Guide',
        description: 'Professional guide services for temple tours',
        amount: 5000,
        currency: 'INR',
        expenseDate: new Date('2024-11-18'),
        location: {
          city: 'Rameswaram',
          state: 'Tamil Nadu',
          place: 'Ramanathaswamy Temple'
        },
        vendor: {
          name: 'Raman Tour Guide Services',
          contact: '+91-9876123456',
          address: 'Temple Street, Rameswaram'
        },
        paymentMethod: 'cash',
        receiptNumber: 'RTG001',
        participants: 25,
        isReimbursable: true,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'Experienced guide with knowledge of temple history',
        tags: ['guide', 'temple-tour', 'cultural']
      },
      // Add expenses for Char Dham Yatra if available
      ...(tours.length > 1 ? [
        {
          tour: tours[1]._id,
          addedBy: adminUser._id,
          category: 'transportation',
          subcategory: 'Helicopter Service',
          description: 'Helicopter service for Kedarnath temple visit',
          amount: 125000,
          currency: 'INR',
          expenseDate: new Date('2024-05-20'),
          location: {
            city: 'Kedarnath',
            state: 'Uttarakhand',
            place: 'Kedarnath Helipad'
          },
          vendor: {
            name: 'Himalaya Helicopter Services',
            contact: '+91-9411234567',
            address: 'Dehradun, Uttarakhand'
          },
          paymentMethod: 'bank-transfer',
          receiptNumber: 'HHS2024001',
          participants: 20,
          isReimbursable: true,
          isApproved: true,
          approvedBy: adminUser._id,
          approvalDate: new Date(),
          notes: 'Weather dependent helicopter service',
          tags: ['helicopter', 'kedarnath', 'emergency-option']
        },
        {
          tour: tours[1]._id,
          addedBy: adminUser._id,
          category: 'accommodation',
          subcategory: 'Dharamshala',
          description: 'Stay at government dharamshala in Badrinath',
          amount: 15000,
          currency: 'INR',
          expenseDate: new Date('2024-05-22'),
          location: {
            city: 'Badrinath',
            state: 'Uttarakhand',
            place: 'Badrinath Temple Complex'
          },
          vendor: {
            name: 'Badrinath Dharamshala Committee',
            contact: '+91-9876543210',
            address: 'Badrinath, Uttarakhand'
          },
          paymentMethod: 'cash',
          receiptNumber: 'BDC001',
          participants: 20,
          isReimbursable: true,
          isApproved: true,
          approvedBy: adminUser._id,
          approvalDate: new Date(),
          notes: 'Basic accommodation near temple',
          tags: ['dharamshala', 'budget-stay', 'pilgrimage']
        }
      ] : []),
      // Medical and emergency expenses
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'medical',
        subcategory: 'First Aid',
        description: 'Medical kit and first aid supplies for the tour',
        amount: 2500,
        currency: 'INR',
        expenseDate: new Date('2024-11-15'),
        location: {
          city: 'Chennai',
          state: 'Tamil Nadu',
          place: 'Medical Store'
        },
        vendor: {
          name: 'Apollo Pharmacy',
          contact: '+91-9876543210',
          address: 'T.Nagar, Chennai'
        },
        paymentMethod: 'card',
        receiptNumber: 'APH20241115',
        participants: 25,
        isReimbursable: true,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'Emergency medical supplies for group safety',
        tags: ['medical', 'safety', 'emergency']
      },
      {
        tour: tours[0]._id,
        addedBy: adminUser._id,
        category: 'miscellaneous',
        subcategory: 'Photography',
        description: 'Group photography at major temple locations',
        amount: 3000,
        currency: 'INR',
        expenseDate: new Date('2024-11-19'),
        location: {
          city: 'Madurai',
          state: 'Tamil Nadu',
          place: 'Meenakshi Temple'
        },
        vendor: {
          name: 'Temple Photography Services',
          contact: '+91-9445667788',
          address: 'Madurai'
        },
        paymentMethod: 'cash',
        receiptNumber: 'TPS001',
        participants: 25,
        isReimbursable: false,
        isApproved: true,
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        notes: 'Professional photos for memories',
        tags: ['photography', 'memories', 'group-photo']
      }
    ];

    // Insert sample expenses
    const createdExpenses = await Expense.insertMany(sampleExpenses);
    console.log(`✅ Created ${createdExpenses.length} sample expenses`);

    // Display summary
    const expensesByCategory = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    console.log('\n📊 Expense Summary by Category:');
    expensesByCategory.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} expenses, ₹${cat.totalAmount.toLocaleString()}`);
    });

    const totalExpenses = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    if (totalExpenses.length > 0) {
      console.log(`\n💰 Total Expenses: ₹${totalExpenses[0].totalAmount.toLocaleString()}`);
      console.log(`📝 Total Records: ${totalExpenses[0].totalCount}`);
    }

  } catch (error) {
    console.error('Error seeding expenses:', error);
  }
};

const main = async () => {
  await connectDB();
  await seedExpenses();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
};

main();