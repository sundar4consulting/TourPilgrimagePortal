import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { toursAPI, Tour } from '../services/api'
import { useAuth } from '../services/AuthContext'

const HomePage: React.FC = () => {
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/home', { replace: true })
        return
      } else if (user.role === 'member') {
        navigate('/member/dashboard', { replace: true })
        return
      }
    }
    
    fetchFeaturedTours()
  }, [isAuthenticated, user, navigate])

  const fetchFeaturedTours = async () => {
    try {
      const response = await toursAPI.getAll({ featured: true, limit: 6 })
      setFeaturedTours(response.data.tours)
    } catch (error) {
      console.error('Error fetching featured tours:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5 mb-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
                            <h1 className="display-4 fw-bold mb-3">Sri Vishnu Chitta Yatra</h1>
              <p className="lead mb-4">
                Embark on sacred journeys to divine destinations across India. Experience spiritual transformation through our carefully curated pilgrimage tours.
              </p>
              <div className="d-flex gap-3">
                <Button 
                  variant="light" 
                  size="lg"
                  onClick={() => navigate('/tours')}
                >
                  Explore Tours
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  onClick={() => navigate('/register')}
                >
                  Join Us
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <i className="fas fa-om fa-10x opacity-75"></i>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* Features Section */}
        <Row className="mb-5">
          <Col className="text-center mb-4">
            <h2 className="display-6 fw-bold">Why Choose Our Pilgrimage Tours?</h2>
            <p className="text-muted">Discover the spiritual essence of India with our expert guidance</p>
          </Col>
        </Row>
        
        <Row className="mb-5">
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="text-primary mb-3">
                  <i className="fas fa-map-marked-alt fa-3x"></i>
                </div>
                <h5>Sacred Destinations</h5>
                <p className="text-muted">
                  Carefully selected temples and spiritual sites across South India and beyond
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="text-primary mb-3">
                  <i className="fas fa-users fa-3x"></i>
                </div>
                <h5>Expert Guidance</h5>
                <p className="text-muted">
                  Experienced guides who understand the spiritual significance of each destination
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="text-primary mb-3">
                  <i className="fas fa-shield-alt fa-3x"></i>
                </div>
                <h5>Safe & Comfortable</h5>
                <p className="text-muted">
                  Well-planned itineraries with comfortable transportation and accommodation
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Featured Tours Section */}
        <Row className="mb-5">
          <Col className="text-center mb-4">
            <h2 className="display-6 fw-bold">Featured Pilgrimage Tours</h2>
            <p className="text-muted">Discover our most popular spiritual journeys</p>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Row>
            {featuredTours.map((tour) => (
              <Col md={6} lg={4} key={tour._id} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg="primary">{tour.category}</Badge>
                      <Badge bg="success">
                        {tour.duration.days}D/{tour.duration.nights}N
                      </Badge>
                    </div>
                    
                    <Card.Title className="h5 mb-3">{tour.title}</Card.Title>
                    
                    <Card.Text className="text-muted mb-3">
                      {tour.shortDescription || tour.description.substring(0, 100) + '...'}
                    </Card.Text>
                    
                    <div className="mb-3">
                      <small className="text-muted">Destinations:</small>
                      <div className="mt-1">
                        {tour.destinations.slice(0, 2).map((dest, index) => (
                          <Badge key={index} bg="light" text="dark" className="me-1">
                            {dest.name}
                          </Badge>
                        ))}
                        {tour.destinations.length > 2 && (
                          <Badge bg="light" text="dark">
                            +{tour.destinations.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-primary">
                          ₹{tour.pricing.adult.toLocaleString()}
                        </strong>
                        <small className="text-muted"> / person</small>
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/tours/${tour._id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {featuredTours.length > 0 && (
          <Row className="mb-5">
            <Col className="text-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/tours')}
              >
                View All Tours
              </Button>
            </Col>
          </Row>
        )}

        {/* Call to Action Section */}
        <Row className="mb-5">
          <Col>
            <Card className="bg-light border-0">
              <Card.Body className="p-5 text-center">
                <h3 className="fw-bold mb-3">Ready to Begin Your Spiritual Journey?</h3>
                <p className="lead text-muted mb-4">
                  Join thousands of pilgrims who have found peace and enlightenment through our tours
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/register')}
                  >
                    Register Now
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="lg"
                    onClick={() => navigate('/tours')}
                  >
                    Browse Tours
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Contact Info Section */}
        <Row className="mb-5">
          <Col md={4} className="text-center mb-3">
            <div className="text-primary mb-2">
              <i className="fas fa-phone fa-2x"></i>
            </div>
            <h6>Call Us</h6>
            <p className="text-muted">+91 9876543210</p>
          </Col>
          
          <Col md={4} className="text-center mb-3">
            <div className="text-primary mb-2">
              <i className="fas fa-envelope fa-2x"></i>
            </div>
            <h6>Email Us</h6>
            <p className="text-muted">info@svcyatra.com</p>
          </Col>
          
          <Col md={4} className="text-center mb-3">
            <div className="text-primary mb-2">
              <i className="fas fa-map-marker-alt fa-2x"></i>
            </div>
            <h6>Visit Us</h6>
            <p className="text-muted">Chennai, Tamil Nadu</p>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default HomePage