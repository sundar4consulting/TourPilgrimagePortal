import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Table,
  Nav,
  Tab,
  Modal,
  Form,
  Alert,
  Spinner,
  ListGroup
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { bookingsAPI, familyAPI, Booking, FamilyMember } from '../services/api'

const MemberDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Family member form state
  const [memberForm, setMemberForm] = useState({
    name: '',
    age: '',
    aadharNumber: '',
    relationship: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchData()
  }, [isAuthenticated, navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch bookings and family members in parallel
      const [bookingsResponse, familyResponse] = await Promise.all([
        bookingsAPI.getAll().catch(() => ({ data: [] })),
        familyAPI.getMembers().catch(() => ({ data: [] }))
      ])
      
      setBookings(bookingsResponse.data)
      setFamilyMembers(familyResponse.data)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    try {
      await bookingsAPI.cancel(bookingId)
      await fetchData() // Refresh data
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('Failed to cancel booking')
    }
  }

  const handleSaveFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const memberData: Omit<FamilyMember, '_id'> = {
        name: memberForm.name,
        age: parseInt(memberForm.age),
        relation: memberForm.relationship as 'spouse' | 'child' | 'parent' | 'sibling' | 'other',
        aadhar: memberForm.aadharNumber,
      }
      
      if (editingMember) {
        await familyAPI.updateMember(editingMember._id!, memberData)
      } else {
        await familyAPI.addMember(memberData)
      }
      
      setShowFamilyModal(false)
      setEditingMember(null)
      setMemberForm({ name: '', age: '', aadharNumber: '', relationship: '' })
      await fetchData()
    } catch (error) {
      console.error('Error saving family member:', error)
      alert('Failed to save family member')
    }
  }

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member)
    setMemberForm({
      name: member.name,
      age: member.age.toString(),
      aadharNumber: member.aadhar,
      relationship: member.relation
    })
    setShowFamilyModal(true)
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this family member?')) return
    
    try {
      await familyAPI.deleteMember(memberId)
      await fetchData()
    } catch (error) {
      console.error('Error deleting family member:', error)
      alert('Failed to delete family member')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge bg="success">Confirmed</Badge>
      case 'pending':
        return <Badge bg="warning">Pending</Badge>
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading your dashboard...</p>
      </Container>
    )
  }

  return (
    <>
      <Container className="py-5">
        {/* Welcome Section */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="display-6 fw-bold text-primary">
                  Welcome, {user?.name}!
                </h1>
                <p className="text-muted">Manage your pilgrimage bookings and family details</p>
              </div>
              <Button 
                variant="primary"
                onClick={() => navigate('/tours')}
              >
                Browse Tours
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Dashboard Stats */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="border-primary">
              <Card.Body className="text-center">
                <div className="text-primary mb-2">
                  <i className="fas fa-calendar-check fa-2x"></i>
                </div>
                <h4 className="text-primary">{bookings.filter(b => b.status !== 'cancelled').length}</h4>
                <p className="text-muted mb-0">Active Bookings</p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="border-success">
              <Card.Body className="text-center">
                <div className="text-success mb-2">
                  <i className="fas fa-users fa-2x"></i>
                </div>
                <h4 className="text-success">{familyMembers.length + 1}</h4>
                <p className="text-muted mb-0">Family Members</p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="border-info">
              <Card.Body className="text-center">
                <div className="text-info mb-2">
                  <i className="fas fa-route fa-2x"></i>
                </div>
                <h4 className="text-info">{bookings.filter(b => b.status === 'confirmed').length}</h4>
                <p className="text-muted mb-0">Confirmed Tours</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'bookings')}>
          <Card>
            <Card.Header>
              <Nav variant="tabs" className="card-header-tabs">
                <Nav.Item>
                  <Nav.Link eventKey="bookings">My Bookings</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="book-tour">Book A Tour</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="family">Family Members</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="profile">Profile</Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            
            <Card.Body>
              <Tab.Content>
                {/* Bookings Tab */}
                <Tab.Pane eventKey="bookings">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Your Tour Bookings</h5>
                    <Button 
                      variant="outline-primary"
                      onClick={() => navigate('/tours')}
                    >
                      Book New Tour
                    </Button>
                  </div>
                  
                  {bookings.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
                      <h5>No Bookings Yet</h5>
                      <p className="text-muted">Start your spiritual journey by booking a tour</p>
                      <Button 
                        variant="primary"
                        onClick={() => navigate('/tours')}
                      >
                        Browse Tours
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Tour</th>
                            <th>Date</th>
                            <th>Participants</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => {
                            const tour = typeof booking.tour === 'object' ? booking.tour : null;
                            return (
                            <tr key={booking._id}>
                              <td>
                                <strong>{tour?.title || 'Unknown Tour'}</strong>
                                <br />
                                <small className="text-muted">
                                  {tour?.duration ? `${tour.duration.days}D/${tour.duration.nights}N` : 'Duration N/A'}
                                </small>
                              </td>
                              <td>
                                <small>
                                  {new Date(booking.createdAt).toLocaleDateString()}
                                </small>
                              </td>
                              <td>{booking.participants.length}</td>
                              <td className="fw-bold">₹{booking.pricing?.total?.toLocaleString() || 'N/A'}</td>
                              <td>{getStatusBadge(booking.status)}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline-primary"
                                    onClick={() => navigate(`/tours/${typeof booking.tour === 'string' ? booking.tour : booking.tour?._id}`)}
                                  >
                                    View
                                  </Button>
                                  {(booking.status === 'interested' || booking.status === 'confirmed') && (
                                    <Button 
                                      size="sm" 
                                      variant="outline-danger"
                                      onClick={() => handleCancelBooking(booking._id)}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab.Pane>

                {/* Book A Tour Tab */}
                <Tab.Pane eventKey="book-tour">
                  <div className="text-center py-5">
                    <i className="fas fa-mountain fa-4x text-primary mb-3"></i>
                    <h4 className="text-primary">Discover Spiritual Journeys</h4>
                    <p className="text-muted mb-4">
                      Explore our curated pilgrimage tours and book your next spiritual adventure.
                    </p>
                    <Button 
                      variant="primary"
                      size="lg"
                      onClick={() => navigate('/member/book-tour')}
                    >
                      <i className="fas fa-search me-2"></i>
                      Browse & Book Tours
                    </Button>
                  </div>
                </Tab.Pane>

                {/* Family Members Tab */}
                <Tab.Pane eventKey="family">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Family Members</h5>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        setEditingMember(null)
                        setMemberForm({ name: '', age: '', aadharNumber: '', relationship: '' })
                        setShowFamilyModal(true)
                      }}
                    >
                      Add Family Member
                    </Button>
                  </div>
                  
                  <Row>
                    {/* Primary User Card */}
                    <Col md={6} lg={4} className="mb-3">
                      <Card className="border-primary">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="text-primary me-3">
                              <i className="fas fa-user-circle fa-2x"></i>
                            </div>
                            <div>
                              <h6 className="mb-1">{user?.name}</h6>
                              <small className="text-muted">Primary Member</small>
                              <br />
                              <small className="text-muted">{user?.email}</small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    {/* Family Members */}
                    {familyMembers.map((member) => (
                      <Col md={6} lg={4} key={member._id} className="mb-3">
                        <Card>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{member.name}</h6>
                                <small className="text-muted">{member.relation}</small>
                                <br />
                                <small className="text-muted">Age: {member.age}</small>
                                <br />
                                <small className="text-muted">Aadhar: ****{member.aadhar.slice(-4)}</small>
                              </div>
                              <div className="d-flex flex-column gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline-primary"
                                  onClick={() => handleEditMember(member)}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline-danger"
                                  onClick={() => handleDeleteMember(member._id!)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  
                  {familyMembers.length === 0 && (
                    <div className="text-center py-4">
                      <i className="fas fa-users fa-3x text-muted mb-3"></i>
                      <h6>No Family Members Added</h6>
                      <p className="text-muted">Add family members to book tours together</p>
                    </div>
                  )}
                </Tab.Pane>

                {/* Profile Tab */}
                <Tab.Pane eventKey="profile">
                  <Row>
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Profile Information</h6>
                        </Card.Header>
                        <Card.Body>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between">
                              <strong>Name:</strong>
                              <span>{user?.name}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <strong>Email:</strong>
                              <span>{user?.email}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <strong>Role:</strong>
                              <Badge bg="primary">{user?.role}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <strong>Phone:</strong>
                              <span>{user?.phone || 'Not provided'}</span>
                            </ListGroup.Item>
                          </ListGroup>
                          
                          <div className="mt-3">
                            <Button variant="outline-primary" size="sm">
                              Edit Profile
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Tab.Container>
      </Container>

      {/* Family Member Modal */}
      <Modal show={showFamilyModal} onHide={() => setShowFamilyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingMember ? 'Edit' : 'Add'} Family Member
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSaveFamilyMember}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={memberForm.name}
                onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Enter full name"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    value={memberForm.age}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, age: e.target.value }))}
                    required
                    min="1"
                    max="120"
                    placeholder="Age"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Relationship</Form.Label>
                  <Form.Select
                    value={memberForm.relationship}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, relationship: e.target.value }))}
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Aadhar Number</Form.Label>
              <Form.Control
                type="text"
                value={memberForm.aadharNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12)
                  setMemberForm(prev => ({ ...prev, aadharNumber: value }))
                }}
                required
                pattern="[0-9]{12}"
                placeholder="12-digit Aadhar number"
                maxLength={12}
              />
              <Form.Text className="text-muted">
                Enter 12-digit Aadhar number (required for booking)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFamilyModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingMember ? 'Update' : 'Add'} Member
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

export default MemberDashboard