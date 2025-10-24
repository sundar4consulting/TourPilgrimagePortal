# Pilgrimage Portal

A comprehensive web portal for Pilgrimage Tour Operators with member and admin functionality.

## Features

### Public Portal
- Home page with pilgrimage packages
- Tour destinations (South India and other Indian places)
- Transportation details for each tour
- Package information and pricing

### Member Portal
- User registration and login
- View available tours
- Express interest to join tours
- Add family members
- Provide Aadhar and personal details
- Booking management

### Admin Portal
- Expense collection and management
- Tour management (CRUD operations)
- Member management
- Consolidated expense reports
- Financial analytics

## Tech Stack

- **Frontend**: React.js, Bootstrap, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **UI Framework**: Bootstrap 5 with React Bootstrap

## Project Structure

```
pilgrimage-portal/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── package.json
└── README.md
```

## Installation

1. Install dependencies for all projects:
```bash
npm run install-deps
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend folder
   - Update database connection string and JWT secret

3. Start the development servers:
```bash
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) servers.

## Environment Variables

Create a `.env` file in the backend directory with:

```
MONGODB_URI=mongodb://localhost:27017/pilgrimage-portal
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login

### Tours
- GET `/api/tours` - Get all tours
- GET `/api/tours/:id` - Get tour by ID
- POST `/api/tours` - Create tour (Admin only)
- PUT `/api/tours/:id` - Update tour (Admin only)
- DELETE `/api/tours/:id` - Delete tour (Admin only)

### Bookings
- GET `/api/bookings` - Get user bookings
- POST `/api/bookings` - Create booking
- PUT `/api/bookings/:id` - Update booking

### Expenses
- GET `/api/expenses` - Get expenses
- POST `/api/expenses` - Add expense
- GET `/api/expenses/reports` - Get expense reports

## License

MIT