# Pilgrimage Portal - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **MongoDB** (v5 or higher)
- **Git**

## Installation Steps

### 1. Clone or Navigate to the Project

```bash
cd /Users/2205287/Documents/CDE/EnterpriseApp/Tour/Expense-VishnuChitr/pilgrimage-portal
```

### 2. Install Dependencies

Install dependencies for all projects (root, backend, and frontend):

```bash
npm run install-deps
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

Copy the environment example file and configure it:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
MONGODB_URI=mongodb://localhost:27017/pilgrimage-portal
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# Or run directly
mongod
```

### 5. Seed the Database (Optional)

You can create sample data by running the backend server and making API calls or by creating a seed script.

### 6. Start the Development Servers

From the root directory:

```bash
npm run dev
```

This will start both:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

Or start them separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

## Default Admin Account

To create an admin account, you can:

1. Register a normal user through the frontend
2. Manually update the user role in MongoDB:

```javascript
// Connect to MongoDB
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Project Structure

```
pilgrimage-portal/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Tours
- `GET /api/tours` - Get all tours
- `GET /api/tours/:id` - Get tour by ID
- `POST /api/tours` - Create tour (Admin only)
- `PUT /api/tours/:id` - Update tour (Admin only)
- `DELETE /api/tours/:id` - Delete tour (Admin only)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update booking status

### Expenses
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Add expense
- `PUT /api/expenses/:id` - Update expense
- `GET /api/expenses/reports/summary` - Get expense reports (Admin)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/expenses` - Get all expenses

## Available Scripts

### Root Directory
- `npm run dev` - Start both backend and frontend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run install-deps` - Install all dependencies

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill existing processes using the port

3. **React App Won't Start**
   - Clear node_modules and reinstall
   - Check for conflicting dependencies

4. **API Calls Failing**
   - Verify backend is running on correct port
   - Check CORS configuration
   - Ensure JWT token is being sent

### Environment Variables

Make sure all required environment variables are set:

```env
# Backend
MONGODB_URI=mongodb://localhost:27017/pilgrimage-portal
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Frontend (optional)
REACT_APP_API_URL=http://localhost:5000/api
```

## Production Deployment

### Backend Deployment

1. Set environment variables:
   ```env
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   PORT=5000
   ```

2. Install dependencies and start:
   ```bash
   npm install --production
   npm start
   ```

### Frontend Deployment

1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the build folder using a web server (nginx, Apache, etc.)

### Docker Deployment (Optional)

You can create Docker containers for easier deployment. Example Dockerfile for backend:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Security Considerations

1. Change the default JWT secret in production
2. Use HTTPS in production
3. Implement rate limiting
4. Validate and sanitize all inputs
5. Use environment variables for sensitive data
6. Regularly update dependencies

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Create an issue in the project repository