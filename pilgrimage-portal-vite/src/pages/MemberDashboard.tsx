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
  Spinner
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { bookingsAPI, familyAPI, Booking, FamilyMember } from '../services/api'
import './MemberDashboard.css'

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

  const getInitials = (value?: string) => {
    if (!value) return 'YY'
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const activeBookingsCount = bookings.filter((b) => b.status !== 'cancelled').length
  const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed').length
  const latestBooking = bookings.length
    ? [...bookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null
  const latestBookingLabel = latestBooking
    ? `${new Date(latestBooking.createdAt).toLocaleDateString()} · ${
        typeof latestBooking.tour === 'object'
          ? latestBooking.tour?.title || 'Pilgrimage'
          : 'Pilgrimage'
      }`
    : 'No journeys booked yet'
  const totalPilgrims = bookings.reduce((sum, booking) => {
    const participantCount = booking.totalParticipants ?? booking.participants?.length ?? 0
    return sum + participantCount
  }, 0)
  const membershipId = user?.id ? `#${user.id.slice(-6).toUpperCase()}` : '#PILGRIM'
  const maskedPhone = user?.phone || 'Add your phone number'
  const maskedAadhar = user?.aadhar ? `•••• ${user.aadhar.slice(-4)}` : 'Add Aadhar for faster bookings'
  const userInitials = getInitials(user?.name || user?.email)
  const profileDetailItems = [
    { label: 'Full Name', value: user?.name || 'Not provided' },
    { label: 'Email Address', value: user?.email || 'Not provided' },
    { label: 'Contact Number', value: maskedPhone },
    { label: 'Membership Role', value: user?.role?.toUpperCase() || 'MEMBER' },
    { label: 'Aadhar Number', value: maskedAadhar },
    { label: 'Unique ID', value: membershipId }
  ]
  const profileTimeline = [
    {
      title: 'Account Status',
      description: confirmedBookingsCount
        ? 'Active traveler with confirmed journeys'
        : 'Ready to plan your first pilgrimage'
    },
    {
      title: 'Preferred Contact',
      description: user?.phone || user?.email || 'Add contact details'
    },
    {
      title: 'Latest Booking',
      description: latestBookingLabel
    }
  ]

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
    <div className="memberDashboard">
      <Container fluid className="memberDashboardContainer py-5">
        {/* Welcome Section */}
        <div className="memberWelcomeCard mb-4">
          <div>
            <p className="memberWelcomeEyebrow">Pilgrimage companion</p>
            <h1 className="memberWelcomeTitle">
              Welcome, {user?.name || 'Member'}!
            </h1>
            <p className="memberWelcomeSubtitle">
              Manage your journeys, bookings, and pilgrim family with the refreshed dashboard experience.
            </p>
          </div>
          <div className="memberWelcomeActions">
            <Button 
              variant="light"
              className="memberPrimaryAction"
              onClick={() => navigate('/tours')}
            >
              <i className="fas fa-compass me-2"></i>
              Browse Tours
            </Button>
            <Button 
              variant="outline-light"
              className="memberSecondaryAction"
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user-circle me-2"></i>
              View Profile
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Dashboard Stats */}
        <div className="memberStatsGrid mb-4">
          <div className="memberStatCard">
            <div className="memberStatIcon primary">
              <i className="fas fa-calendar-check"></i>
            </div>
            <p className="label">Active Bookings</p>
            <h3>{activeBookingsCount}</h3>
            <small>Journeys currently planned</small>
          </div>

          <div className="memberStatCard">
            <div className="memberStatIcon success">
              <i className="fas fa-users"></i>
            </div>
            <p className="label">Family Members</p>
            <h3>{familyMembers.length + 1}</h3>
            <small>Travellers linked to your account</small>
          </div>

          <div className="memberStatCard">
            <div className="memberStatIcon info">
              <i className="fas fa-route"></i>
            </div>
            <p className="label">Confirmed Tours</p>
            <h3>{confirmedBookingsCount}</h3>
            <small>Awaiting departure</small>
          </div>

          <div className="memberStatCard">
            <div className="memberStatIcon warning">
              <i className="fas fa-people-carry"></i>
            </div>
            <p className="label">Total Pilgrims</p>
            <h3>{Math.max(totalPilgrims, 1)}</h3>
            <small>Participants across bookings</small>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'bookings')}>
          <Card className="memberTabCard">
            <Card.Header className="memberTabsHeader">
              <Nav variant="tabs" className="memberTabs">
                <Nav.Item>
                  <Nav.Link eventKey="bookings">
                    <i className="fas fa-calendar-alt me-2"></i>
                    My Bookings
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="book-tour">
                    <i className="fas fa-mountain me-2"></i>
                    Book A Tour
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="family">
                    <i className="fas fa-users me-2"></i>
                    Family Members
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="profile">
                    <i className="fas fa-id-card me-2"></i>
                    Profile
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            
            <Card.Body className="memberTabBody">
              <Tab.Content>
                {/* Bookings Tab */}
                <Tab.Pane eventKey="bookings">
                  <div className="memberSectionHeader">
                    <div>
                      <p className="sectionEyebrow">Journey Planner</p>
                      <h5 className="mb-0">Your Tour Bookings</h5>
                    </div>
                    <div className="memberSectionActions">
                      <Button 
                        variant="outline-primary"
                        className="memberGhostButton"
                        onClick={() => setActiveTab('family')}
                      >
                        <i className="fas fa-user-friends me-2"></i>
                        Manage Family
                      </Button>
                      <Button 
                        variant="primary"
                        className="memberAccentButton"
                        onClick={() => navigate('/tours')}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Book New Tour
                      </Button>
                    </div>
                  </div>
                  
                  {bookings.length === 0 ? (
                    <div className="memberEmptyState">
                      <div className="iconCircle">
                        <i className="fas fa-calendar-plus"></i>
                      </div>
                      <h5>No bookings yet</h5>
                      <p>Start your spiritual journey by booking a curated pilgrimage.</p>
                      <Button 
                        variant="primary"
                        onClick={() => navigate('/tours')}
                      >
                        Explore Tours
                      </Button>
                    </div>
                  ) : (
                    <Card className="memberSectionCard">
                      <div className="table-responsive memberTableWrapper">
                        <Table hover className="memberTable">
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
                                    <div className="memberBookingActions">
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
                    </Card>
                  )}
                </Tab.Pane>

                {/* Book A Tour Tab */}
                <Tab.Pane eventKey="book-tour">
                  <div className="memberBookTourPanel memberSectionCard text-center">
                    <div className="iconAura">
                      <i className="fas fa-mountain"></i>
                    </div>
                    <h4>Discover Spiritual Journeys</h4>
                    <p>
                      Explore curated circuits, temple trails, and festival tours designed for every devotee.
                    </p>
                    <div className="memberBookTourActions">
                      <Button 
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/member/book-tour')}
                      >
                        <i className="fas fa-search me-2"></i>
                        Browse & Book Tours
                      </Button>
                      <Button 
                        variant="outline-primary"
                        size="lg"
                        onClick={() => navigate('/tours')}
                      >
                        <i className="fas fa-th-large me-2"></i>
                        View All Tours
                      </Button>
                    </div>
                  </div>
                </Tab.Pane>

                {/* Family Members Tab */}
                <Tab.Pane eventKey="family">
                  <div className="memberSectionHeader">
                    <div>
                      <p className="sectionEyebrow">Pilgrim Circle</p>
                      <h5 className="mb-0">Family Members</h5>
                    </div>
                    <Button 
                      variant="primary"
                      className="memberAccentButton"
                      onClick={() => {
                        setEditingMember(null)
                        setMemberForm({ name: '', age: '', aadharNumber: '', relationship: '' })
                        setShowFamilyModal(true)
                      }}
                    >
                      <i className="fas fa-user-plus me-2"></i>
                      Add Family Member
                    </Button>
                  </div>
                  
                  <div className="memberFamilyGrid">
                    <div className="memberFamilyCard primary">
                      <div className="memberFamilyAvatar">
                        <i className="fas fa-user-circle"></i>
                      </div>
                      <div>
                        <p className="label">Primary Member</p>
                        <h6>{user?.name || 'Member'}</h6>
                        <small>{user?.email}</small>
                      </div>
                    </div>

                    {familyMembers.map((member) => (
                      <div key={member._id} className="memberFamilyCard">
                        <div>
                          <p className="label text-capitalize">{member.relation}</p>
                          <h6>{member.name}</h6>
                        </div>
                        <div className="memberFamilyMeta">
                          <span>Age {member.age}</span>
                          <span>Aadhar ••••{member.aadhar.slice(-4)}</span>
                        </div>
                        <div className="memberFamilyActions">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => handleEditMember(member)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDeleteMember(member._id!)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {familyMembers.length === 0 && (
                    <div className="memberEmptyState">
                      <div className="iconCircle">
                        <i className="fas fa-users"></i>
                      </div>
                      <h5>No family members added</h5>
                      <p>Add family members to share bookings and manage pilgrim details.</p>
                    </div>
                  )}
                </Tab.Pane>

                {/* Profile Tab */}
                <Tab.Pane eventKey="profile" className="profileTab">
                  <div className="profileHeroCard">
                    <div className="profileHeroContent">
                      <div className="profileAvatar">{userInitials}</div>
                      <div>
                        <p className="profileGreeting">Member Identity</p>
                        <h3 className="text-white mb-1">{user?.name || 'Member'}</h3>
                        <p className="mb-0 text-white-50">{membershipId}</p>
                      </div>
                    </div>
                    <div className="profileHeroMeta">
                      <span className="profileChip">
                        {user?.role === 'admin' ? 'Administrator Access' : 'Member Access'}
                      </span>
                      <span className="profileChip">{activeBookingsCount} active bookings</span>
                      <span className="profileChip">{familyMembers.length + 1} linked members</span>
                    </div>
                    <div className="profileActions">
                      <Button variant="light" size="sm" className="profileActionButton">
                        Update Profile
                      </Button>
                      <Button
                        variant="outline-light"
                        size="sm"
                        className="profileActionButton"
                        onClick={() => setActiveTab('family')}
                      >
                        Manage Family
                      </Button>
                      <Button
                        variant="outline-light"
                        size="sm"
                        className="profileActionButton"
                        onClick={() => setActiveTab('bookings')}
                      >
                        View Bookings
                      </Button>
                    </div>
                  </div>

                  <Row className="gy-4 profileContent">
                    <Col lg={8}>
                      <Card className="profileInfoCard">
                        <Card.Body>
                          <div className="profileSectionHeader">
                            <div>
                              <p className="sectionEyebrow">Personal Details</p>
                              <h5 className="mb-0">Account & Identity</h5>
                            </div>
                            <Badge bg="success" className="profileStatusBadge">
                              Verified Member
                            </Badge>
                          </div>

                          <div className="profileDetailsGrid">
                            {profileDetailItems.map((detail) => (
                              <div key={detail.label} className="profileDetailItem">
                                <span className="label">{detail.label}</span>
                                <p className="value">{detail.value}</p>
                              </div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>

                      <Card className="profileInfoCard">
                        <Card.Body>
                          <div className="profileSectionHeader">
                            <div>
                              <p className="sectionEyebrow">Journey Snapshot</p>
                              <h5 className="mb-0">Pilgrimage Insights</h5>
                            </div>
                            <span className="profileChip">Real-time metrics</span>
                          </div>

                          <div className="profileStatsGrid">
                            <div className="profileStatCard">
                              <span className="label">Active Bookings</span>
                              <h3>{activeBookingsCount}</h3>
                              <small>Currently planned journeys</small>
                            </div>
                            <div className="profileStatCard">
                              <span className="label">Family Members</span>
                              <h3>{familyMembers.length + 1}</h3>
                              <small>Linked travellers</small>
                            </div>
                            <div className="profileStatCard">
                              <span className="label">Total Pilgrims</span>
                              <h3>{Math.max(totalPilgrims, 1)}</h3>
                              <small>Across all bookings</small>
                            </div>
                            <div className="profileStatCard">
                              <span className="label">Confirmed Tours</span>
                              <h3>{confirmedBookingsCount}</h3>
                              <small>Awaiting departure</small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={4}>
                      <Card className="profileInfoCard">
                        <Card.Body>
                          <div className="profileSectionHeader">
                            <div>
                              <p className="sectionEyebrow">Contact Preferences</p>
                              <h5 className="mb-0">Stay Connected</h5>
                            </div>
                          </div>
                          <ul className="profileContactList">
                            <li>
                              <span>Email</span>
                              <span>{user?.email || 'Not provided'}</span>
                            </li>
                            <li>
                              <span>Phone</span>
                              <span>{maskedPhone}</span>
                            </li>
                            <li>
                              <span>Notifications</span>
                              <span>App & Email</span>
                            </li>
                            <li>
                              <span>Latest Booking</span>
                              <span>{latestBooking ? new Date(latestBooking.createdAt).toLocaleDateString() : 'None'}</span>
                            </li>
                          </ul>
                        </Card.Body>
                      </Card>

                      <Card className="profileInfoCard profileTimelineCard mt-4">
                        <Card.Body>
                          <div className="profileSectionHeader">
                            <div>
                              <p className="sectionEyebrow text-white-50">Journey Timeline</p>
                              <h5 className="mb-0 text-white">Recent Highlights</h5>
                            </div>
                          </div>
                          <ul className="profileTimeline">
                            {profileTimeline.map((item) => (
                              <li key={item.title} className="profileTimelineItem">
                                <span className="timelineDot" />
                                <div>
                                  <p className="timelineLabel">{item.title}</p>
                                  <p className="timelineValue">{item.description}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
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
    </div>
  )
}

export default MemberDashboard