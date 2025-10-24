import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../services/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
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
    },
    validationSchema: Yup.object({
      firstName: Yup.string()
        .required('First name is required'),
      lastName: Yup.string()
        .required('Last name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
      phoneNumber: Yup.string()
        .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
        .required('Phone number is required'),
      aadharNumber: Yup.string()
        .matches(/^[0-9]{12}$/, 'Aadhar number must be 12 digits')
        .required('Aadhar number is required'),
      address: Yup.object({
        street: Yup.string().required('Street address is required'),
        city: Yup.string().required('City is required'),
        state: Yup.string().required('State is required'),
        pincode: Yup.string()
          .matches(/^[0-9]{6}$/, 'Pincode must be 6 digits')
          .required('Pincode is required')
      })
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { confirmPassword, ...userData } = values;
        const result = await register(userData);
        if (result.success) {
          toast.success('Registration successful!');
          navigate('/');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={7}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              {/* Header Section */}
              <div 
                className="text-center py-4"
                style={{
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  color: 'white'
                }}
              >
                <div className="d-flex justify-content-center align-items-center mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '70px',
                      height: '70px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <img 
                      src="/logo.png" 
                      alt="Sri Vishnu Chitra Yatra Logo" 
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="mb-0 fw-bold" style={{ fontSize: '2.2rem' }}>
                      Join Sri Vishnu Chitra Yatra
                    </h1>
                  </div>
                </div>
                <p className="mb-0" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                  Create your account to start your spiritual journey
                </p>
              </div>

              <Card.Body className="p-5">
                <Form onSubmit={formik.handleSubmit}>
                  {/* Personal Information Section */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                          color: 'white',
                          fontSize: '1.2rem'
                        }}
                      >
                        1
                      </div>
                      <h3 className="mb-0 text-primary fw-bold">Personal Information</h3>
                    </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formik.values.firstName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.firstName && formik.errors.firstName}
                          placeholder="Enter first name"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.firstName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formik.values.lastName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.lastName && formik.errors.lastName}
                          placeholder="Enter last name"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.lastName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      isInvalid={formik.touched.email && formik.errors.email}
                      placeholder="Enter email address"
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formik.errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phoneNumber"
                          value={formik.values.phoneNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.phoneNumber && formik.errors.phoneNumber}
                          placeholder="10-digit phone number"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.phoneNumber}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Aadhar Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="aadharNumber"
                          value={formik.values.aadharNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.aadharNumber && formik.errors.aadharNumber}
                          placeholder="12-digit Aadhar number"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.aadharNumber}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Security Section */}
                <div className="mb-5">
                  <div className="d-flex align-items-center mb-4">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                        color: 'white',
                        fontSize: '1.2rem'
                      }}
                    >
                      2
                    </div>
                    <h3 className="mb-0 text-primary fw-bold">Security Information</h3>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formik.values.password}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.password && formik.errors.password}
                          placeholder="Enter password"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Confirm Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formik.values.confirmPassword}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.confirmPassword && formik.errors.confirmPassword}
                          placeholder="Confirm password"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Address Section */}
                <div className="mb-5">
                  <div className="d-flex align-items-center mb-4">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                        color: 'white',
                        fontSize: '1.2rem'
                      }}
                    >
                      3
                    </div>
                    <h3 className="mb-0 text-primary fw-bold">Address Information</h3>
                  </div>
                
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address.street"
                      value={formik.values.address.street}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      isInvalid={formik.touched.address?.street && formik.errors.address?.street}
                      placeholder="Enter street address"
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formik.errors.address?.street}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">City</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.city"
                          value={formik.values.address.city}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.address?.city && formik.errors.address?.city}
                          placeholder="Enter city"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.address?.city}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">State</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.state"
                          value={formik.values.address.state}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={formik.touched.address?.state && formik.errors.address?.state}
                          placeholder="Enter state"
                          style={{ borderRadius: '8px', padding: '12px' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.address?.state}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Pincode</Form.Label>
                    <Form.Control
                      type="text"
                      name="address.pincode"
                      value={formik.values.address.pincode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      isInvalid={formik.touched.address?.pincode && formik.errors.address?.pincode}
                      placeholder="6-digit pincode"
                      style={{ borderRadius: '8px', padding: '12px', maxWidth: '200px' }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formik.errors.address?.pincode}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '15px 50px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </Form>

              <hr className="my-4" style={{ border: 'none', borderTop: '2px solid #e9ecef' }} />

              <div className="text-center">
                <p className="mb-0" style={{ fontSize: '1rem' }}>
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-decoration-none fw-bold"
                    style={{ 
                      color: '#ff6b35',
                      transition: 'color 0.3s ease'
                    }}
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default RegisterPage;