import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ToursPage from './pages/ToursPage'
import TourDetailsPage from './pages/TourDetailsPage'
import MemberDashboard from './pages/MemberDashboard'
import BookTourPage from './pages/BookTourPage'
import PilgrimageAdminDashboard from './pages/PilgrimageAdminDashboard'
import TestAPIConnection from './pages/TestAPIConnection'
import ExpensesPage from './pages/ExpensesPage.tsx'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test-api" element={<TestAPIConnection />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<TourDetailsPage />} />
            
            {/* Member Routes */}
            <Route path="/member/dashboard" element={
              <ProtectedRoute role="member">
                <MemberDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/member/book-tour" element={
              <ProtectedRoute role="member">
                <BookTourPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/home" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Redirect /admin/dashboard to new dashboard */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* All other admin routes redirect to main dashboard since it handles tabs */}
                        <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/tours" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/expenses" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/accommodations" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/bookings" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/analytics" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/approvals" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/tours" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/bookings" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/analytics" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/approvals" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute role="admin">
                <PilgrimageAdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Legacy expenses route for admin backward compatibility */}
            <Route path="/expenses" element={
              <ProtectedRoute role="admin">
                <ExpensesPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App