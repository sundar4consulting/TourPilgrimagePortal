import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Carousel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FaMapMarkerAlt, FaClock, FaUsers, FaStar } from 'react-icons/fa';
import api from '../services/api';

const HomePage = () => {
  const [featuredTours, setFeaturedTours] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [toursResponse, destinationsResponse] = await Promise.all([
        api.get('/tours/featured'),
        api.get('/destinations')
      ]);
      
      setFeaturedTours(toursResponse.data.slice(0, 6));
      setDestinations(destinationsResponse.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set some fallback data if API fails
      setFeaturedTours([]);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  const regionDestinations = {
    'south-india': [
      {
        name: 'Tirupati',
        state: 'Andhra Pradesh',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400',
        temples: ['Sri Venkateswara Temple'],
        significance: 'One of the most visited pilgrimage sites'
      },
      {
        name: 'Madurai',
        state: 'Tamil Nadu',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        temples: ['Meenakshi Amman Temple'],
        significance: 'Ancient temple city'
      },
      {
        name: 'Rameswaram',
        state: 'Tamil Nadu',
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        temples: ['Ramanathaswamy Temple'],
        significance: 'One of the Char Dhams'
      }
    ],
    'north-india': [
      {
        name: 'Varanasi',
        state: 'Uttar Pradesh',
        image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400',
        temples: ['Kashi Vishwanath Temple'],
        significance: 'Oldest living city'
      },
      {
        name: 'Rishikesh',
        state: 'Uttarakhand',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        temples: ['Lakshman Jhula', 'Ram Jhula'],
        significance: 'Yoga capital of the world'
      },
      {
        name: 'Amritsar',
        state: 'Punjab',
        image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400',
        temples: ['Golden Temple'],
        significance: 'Holiest Sikh shrine'
      }
    ]
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div>Loading...</div>
      </Container>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Discover Sacred India
              </h1>
              <p className="lead mb-4">
                Embark on a spiritual journey through India's most revered pilgrimage 
                destinations. Experience divinity, culture, and heritage with our 
                expertly curated tours.
              </p>
              <LinkContainer to="/tours">
                <Button variant="light" size="lg" className="me-3">
                  Explore Tours
                </Button>
              </LinkContainer>
              <LinkContainer to="/register">
                <Button variant="outline-light" size="lg">
                  Join Us
                </Button>
              </LinkContainer>
            </Col>
            <Col lg={6}>
              <Carousel className="rounded">
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop"
                    alt="Tirupati Temple"
                    style={{ height: '400px', objectFit: 'cover' }}
                  />
                  <Carousel.Caption>
                    <h3>Tirupati - Abode of Lord Venkateswara</h3>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&h=400&fit=crop"
                    alt="Varanasi Ghats"
                    style={{ height: '400px', objectFit: 'cover' }}
                  />
                  <Carousel.Caption>
                    <h3>Varanasi - The Eternal City</h3>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop"
                    alt="Madurai Temple"
                    style={{ height: '400px', objectFit: 'cover' }}
                  />
                  <Carousel.Caption>
                    <h3>Madurai - Temple City of Tamil Nadu</h3>
                  </Carousel.Caption>
                </Carousel.Item>
              </Carousel>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Tours */}
      <section className="py-5">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="text-center mb-3">Featured Pilgrimage Tours</h2>
              <p className="text-center text-muted">
                Discover our most popular spiritual journeys
              </p>
            </Col>
          </Row>
          <Row>
            {featuredTours.length > 0 ? featuredTours.map((tour) => (
              <Col lg={4} md={6} className="mb-4" key={tour._id}>
                <Card className="tour-card h-100">
                  <Card.Img 
                    variant="top" 
                    src={tour.images?.[0] || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=250&fit=crop'}
                    style={{ height: '250px', objectFit: 'cover' }}
                  />
                  <Card.Body>
                    <Card.Title>{tour.title}</Card.Title>
                    <Card.Text>{tour.shortDescription}</Card.Text>
                    
                    <div className="mb-3">
                      <small className="text-muted">
                        <FaMapMarkerAlt className="me-1" />
                        {tour.destinations?.map(d => d.name).join(', ')}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Badge bg="primary">
                        <FaClock className="me-1" />
                        {tour.durationString}
                      </Badge>
                      <Badge bg="success">
                        <FaUsers className="me-1" />
                        {tour.maxParticipants - tour.currentParticipants} seats left
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-primary">
                        ₹{tour.pricing?.adult?.toLocaleString()} per person
                      </strong>
                      <LinkContainer to={`/tours/${tour._id}`}>
                        <Button variant="outline-primary" size="sm">
                          View Details
                        </Button>
                      </LinkContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )) : (
              <Col className="text-center">
                <p>No featured tours available at the moment.</p>
              </Col>
            )}
          </Row>
        </Container>
      </section>

      {/* Destinations by Region */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="text-center mb-3">Explore Sacred Destinations</h2>
              <p className="text-center text-muted">
                Journey through India's spiritual heartlands
              </p>
            </Col>
          </Row>
          
          {/* South India */}
          <Row className="mb-5">
            <Col>
              <h3 className="mb-3">
                <FaStar className="text-warning me-2" />
                South India Pilgrimage
              </h3>
            </Col>
          </Row>
          <Row>
            {regionDestinations['south-india'].map((destination, index) => (
              <Col lg={4} md={6} className="mb-4" key={index}>
                <Card className="destination-card">
                  <div className="position-relative">
                    <img 
                      src={destination.image} 
                      alt={destination.name}
                      className="card-img"
                    />
                    <div className="destination-overlay">
                      <h5>{destination.name}</h5>
                      <p className="mb-1">{destination.state}</p>
                      <small>{destination.significance}</small>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* North India */}
          <Row className="mb-5 mt-5">
            <Col>
              <h3 className="mb-3">
                <FaStar className="text-warning me-2" />
                North India Pilgrimage
              </h3>
            </Col>
          </Row>
          <Row>
            {regionDestinations['north-india'].map((destination, index) => (
              <Col lg={4} md={6} className="mb-4" key={index}>
                <Card className="destination-card">
                  <div className="position-relative">
                    <img 
                      src={destination.image} 
                      alt={destination.name}
                      className="card-img"
                    />
                    <div className="destination-overlay">
                      <h5>{destination.name}</h5>
                      <p className="mb-1">{destination.state}</p>
                      <small>{destination.significance}</small>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Transportation Info */}
      <section className="py-5">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="text-center mb-3">Travel in Comfort</h2>
              <p className="text-center text-muted">
                We provide various transportation options for your convenience
              </p>
            </Col>
          </Row>
          <Row>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-bus fa-3x text-primary"></i>
              </div>
              <h5>Luxury Buses</h5>
              <p>AC coaches with comfortable seating and entertainment systems</p>
            </Col>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-train fa-3x text-primary"></i>
              </div>
              <h5>Train Travel</h5>
              <p>Comfortable train journeys with reserved compartments</p>
            </Col>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-plane fa-3x text-primary"></i>
              </div>
              <h5>Flight Connections</h5>
              <p>Quick air travel for distant destinations</p>
            </Col>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-car fa-3x text-primary"></i>
              </div>
              <h5>Private Vehicles</h5>
              <p>Personal cars and vans for small groups</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row>
            <Col className="text-center">
              <h2 className="mb-3">Ready to Begin Your Spiritual Journey?</h2>
              <p className="lead mb-4">
                Join thousands of pilgrims who have discovered peace and divinity 
                through our carefully crafted tours.
              </p>
              <LinkContainer to="/register">
                <Button variant="light" size="lg" className="me-3">
                  Register Now
                </Button>
              </LinkContainer>
              <LinkContainer to="/tours">
                <Button variant="outline-light" size="lg">
                  Browse All Tours
                </Button>
              </LinkContainer>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;