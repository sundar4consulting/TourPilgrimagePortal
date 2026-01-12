const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Set mongoose options
mongoose.set('strictQuery', false);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pilgrimage-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Create default admin user if not exists
  await createDefaultAdmin();
})
.catch((err) => console.error('MongoDB connection error:', err));

// Create default admin user function
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@srivishnu-yatra.com' },
        { aadharNumber: '999999999999' }
      ]
    });
    
    if (!existingAdmin) {
      console.log('Creating default admin user...');
      const defaultAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@srivishnu-yatra.com',
        password: 'admin123',
        phoneNumber: '9999999999',
        aadharNumber: '999999999999',
        role: 'admin'
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created successfully!');
      console.log('📧 Email: admin@srivishnu-yatra.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('ℹ️  Default admin user already exists');
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Default admin user already exists (duplicate key)');
    } else {
      console.error('Error creating default admin user:', error.message);
    }
  }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/accommodations', require('./routes/accommodations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/misc', require('./routes/misc'));
app.use('/api/parts', require('./routes/parts'));
app.use('/api/member-contacts', require('./routes/memberContacts'));
// app.use('/api/tourParticipants', require('./routes/tourParticipants'));
// Note: Search and export routes will be added after fixing the router issue

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});