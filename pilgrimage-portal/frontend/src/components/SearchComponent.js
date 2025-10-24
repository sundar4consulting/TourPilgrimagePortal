import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Container, Row, Col, Card, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { FaSearch, FaTimes, FaRoute, FaUsers, FaMoneyBill, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../services/api';

const SearchComponent = ({ show, onHide }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    tours: [],
    destinations: [],
    users: [],
    bookings: [],
    expenses: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    category: '',
    dateRange: '',
    priceRange: '',
    status: ''
  });

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults({ tours: [], destinations: [], users: [], bookings: [], expenses: [] });
    }
  }, [searchQuery, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get('/search/global', {
        params: {
          query: searchQuery,
          ...filters,
          tab: activeTab
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({ tours: [], destinations: [], users: [], bookings: [], expenses: [] });
    setFilters({ category: '', dateRange: '', priceRange: '', status: '' });
  };

  const getTotalResults = () => {
    return Object.values(searchResults).reduce((total, arr) => total + arr.length, 0);
  };

  const renderTourResults = () => (
    <ListGroup variant="flush">
      {searchResults.tours.map(tour => (
        <ListGroup.Item key={tour._id} className="d-flex justify-content-between align-items-start">
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              <FaRoute className="me-2" color="#007bff" />
              {tour.name}
            </div>
            <p className="mb-1">{tour.description?.substring(0, 100)}...</p>
            <small>
              <FaMapMarkerAlt className="me-1" />
              {tour.destinations?.join(', ')}
            </small>
          </div>
          <div className="text-end">
            <Badge bg="primary">₹{tour.price?.toLocaleString()}</Badge>
            <br />
            <small className="text-muted">{new Date(tour.startDate).toLocaleDateString()}</small>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const renderDestinationResults = () => (
    <ListGroup variant="flush">
      {searchResults.destinations.map(dest => (
        <ListGroup.Item key={dest._id} className="d-flex justify-content-between align-items-start">
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              <FaMapMarkerAlt className="me-2" color="#28a745" />
              {dest.name}
            </div>
            <p className="mb-1">{dest.description?.substring(0, 100)}...</p>
            <small>Country: {dest.country} | State: {dest.state}</small>
          </div>
          <Badge bg="success">{dest.category}</Badge>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const renderUserResults = () => (
    <ListGroup variant="flush">
      {searchResults.users.map(user => (
        <ListGroup.Item key={user._id} className="d-flex justify-content-between align-items-start">
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              <FaUsers className="me-2" color="#6f42c1" />
              {user.name}
            </div>
            <small>{user.email}</small>
          </div>
          <div className="text-end">
            <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>{user.role}</Badge>
            <br />
            <Badge bg={user.isActive ? 'success' : 'secondary'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const renderBookingResults = () => (
    <ListGroup variant="flush">
      {searchResults.bookings.map(booking => (
        <ListGroup.Item key={booking._id} className="d-flex justify-content-between align-items-start">
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              <FaRoute className="me-2" color="#007bff" />
              {booking.tour?.name}
            </div>
            <small>Booked by: {booking.user?.name}</small>
          </div>
          <div className="text-end">
            <Badge bg="info">₹{booking.totalAmount?.toLocaleString()}</Badge>
            <br />
            <Badge bg={getStatusColor(booking.status)}>{booking.status}</Badge>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const renderExpenseResults = () => (
    <ListGroup variant="flush">
      {searchResults.expenses.map(expense => (
        <ListGroup.Item key={expense._id} className="d-flex justify-content-between align-items-start">
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              <FaMoneyBill className="me-2" color="#ffc107" />
              {expense.description}
            </div>
            <small>By: {expense.user?.name} | Category: {expense.category}</small>
          </div>
          <div className="text-end">
            <Badge bg="warning">₹{expense.amount?.toLocaleString()}</Badge>
            <br />
            <Badge bg={getStatusColor(expense.status)}>{expense.status}</Badge>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'success',
      pending: 'warning',
      cancelled: 'danger',
      completed: 'info',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'secondary';
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'tours': return renderTourResults();
      case 'destinations': return renderDestinationResults();
      case 'users': return renderUserResults();
      case 'bookings': return renderBookingResults();
      case 'expenses': return renderExpenseResults();
      default:
        return (
          <div>
            {searchResults.tours.length > 0 && (
              <Card className="mb-3">
                <Card.Header><h6>Tours ({searchResults.tours.length})</h6></Card.Header>
                <Card.Body className="p-0">{renderTourResults()}</Card.Body>
              </Card>
            )}
            {searchResults.destinations.length > 0 && (
              <Card className="mb-3">
                <Card.Header><h6>Destinations ({searchResults.destinations.length})</h6></Card.Header>
                <Card.Body className="p-0">{renderDestinationResults()}</Card.Body>
              </Card>
            )}
            {searchResults.users.length > 0 && (
              <Card className="mb-3">
                <Card.Header><h6>Users ({searchResults.users.length})</h6></Card.Header>
                <Card.Body className="p-0">{renderUserResults()}</Card.Body>
              </Card>
            )}
            {searchResults.bookings.length > 0 && (
              <Card className="mb-3">
                <Card.Header><h6>Bookings ({searchResults.bookings.length})</h6></Card.Header>
                <Card.Body className="p-0">{renderBookingResults()}</Card.Body>
              </Card>
            )}
            {searchResults.expenses.length > 0 && (
              <Card className="mb-3">
                <Card.Header><h6>Expenses ({searchResults.expenses.length})</h6></Card.Header>
                <Card.Body className="p-0">{renderExpenseResults()}</Card.Body>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaSearch className="me-2" />
          Global Search
          {getTotalResults() > 0 && (
            <Badge bg="secondary" className="ms-2">{getTotalResults()} results</Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid>
          {/* Search Input */}
          <Row className="mb-3">
            <Col>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search tours, destinations, users, bookings, expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-5"
                />
                {searchQuery && (
                  <Button
                    variant="link"
                    className="position-absolute top-50 end-0 translate-middle-y me-2 p-0"
                    onClick={handleClearSearch}
                  >
                    <FaTimes />
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          {/* Filters */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                <option value="spiritual">Spiritual</option>
                <option value="cultural">Cultural</option>
                <option value="adventure">Adventure</option>
                <option value="heritage">Heritage</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="">All Prices</option>
                <option value="0-10000">₹0 - ₹10,000</option>
                <option value="10000-25000">₹10,000 - ₹25,000</option>
                <option value="25000-50000">₹25,000 - ₹50,000</option>
                <option value="50000+">₹50,000+</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              >
                <option value="">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="this-month">This Month</option>
                <option value="next-month">Next Month</option>
                <option value="this-year">This Year</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Tab Navigation */}
          <Row className="mb-3">
            <Col>
              <div className="btn-group w-100" role="group">
                {['all', 'tours', 'destinations', 'users', 'bookings', 'expenses'].map(tab => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveTab(tab)}
                    className="text-capitalize"
                  >
                    {tab === 'all' ? 'All Results' : tab}
                    {tab !== 'all' && searchResults[tab]?.length > 0 && (
                      <Badge bg="light" text="dark" className="ms-2">
                        {searchResults[tab].length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>

          {/* Loading Spinner */}
          {loading && (
            <Row className="justify-content-center mb-3">
              <Col className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Searching...</span>
                </Spinner>
              </Col>
            </Row>
          )}

          {/* Results */}
          <Row>
            <Col>
              {searchQuery.length > 2 && !loading && getTotalResults() === 0 && (
                <div className="text-center text-muted py-5">
                  <FaSearch size={48} className="mb-3" />
                  <h5>No results found</h5>
                  <p>Try adjusting your search terms or filters</p>
                </div>
              )}
              
              {searchQuery.length <= 2 && (
                <div className="text-center text-muted py-5">
                  <FaSearch size={48} className="mb-3" />
                  <h5>Start searching</h5>
                  <p>Enter at least 3 characters to search</p>
                </div>
              )}

              {!loading && getTotalResults() > 0 && renderActiveTabContent()}
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SearchComponent;