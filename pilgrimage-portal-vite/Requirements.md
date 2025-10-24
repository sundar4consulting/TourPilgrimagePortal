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
- Add a link for Dashboard beneath - Admin user

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

