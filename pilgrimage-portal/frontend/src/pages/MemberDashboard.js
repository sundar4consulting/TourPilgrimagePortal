import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCalendar, FaUsers, FaMoneyBill, FaUser } from 'react-icons/fa';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tours, setTours] = useState([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showTourInterestModal, setShowTourInterestModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingTours: 0,
    totalExpenses: 0,
    familyMembers: 0
  });

  const [familyForm, setFamilyForm] = useState({
    name: '',
    relationship: '',
    age: '',
    contact: ''
  });

  const [tourInterestForm, setTourInterestForm] = useState({
    tourId: '',
    familyMembers: [],
    specialRequests: '',
    preferredDates: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, familyRes, expensesRes, toursRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/auth/family-members'),
        api.get('/expenses/my-expenses'),
        api.get('/tours')
      ]);

      setBookings(bookingsRes.data);
      setFamilyMembers(familyRes.data);
      setExpenses(expensesRes.data);
      setTours(toursRes.data);

      // Calculate stats
      setStats({
        totalBookings: bookingsRes.data.length,
        upcomingTours: bookingsRes.data.filter(b => new Date(b.tour.startDate) > new Date()).length,
        totalExpenses: expensesRes.data.reduce((sum, exp) => sum + exp.amount, 0),
        familyMembers: familyRes.data.length
      });
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFamily = async (e) => {
    e.preventDefault();
    try {
      if (editingFamily) {
        await api.put(`/auth/family-members/${editingFamily._id}`, familyForm);
        setAlert({ type: 'success', message: 'Family member updated successfully' });
      } else {
        await api.post('/auth/family-members', familyForm);
        setAlert({ type: 'success', message: 'Family member added successfully' });
      }
      setShowFamilyModal(false);
      setFamilyForm({ name: '', relationship: '', age: '', contact: '' });
      setEditingFamily(null);
      fetchDashboardData();
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to save family member' });
    }
  };

  const handleDeleteFamily = async (id) => {
    if (window.confirm('Are you sure you want to delete this family member?')) {
      try {
        await api.delete(`/auth/family-members/${id}`);
        setAlert({ type: 'success', message: 'Family member deleted successfully' });
        fetchDashboardData();
      } catch (error) {
        setAlert({ type: 'danger', message: 'Failed to delete family member' });
      }
    }
  };

  const handleTourInterest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tours/express-interest', tourInterestForm);
      setAlert({ type: 'success', message: 'Tour interest submitted successfully' });
      setShowTourInterestModal(false);
      setTourInterestForm({ tourId: '', familyMembers: [], specialRequests: '', preferredDates: '' });
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to submit tour interest' });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: 'success',
      pending: 'warning',
      cancelled: 'danger',
      completed: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Welcome, {user?.name}!</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowFamilyModal(true)}>
            <FaPlus /> Add Family Member
          </Button>
          <Button variant="outline-success" onClick={() => setShowTourInterestModal(true)}>
            <FaCalendar /> Express Tour Interest
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaCalendar className="mb-2" size={24} color="#007bff" />
              <Card.Title>{stats.totalBookings}</Card.Title>
              <Card.Text>Total Bookings</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaEye className="mb-2" size={24} color="#28a745" />
              <Card.Title>{stats.upcomingTours}</Card.Title>
              <Card.Text>Upcoming Tours</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaMoneyBill className="mb-2" size={24} color="#ffc107" />
              <Card.Title>₹{stats.totalExpenses.toLocaleString()}</Card.Title>
              <Card.Text>Total Expenses</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaUsers className="mb-2" size={24} color="#6f42c1" />
              <Card.Title>{stats.familyMembers}</Card.Title>
              <Card.Text>Family Members</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Recent Bookings */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5><FaCalendar /> My Bookings</h5>
            </Card.Header>
            <Card.Body>
              {bookings.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Tour</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map(booking => (
                      <tr key={booking._id}>
                        <td>{booking.tour?.name}</td>
                        <td>{new Date(booking.tour?.startDate).toLocaleDateString()}</td>
                        <td>{getStatusBadge(booking.status)}</td>
                        <td>₹{booking.totalAmount?.toLocaleString()}</td>
                        <td>
                          <Button size="sm" variant="outline-info">
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No bookings found. <a href="/tours">Explore tours</a> to make your first booking!</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Family Members */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h6><FaUsers /> Family Members</h6>
            </Card.Header>
            <Card.Body>
              {familyMembers.length > 0 ? (
                familyMembers.map(member => (
                  <div key={member._id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <strong>{member.name}</strong>
                      <br />
                      <small className="text-muted">{member.relationship}, Age: {member.age}</small>
                    </div>
                    <div>
                      <Button size="sm" variant="outline-warning" className="me-1" 
                              onClick={() => {setEditingFamily(member); setFamilyForm(member); setShowFamilyModal(true);}}>
                        <FaEdit />
                      </Button>
                      <Button size="sm" variant="outline-danger" 
                              onClick={() => handleDeleteFamily(member._id)}>
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No family members added yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Expenses */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5><FaMoneyBill /> Recent Expenses</h5>
            </Card.Header>
            <Card.Body>
              {expenses.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 5).map(expense => (
                      <tr key={expense._id}>
                        <td>{expense.description}</td>
                        <td>₹{expense.amount?.toLocaleString()}</td>
                        <td>{expense.category}</td>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{getStatusBadge(expense.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No expenses recorded yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Family Member Modal */}
      <Modal show={showFamilyModal} onHide={() => {setShowFamilyModal(false); setEditingFamily(null); setFamilyForm({ name: '', relationship: '', age: '', contact: '' });}}>
        <Modal.Header closeButton>
          <Modal.Title>{editingFamily ? 'Edit' : 'Add'} Family Member</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddFamily}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={familyForm.name} 
                          onChange={(e) => setFamilyForm({...familyForm, name: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Relationship</Form.Label>
              <Form.Select value={familyForm.relationship} 
                          onChange={(e) => setFamilyForm({...familyForm, relationship: e.target.value})} required>
                <option value="">Select Relationship</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Age</Form.Label>
              <Form.Control type="number" value={familyForm.age} 
                          onChange={(e) => setFamilyForm({...familyForm, age: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact (Optional)</Form.Label>
              <Form.Control type="text" value={familyForm.contact} 
                          onChange={(e) => setFamilyForm({...familyForm, contact: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFamilyModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editingFamily ? 'Update' : 'Add'} Family Member</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Tour Interest Modal */}
      <Modal show={showTourInterestModal} onHide={() => setShowTourInterestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Express Tour Interest</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTourInterest}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Tour</Form.Label>
              <Form.Select value={tourInterestForm.tourId} 
                          onChange={(e) => setTourInterestForm({...tourInterestForm, tourId: e.target.value})} required>
                <option value="">Choose a tour...</option>
                {tours.map(tour => (
                  <option key={tour._id} value={tour._id}>{tour.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Family Members (hold Ctrl/Cmd for multiple)</Form.Label>
              <Form.Select multiple value={tourInterestForm.familyMembers} 
                          onChange={(e) => setTourInterestForm({...tourInterestForm, familyMembers: Array.from(e.target.selectedOptions, option => option.value)})}>
                {familyMembers.map(member => (
                  <option key={member._id} value={member._id}>{member.name} ({member.relationship})</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Optional: Select family members who will join</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Preferred Dates</Form.Label>
              <Form.Control type="text" value={tourInterestForm.preferredDates} 
                          onChange={(e) => setTourInterestForm({...tourInterestForm, preferredDates: e.target.value})} 
                          placeholder="e.g., December 2024 or specific dates" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Special Requests</Form.Label>
              <Form.Control as="textarea" rows={3} value={tourInterestForm.specialRequests} 
                          onChange={(e) => setTourInterestForm({...tourInterestForm, specialRequests: e.target.value})} 
                          placeholder="Any special requirements or requests..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTourInterestModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Interest</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MemberDashboard;