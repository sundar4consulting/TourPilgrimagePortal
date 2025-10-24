import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Tab, Tabs, Badge, Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import PilgrimageAdminSidebar from '../components/PilgrimageAdminSidebar';
import { toursAPI, bookingsAPI, expensesAPI, type Tour, type Booking, type Expense } from '../services/api';
import './AdminDashboard.css';
import './PilgrimageAdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  
  // Determine initial tab based on URL
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/expenses')) return 'expenses';
    if (path.includes('/tours')) return 'tours';
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/approvals')) return 'approvals';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // State for data
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [showTourModal, setShowTourModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form data
  const [tourForm, setTourForm] = useState<Partial<Tour>>({
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
  
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
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

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [toursResponse, bookingsResponse, expensesResponse] = await Promise.all([
        toursAPI.getAll().catch(() => ({ data: [] })),
        bookingsAPI.getAll().catch(() => ({ data: [] })),
        expensesAPI.getAll().catch(() => ({ data: [] }))
      ]);
      
      setTours(Array.isArray(toursResponse.data) ? toursResponse.data : []);
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
      setExpenses(Array.isArray(expensesResponse.data) ? expensesResponse.data : []);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.pricing?.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeBookings = bookings.filter(booking => booking.status === 'confirmed').length;

  const toggleSidebar = () => {
    // On desktop: toggle minimized state
    // On mobile: toggle open/close state
    if (window.innerWidth >= 768) {
      setSidebarMinimized(!sidebarMinimized);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderHomeContent = () => (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h1 className="fade-in-up">Admin Dashboard</h1>
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
        </Col>
      </Row>

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
    </Container>
  );

  const renderToursContent = () => (
    <Container fluid>
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
    </Container>
  );

  const renderExpensesContent = () => (
    <Container fluid>
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
                <th>ID</th>
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
                  <td>{expense._id}</td>
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
    </Container>
  );

  const renderBookingsContent = () => (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <Button 
            variant="primary" 
            onClick={() => {
              // Will implement booking creation modal later
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
                <th>Email</th>
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
                  <td>N/A</td>
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
    </Container>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'tours':
        return renderToursContent();
      case 'expenses':
        return renderExpensesContent();
      case 'bookings':
        return renderBookingsContent();
      default:
        return renderHomeContent();
    }
  };

  // CRUD functions for Tours
  const handleSaveTour = async () => {
    try {
      setLoading(true);
      setError(null);
      if (editingTour) {
        await toursAPI.update(editingTour._id!, tourForm);
        setSuccess('Tour updated successfully!');
      } else {
        await toursAPI.create(tourForm as Omit<Tour, '_id'>);
        setSuccess('Tour created successfully!');
      }
      await fetchAllData();
      setShowTourModal(false);
      setEditingTour(null);
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
    } catch (err) {
      setError('Failed to save tour. Please try again.');
      console.error('Error saving tour:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        setLoading(true);
        setError(null);
        await toursAPI.delete(tourId);
        setSuccess('Tour deleted successfully!');
        await fetchAllData();
      } catch (err) {
        setError('Failed to delete tour. Please try again.');
        console.error('Error deleting tour:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // CRUD functions for Expenses
  const handleSaveExpense = async () => {
    try {
      setLoading(true);
      setError(null);
      if (editingExpense) {
        await expensesAPI.adminUpdate(editingExpense._id!, expenseForm);
        setSuccess('Expense updated successfully!');
      } else {
        const expenseData = {
          ...expenseForm,
          description: expenseForm.description || '',
          category: expenseForm.category || 'transportation',
          amount: expenseForm.amount || 0,
          expenseDate: expenseForm.expenseDate || new Date().toISOString().split('T')[0]
        } as Omit<Expense, '_id' | 'addedBy'>;
        await expensesAPI.adminCreate(expenseData);
        setSuccess('Expense created successfully!');
      }
      await fetchAllData();
      setShowExpenseModal(false);
      setEditingExpense(null);
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
    } catch (err) {
      setError('Failed to save expense. Please try again.');
      console.error('Error saving expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        setLoading(true);
        setError(null);
        await expensesAPI.adminDelete(expenseId);
        setSuccess('Expense deleted successfully!');
        await fetchAllData();
      } catch (err) {
        setError('Failed to delete expense. Please try again.');
        console.error('Error deleting expense:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApproveExpense = async (expenseId: string, isApproved: boolean) => {
    try {
      setLoading(true);
      setError(null);
      await expensesAPI.adminApprove(expenseId, isApproved);
      setSuccess(isApproved ? 'Expense approved successfully!' : 'Expense rejected successfully!');
      await fetchAllData();
    } catch (err) {
      setError('Failed to approve expense. Please try again.');
      console.error('Error approving expense:', err);
    } finally {
      setLoading(false);
    }
  };

  // CRUD functions for Bookings
  const handleApproveBooking = async (bookingId: string, status: string) => {
    try {
      setLoading(true);
      await bookingsAPI.updateStatus(bookingId, status);
      await fetchAllData();
    } catch (err) {
      setError('Failed to update booking status. Please try again.');
      console.error('Error updating booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        setLoading(true);
        await bookingsAPI.deleteBooking(bookingId);
        await fetchAllData();
      } catch (err) {
        setError('Failed to delete booking. Please try again.');
        console.error('Error deleting booking:', err);
      } finally {
        setLoading(false);
      }
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
        </Tab>

        {/* Tours Tab */}
        <Tab eventKey="tours" title="Tours">
          <Row className="mb-3">
            <Col>
              <Button 
                variant="primary" 
                onClick={() => {
                  setTourForm({
                    title: '',
                    description: '',
                    duration: { days: 0, nights: 0 },
                    pricing: { 
                      adult: 0,
                      child: 0,
                      senior: 0,
                      currency: 'INR'
                    },
                    maxParticipants: 0,
                    availableSeats: 0,
                    startDate: '',
                    endDate: '',
                    category: '',
                    difficulty: 'easy',
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
                    <th>ID</th>
                    <th>Name</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Available Seats</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map(tour => (
                    <tr key={tour._id}>
                      <td>{tour._id}</td>
                      <td>{tour.title}</td>
                      <td>{tour.duration?.days} days, {tour.duration?.nights} nights</td>
                      <td>₹{tour.pricing?.adult || 0}</td>
                      <td>{tour.availableSeats}</td>
                      <td>{tour.startDate ? new Date(tour.startDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{tour.endDate ? new Date(tour.endDate).toLocaleDateString() : 'N/A'}</td>
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
        </Tab>

        {/* Bookings Tab */}
        <Tab eventKey="bookings" title="Bookings">
          <Row className="mb-3">
            <Col>
              <Button 
                variant="primary" 
                onClick={() => {
                  // Will implement booking creation modal later
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
                    <th>Email</th>
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
                      <td>N/A</td>
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
        </Tab>

        {/* Expenses Tab */}
        <Tab eventKey="expenses" title="Expenses">
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
                    <th>ID</th>
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
                      <td>{expense._id}</td>
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
        </Tab>
      </Tabs>

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
                  <Form.Control
                    type="text"
                    value={tourForm.category || ''}
                    onChange={(e) => setTourForm({...tourForm, category: e.target.value})}
                    placeholder="e.g., pilgrimage, cultural"
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
            
            {/* Duration Section */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Days</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.duration?.days || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      duration: { 
                        ...tourForm.duration!, 
                        days: parseInt(e.target.value) || 0 
                      }
                    })}
                    placeholder="Number of days"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nights</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.duration?.nights || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      duration: { 
                        ...tourForm.duration!, 
                        nights: parseInt(e.target.value) || 0 
                      }
                    })}
                    placeholder="Number of nights"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Pricing Section */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Adult Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.pricing?.adult || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      pricing: { 
                        ...tourForm.pricing!, 
                        adult: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Adult price"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Child Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.pricing?.child || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      pricing: { 
                        ...tourForm.pricing!, 
                        child: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Child price"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Senior Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.pricing?.senior || 0}
                    onChange={(e) => setTourForm({
                      ...tourForm, 
                      pricing: { 
                        ...tourForm.pricing!, 
                        senior: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Senior price"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.maxParticipants || 0}
                    onChange={(e) => setTourForm({...tourForm, maxParticipants: parseInt(e.target.value) || 0})}
                    placeholder="Enter max participants"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Available Seats</Form.Label>
                  <Form.Control
                    type="number"
                    value={tourForm.availableSeats || ''}
                    onChange={(e) => setTourForm({...tourForm, availableSeats: parseInt(e.target.value) || 0})}
                    placeholder="Enter available seats"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={tourForm.startDate || ''}
                    onChange={(e) => setTourForm({...tourForm, startDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={tourForm.endDate || ''}
                    onChange={(e) => setTourForm({...tourForm, endDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty</Form.Label>
                  <Form.Select
                    value={tourForm.difficulty || 'easy'}
                    onChange={(e) => setTourForm({...tourForm, difficulty: e.target.value as 'easy' | 'moderate' | 'challenging'})}
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={tourForm.status || 'draft'}
                    onChange={(e) => setTourForm({...tourForm, status: e.target.value as 'draft' | 'published' | 'cancelled'})}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Featured Tour"
                checked={tourForm.featured || false}
                onChange={(e) => setTourForm({...tourForm, featured: e.target.checked})}
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
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={expenseForm.category || ''}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as 'transportation' | 'accommodation' | 'meals' | 'temple-donations' | 'guide-fees' | 'entrance-fees' | 'photography' | 'shopping' | 'medical' | 'emergency' | 'miscellaneous'})}
              >
                <option value="">Select category</option>
                <option value="transportation">Transportation</option>
                <option value="accommodation">Accommodation</option>
                <option value="meals">Meals</option>
                <option value="temple-donations">Temple Donations</option>
                <option value="guide-fees">Guide Fees</option>
                <option value="entrance-fees">Entrance Fees</option>
                <option value="photography">Photography</option>
                <option value="shopping">Shopping</option>
                <option value="medical">Medical</option>
                <option value="emergency">Emergency</option>
                <option value="miscellaneous">Miscellaneous</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={expenseForm.description || ''}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="Enter expense description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount (₹)</Form.Label>
              <Form.Control
                type="number"
                value={expenseForm.amount || ''}
                onChange={(e) => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})}
                placeholder="Enter amount"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={expenseForm.expenseDate || ''}
                onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Method</Form.Label>
                    <Form.Select
                      value={expenseForm.paymentMethod || 'cash'}
                      onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value as 'cash' | 'card' | 'upi' | 'netbanking' | 'other'})}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Receipt Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={expenseForm.receiptNumber || ''}
                    onChange={(e) => setExpenseForm({...expenseForm, receiptNumber: e.target.value})}
                    placeholder="Enter receipt number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={expenseForm.location?.name || ''}
                onChange={(e) => setExpenseForm({
                  ...expenseForm, 
                  location: { name: e.target.value, address: expenseForm.location?.address || '' }
                })}
                placeholder="Enter location name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vendor Name</Form.Label>
              <Form.Control
                type="text"
                value={expenseForm.vendor?.name || ''}
                onChange={(e) => setExpenseForm({
                  ...expenseForm, 
                  vendor: { name: e.target.value, contact: expenseForm.vendor?.contact, address: expenseForm.vendor?.address }
                })}
                placeholder="Enter vendor name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vendor Contact</Form.Label>
              <Form.Control
                type="text"
                value={expenseForm.vendor?.contact || ''}
                onChange={(e) => setExpenseForm({
                  ...expenseForm, 
                  vendor: { name: expenseForm.vendor?.name || '', contact: e.target.value, address: expenseForm.vendor?.address }
                })}
                placeholder="Enter vendor contact"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={expenseForm.notes || ''}
                onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                placeholder="Additional notes (optional)"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Related Tour (Optional)</Form.Label>
              <Form.Select
                value={expenseForm.tour as string || ''}
                onChange={(e) => setExpenseForm({...expenseForm, tour: e.target.value || undefined})}
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
    </Container>
  );
};

export default AdminDashboard;
