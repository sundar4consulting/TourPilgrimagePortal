import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Table, 
  Modal, 
  Alert,
  Spinner,
  ListGroup
} from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import { toursAPI, bookingsAPI, Tour } from '../services/api'
import { useAuth } from '../services/AuthContext'
import TourBooking from '../components/TourBooking'

const TourDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [showInterestModal, setShowInterestModal] = useState(false)
  
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      fetchTourDetails()
    }
  }, [id])

  const fetchTourDetails = async () => {
    try {
      setLoading(true)
      const response = await toursAPI.getById(id!)
      setTour(response.data)
    } catch (error: any) {
      console.error('Error fetching tour details:', error)
      setError('Failed to load tour details')
    } finally {
      setLoading(false)
    }
  }

  const handleExpressInterest = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    try {
      setBookingLoading(true)
      await bookingsAPI.expressInterest(tour!._id)
      setShowInterestModal(true)
    } catch (error: any) {
      console.error('Error expressing interest:', error)
      setBookingError('Failed to express interest. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    setShowBookingModal(true)
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading tour details...</p>
      </Container>
    )
  }

  if (error || !tour) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Tour not found'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/tours')}>
          Back to Tours
        </Button>
      </Container>
    )
  }

  return (
    <>
      <Container className="py-5">
        {/* Tour Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h1 className="display-6 fw-bold text-primary">{tour.title}</h1>
                <div className="d-flex gap-2 mb-2">
                  <Badge bg="primary">{tour.category}</Badge>
                  <Badge bg="success">
                    {tour.duration.days}D/{tour.duration.nights}N
                  </Badge>
                  <Badge bg="info">{tour.difficulty}</Badge>
                  {tour.featured && <Badge bg="warning">Featured</Badge>}
                </div>
              </div>
              <div className="text-end">
                <div className="h4 text-primary mb-1">
                  ₹{tour.pricing.adult.toLocaleString()}
                </div>
                <small className="text-muted">per adult</small>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            {/* Tour Description */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Tour Overview</h5>
              </Card.Header>
              <Card.Body>
                <p className="lead">{tour.description}</p>
              </Card.Body>
            </Card>

            {/* Destinations */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Sacred Destinations</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {tour.destinations.map((destination, index) => (
                    <Col md={6} key={index} className="mb-3">
                      <Card className="h-100 border-light">
                        <Card.Body>
                          <h6 className="text-primary">{destination.name}</h6>
                          <p className="small text-muted mb-1">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {destination.state}
                          </p>
                          <p className="small">{destination.significance}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            {/* Pricing Table */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Pricing Details</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Age Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Adult</td>
                      <td className="text-primary fw-bold">
                        ₹{tour.pricing.adult.toLocaleString()}
                      </td>
                      <td>18+ years</td>
                    </tr>
                    <tr>
                      <td>Child</td>
                      <td className="text-primary fw-bold">
                        ₹{tour.pricing.child.toLocaleString()}
                      </td>
                      <td>5-17 years</td>
                    </tr>
                    <tr>
                      <td>Senior</td>
                      <td className="text-primary fw-bold">
                        ₹{tour.pricing.senior.toLocaleString()}
                      </td>
                      <td>60+ years</td>
                    </tr>
                  </tbody>
                </Table>
                <small className="text-muted">
                  * All prices are in {tour.pricing.currency}
                  * Children below 5 years travel free
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Booking Card */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Book This Tour</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Duration:</strong> {tour.duration.days} Days, {tour.duration.nights} Nights
                </div>
                
                {tour.startDate && (
                  <div className="mb-3">
                    <strong>Start Date:</strong> {new Date(tour.startDate).toLocaleDateString()}
                  </div>
                )}

                {tour.maxParticipants && (
                  <div className="mb-3">
                    <strong>Available Spots:</strong>{' '}
                    {tour.maxParticipants - (tour.currentBookings || 0)} / {tour.maxParticipants}
                  </div>
                )}

                {bookingError && (
                  <Alert variant="danger" className="small">
                    {bookingError}
                  </Alert>
                )}

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      'Book Now'
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline-primary"
                    onClick={handleExpressInterest}
                    disabled={bookingLoading}
                  >
                    Express Interest
                  </Button>
                </div>

                <hr />
                
                <div className="text-center">
                  <small className="text-muted">
                    <i className="fas fa-shield-alt me-1"></i>
                    Safe & Secure Booking
                  </small>
                </div>
              </Card.Body>
            </Card>

            {/* Tour Highlights */}
            <Card>
              <Card.Header>
                <h6 className="mb-0">Tour Highlights</h6>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0">
                    <i className="fas fa-check text-success me-2"></i>
                    Comfortable transportation
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <i className="fas fa-check text-success me-2"></i>
                    Experienced tour guide
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <i className="fas fa-check text-success me-2"></i>
                    All temple entry fees included
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <i className="fas fa-check text-success me-2"></i>
                    Group dining arrangements
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <i className="fas fa-check text-success me-2"></i>
                    24/7 support during tour
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Interest Confirmation Modal */}
      <Modal 
        show={showInterestModal} 
        onHide={() => setShowInterestModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Interest Registered!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="fas fa-check-circle text-success fa-3x mb-3"></i>
            <p>
              Thank you for expressing interest in <strong>{tour.title}</strong>.
              We will contact you with more details and booking information.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowInterestModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Booking Modal - Using TourBooking component */}
      <TourBooking
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        tour={tour}
        onBookingSuccess={() => {
          setShowBookingModal(false)
          // You could show a success message or redirect here
          alert('Booking submitted successfully! We will contact you soon.')
        }}
      />
    </>
  )
}

export default TourDetailsPage