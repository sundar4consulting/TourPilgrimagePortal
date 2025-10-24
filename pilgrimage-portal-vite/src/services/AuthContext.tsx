import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, User } from './api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (user: User, token: string) => void
  logout: () => void
  register: (userData: any) => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    console.log('AuthContext: Checking stored auth data')
    
    // Clear any outstanding sessions first
    const clearSession = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
    }
    
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    console.log('AuthContext: Found data', { hasToken: !!token, hasUserData: !!userData })
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        
        // Validate the stored data
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
          console.log('AuthContext: Setting user', parsedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } else {
          console.log('AuthContext: Invalid user data, clearing session')
          clearSession()
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
        clearSession()
      }
    } else {
      console.log('AuthContext: No stored auth data found')
      clearSession()
    }
  }, [])

  const login = (user: User, token: string) => {
    // Clear any existing session first
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Set new session
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    setIsAuthenticated(true)
    
    console.log('AuthContext: User logged in', { userId: user.id, role: user.role })
  }

  const logout = () => {
    // Clear all authentication data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Clear any other potential session data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('auth_') || key.startsWith('session_')) {
        localStorage.removeItem(key)
      }
    })
    
    // Reset state
    setUser(null)
    setIsAuthenticated(false)
    
    console.log('AuthContext: User logged out, session cleared')
    
    // Redirect to login page
    window.location.href = '/login'
  }

  const register = async (userData: any): Promise<User> => {
    const response = await authAPI.register(userData)
    const { user, token } = response.data
    login(user, token)
    return user
  }

  const isAdmin = user?.role === 'admin'

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}