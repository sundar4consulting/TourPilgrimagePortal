import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../services/AuthContext'

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validated, setValidated] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = (location.state as any)?.from?.pathname || '/'

  // Check for rate limiting on component mount
  React.useEffect(() => {
    const lastAttempt = localStorage.getItem('lastLoginAttempt')
    const attemptCount = parseInt(localStorage.getItem('loginAttemptCount') || '0')
    
    if (lastAttempt && attemptCount >= 3) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt)
      const cooldownDuration = 60000 // 1 minute cooldown
      
      if (timeSinceLastAttempt < cooldownDuration) {
        setRateLimited(true)
        setCooldownTime(Math.ceil((cooldownDuration - timeSinceLastAttempt) / 1000))
        
        const interval = setInterval(() => {
          setCooldownTime(prev => {
            if (prev <= 1) {
              setRateLimited(false)
              localStorage.removeItem('loginAttemptCount')
              localStorage.removeItem('lastLoginAttempt')
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        return () => clearInterval(interval)
      } else {
        // Reset if cooldown period has passed
        localStorage.removeItem('loginAttemptCount')
        localStorage.removeItem('lastLoginAttempt')
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    
    if (form.checkValidity() === false) {
      e.stopPropagation()
      setValidated(true)
      return
    }

    // Check if currently rate limited
    if (rateLimited) {
      setError(`Too many login attempts. Please wait ${cooldownTime} seconds before trying again.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Clear any existing session before login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear any cached navigation or route history
      sessionStorage.clear()
      
      const response = await authAPI.login(formData)
      const { user, token } = response.data
      
      console.log('Login response:', { user, token: token ? 'present' : 'missing' })
      console.log('User role:', user?.role)
      
      // Validate response data
      if (!user || !token || !user.role) {
        throw new Error('Invalid login response from server')
      }
      
      // Clear login attempt tracking on successful login
      localStorage.removeItem('loginAttemptCount')
      localStorage.removeItem('lastLoginAttempt')
      
      // Store auth data and update context
      login(user, token)
      
      // Redirect based on role with replace to prevent back navigation
      if (user.role === 'admin') {
        console.log('Redirecting admin to dashboard')
        navigate('/admin/home', { replace: true })
      } else if (user.role === 'member') {
        console.log('Redirecting member to dashboard')
        navigate('/member/dashboard', { replace: true })
      } else {
        // Fallback for any other roles or if coming from a specific page
        console.log('Redirecting to fallback:', from)
        navigate(from, { replace: true })
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Track failed login attempts
      const attemptCount = parseInt(localStorage.getItem('loginAttemptCount') || '0') + 1
      localStorage.setItem('loginAttemptCount', attemptCount.toString())
      localStorage.setItem('lastLoginAttempt', Date.now().toString())
      
      // Clear any partial session data on error
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      let errorMessage = 'Login failed. Please check your credentials and try again.'
      
      // Handle specific error types
      if (error.name === 'NetworkError' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Unable to connect to server. Please ensure the backend server is running on port 5000.'
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.'
        // Trigger rate limiting UI
        setRateLimited(true)
        setCooldownTime(60) // 60 seconds cooldown
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.response?.status === 403) {
        errorMessage = 'Account access is restricted. Please contact administrator.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Welcome Back</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid email address.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Enter your password"
                  />
                  <Form.Control.Feedback type="invalid">
                    Password must be at least 6 characters long.
                  </Form.Control.Feedback>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg" 
                  className="w-100 mb-3"
                  disabled={loading || rateLimited}
                >
                  {loading ? (
                    <>
                      <Spinner 
                        as="span" 
                        animation="border" 
                        size="sm" 
                        className="me-2" 
                      />
                      Signing In...
                    </>
                  ) : rateLimited ? (
                    `Please wait ${cooldownTime}s`
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                {rateLimited && (
                  <Alert variant="warning" className="mb-3">
                    <i className="fas fa-clock me-2"></i>
                    Too many login attempts. Please wait {cooldownTime} seconds before trying again.
                  </Alert>
                )}
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary text-decoration-none">
                    Register here
                  </Link>
                </p>
                
                {parseInt(localStorage.getItem('loginAttemptCount') || '0') >= 2 && !rateLimited && (
                  <small className="text-warning mt-2 d-block">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Multiple failed attempts detected. Account will be temporarily locked after 3 failed attempts.
                  </small>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default LoginPage