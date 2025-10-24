import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import PilgrimageAdminSidebar from '../components/PilgrimageAdminSidebar';
import api from '../services/api';
import AccommodationsPage from './AccommodationsPage';
import ApprovalsPage from './ApprovalsPage';
import AnalyticsPage from './AnalyticsPage';
import MiscPage from './MiscPage';

interface Tour {
  _id?: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: {
    days: number;
    nights: number;
  };
  pricing: {
    adult: number;
    child: number;
    senior: number;
    currency: string;
  };
  category: string;
  difficulty: string;
  featured: boolean;
  destinations: string[];
  maxParticipants: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface Booking {
  _id?: string;
  bookingId: string;
  tour: Tour | string;
  participants?: Array<{ name: string; age: number; gender: string }>;
  totalParticipants: number;
  pricing?: {
    adult: number;
    child: number;
    senior: number;
    total: number;
  };
  status: string;
  bookingDate?: string;
}

interface Expense {
  _id?: string;
  tour: Tour | string;
  addedBy: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  location: {
    name: string;
    address: string;
  };
  vendor: {
    name: string;
    contact: string;
    address: string;
  };
  paymentMethod: string;
  receiptNumber: string;
  isApproved: boolean;
  notes: string;
}

const AdminDashboard: React.FC = () => {
  // States
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showTourModal, setShowTourModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [tourForm, setTourForm] = useState<Tour>({
    title: '',
    description: '',
    shortDescription: '',
    duration: { days: 0, nights: 0 },
    pricing: { adult: 0, child: 0, senior: 0, currency: 'INR' },
    category: 'pilgrimage',
    difficulty: 'easy',
    featured: false,
    destinations: [],
    maxParticipants: 0,
    startDate: '',
    endDate: '',
    status: 'draft'
  });

  const [expenseForm, setExpenseForm] = useState<Expense>({
    tour: '',
    addedBy: '',
    category: 'transportation',
    description: '',
    amount: 0,
    expenseDate: '',
    location: { name: '', address: '' },
    vendor: { name: '', contact: '', address: '' },
    paymentMethod: 'cash',
    receiptNumber: '',
    isApproved: false,
    notes: ''
  });

  // Sidebar handlers
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleTabChange = (tab: string) => setActiveTab(tab);

  // Calculated values
  const activeBookings = bookings.filter(booking => booking.status === 'confirmed').length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.pricing?.total || 0), 0);
  const totalExpenses = expenses.filter(expense => expense.isApproved).reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toursResponse, bookingsResponse, expensesResponse] = await Promise.all([
        api.get('/api/tours'),
        api.get('/api/bookings'),
        api.get('/api/expenses')
      ]);
      
      setTours(toursResponse.data || []);
      setBookings(bookingsResponse.data || []);
      setExpenses(expensesResponse.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Tour handlers
  const handleSaveTour = async () => {
    try {
      if (editingTour) {
        await api.put(`/api/tours/${editingTour._id}`, tourForm);
        setSuccess('Tour updated successfully');
      } else {
        await api.post('/api/tours', tourForm);
        setSuccess('Tour created successfully');
      }
      setShowTourModal(false);
      loadData();
    } catch (error: any) {
      setError('Failed to save tour');
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await api.delete(`/api/tours/${tourId}`);
        setSuccess('Tour deleted successfully');
        loadData();
      } catch (error: any) {
        setError('Failed to delete tour');
      }
    }
  };

  // Booking handlers
  const handleApproveBooking = async (bookingId: string, status: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}`, { status });
      setSuccess(`Booking ${status} successfully`);
      loadData();
    } catch (error: any) {
      setError(`Failed to ${status} booking`);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/api/bookings/${bookingId}`);
        setSuccess('Booking deleted successfully');
        loadData();
      } catch (error: any) {
        setError('Failed to delete booking');
      }
    }
  };

  // Expense handlers
  const handleSaveExpense = async () => {
    try {
      if (editingExpense) {
        await api.put(`/api/expenses/${editingExpense._id}`, expenseForm);
        setSuccess('Expense updated successfully');
      } else {
        await api.post('/api/expenses', expenseForm);
        setSuccess('Expense created successfully');
      }
      setShowExpenseModal(false);
      loadData();
    } catch (error: any) {
      setError('Failed to save expense');
    }
  };

  const handleApproveExpense = async (expenseId: string, isApproved: boolean) => {
    try {
      await api.put(`/api/expenses/${expenseId}`, { isApproved });
      setSuccess(`Expense ${isApproved ? 'approved' : 'rejected'} successfully`);
      loadData();
    } catch (error: any) {
      setError(`Failed to ${isApproved ? 'approve' : 'reject'} expense`);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/api/expenses/${expenseId}`);
        setSuccess('Expense deleted successfully');
        loadData();
      } catch (error: any) {
        setError('Failed to delete expense');
      }
    }
  };

  // Content renderers
  const renderHomeContent = () => (
    <div className="pilgrimage-dashboard-content">
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center stats-card">
            <Card.Body>
              <Card.Title>Total Tours</Card.Title>
              <h2 className="text-primary">{tours.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center stats-card">
            <Card.Body>
              <Card.Title>Active Bookings</Card.Title>
              <h2 className="text-success">{activeBookings}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center stats-card">
            <Card.Body>
              <Card.Title>Total Revenue</Card.Title>
              <h2 className="text-info">₹{totalRevenue.toLocaleString()}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center stats-card">
            <Card.Body>
              <Card.Title>Net Profit</Card.Title>
              <h2 className={netProfit >= 0 ? "text-success" : "text-danger"}>
                ₹{netProfit.toLocaleString()}
              </h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="recent-card">
            <Card.Header>Recent Bookings</Card.Header>
            <Card.Body>
              {bookings.slice(0, 5).map(booking => (
                <div key={booking._id} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{booking.bookingId}</strong>
                    <br />
                    <small className="text-muted">₹{booking.pricing?.total || 0}</small>
                  </div>
                  <Badge bg={booking.status === 'confirmed' ? 'success' : 'warning'}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="recent-card">
            <Card.Header>Recent Expenses</Card.Header>
            <Card.Body>
              {expenses.slice(0, 5).map(expense => (
                <div key={expense._id} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{expense.category}</strong>
                    <br />
                    <small className="text-muted">{expense.description}</small>
                  </div>
                  <span className="text-danger">₹{expense.amount}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderToursContent = () => (
    <div className="pilgrimage-dashboard-content">
      <Row className="mb-3">
        <Col>
          <Button 
            variant="primary" 
            onClick={() => {
              setTourForm({
                title: '',
                description: '',
                shortDescription: '',
                duration: { days: 0, nights: 0 },
                pricing: { adult: 0, child: 0, senior: 0, currency: 'INR' },
                category: 'pilgrimage',
                difficulty: 'easy',
                featured: false,
                destinations: [],
                maxParticipants: 0,
                startDate: '',
                endDate: '',
                status: 'draft'
              });
              setEditingTour(null);
              setShowTourModal(true);
            }}
          >
            Add New Tour
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Duration</th>
                <th>Price (Adult)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour._id}>
                  <td>{tour.title}</td>
                  <td>{tour.duration.days}D/{tour.duration.nights}N</td>
                  <td>₹{tour.pricing.adult}</td>
                  <td>
                    <Badge bg={tour.status === 'published' ? 'success' : tour.status === 'draft' ? 'warning' : 'danger'}>
                      {tour.status}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => {
                        setEditingTour(tour);
                        setTourForm(tour);
                        setShowTourModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteTour(tour._id!)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </div>
  );

  const renderBookingsContent = () => (
    <div className="pilgrimage-dashboard-content">
      <Row className="mb-3">
        <Col>
          <Button 
            variant="primary" 
            onClick={() => {
              alert('Booking creation modal will be implemented');
            }}
          >
            Add New Booking
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Tour</th>
                <th>People</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Travel Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.bookingId}</td>
                  <td>{booking.participants?.[0]?.name || 'N/A'}</td>
                  <td>{typeof booking.tour === 'object' ? booking.tour.title : 'N/A'}</td>
                  <td>{booking.totalParticipants}</td>
                  <td>₹{booking.pricing?.total || 0}</td>
                  <td>
                    <Badge bg={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'danger'}>
                      {booking.status}
                    </Badge>
                  </td>
                  <td>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {booking.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleApproveBooking(booking._id!, 'confirmed')}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleApproveBooking(booking._id!, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteBooking(booking._id!)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </div>
  );

  const renderExpensesContent = () => (
    <div className="pilgrimage-dashboard-content">
      <Row className="mb-3">
        <Col>
          <Button 
            variant="primary" 
            onClick={() => {
              setExpenseForm({
                tour: '',
                addedBy: '',
                category: 'transportation',
                description: '',
                amount: 0,
                expenseDate: '',
                location: { name: '', address: '' },
                vendor: { name: '', contact: '', address: '' },
                paymentMethod: 'cash',
                receiptNumber: '',
                isApproved: false,
                notes: ''
              });
              setEditingExpense(null);
              setShowExpenseModal(true);
            }}
          >
            Add New Expense
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Tour</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense._id}>
                  <td>{expense.category}</td>
                  <td>{expense.description}</td>
                  <td>₹{expense.amount}</td>
                  <td>{expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{typeof expense.tour === 'object' ? expense.tour.title : 'General'}</td>
                  <td>
                    <Badge bg={expense.isApproved ? 'success' : 'warning'}>
                      {expense.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </td>
                  <td>
                    {!expense.isApproved && (
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleApproveExpense(expense._id!, true)}
                      >
                        Approve
                      </Button>
                    )}
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => {
                        setEditingExpense(expense);
                        setExpenseForm(expense);
                        setShowExpenseModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteExpense(expense._id!)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    console.log('Current activeTab:', activeTab); // Debug log
    switch (activeTab) {
      case 'home':
      case 'overview':
        return renderHomeContent();
      case 'tours':
        return renderToursContent();
      case 'bookings':
        return renderBookingsContent();
      case 'expenses':
        return renderExpensesContent();
      case 'accommodations':
        return <AccommodationsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'misc':
        console.log('Rendering MiscPage'); // Debug log
        return <MiscPage />;
      default:
        console.log('Default case - rendering home'); // Debug log
        return renderHomeContent();
    }
  };

  if (loading) {
    return (
      <div className="pilgrimage-loading">
        <div className="pilgrimage-spinner">
          <i className="fas fa-om fa-spin"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="pilgrimage-admin-layout">
      <PilgrimageAdminSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isMinimized={sidebarMinimized}
      />
      
      <div className={`pilgrimage-main-content ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarMinimized ? 'sidebar-minimized' : ''}`}>
        {/* Top Navigation Bar */}
        <nav className="pilgrimage-topbar">
          <div className="pilgrimage-topbar-content">
            {/* Mobile Menu Button */}
            <Button
              variant="link"
              className="pilgrimage-mobile-toggle d-md-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Open Menu"
            >
              <i className="fas fa-bars"></i>
            </Button>
            
            <h1 className="pilgrimage-page-title">
              Sri Vishnu Chitra - Admin Dashboard
            </h1>
            <div className="pilgrimage-topbar-actions">
              <Button 
                variant="link" 
                className="pilgrimage-notification-btn me-2"
                onClick={() => window.location.reload()}
                title="Refresh Data"
              >
                <i className="fas fa-sync-alt"></i>
              </Button>
              <Button variant="link" className="pilgrimage-notification-btn">
                <i className="fas fa-bell"></i>
                <span className="pilgrimage-notification-badge">3</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="pilgrimage-content-area">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          {renderContent()}
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="pilgrimage-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Tour Modal */}
      <Modal show={showTourModal} onHide={() => setShowTourModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTour ? 'Edit Tour' : 'Add New Tour'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tour Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={tourForm.title || ''}
                    onChange={(e) => setTourForm({...tourForm, title: e.target.value})}
                    placeholder="Enter tour title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={tourForm.category || ''}
                    onChange={(e) => setTourForm({...tourForm, category: e.target.value})}
                  >
                    <option value="pilgrimage">Pilgrimage</option>
                    <option value="cultural">Cultural</option>
                    <option value="adventure">Adventure</option>
                    <option value="heritage">Heritage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Days</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.duration?.days || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      duration: { ...tourForm.duration, days: parseInt(e.target.value) }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nights</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.duration?.nights || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      duration: { ...tourForm.duration, nights: parseInt(e.target.value) }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.maxParticipants || 0}
                    onChange={(e) => setTourForm({...tourForm, maxParticipants: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Adult Price</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.pricing?.adult || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      pricing: { ...tourForm.pricing, adult: parseFloat(e.target.value) }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Child Price</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.pricing?.child || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      pricing: { ...tourForm.pricing, child: parseFloat(e.target.value) }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Senior Price</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.pricing?.senior || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      pricing: { ...tourForm.pricing, senior: parseFloat(e.target.value) }
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tourForm.description || ''}
                onChange={(e) => setTourForm({...tourForm, description: e.target.value})}
                placeholder="Enter tour description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Short Description</Form.Label>
              <Form.Control
                type="text"
                value={tourForm.shortDescription || ''}
                onChange={(e) => setTourForm({...tourForm, shortDescription: e.target.value})}
                placeholder="Enter short description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTourModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveTour}>
            {editingTour ? 'Update Tour' : 'Add Tour'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Expense Modal */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={expenseForm.category || ''}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    <option value="transportation">Transportation</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="food">Food & Meals</option>
                    <option value="activities">Activities</option>
                    <option value="guides">Guide Services</option>
                    <option value="permits">Permits & Fees</option>
                    <option value="equipment">Equipment</option>
                    <option value="emergency">Emergency</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="number"
                    value={expenseForm.amount || 0}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})}
                    placeholder="Enter amount"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={expenseForm.description || ''}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="Enter expense description"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expense Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={expenseForm.expenseDate || ''}
                    onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    value={expenseForm.paymentMethod || ''}
                    onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Associated Tour (Optional)</Form.Label>
              <Form.Select
                value={typeof expenseForm.tour === 'string' ? expenseForm.tour : ''}
                onChange={(e) => setExpenseForm({...expenseForm, tour: e.target.value})}
              >
                <option value="">Select tour (optional)</option>
                {tours.map(tour => (
                  <option key={tour._id} value={tour._id}>{tour.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveExpense}>
            {editingExpense ? 'Update Expense' : 'Add Expense'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;