import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Form,
  Alert,
  Spinner,
  Modal,
  InputGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { toursAPI, bookingsAPI, type Tour, type FamilyMember } from '../services/api';

const BookTourPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [bookingForm, setBookingForm] = useState({
    participants: 1,
    specialRequirements: '',
    emergencyContact: '',
    emergencyName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await toursAPI.getAll({ featured: true, limit: 50 });
      
      if (response.data && response.data.tours) {
        setTours(response.data.tours);
      } else {
        setTours([]);
      }
    } catch (error: any) {
      console.error('Error fetching tours:', error);
      setError('Failed to load tours. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTour = (tour: Tour) => {
    setSelectedTour(tour);
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTour || !user) return;
    
    try {
      setSubmitting(true);
      
      // Create participant data
      const participants: FamilyMember[] = [];
      
      // Add primary participant (user)
      participants.push({
        name: user.name || 'User',
        age: 30, // Default age, should be collected from user profile
        relation: 'self',
        aadhar: user.aadhar || '',
      });
      
      // Add additional participants if more than 1
      for (let i = 1; i < bookingForm.participants; i++) {
        participants.push({
          name: `Family Member ${i}`,
          age: 30,
          relation: 'other',
          aadhar: '',
        });
      }
      
      // Transform participants to match backend validation requirements
      const transformedParticipants = participants.map((participant, index) => {
        // Determine price category based on age
        let priceCategory: 'adult' | 'child' | 'senior' = 'adult'
        if (participant.age < 5) {
          priceCategory = 'child' // Free but still considered child category
        } else if (participant.age < 18) {
          priceCategory = 'child'
        } else if (participant.age >= 60) {
          priceCategory = 'senior'
        }

        return {
          type: index === 0 ? 'primary' : 'family', // First participant is primary, rest are family
          name: participant.name,
          age: participant.age,
          aadharNumber: participant.aadhar, // Map aadhar -> aadharNumber
          relationship: participant.relation.toLowerCase(), // Map relation -> relationship
          priceCategory: priceCategory // Add required priceCategory field
        }
      })
      
      const bookingData = {
        tourId: selectedTour._id,
        participants: transformedParticipants
      };
      
      await bookingsAPI.create(bookingData);
      
      setShowBookingModal(false);
      setBookingForm({
        participants: 1,
        specialRequirements: '',
        emergencyContact: '',
        emergencyName: ''
      });
      
      alert('Tour booked successfully! You can view your bookings in the dashboard.');
      navigate('/member/dashboard');
      
    } catch (error: any) {
      console.error('Error booking tour:', error);
      alert('Failed to book tour. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tours based on search and category
  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || tour.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(tours.map(tour => tour.category))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge bg="success">Available</Badge>;
      case 'draft':
        return <Badge bg="warning">Coming Soon</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      case 'completed':
        return <Badge bg="secondary">Completed</Badge>;
      default:
        return <Badge bg="primary">{status}</Badge>;
    }
  };

  const getTourPrice = (tour: Tour) => {
    return tour.pricing?.adult || 0;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading available tours...</p>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-5">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="display-6 fw-bold text-primary">Book A Tour</h1>
                <p className="text-muted">Choose from our spiritual pilgrimage tours</p>
              </div>
              <Button 
                variant="outline-primary"
                onClick={() => navigate('/member/dashboard')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Dashboard
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Search and Filter */}
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={8}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search tours by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-mountain fa-3x text-muted mb-3"></i>
            <h5>No Tours Available</h5>
            <p className="text-muted">
              {searchTerm || selectedCategory ? 'No tours match your search criteria.' : 'No tours are currently available.'}
            </p>
          </div>
        ) : (
          <Row>
            {filteredTours.map((tour) => (
              <Col key={tour._id} lg={4} md={6} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={tour.images?.[0] || '/placeholder-tour.jpg'} 
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <div className="mb-auto">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="h5">{tour.title}</Card.Title>
                        {getStatusBadge(tour.status || 'draft')}
                      </div>
                      
                      <Card.Text className="text-muted small">
                        {tour.description.substring(0, 100)}...
                      </Card.Text>
                      
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {tour.duration.days}D/{tour.duration.nights}N
                        </small>
                        <br />
                        <small className="text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {tour.destinations.join(', ')}
                        </small>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="text-primary h5">₹{getTourPrice(tour).toLocaleString()}</strong>
                          <small className="text-muted d-block">per person</small>
                        </div>
                        <div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/tours/${tour._id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={tour.status !== 'published'}
                            onClick={() => handleBookTour(tour)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Book Tour: {selectedTour?.title}</Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmitBooking}>
          <Modal.Body>
            {selectedTour && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Duration:</strong> {selectedTour.duration.days}D/{selectedTour.duration.nights}N
                  </Col>
                  <Col md={6}>
                    <strong>Price per person:</strong> ₹{getTourPrice(selectedTour).toLocaleString()}
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Number of Participants</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        value={bookingForm.participants}
                        onChange={(e) => setBookingForm({
                          ...bookingForm,
                          participants: parseInt(e.target.value) || 1
                        })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Total Amount</Form.Label>
                      <Form.Control
                        type="text"
                        value={`₹${(getTourPrice(selectedTour) * bookingForm.participants).toLocaleString()}`}
                        readOnly
                        className="fw-bold text-primary"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Emergency Contact</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Emergency contact number"
                    value={bookingForm.emergencyContact}
                    onChange={(e) => setBookingForm({
                      ...bookingForm,
                      emergencyContact: e.target.value
                    })}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Special Requirements (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Any special dietary requirements, medical conditions, or other notes..."
                    value={bookingForm.specialRequirements}
                    onChange={(e) => setBookingForm({
                      ...bookingForm,
                      specialRequirements: e.target.value
                    })}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default BookTourPage;