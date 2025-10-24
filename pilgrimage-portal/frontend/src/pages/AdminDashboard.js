import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Badge, Nav, Tab } from 'react-bootstrap';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { FaUsers, FaRoute, FaMoneyBill, FaChartBar, FaPlus, FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaDownload } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTours: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingExpenses: 0,
    activeMembers: 0
  });

  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showTourModal, setShowTourModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [tourForm, setTourForm] = useState({
    name: '',
    description: '',
    destinations: '',
    startDate: '',
    endDate: '',
    price: '',
    maxParticipants: '',
    inclusions: '',
    exclusions: '',
    category: ''
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    isActive: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, toursRes, bookingsRes, expensesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/tours'),
        api.get('/admin/bookings'),
        api.get('/admin/expenses')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTours(toursRes.data);
      setBookings(bookingsRes.data);
      setExpenses(expensesRes.data);
      setPendingExpenses(expensesRes.data.filter(exp => exp.status === 'pending'));
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const handleTourSubmit = async (e) => {
    e.preventDefault();
    try {
      const tourData = {
        ...tourForm,
        destinations: tourForm.destinations.split(',').map(d => d.trim()),
        inclusions: tourForm.inclusions.split(',').map(i => i.trim()),
        exclusions: tourForm.exclusions.split(',').map(e => e.trim())
      };

      if (editingTour) {
        await api.put(`/admin/tours/${editingTour._id}`, tourData);
        setAlert({ type: 'success', message: 'Tour updated successfully' });
      } else {
        await api.post('/admin/tours', tourData);
        setAlert({ type: 'success', message: 'Tour created successfully' });
      }

      setShowTourModal(false);
      resetTourForm();
      fetchDashboardData();
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to save tour' });
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, userForm);
        setAlert({ type: 'success', message: 'User updated successfully' });
      } else {
        await api.post('/admin/users', userForm);
        setAlert({ type: 'success', message: 'User created successfully' });
      }

      setShowUserModal(false);
      resetUserForm();
      fetchDashboardData();
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to save user' });
    }
  };

  const handleExpenseApproval = async (expenseId, status) => {
    try {
      await api.put(`/admin/expenses/${expenseId}/approve`, { status });
      setAlert({ type: 'success', message: `Expense ${status} successfully` });
      fetchDashboardData();
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to update expense status' });
    }
  };

  const handleDeleteTour = async (tourId) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await api.delete(`/admin/tours/${tourId}`);
        setAlert({ type: 'success', message: 'Tour deleted successfully' });
        fetchDashboardData();
      } catch (error) {
        setAlert({ type: 'danger', message: 'Failed to delete tour' });
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setAlert({ type: 'success', message: 'User deleted successfully' });
        fetchDashboardData();
      } catch (error) {
        setAlert({ type: 'danger', message: 'Failed to delete user' });
      }
    }
  };

  const resetTourForm = () => {
    setTourForm({
      name: '', description: '', destinations: '', startDate: '', endDate: '',
      price: '', maxParticipants: '', inclusions: '', exclusions: '', category: ''
    });
    setEditingTour(null);
  };

  const resetUserForm = () => {
    setUserForm({ name: '', email: '', phone: '', role: 'member', isActive: true });
    setEditingUser(null);
  };

  const editTour = (tour) => {
    setTourForm({
      ...tour,
      startDate: tour.startDate ? new Date(tour.startDate).toISOString().split('T')[0] : '',
      endDate: tour.endDate ? new Date(tour.endDate).toISOString().split('T')[0] : '',
      destinations: tour.destinations ? tour.destinations.join(', ') : '',
      inclusions: tour.inclusions ? tour.inclusions.join(', ') : '',
      exclusions: tour.exclusions ? tour.exclusions.join(', ') : ''
    });
    setEditingTour(tour);
    setShowTourModal(true);
  };

  const editUser = (user) => {
    setUserForm(user);
    setEditingUser(user);
    setShowUserModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: 'success', pending: 'warning', cancelled: 'danger',
      completed: 'info', approved: 'success', rejected: 'danger'
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
    <Container fluid className="mt-4">
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowTourModal(true)}>
            <FaPlus /> Add Tour
          </Button>
          <Button variant="outline-success" onClick={() => setShowUserModal(true)}>
            <FaPlus /> Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers className="mb-2" size={24} color="#007bff" />
              <Card.Title>{stats.totalUsers}</Card.Title>
              <Card.Text>Total Users</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaRoute className="mb-2" size={24} color="#28a745" />
              <Card.Title>{stats.totalTours}</Card.Title>
              <Card.Text>Total Tours</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaChartBar className="mb-2" size={24} color="#ffc107" />
              <Card.Title>{stats.totalBookings}</Card.Title>
              <Card.Text>Total Bookings</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaMoneyBill className="mb-2" size={24} color="#17a2b8" />
              <Card.Title>₹{stats.totalRevenue?.toLocaleString()}</Card.Title>
              <Card.Text>Total Revenue</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaMoneyBill className="mb-2" size={24} color="#dc3545" />
              <Card.Title>{stats.pendingExpenses}</Card.Title>
              <Card.Text>Pending Expenses</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers className="mb-2" size={24} color="#6f42c1" />
              <Card.Title>{stats.activeMembers}</Card.Title>
              <Card.Text>Active Members</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabbed Interface */}
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="tours">Tours Management</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="users">Users Management</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="bookings">Bookings</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="expenses">Expense Approval</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Overview Tab */}
          <Tab.Pane eventKey="overview">
            <Row>
              <Col lg={8}>
                <Card className="mb-4">
                  <Card.Header><h5>Recent Bookings</h5></Card.Header>
                  <Card.Body>
                    <Table responsive striped hover>
                      <thead>
                        <tr><th>User</th><th>Tour</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 5).map(booking => (
                          <tr key={booking._id}>
                            <td>{booking.user?.name}</td>
                            <td>{booking.tour?.name}</td>
                            <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                            <td>₹{booking.totalAmount?.toLocaleString()}</td>
                            <td>{getStatusBadge(booking.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card>
                  <Card.Header><h6>Pending Expense Approvals</h6></Card.Header>
                  <Card.Body>
                    {pendingExpenses.slice(0, 5).map(expense => (
                      <div key={expense._id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div>
                          <strong>₹{expense.amount}</strong><br />
                          <small>{expense.description}</small>
                        </div>
                        <div>
                          <Button size="sm" variant="success" className="me-1"
                                  onClick={() => handleExpenseApproval(expense._id, 'approved')}>
                            <FaCheck />
                          </Button>
                          <Button size="sm" variant="danger"
                                  onClick={() => handleExpenseApproval(expense._id, 'rejected')}>
                            <FaTimes />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          {/* Tours Management Tab */}
          <Tab.Pane eventKey="tours">
            <Card>
              <Card.Header><h5>Tours Management</h5></Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr><th>Name</th><th>Destinations</th><th>Start Date</th><th>Price</th><th>Max Participants</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {tours.map(tour => (
                      <tr key={tour._id}>
                        <td>{tour.name}</td>
                        <td>{tour.destinations?.join(', ')}</td>
                        <td>{new Date(tour.startDate).toLocaleDateString()}</td>
                        <td>₹{tour.price?.toLocaleString()}</td>
                        <td>{tour.maxParticipants}</td>
                        <td>
                          <Button size="sm" variant="outline-info" className="me-1" onClick={() => editTour(tour)}>
                            <FaEdit />
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteTour(tour._id)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Users Management Tab */}
          <Tab.Pane eventKey="users">
            <Card>
              <Card.Header><h5>Users Management</h5></Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td><Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>{user.role}</Badge></td>
                        <td><Badge bg={user.isActive ? 'success' : 'secondary'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></td>
                        <td>
                          <Button size="sm" variant="outline-info" className="me-1" onClick={() => editUser(user)}>
                            <FaEdit />
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteUser(user._id)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Bookings Tab */}
          <Tab.Pane eventKey="bookings">
            <Card>
              <Card.Header><h5>All Bookings</h5></Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr><th>User</th><th>Tour</th><th>Booking Date</th><th>Tour Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking._id}>
                        <td>{booking.user?.name}</td>
                        <td>{booking.tour?.name}</td>
                        <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(booking.tour?.startDate).toLocaleDateString()}</td>
                        <td>₹{booking.totalAmount?.toLocaleString()}</td>
                        <td>{getStatusBadge(booking.status)}</td>
                        <td>
                          <Button size="sm" variant="outline-info">
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Expenses Tab */}
          <Tab.Pane eventKey="expenses">
            <Card>
              <Card.Header><h5>Expense Management</h5></Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr><th>User</th><th>Description</th><th>Amount</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense._id}>
                        <td>{expense.user?.name}</td>
                        <td>{expense.description}</td>
                        <td>₹{expense.amount?.toLocaleString()}</td>
                        <td>{expense.category}</td>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{getStatusBadge(expense.status)}</td>
                        <td>
                          {expense.status === 'pending' && (
                            <>
                              <Button size="sm" variant="success" className="me-1"
                                      onClick={() => handleExpenseApproval(expense._id, 'approved')}>
                                <FaCheck /> Approve
                              </Button>
                              <Button size="sm" variant="danger"
                                      onClick={() => handleExpenseApproval(expense._id, 'rejected')}>
                                <FaTimes /> Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Tour Modal */}
      <Modal show={showTourModal} onHide={() => {setShowTourModal(false); resetTourForm();}} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTour ? 'Edit' : 'Add'} Tour</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTourSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tour Name</Form.Label>
                  <Form.Control type="text" value={tourForm.name}
                               onChange={(e) => setTourForm({...tourForm, name: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={tourForm.category}
                              onChange={(e) => setTourForm({...tourForm, category: e.target.value})} required>
                    <option value="">Select Category</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="cultural">Cultural</option>
                    <option value="adventure">Adventure</option>
                    <option value="heritage">Heritage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={tourForm.description}
                           onChange={(e) => setTourForm({...tourForm, description: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Destinations (comma-separated)</Form.Label>
              <Form.Control type="text" value={tourForm.destinations}
                           onChange={(e) => setTourForm({...tourForm, destinations: e.target.value})} required />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control type="date" value={tourForm.startDate}
                               onChange={(e) => setTourForm({...tourForm, startDate: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control type="date" value={tourForm.endDate}
                               onChange={(e) => setTourForm({...tourForm, endDate: e.target.value})} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹)</Form.Label>
                  <Form.Control type="number" value={tourForm.price}
                               onChange={(e) => setTourForm({...tourForm, price: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants</Form.Label>
                  <Form.Control type="number" value={tourForm.maxParticipants}
                               onChange={(e) => setTourForm({...tourForm, maxParticipants: e.target.value})} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Inclusions (comma-separated)</Form.Label>
              <Form.Control type="text" value={tourForm.inclusions}
                           onChange={(e) => setTourForm({...tourForm, inclusions: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Exclusions (comma-separated)</Form.Label>
              <Form.Control type="text" value={tourForm.exclusions}
                           onChange={(e) => setTourForm({...tourForm, exclusions: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {setShowTourModal(false); resetTourForm();}}>Cancel</Button>
            <Button variant="primary" type="submit">{editingTour ? 'Update' : 'Create'} Tour</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => {setShowUserModal(false); resetUserForm();}}>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit' : 'Add'} User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUserSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={userForm.name}
                           onChange={(e) => setUserForm({...userForm, name: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={userForm.email}
                           onChange={(e) => setUserForm({...userForm, email: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" value={userForm.phone}
                           onChange={(e) => setUserForm({...userForm, phone: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={userForm.role}
                          onChange={(e) => setUserForm({...userForm, role: e.target.value})} required>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" checked={userForm.isActive}
                         onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                         label="Active User" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {setShowUserModal(false); resetUserForm();}}>Cancel</Button>
            <Button variant="primary" type="submit">{editingUser ? 'Update' : 'Create'} User</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;