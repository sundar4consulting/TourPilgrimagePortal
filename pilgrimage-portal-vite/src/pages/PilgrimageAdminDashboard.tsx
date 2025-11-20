import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import PilgrimageAdminSidebar from '../components/PilgrimageAdminSidebar';
import AccommodationsPage from './AccommodationsPage';
import MemberContactsPage from './MemberContactsPage';
import MiscPage from './MiscPage';
import ExpensesPage from './ExpensesPage';
import { toursAPI, bookingsAPI, expensesAPI, authAPI, type Tour, type Booking, type Expense, type User } from '../services/api';
import './PilgrimageAdminDashboard.css';

const PilgrimageAdminDashboard: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine initial tab based on URL
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/expenses')) return 'expenses';
    if (path.includes('/tours')) return 'tours';
    if (path.includes('/accommodations')) return 'accommodations';
    if (path.includes('/member-contacts')) return 'member-contacts';
    if (path.includes('/misc')) return 'misc';
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/approvals')) return 'approvals';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [currentTourIndex, setCurrentTourIndex] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFamilyMemberModal, setShowFamilyMemberModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [selectedBookingForFamily, setSelectedBookingForFamily] = useState<any>(null);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Form states (without _id for new items)
  const [expenseForm, setExpenseForm] = useState<any>({
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

  const [tourForm, setTourForm] = useState<any>({
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

  const [familyMemberForm, setFamilyMemberForm] = useState<any>({
    name: '',
    age: 0,
    aadhar: '',
    relation: '',
    priceCategory: 'adult'
  });

  const [newBookingForm, setNewBookingForm] = useState<any>({
    tourId: '',
    userId: '',
    participants: [
      {
        name: '',
        age: 0,
        aadhar: '',
        relation: 'self',
        priceCategory: 'adult'
      }
    ],
    specialRequests: '',
    autoApprove: false
  });

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers(); // This should be added to the API
      setUsers(response.data || []);
            // Load users for booking form
        fetchUsers();
        
      } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching dashboard data...');
        
        const [toursResponse, bookingsResponse, expensesResponse] = await Promise.all([
          toursAPI.getAll({ limit: 100 }), // Get more tours for better stats
          bookingsAPI.getAll(),
          expensesAPI.getAll()
        ]);
        
        console.log('API Responses:', {
          tours: toursResponse.data,
          bookings: bookingsResponse.data,
          expenses: expensesResponse.data
        });
        
        // Handle tours response - it returns paginated data
        if (toursResponse.data && toursResponse.data.tours) {
          setTours(toursResponse.data.tours);
        } else {
          setTours([]);
        }
        
        // Handle bookings response - it returns array directly
        if (bookingsResponse.data && Array.isArray(bookingsResponse.data)) {
          setBookings(bookingsResponse.data);
        } else {
          setBookings([]);
        }
        
        // Handle expenses response - it returns array directly
        if (expensesResponse.data && Array.isArray(expensesResponse.data)) {
          setExpenses(expensesResponse.data);
        } else {
          setExpenses([]);
        }
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        
        let errorMessage = 'Failed to load dashboard data. ';
        
        if (error.name === 'NetworkError' || error.code === 'ERR_NETWORK') {
          errorMessage += 'Please ensure the backend server is running on port 5000.';
        } else if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
        } else {
          errorMessage += 'Please try again later.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tour carousel effect - cycle through tours every 5 seconds
  useEffect(() => {
    if (tours.length > 0) {
      const interval = setInterval(() => {
        setCurrentTourIndex((prevIndex) => (prevIndex + 1) % tours.length);
      }, 5000); // 5 seconds interval

      return () => clearInterval(interval);
    }
  }, [tours.length]);

  // Calculate statistics with better handling
  const stats = {
    totalRevenue: bookings.reduce((sum, booking) => {
      if (booking.pricing && typeof booking.pricing === 'object' && booking.pricing.total) {
        return sum + booking.pricing.total;
      }
      return sum;
    }, 0),
    totalBookings: bookings.length,
    activeTours: tours.filter(tour => tour.status === 'published').length,
    totalExpenses: expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    pendingApprovals: bookings.filter(booking => 
      booking.status === 'interested' || 
      booking.paymentStatus === 'pending'
    ).length,
    confirmedBookings: bookings.filter(booking => booking.status === 'confirmed').length,
    paidBookings: bookings.filter(booking => booking.paymentStatus === 'paid').length,
    monthlyGrowth: bookings.length > 0 ? 
      Math.round(((bookings.filter(b => new Date(b.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length) / bookings.length * 100)) : 0
  };

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

  // Data refresh function
  const refreshData = async () => {
    try {
      const [toursResponse, bookingsResponse, expensesResponse] = await Promise.all([
        toursAPI.getAll({ limit: 100 }),
        bookingsAPI.getAll(),
        expensesAPI.getAll()
      ]);
      
      if (toursResponse.data?.tours && Array.isArray(toursResponse.data.tours)) {
        setTours(toursResponse.data.tours);
      }
      if (bookingsResponse.data && Array.isArray(bookingsResponse.data)) {
        setBookings(bookingsResponse.data);
      }
      if (expensesResponse.data && Array.isArray(expensesResponse.data)) {
        setExpenses(expensesResponse.data);
      }
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    }
  };

  // Expense CRUD handlers
  const handleSaveExpense = async () => {
    try {
      if (editingExpense) {
        await expensesAPI.update(editingExpense._id, expenseForm);
        setSuccess('Expense updated successfully');
      } else {
        await expensesAPI.create(expenseForm);
        setSuccess('Expense created successfully');
      }
      setShowExpenseModal(false);
      refreshData();
    } catch (error: any) {
      setError('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesAPI.delete(expenseId);
        setSuccess('Expense deleted successfully');
        refreshData();
      } catch (error: any) {
        setError('Failed to delete expense');
      }
    }
  };

  const handleApproveExpense = async (expenseId: string, isApproved: boolean) => {
    try {
      await expensesAPI.update(expenseId, { isApproved });
      setSuccess(`Expense ${isApproved ? 'approved' : 'rejected'} successfully`);
      refreshData();
    } catch (error: any) {
      setError(`Failed to ${isApproved ? 'approve' : 'reject'} expense`);
    }
  };

  // Tour CRUD handlers
  const handleSaveTour = async () => {
    try {
      if (editingTour) {
        await toursAPI.update(editingTour._id, tourForm);
        setSuccess('Tour updated successfully');
      } else {
        await toursAPI.create(tourForm);
        setSuccess('Tour created successfully');
      }
      setShowTourModal(false);
      refreshData();
    } catch (error: any) {
      setError('Failed to save tour');
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await toursAPI.delete(tourId);
        setSuccess('Tour deleted successfully');
        refreshData();
      } catch (error: any) {
        setError('Failed to delete tour');
      }
    }
  };

  // Booking CRUD handlers
  const handleApproveBooking = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'interested' | 'paid') => {
    try {
      await bookingsAPI.updateStatus(bookingId, status);
      setSuccess(`Booking ${status} successfully`);
      refreshData();
    } catch (error: any) {
      setError(`Failed to ${status} booking`);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingsAPI.deleteBooking(bookingId);
        setSuccess('Booking deleted successfully');
        refreshData();
      } catch (error: any) {
        setError('Failed to delete booking');
      }
    }
  };

  const handleAddFamilyMember = async () => {
    if (!selectedBookingForFamily) return;
    
    try {
      // The API expects an array of participants to add
      const participantsToAdd = [familyMemberForm];
      await bookingsAPI.addFamilyMember(selectedBookingForFamily._id, participantsToAdd);
      setSuccess('Family member added successfully');
      setShowFamilyMemberModal(false);
      setFamilyMemberForm({
        name: '',
        age: 0,
        aadhar: '',
        relation: '',
        priceCategory: 'adult'
      });
      refreshData();
    } catch (error: any) {
      setError('Failed to add family member');
    }
  };

  const handleSaveNewBooking = async () => {
    try {
      const bookingData = {
        userId: newBookingForm.userId,
        tourId: newBookingForm.tourId,
        participants: newBookingForm.participants,
        specialRequests: newBookingForm.specialRequests,
        autoApprove: newBookingForm.autoApprove
      };
      
      await bookingsAPI.createForUser(bookingData);
      setSuccess('Booking created successfully');
      setShowAddBookingModal(false);
      setNewBookingForm({
        tourId: '',
        userId: '',
        participants: [
          {
            name: '',
            age: 0,
            aadhar: '',
            relation: 'self',
            priceCategory: 'adult'
          }
        ],
        specialRequests: '',
        autoApprove: false
      });
      refreshData();
    } catch (error: any) {
      setError('Failed to create booking');
    }
  };

  const addParticipantToBooking = () => {
    setNewBookingForm({
      ...newBookingForm,
      participants: [
        ...newBookingForm.participants,
        {
          name: '',
          age: 0,
          aadhar: '',
          relation: '',
          priceCategory: 'adult'
        }
      ]
    });
  };

  const removeParticipantFromBooking = (index: number) => {
    if (newBookingForm.participants.length > 1) {
      const updatedParticipants = newBookingForm.participants.filter((_: any, i: number) => i !== index);
      setNewBookingForm({
        ...newBookingForm,
        participants: updatedParticipants
      });
    }
  };

  const updateParticipant = (index: number, field: string, value: any) => {
    const updatedParticipants = [...newBookingForm.participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value
    };
    setNewBookingForm({
      ...newBookingForm,
      participants: updatedParticipants
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'expenses':
        return <ExpensesPage />;
      case 'tours':
        return renderToursContent();
      case 'accommodations':
        return <AccommodationsPage />;
      case 'member-contacts':
        return <MemberContactsPage />;
      case 'misc':
        return <MiscPage />;
      case 'bookings':
        return renderBookingsContent();
      case 'analytics':
        return renderAnalyticsContent();
      case 'approvals':
        return renderApprovalsContent();
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Statistics Cards */}
      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <Card className="pilgrimage-stat-card pilgrimage-card-revenue">
            <Card.Body>
              <div className="pilgrimage-stat-content">
                <div className="pilgrimage-stat-icon">
                  <i className="fas fa-rupee-sign"></i>
                </div>
                <div className="pilgrimage-stat-details">
                  <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
                  <p>Total Revenue</p>
                  <span className="pilgrimage-stat-trend positive">
                    <i className="fas fa-arrow-up"></i> +{stats.monthlyGrowth}%
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="pilgrimage-stat-card pilgrimage-card-bookings">
            <Card.Body>
              <div className="pilgrimage-stat-content">
                <div className="pilgrimage-stat-icon">
                  <i className="fas fa-ticket-alt"></i>
                </div>
                <div className="pilgrimage-stat-details">
                  <h3>{stats.totalBookings}</h3>
                  <p>Total Bookings</p>
                  <span className="pilgrimage-stat-trend positive">
                    <i className="fas fa-arrow-up"></i> +{stats.monthlyGrowth}%
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="pilgrimage-stat-card pilgrimage-card-tours">
            <Card.Body>
              <div className="pilgrimage-stat-content">
                <div className="pilgrimage-stat-icon">
                  <i className="fas fa-mountain"></i>
                </div>
                <div className="pilgrimage-stat-details">
                  <h3>{stats.activeTours}</h3>
                  <p>Active Tours</p>
                  <span className="pilgrimage-stat-trend neutral">
                    <i className="fas fa-minus"></i> 0%
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="pilgrimage-stat-card pilgrimage-card-approvals">
            <Card.Body>
              <div className="pilgrimage-stat-content">
                <div className="pilgrimage-stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="pilgrimage-stat-details">
                  <h3>{stats.pendingApprovals}</h3>
                  <p>Pending Approvals</p>
                  <span className="pilgrimage-stat-trend negative">
                    <i className="fas fa-exclamation-triangle"></i> Urgent
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts and Tables Row */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="pilgrimage-chart-card">
            <Card.Header className="pilgrimage-card-header">
              <h5>Featured Tours</h5>
              <small className="text-muted">Discover our amazing pilgrimage destinations</small>
            </Card.Header>
            <Card.Body>
              {tours.length > 0 ? (
                <div className="pilgrimage-tour-carousel">
                  {(() => {
                    const currentTour = tours[currentTourIndex];
                    return (
                      <div className="pilgrimage-tour-slide" key={currentTour._id}>
                        <Row className="align-items-center h-100">
                          <Col md={4}>
                            <div className="pilgrimage-tour-image">
                              {currentTour.images && currentTour.images.length > 0 ? (
                                <img 
                                  src={currentTour.images[0]} 
                                  alt={currentTour.title}
                                  className="img-fluid rounded"
                                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="pilgrimage-tour-placeholder d-flex align-items-center justify-content-center" style={{ height: '150px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px' }}>
                                  <i className="fas fa-mountain fa-3x text-white"></i>
                                </div>
                              )}
                            </div>
                          </Col>
                          <Col md={8}>
                            <div className="pilgrimage-tour-details">
                              <h4 className="mb-2">{currentTour.title}</h4>
                              <p className="text-muted mb-2">{currentTour.description?.substring(0, 120)}...</p>
                              <div className="pilgrimage-tour-meta">
                                <Row>
                                  <Col sm={6}>
                                    <small className="text-muted">
                                      <i className="fas fa-map-marker-alt me-1"></i>
                                      {currentTour.destinations && currentTour.destinations.length > 0 
                                        ? `${currentTour.destinations[0].name}, ${currentTour.destinations[0].state}`
                                        : 'Multiple Destinations'
                                      }
                                    </small>
                                  </Col>
                                  <Col sm={6}>
                                    <small className="text-muted">
                                      <i className="fas fa-calendar me-1"></i>
                                      {currentTour.duration.days} days, {currentTour.duration.nights} nights
                                    </small>
                                  </Col>
                                  <Col sm={6}>
                                    <small className="text-success fw-bold">
                                      <i className="fas fa-rupee-sign me-1"></i>
                                      ₹{currentTour.pricing.adult.toLocaleString()}
                                    </small>
                                  </Col>
                                  <Col sm={6}>
                                    <Badge 
                                      bg={currentTour.featured ? 'success' : 'secondary'}
                                      className="ms-1"
                                    >
                                      {currentTour.featured ? 'Featured' : 'Regular'}
                                    </Badge>
                                  </Col>
                                </Row>
                              </div>
                            </div>
                          </Col>
                        </Row>
                        <div className="pilgrimage-carousel-indicators mt-3">
                          {tours.map((_, index) => (
                            <span
                              key={index}
                              className={`pilgrimage-indicator ${index === currentTourIndex ? 'active' : ''}`}
                              onClick={() => setCurrentTourIndex(index)}
                            ></span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-mountain fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No tours available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="pilgrimage-donut-card">
            <Card.Header className="pilgrimage-card-header">
              <h5>Tour Categories</h5>
              <small className="text-muted">Distribution by type</small>
            </Card.Header>
            <Card.Body>
              <div className="pilgrimage-donut-chart">
                <div className="pilgrimage-donut-center">
                  <span className="pilgrimage-donut-value">{tours.length}</span>
                  <span className="pilgrimage-donut-label">Total Tours</span>
                </div>
              </div>
              <div className="pilgrimage-donut-legend">
                <div className="pilgrimage-legend-item">
                  <span className="pilgrimage-legend-color pilgrimage-color-1"></span>
                  <span>Spiritual (45%)</span>
                </div>
                <div className="pilgrimage-legend-item">
                  <span className="pilgrimage-legend-color pilgrimage-color-2"></span>
                  <span>Adventure (30%)</span>
                </div>
                <div className="pilgrimage-legend-item">
                  <span className="pilgrimage-legend-color pilgrimage-color-3"></span>
                  <span>Cultural (25%)</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities Row */}
      <Row className="g-4">
        <Col lg={8}>
          <Card className="pilgrimage-table-card">
            <Card.Header className="pilgrimage-card-header">
              <h5>Recent Bookings</h5>
              <Button variant="link" size="sm" onClick={() => setActiveTab('bookings')}>View All</Button>
            </Card.Header>
            <Card.Body>
              <Table responsive className="pilgrimage-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Tour</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? (
                    bookings.slice(0, 5).map((booking) => (
                      <tr key={booking._id}>
                        <td>#{booking.bookingId || 'N/A'}</td>
                        <td>{booking.participants?.[0]?.name || 'N/A'}</td>
                        <td>
                          {typeof booking.tour === 'object' && booking.tour ? 
                            booking.tour.title : 
                            'N/A'
                          }
                        </td>
                        <td>
                          ₹{booking.pricing && typeof booking.pricing === 'object' && booking.pricing.total ? 
                            booking.pricing.total.toLocaleString() : 
                            '0'
                          }
                        </td>
                        <td>
                          <Badge 
                            bg={booking.status === 'confirmed' ? 'success' : 
                               booking.status === 'interested' ? 'warning' : 
                               booking.status === 'paid' ? 'primary' :
                               'danger'}
                          >
                            {booking.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="pilgrimage-activity-card">
            <Card.Header className="pilgrimage-card-header">
              <h5>Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="pilgrimage-quick-actions">
                <Button 
                  className="pilgrimage-action-btn pilgrimage-btn-tours"
                  onClick={() => setActiveTab('tours')}
                >
                  <i className="fas fa-plus"></i>
                  <span>Add New Tour</span>
                </Button>
                <Button 
                  className="pilgrimage-action-btn pilgrimage-btn-bookings"
                  onClick={() => setActiveTab('bookings')}
                >
                  <i className="fas fa-calendar-check"></i>
                  <span>Manage Bookings</span>
                </Button>
                <Button 
                  className="pilgrimage-action-btn pilgrimage-btn-expenses"
                  onClick={() => setActiveTab('expenses')}
                >
                  <i className="fas fa-file-invoice"></i>
                  <span>Add Expense</span>
                </Button>
                <Button 
                  className="pilgrimage-action-btn pilgrimage-btn-reports"
                  onClick={() => setActiveTab('analytics')}
                >
                  <i className="fas fa-chart-bar"></i>
                  <span>Generate Report</span>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderExpensesContent = () => (
    <Row className="g-4">
      <Col>
        <Card className="pilgrimage-table-card">
          <Card.Header className="pilgrimage-card-header">
            <h5>Expense Management</h5>
            <Button 
              variant="primary" 
              size="sm"
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
                  paymentMethod: 'cash' as const,
                  receiptNumber: '',
                  isApproved: false,
                  notes: ''
                });
                setEditingExpense(null);
                setShowExpenseModal(true);
              }}
            >
              <i className="fas fa-plus me-2"></i>Add New Expense
            </Button>
          </Card.Header>
          <Card.Body>
            <Table responsive className="pilgrimage-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Tour</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense._id}>
                      <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td>
                        <Badge bg="info">{expense.category}</Badge>
                      </td>
                      <td>{expense.description}</td>
                      <td>₹{expense.amount.toLocaleString()}</td>
                      <td>
                        {typeof expense.tour === 'object' && expense.tour ? 
                          expense.tour.title : 
                          'General'
                        }
                      </td>
                      <td>
                        <Badge 
                          bg={expense.isApproved ? 'success' : 'warning'}
                        >
                          {expense.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>
                      <td>
                        {!expense.isApproved && (
                          <Button 
                            size="sm" 
                            variant="outline-success" 
                            className="me-1"
                            onClick={() => handleApproveExpense(expense._id, true)}
                            title="Approve"
                          >
                            <i className="fas fa-check"></i>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline-primary" 
                          className="me-1"
                          onClick={() => {
                            setEditingExpense(expense);
                            setExpenseForm({
                              tour: typeof expense.tour === 'object' ? expense.tour._id : expense.tour,
                              addedBy: expense.addedBy || '',
                              category: expense.category,
                              description: expense.description,
                              amount: expense.amount,
                              expenseDate: expense.expenseDate,
                              location: expense.location || { name: '', address: '' },
                              vendor: {
                                name: expense.vendor?.name || '',
                                contact: expense.vendor?.contact || '',
                                address: expense.vendor?.address || ''
                              },
                              paymentMethod: expense.paymentMethod || 'cash',
                              receiptNumber: expense.receiptNumber || '',
                              isApproved: expense.isApproved,
                              notes: expense.notes || ''
                            });
                            setShowExpenseModal(true);
                          }}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={() => handleDeleteExpense(expense._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      <i className="fas fa-wallet fa-2x mb-2 d-block"></i>
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderToursContent = () => (
    <Row className="g-4">
      <Col>
        <Card className="pilgrimage-table-card">
          <Card.Header className="pilgrimage-card-header">
            <h5>Tour Management</h5>
            <Button 
              variant="primary" 
              size="sm"
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
              <i className="fas fa-plus me-2"></i>Add New Tour
            </Button>
          </Card.Header>
          <Card.Body>
            <Table responsive className="pilgrimage-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Seats</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tours.length > 0 ? (
                  tours.map((tour) => (
                    <tr key={tour._id}>
                      <td>
                        <strong>{tour.title}</strong>
                        <br />
                        <small className="text-muted">{tour.shortDescription}</small>
                      </td>
                      <td>{tour.duration.days}D/{tour.duration.nights}N</td>
                      <td>₹{tour.pricing.adult.toLocaleString()}</td>
                      <td>{tour.availableSeats}/{tour.maxParticipants}</td>
                      <td>{tour.startDate ? new Date(tour.startDate).toLocaleDateString() : 'Not set'}</td>
                      <td>
                        <Badge 
                          bg={tour.status === 'published' ? 'success' : 
                             tour.status === 'draft' ? 'warning' : 'danger'}
                        >
                          {tour.status}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-primary" 
                          className="me-1"
                          onClick={() => {
                            setEditingTour(tour);
                            setTourForm({
                              title: tour.title,
                              description: tour.description,
                              shortDescription: tour.shortDescription || '',
                              duration: tour.duration,
                              pricing: tour.pricing,
                              category: tour.category,
                              difficulty: tour.difficulty,
                              featured: tour.featured,
                              destinations: tour.destinations,
                              maxParticipants: tour.maxParticipants || 0,
                              startDate: tour.startDate || '',
                              endDate: tour.endDate || '',
                              status: tour.status || 'draft'
                            });
                            setShowTourModal(true);
                          }}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={() => handleDeleteTour(tour._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      <i className="fas fa-mountain fa-2x mb-2 d-block"></i>
                      No tours found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderBookingsContent = () => (
    <Row className="g-4">
      <Col>
        <Card className="pilgrimage-table-card">
          <Card.Header className="pilgrimage-card-header">
            <h5>Booking Management</h5>
            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setNewBookingForm({
                    tourId: '',
                    userId: '',
                    participants: [
                      {
                        name: '',
                        age: 0,
                        aadhar: '',
                        relation: 'self',
                        priceCategory: 'adult'
                      }
                    ],
                    specialRequests: '',
                    autoApprove: false
                  });
                  setShowAddBookingModal(true);
                }}
              >
                <i className="fas fa-plus me-1"></i>Add Booking
              </Button>
              <Button variant="outline-primary" size="sm">
                <i className="fas fa-filter me-1"></i>Filter
              </Button>
              <Button variant="outline-success" size="sm">
                <i className="fas fa-download me-1"></i>Export
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Table responsive className="pilgrimage-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Tour</th>
                  <th>Participants</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Booking Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>#{booking.bookingId}</td>
                      <td>{booking.participants?.[0]?.name || 'N/A'}</td>
                      <td>
                        {typeof booking.tour === 'object' && booking.tour ? 
                          booking.tour.title : 
                          'N/A'
                        }
                      </td>
                      <td>
                        {booking.totalParticipants}
                        <Button 
                          size="sm" 
                          variant="outline-success" 
                          className="ms-2"
                          onClick={() => {
                            setSelectedBookingForFamily(booking);
                            setFamilyMemberForm({
                              name: '',
                              age: 0,
                              aadhar: '',
                              relation: '',
                              priceCategory: 'adult'
                            });
                            setShowFamilyMemberModal(true);
                          }}
                          title="Add Family Member"
                        >
                          <i className="fas fa-user-plus"></i>
                        </Button>
                      </td>
                      <td>
                        ₹{booking.pricing && typeof booking.pricing === 'object' && booking.pricing.total ? 
                          booking.pricing.total.toLocaleString() : 
                          '0'
                        }
                      </td>
                      <td>
                        <Badge 
                          bg={booking.paymentStatus === 'paid' ? 'success' : 
                             booking.paymentStatus === 'partial' ? 'warning' : 'danger'}
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          bg={booking.status === 'confirmed' ? 'success' : 
                             booking.status === 'interested' ? 'warning' : 
                             booking.status === 'paid' ? 'primary' :
                             'danger'}
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td>
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline-success" 
                              className="me-1"
                              onClick={() => handleApproveBooking(booking._id, 'confirmed')}
                              title="Approve"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-warning" 
                              className="me-1"
                              onClick={() => handleApproveBooking(booking._id, 'cancelled')}
                              title="Reject"
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline-primary" 
                          className="me-1"
                          onClick={() => {
                            // View booking details
                            alert('View booking details functionality will be implemented');
                          }}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={() => handleDeleteBooking(booking._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      <i className="fas fa-ticket-alt fa-2x mb-2 d-block"></i>
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderAnalyticsContent = () => (
    <Row className="g-4">
      <Col>
        <Card>
          <Card.Header>
            <h5>Analytics Dashboard</h5>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-5">
              <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
              <h4>Analytics Coming Soon</h4>
              <p className="text-muted">Detailed analytics and reports will be available here.</p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderApprovalsContent = () => (
    <Row className="g-4">
      <Col>
        <Card>
          <Card.Header>
            <h5>Pending Approvals</h5>
            <Badge bg="warning">{stats.pendingApprovals} Pending</Badge>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-5">
              <i className="fas fa-clock fa-3x text-warning mb-3"></i>
              <h4>Approval System Coming Soon</h4>
              <p className="text-muted">Expense and booking approval workflow will be available here.</p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

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
              Sri Vishnu Chitra
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
                {stats.pendingApprovals > 0 && (
                  <Badge bg="danger" className="pilgrimage-notification-badge">
                    {stats.pendingApprovals}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="pilgrimage-dashboard-content">
          <Container fluid>
            {/* Error Alert */}
            {error && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                <Alert.Heading>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Error Loading Dashboard Data
                </Alert.Heading>
                <p className="mb-0">{error}</p>
              </Alert>
            )}
            
            {/* Dynamic Content */}
            {renderContent()}
          </Container>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="position-fixed" style={{top: '20px', right: '20px', zIndex: 9999}}>
          {success}
        </Alert>
      )}

      {/* Expense Modal */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} size="lg">
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
                    <option value="netbanking">Net Banking</option>
                    <option value="other">Other</option>
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={tourForm.status || 'draft'}
                    onChange={(e) => setTourForm({...tourForm, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty</Form.Label>
                  <Form.Select
                    value={tourForm.difficulty || 'easy'}
                    onChange={(e) => setTourForm({...tourForm, difficulty: e.target.value})}
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
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

      {/* Family Member Modal */}
      <Modal show={showFamilyMemberModal} onHide={() => setShowFamilyMemberModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Family Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={familyMemberForm.name}
                    onChange={(e) => setFamilyMemberForm({...familyMemberForm, name: e.target.value})}
                    placeholder="Enter family member name"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    value={familyMemberForm.age}
                    onChange={(e) => setFamilyMemberForm({...familyMemberForm, age: parseInt(e.target.value)})}
                    placeholder="Age"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Price Category</Form.Label>
                  <Form.Select
                    value={familyMemberForm.priceCategory}
                    onChange={(e) => setFamilyMemberForm({...familyMemberForm, priceCategory: e.target.value})}
                  >
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                    <option value="senior">Senior</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Aadhar Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={familyMemberForm.aadhar}
                    onChange={(e) => setFamilyMemberForm({...familyMemberForm, aadhar: e.target.value})}
                    placeholder="Enter Aadhar number"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Relation</Form.Label>
                  <Form.Control
                    type="text"
                    value={familyMemberForm.relation}
                    onChange={(e) => setFamilyMemberForm({...familyMemberForm, relation: e.target.value})}
                    placeholder="e.g., Father, Mother, Spouse"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFamilyMemberModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddFamilyMember}>
            Add Family Member
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New Booking Modal */}
      <Modal show={showAddBookingModal} onHide={() => setShowAddBookingModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create New Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select User</Form.Label>
                  <Form.Select
                    value={newBookingForm.userId}
                    onChange={(e) => setNewBookingForm({...newBookingForm, userId: e.target.value})}
                  >
                    <option value="">Select a user...</option>
                    {users.map((user: any) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Tour</Form.Label>
                  <Form.Select
                    value={newBookingForm.tourId}
                    onChange={(e) => setNewBookingForm({...newBookingForm, tourId: e.target.value})}
                  >
                    <option value="">Select a tour...</option>
                    {tours.map((tour: any) => (
                      <option key={tour._id} value={tour._id}>
                        {tour.title} - ₹{tour.pricing?.adult || 0}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mb-3">Participants</h6>
            {newBookingForm.participants.map((participant: any, index: number) => (
              <div key={index} className="border p-3 mb-3 rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Participant {index + 1}</h6>
                  {index > 0 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeParticipantFromBooking(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </div>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={participant.name}
                        onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                        placeholder="Enter name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age</Form.Label>
                      <Form.Control
                        type="number"
                        value={participant.age}
                        onChange={(e) => updateParticipant(index, 'age', parseInt(e.target.value))}
                        placeholder="Age"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Aadhar</Form.Label>
                      <Form.Control
                        type="text"
                        value={participant.aadhar}
                        onChange={(e) => updateParticipant(index, 'aadhar', e.target.value)}
                        placeholder="Aadhar number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price Category</Form.Label>
                      <Form.Select
                        value={participant.priceCategory}
                        onChange={(e) => updateParticipant(index, 'priceCategory', e.target.value)}
                      >
                        <option value="adult">Adult</option>
                        <option value="child">Child</option>
                        <option value="senior">Senior</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                {index === 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Relation</Form.Label>
                    <Form.Control
                      type="text"
                      value={participant.relation}
                      onChange={(e) => updateParticipant(index, 'relation', e.target.value)}
                      placeholder="self, spouse, etc."
                    />
                  </Form.Group>
                )}
                {index > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Relation to Primary</Form.Label>
                    <Form.Control
                      type="text"
                      value={participant.relation}
                      onChange={(e) => updateParticipant(index, 'relation', e.target.value)}
                      placeholder="e.g., Father, Mother, Child"
                    />
                  </Form.Group>
                )}
              </div>
            ))}

            <Button
              variant="outline-primary"
              className="mb-3"
              onClick={addParticipantToBooking}
            >
              <i className="fas fa-plus me-2"></i>Add Another Participant
            </Button>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Special Requests</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newBookingForm.specialRequests}
                    onChange={(e) => setNewBookingForm({...newBookingForm, specialRequests: e.target.value})}
                    placeholder="Any special requirements or requests..."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Auto-approve booking"
                    checked={newBookingForm.autoApprove}
                    onChange={(e) => setNewBookingForm({...newBookingForm, autoApprove: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddBookingModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNewBooking}>
            Create Booking
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PilgrimageAdminDashboard;