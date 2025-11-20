import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    aadharNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validated, setValidated] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Handle address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      let processedValue = value
      
      // Special handling for pincode - only numbers
      if (addressField === 'pincode') {
        processedValue = value.replace(/[^0-9]/g, '').slice(0, 6)
      }
      
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: processedValue
        }
      }))
    }
    // Special handling for numeric fields
    else if (name === 'phoneNumber' || name === 'aadharNumber') {
      // Allow only numbers
      const numericValue = value.replace(/[^0-9]/g, '')
      
      // Limit length
      const maxLength = name === 'phoneNumber' ? 10 : 12
      const trimmedValue = numericValue.slice(0, maxLength)
      
      setFormData(prev => ({
        ...prev,
        [name]: trimmedValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
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

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Additional validation
    if (!formData.phoneNumber || !/^[0-9]{10}$/.test(formData.phoneNumber)) {
      setError('Phone number is required and must be exactly 10 digits')
      return
    }

    if (!formData.aadharNumber || !/^[0-9]{12}$/.test(formData.aadharNumber)) {
      setError('Aadhar number is required and must be exactly 12 digits')
      return
    }

    // Optional pincode validation
    if (formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode)) {
      setError('PIN code must be exactly 6 digits')
      return
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least 6 characters with uppercase, lowercase, number and special character')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { confirmPassword, ...registrationData } = formData
      const user = await register(registrationData)
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/home')
      } else {
        navigate('/member/dashboard')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      let errorMessage = 'Registration failed. Please try again.'
      
      // Handle specific error types
      if (error.name === 'NetworkError' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Unable to connect to server. Please ensure the backend server is running on port 5000.'
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait a moment and try again.'
      } else if (error.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.'
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
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Join Sri Vishnu Chitra Yatra</h2>
                <p className="text-muted">Create your account to start your spiritual journey with us</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your first name"
                        minLength={2}
                        maxLength={50}
                        pattern="[a-zA-Z]+"
                        title="First name should only contain letters"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide your first name (2-50 characters, letters only).
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your last name"
                        minLength={2}
                        maxLength={50}
                        pattern="[a-zA-Z]+"
                        title="Last name should only contain letters"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide your last name (2-50 characters, letters only).
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Please enter a valid email address"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid email address.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter your phone number"
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit phone number"
                  />
                  <Form.Text className="text-muted">
                    Enter 10-digit mobile number (required)
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid 10-digit phone number.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Aadhar Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter your Aadhar number"
                    pattern="[0-9]{12}"
                    title="Please enter a valid 12-digit Aadhar number"
                    maxLength={12}
                  />
                  <Form.Text className="text-muted">
                    Enter 12-digit Aadhar number (required for verification)
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid 12-digit Aadhar number.
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Address Section */}
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Address (Optional)</h6>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Street Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleChange}
                          placeholder="Enter your street address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleChange}
                          placeholder="Enter your city"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleChange}
                          placeholder="Enter your state"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>PIN Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.pincode"
                          value={formData.address.pincode}
                          onChange={handleChange}
                          placeholder="Enter 6-digit PIN code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          title="Please enter a valid 6-digit PIN code"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Create a password"
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$"
                        title="Password must be at least 6 characters with uppercase, lowercase, number and special character"
                      />
                      <Form.Control.Feedback type="invalid">
                        Password must be at least 6 characters with uppercase, lowercase, number and special character.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Confirm your password"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please confirm your password.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="terms"
                    label={
                      <span>
                        I agree to the{' '}
                        <a href="#" className="text-primary">
                          Terms and Conditions
                        </a>
                      </span>
                    }
                    required
                  />
                </div>

                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg" 
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner 
                        as="span" 
                        animation="border" 
                        size="sm" 
                        className="me-2" 
                      />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary text-decoration-none">
                    Sign in here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default RegisterPage