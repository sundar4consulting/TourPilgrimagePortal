import React, { ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  role?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { isAuthenticated, user, logout } = useAuth()

  useEffect(() => {
    // Validate session integrity
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (isAuthenticated && (!token || !userData)) {
      console.log('Session integrity check failed - clearing session')
      logout()
      return
    }
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        if (!parsedUser || !parsedUser.id || !parsedUser.role) {
          console.log('Invalid user data detected - clearing session')
          logout()
          return
        }
      } catch (error) {
        console.log('Corrupted user data detected - clearing session')
        logout()
        return
      }
    }
  }, [isAuthenticated, logout])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    // Redirect based on user role
    if (user?.role === 'admin') {
      return <Navigate to="/admin/home" replace />
    } else if (user?.role === 'member') {
      return <Navigate to="/member/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute