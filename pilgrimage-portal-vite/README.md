# Pilgrimage Portal - Vite Edition

A modern, memory-efficient spiritual tourism booking platform built with Vite, React, TypeScript, and Bootstrap.

## 🚀 Features

- **Optimized Performance**: Built with Vite for faster development and smaller bundle sizes
- **Memory Efficient**: Designed to avoid the memory issues of Create React App
- **Tours Management**: Browse and book pilgrimage tours with detailed information
- **User Authentication**: Secure login/registration system
- **Responsive Design**: Bootstrap-powered responsive UI
- **TypeScript**: Full type safety for better development experience

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- MongoDB (for backend API)

## 🛠 Installation

1. Clone or navigate to the project directory:
   ```bash
   cd pilgrimage-portal-vite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🚦 Getting Started

### Development Server

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── ToursPage.tsx   # Main tours listing page
│   ├── TourDetailsPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── MemberDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── ExpensesPage.tsx
├── services/           # API and context providers
│   ├── api.ts         # Axios API configuration
│   └── AuthContext.tsx
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## 🎯 Key Features Implemented

### ToursPage Component
- **Optimized Data Fetching**: Efficient API calls with proper TypeScript types
- **Professional UI**: Bootstrap cards with tour information, pricing, and difficulty badges
- **Responsive Layout**: Mobile-friendly grid system
- **Error Handling**: Graceful error states and loading indicators
- **Navigation**: Seamless routing to tour details

### Memory Optimizations
- **Vite Build Tool**: Faster builds and smaller bundles compared to webpack
- **Tree Shaking**: Automatic removal of unused code
- **Code Splitting**: Lazy loading for better performance
- **Optimized Dependencies**: Careful selection of lightweight packages

## 🔧 Configuration

### Vite Configuration (`vite.config.ts`)
- Custom port (3000) for consistency
- Build optimizations for production
- Development server settings

### TypeScript Configuration
- Strict type checking enabled
- Modern ES2020 target
- JSX support for React

## 🌐 API Integration

The application connects to a backend API running on `http://localhost:5000/api`

Key endpoints:
- `GET /tours` - Fetch tours list
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration

## 📱 Responsive Design

Built with Bootstrap 5 for:
- Mobile-first responsive design
- Consistent component styling
- Professional UI components
- Accessibility features

## 🔄 State Management

- **React Context**: For authentication state
- **Local State**: Component-level state with React hooks
- **Persistent Storage**: localStorage for user sessions

## 🚀 Performance Features

1. **Fast Refresh**: Instant updates during development
2. **Optimized Builds**: Minification and compression
3. **Modern Bundling**: ES modules and tree shaking
4. **Source Maps**: Better debugging experience

## 🛠 Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Production preview
npm run preview
```

## 🐛 Troubleshooting

### Memory Issues
This Vite version is specifically designed to avoid the memory exhaustion issues experienced with Create React App.

### Port Conflicts
If port 3000 is in use, Vite will automatically try the next available port.

### Build Errors
Run `npm run build` to check for TypeScript errors before deployment.

## 📈 Advantages Over Create React App

1. **Faster Development**: Vite's HMR is significantly faster
2. **Smaller Bundles**: Better tree shaking and optimization
3. **Memory Efficient**: Lower resource usage during development
4. **Modern Tooling**: Native ES modules support
5. **Faster Builds**: esbuild-powered bundling

## 🎨 Styling

- **Bootstrap 5**: For consistent, responsive design
- **Custom CSS**: Additional styling in `App.css` and `index.css`
- **React Icons**: Font Awesome icons through react-icons

## 📄 License

This project is part of the Sri Vishnu Chitra Yatra pilgrimage portal system.

---

**Ready to run!** Use `npm run dev` to start developing your pilgrimage booking platform.