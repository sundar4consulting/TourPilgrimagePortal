import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ToursPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const response = await api.get('/tours');
      setTours(response.data.tours || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tours:', error);
      setError('Failed to load tours. Please try again later.');
      setLoading(false);
    }
  };

  const handleViewDetails = (tourId) => {
    navigate(`/tours/${tourId}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading tours...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger text-center">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-center mb-2">Pilgrimage Tours</h1>
        <p className="text-center text-muted">Discover spiritual journeys to sacred destinations</p>
      </div>
      
      {tours.length === 0 ? (
        <div className="text-center py-5">
          <h3>No tours available</h3>
          <p className="text-muted">Please check back later for new tour offerings.</p>
        </div>
      ) : (
        <Row>
          {tours.map((tour) => (
            <Col lg={4} md={6} key={tour._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="mb-3">
                    <Card.Title className="h5 text-primary">
                      {tour.title}
                    </Card.Title>
                    <div className="mb-2">
                      <Badge bg="success" className="me-2">
                        {tour.duration?.days} Days
                      </Badge>
                      <Badge bg="info">
                        {tour.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <Card.Text className="text-muted flex-grow-1">
                    {tour.shortDescription || tour.description?.substring(0, 120) + '...'}
                  </Card.Text>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <small className="text-muted">Starting from</small>
                        <div className="h6 text-success mb-0">
                          ₹{tour.pricing?.adult?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-end">
                        <small className="text-muted">Difficulty</small>
                        <div className="small">
                          <Badge bg={tour.difficulty === 'easy' ? 'success' : 'warning'}>
                            {tour.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={() => handleViewDetails(tour._id)}
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
    </Container>
  );
};

export default ToursPage;
