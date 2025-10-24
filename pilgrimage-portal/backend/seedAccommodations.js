const mongoose = require('mongoose');
const Accommodation = require('./models/Accommodation');
const Tour = require('./models/Tour');
const User = require('./models/User');
require('dotenv').config();

const seedAccommodations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pilgrimage-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB for accommodation seeding');

    // Find admin user and tours for references
    const adminUser = await User.findOne({ role: 'admin' });
    const tours = await Tour.find().limit(3);
    
    if (!adminUser) {
      console.log('Admin user not found. Please run the server first to create default admin.');
      return;
    }

    // Clear existing accommodations
    await Accommodation.deleteMany({});
    console.log('Cleared existing accommodations');

    // Sample accommodation data
    const accommodations = [
      // Hotels
      {
        name: 'Divine Heritage Hotel',
        category: 'hotel',
        description: 'A premium hotel near Tirupati temple with modern amenities and traditional hospitality.',
        location: {
          address: '123 Temple Street, Near Tirupati Temple',
          city: 'Tirupati',
          state: 'Andhra Pradesh',
          pincode: '517501',
          coordinates: {
            latitude: 13.6288,
            longitude: 79.4192
          }
        },
        contact: {
          phone: '9876543210',
          email: 'info@divineheritage.com',
          website: 'https://divineheritage.com'
        },
        owner: {
          name: 'Ramesh Kumar',
          phone: '9876543210',
          email: 'ramesh@divineheritage.com'
        },
        facilities: ['heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv', 'parking', 'restaurant', 'room-service', 'temple-nearby'],
        rooms: [
          {
            roomNumber: '101',
            roomType: 'double',
            capacity: 2,
            facilities: ['heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv'],
            pricePerNight: 2500,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: '102',
            roomType: 'family',
            capacity: 4,
            facilities: ['heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv', 'refrigerator'],
            pricePerNight: 4000,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: '201',
            roomType: 'suite',
            capacity: 2,
            facilities: ['heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv', 'refrigerator', 'balcony'],
            pricePerNight: 5000,
            isAvailable: true,
            bookings: []
          }
        ],
        associatedTours: tours.length > 0 ? [{
          tour: tours[0]._id,
          destination: 'Tirupati',
          dayNumber: 1,
          checkInTime: '14:00',
          checkOutTime: '11:00'
        }] : [],
        pricing: {
          basePrice: 3000,
          seasonalRates: [
            {
              season: 'peak',
              multiplier: 1.5,
              startDate: new Date('2024-12-15'),
              endDate: new Date('2025-01-15')
            }
          ],
          extraPersonCharge: 500
        },
        policies: {
          cancellationPolicy: 'Free cancellation 24 hours before check-in',
          checkInPolicy: 'Check-in after 2:00 PM, Check-out before 11:00 AM',
          childPolicy: 'Children below 5 years stay free'
        },
        rating: {
          overall: 4.5,
          cleanliness: 4.7,
          service: 4.3,
          location: 4.8,
          reviewCount: 156
        },
        images: [
          {
            url: '/uploads/accommodations/divine-heritage-1.jpg',
            caption: 'Hotel Exterior',
            isPrimary: true
          },
          {
            url: '/uploads/accommodations/divine-heritage-2.jpg',
            caption: 'Family Room',
            isPrimary: false
          }
        ],
        isActive: true,
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: adminUser._id,
        createdBy: adminUser._id
      },

      // Guest House
      {
        name: 'Peaceful Guest House',
        category: 'guest-house',
        description: 'Simple and clean guest house perfect for pilgrims seeking comfortable stay.',
        location: {
          address: '45 Pilgrim Road, Temple Area',
          city: 'Varanasi',
          state: 'Uttar Pradesh',
          pincode: '221001',
          coordinates: {
            latitude: 25.3176,
            longitude: 82.9739
          }
        },
        contact: {
          phone: '9876543211',
          email: 'contact@peacefulguest.com'
        },
        owner: {
          name: 'Sunita Devi',
          phone: '9876543211',
          email: 'sunita@peacefulguest.com'
        },
        facilities: ['bathroom', 'bed', 'wifi', 'parking', 'temple-nearby'],
        rooms: [
          {
            roomNumber: 'G1',
            roomType: 'double',
            capacity: 2,
            facilities: ['bathroom', 'bed', 'wifi'],
            pricePerNight: 800,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: 'G2',
            roomType: 'triple',
            capacity: 3,
            facilities: ['bathroom', 'bed', 'wifi'],
            pricePerNight: 1200,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: 'G3',
            roomType: 'dormitory',
            capacity: 6,
            facilities: ['bathroom', 'bed', 'wifi'],
            pricePerNight: 300,
            isAvailable: true,
            bookings: []
          }
        ],
        associatedTours: tours.length > 1 ? [{
          tour: tours[1]._id,
          destination: 'Varanasi',
          dayNumber: 2,
          checkInTime: '12:00',
          checkOutTime: '10:00'
        }] : [],
        pricing: {
          basePrice: 800,
          seasonalRates: [],
          extraPersonCharge: 200
        },
        policies: {
          cancellationPolicy: 'Free cancellation 12 hours before check-in',
          checkInPolicy: 'Flexible check-in and check-out timings',
          childPolicy: 'Children below 8 years stay free'
        },
        rating: {
          overall: 4.0,
          cleanliness: 4.2,
          service: 3.8,
          location: 4.5,
          reviewCount: 89
        },
        images: [
          {
            url: '/uploads/accommodations/peaceful-guest-1.jpg',
            caption: 'Guest House Front View',
            isPrimary: true
          }
        ],
        isActive: true,
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: adminUser._id,
        createdBy: adminUser._id
      },

      // Cottage
      {
        name: 'Himalayan Spiritual Cottage',
        category: 'cottage',
        description: 'Traditional cottages in the serene Himalayan foothills with mountain views.',
        location: {
          address: 'Village Guptakashi, Near Temple',
          city: 'Guptakashi',
          state: 'Uttarakhand',
          pincode: '246439',
          coordinates: {
            latitude: 30.5424,
            longitude: 79.0826
          }
        },
        contact: {
          phone: '9876543212',
          email: 'stay@himalayancottage.com'
        },
        owner: {
          name: 'Mahesh Sharma',
          phone: '9876543212',
          email: 'mahesh@himalayancottage.com'
        },
        facilities: ['heater', 'bathroom', 'bed', 'wifi', 'parking', 'garden', 'temple-nearby'],
        rooms: [
          {
            roomNumber: 'C1',
            roomType: 'double',
            capacity: 2,
            facilities: ['heater', 'bathroom', 'bed'],
            pricePerNight: 1500,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: 'C2',
            roomType: 'family',
            capacity: 4,
            facilities: ['heater', 'bathroom', 'bed'],
            pricePerNight: 2500,
            isAvailable: true,
            bookings: []
          }
        ],
        associatedTours: tours.length > 2 ? [{
          tour: tours[2]._id,
          destination: 'Kedarnath',
          dayNumber: 3,
          checkInTime: '15:00',
          checkOutTime: '09:00'
        }] : [],
        pricing: {
          basePrice: 1500,
          seasonalRates: [
            {
              season: 'peak',
              multiplier: 2.0,
              startDate: new Date('2024-04-15'),
              endDate: new Date('2024-06-15')
            }
          ],
          extraPersonCharge: 300
        },
        policies: {
          cancellationPolicy: 'Free cancellation 48 hours before check-in',
          checkInPolicy: 'Check-in after 3:00 PM due to mountain location',
          childPolicy: 'Children below 10 years stay free'
        },
        rating: {
          overall: 4.3,
          cleanliness: 4.1,
          service: 4.5,
          location: 4.8,
          reviewCount: 67
        },
        images: [
          {
            url: '/uploads/accommodations/himalayan-cottage-1.jpg',
            caption: 'Cottage with Mountain View',
            isPrimary: true
          }
        ],
        isActive: true,
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: adminUser._id,
        createdBy: adminUser._id
      },

      // Lodge
      {
        name: 'Pilgrim\'s Lodge',
        category: 'lodge',
        description: 'Budget-friendly lodge with basic amenities for budget-conscious pilgrims.',
        location: {
          address: '78 Station Road, Near Bus Stand',
          city: 'Dwarka',
          state: 'Gujarat',
          pincode: '361335',
          coordinates: {
            latitude: 22.2394,
            longitude: 68.9678
          }
        },
        contact: {
          phone: '9876543213',
          email: 'info@pilgrimslodge.com'
        },
        owner: {
          name: 'Kiran Patel',
          phone: '9876543213'
        },
        facilities: ['bathroom', 'bed', 'wifi', 'parking', 'temple-nearby'],
        rooms: [
          {
            roomNumber: 'L1',
            roomType: 'single',
            capacity: 1,
            facilities: ['bathroom', 'bed'],
            pricePerNight: 500,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: 'L2',
            roomType: 'double',
            capacity: 2,
            facilities: ['bathroom', 'bed'],
            pricePerNight: 800,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: 'L3',
            roomType: 'dormitory',
            capacity: 8,
            facilities: ['bathroom', 'bed'],
            pricePerNight: 200,
            isAvailable: true,
            bookings: []
          }
        ],
        associatedTours: [],
        pricing: {
          basePrice: 500,
          seasonalRates: [],
          extraPersonCharge: 100
        },
        policies: {
          cancellationPolicy: 'No cancellation charges',
          checkInPolicy: 'Flexible timings',
          childPolicy: 'Children below 12 years stay free'
        },
        rating: {
          overall: 3.8,
          cleanliness: 3.9,
          service: 3.7,
          location: 4.2,
          reviewCount: 124
        },
        images: [
          {
            url: '/uploads/accommodations/pilgrims-lodge-1.jpg',
            caption: 'Lodge Entrance',
            isPrimary: true
          }
        ],
        isActive: true,
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: adminUser._id,
        createdBy: adminUser._id
      },

      // Marriage Hall (can also function as accommodation)
      {
        name: 'Golden Palace Marriage Hall & Rooms',
        category: 'marriage-hall',
        description: 'Marriage hall with attached guest rooms for wedding parties and group stays.',
        location: {
          address: '15 Community Center, Wedding Street',
          city: 'Pushkar',
          state: 'Rajasthan',
          pincode: '305022',
          coordinates: {
            latitude: 26.4847,
            longitude: 74.5507
          }
        },
        contact: {
          phone: '9876543214',
          email: 'bookings@goldenpalace.com'
        },
        owner: {
          name: 'Vikram Singh',
          phone: '9876543214',
          email: 'vikram@goldenpalace.com'
        },
        facilities: ['bathroom', 'bed', 'ac', 'wifi', 'parking', 'conference-hall', 'restaurant', 'temple-nearby'],
        rooms: [
          {
            roomNumber: 'MP1',
            roomType: 'family',
            capacity: 6,
            facilities: ['bathroom', 'bed', 'ac'],
            pricePerNight: 3000,
            isAvailable: true,
            bookings: []
          },
          {
            roomNumber: 'MP2',
            roomType: 'suite',
            capacity: 4,
            facilities: ['bathroom', 'bed', 'ac', 'balcony'],
            pricePerNight: 4500,
            isAvailable: true,
            bookings: []
          }
        ],
        associatedTours: [],
        pricing: {
          basePrice: 3500,
          seasonalRates: [
            {
              season: 'peak',
              multiplier: 1.8,
              startDate: new Date('2024-10-15'),
              endDate: new Date('2024-12-15')
            }
          ],
          extraPersonCharge: 600
        },
        policies: {
          cancellationPolicy: 'Cancellation charges apply for group bookings',
          checkInPolicy: 'Group check-in preferred',
          childPolicy: 'Children below 5 years stay free'
        },
        rating: {
          overall: 4.2,
          cleanliness: 4.0,
          service: 4.4,
          location: 4.0,
          reviewCount: 45
        },
        images: [
          {
            url: '/uploads/accommodations/golden-palace-1.jpg',
            caption: 'Marriage Hall & Rooms',
            isPrimary: true
          }
        ],
        isActive: true,
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: adminUser._id,
        createdBy: adminUser._id
      }
    ];

    // Insert accommodations
    const createdAccommodations = await Accommodation.insertMany(accommodations);
    console.log(`✅ Created ${createdAccommodations.length} accommodations`);

    // Display summary
    console.log('\n📊 Accommodation Summary:');
    const summary = createdAccommodations.reduce((acc, accommodation) => {
      acc[accommodation.category] = (acc[accommodation.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(summary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} accommodations`);
    });

    const totalRooms = createdAccommodations.reduce((sum, acc) => sum + acc.rooms.length, 0);
    const totalCapacity = createdAccommodations.reduce((sum, acc) => 
      sum + acc.rooms.reduce((roomSum, room) => roomSum + room.capacity, 0), 0
    );

    console.log(`\n💰 Total Rooms: ${totalRooms}`);
    console.log(`👥 Total Capacity: ${totalCapacity} guests`);
    console.log('\n🏨 Accommodations by City:');
    
    const cityBreakdown = createdAccommodations.reduce((acc, accommodation) => {
      const city = accommodation.location.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    Object.entries(cityBreakdown).forEach(([city, count]) => {
      console.log(`   ${city}: ${count} accommodations`);
    });

    console.log('\n✅ Accommodation seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding accommodations:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedAccommodations();