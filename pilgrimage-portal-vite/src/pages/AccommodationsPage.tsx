import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { accommodationsAPI, toursAPI, bookingsAPI, type Accommodation, type Room, type Tour, type Booking } from '../services/api'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  InputGroup,
  Accordion
} from 'react-bootstrap'
import './AccommodationsPage.css'

const AccommodationsPage: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    state: '',
    isActive: true,
    isVerified: false as boolean | undefined,
    minRating: '',
    page: 1,
    limit: 10
  })

  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [accommodationForm, setAccommodationForm] = useState({
    name: '',
    category: 'hotel' as const,
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    owner: {
      name: '',
      phone: '',
      email: ''
    },
    facilities: [] as string[],
    pricing: {
      basePrice: 0,
      extraPersonCharge: 0
    },
    policies: {
      cancellationPolicy: '',
      checkInPolicy: '',
      childPolicy: ''
    }
  })

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomType: 'double' as const,
    capacity: 2,
    facilities: [] as string[],
    pricePerNight: 0
  })

  const [showRoomModal, setShowRoomModal] = useState(false)
  const [selectedAccommodationForRoom, setSelectedAccommodationForRoom] = useState<string>('')
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  const categories = [
    { value: 'hotel', label: 'Hotel', icon: '🏨' },
    { value: 'cottage', label: 'Cottage', icon: '🏘️' },
    { value: 'guest-house', label: 'Guest House', icon: '🏠' },
    { value: 'marriage-hall', label: 'Marriage Hall', icon: '🏛️' },
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'lodge', label: 'Lodge', icon: '🏚️' }
  ]

  const roomTypes = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'triple', label: 'Triple' },
    { value: 'family', label: 'Family' },
    { value: 'dormitory', label: 'Dormitory' },
    { value: 'suite', label: 'Suite' }
  ]

  const facilitiesOptions = [
    'heater', 'bathroom', 'bed', 'ac', 'wifi', 'tv', 'refrigerator',
    'parking', 'restaurant', 'room-service', 'laundry', 'power-backup',
    'elevator', 'gym', 'swimming-pool', 'conference-hall', 'garden',
    'temple-nearby', 'market-nearby', 'medical-nearby'
  ]

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchData()
  }, [isAuthenticated, user, navigate, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const cleanFilters = {
        ...filters,
        minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
        isVerified: filters.isVerified
      }
      
      const accommodationsResponse = await accommodationsAPI.getAll(cleanFilters).catch(() => ({ data: { accommodations: [], total: 0 } }))
      
      setAccommodations(accommodationsResponse.data.accommodations || [])
    } catch (error: any) {
      console.error('Error fetching accommodations:', error)
      setError('Failed to load accommodations data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAccommodation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const accommodationData = {
        ...accommodationForm,
        facilities: accommodationForm.facilities,
        pricing: {
          ...accommodationForm.pricing,
          seasonalRates: []
        },
        isActive: true,
        isVerified: false,
        rating: {
          overall: 0,
          cleanliness: 0,
          service: 0,
          location: 0,
          reviewCount: 0
        },
        images: [],
        rooms: [],
        associatedTours: []
      }
      
      if (editingAccommodation) {
        await accommodationsAPI.update(editingAccommodation._id, accommodationData)
      } else {
        await accommodationsAPI.create(accommodationData as any)
      }
      
      setShowModal(false)
      resetAccommodationForm()
      await fetchData()
    } catch (error) {
      console.error('Error saving accommodation:', error)
      setError('Failed to save accommodation')
    }
  }

  const handleDeleteAccommodation = async (accommodationId: string) => {
    if (!confirm('Are you sure you want to delete this accommodation?')) return
    
    try {
      await accommodationsAPI.delete(accommodationId)
      await fetchData()
    } catch (error) {
      console.error('Error deleting accommodation:', error)
      setError('Failed to delete accommodation')
    }
  }

  const handleEditAccommodation = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation)
    setAccommodationForm({
      name: accommodation.name,
      category: accommodation.category as any,
      description: accommodation.description || '',
      location: accommodation.location,
      contact: {
        phone: accommodation.contact.phone,
        email: accommodation.contact.email || '',
        website: accommodation.contact.website || ''
      },
      owner: {
        name: accommodation.owner.name,
        phone: accommodation.owner.phone,
        email: accommodation.owner.email || ''
      },
      facilities: accommodation.facilities,
      pricing: accommodation.pricing,
      policies: {
        cancellationPolicy: accommodation.policies?.cancellationPolicy || '',
        checkInPolicy: accommodation.policies?.checkInPolicy || '',
        childPolicy: accommodation.policies?.childPolicy || ''
      }
    })
    setShowModal(true)
  }

  const resetAccommodationForm = () => {
    setAccommodationForm({
      name: '',
      category: 'hotel',
      description: '',
      location: {
        address: '',
        city: '',
        state: '',
        pincode: ''
      },
      contact: {
        phone: '',
        email: '',
        website: ''
      },
      owner: {
        name: '',
        phone: '',
        email: ''
      },
      facilities: [],
      pricing: {
        basePrice: 0,
        extraPersonCharge: 0
      },
      policies: {
        cancellationPolicy: '',
        checkInPolicy: '',
        childPolicy: ''
      }
    })
    setEditingAccommodation(null)
  }

  // Room management functions
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const roomData = {
        ...roomForm,
        isAvailable: true
      }
      
      if (editingRoom) {
        await accommodationsAPI.updateRoom(selectedAccommodationForRoom, editingRoom._id!, roomData)
      } else {
        await accommodationsAPI.addRoom(selectedAccommodationForRoom, roomData)
      }
      
      setShowRoomModal(false)
      resetRoomForm()
      await fetchData()
    } catch (error) {
      console.error('Error saving room:', error)
      setError('Failed to save room')
    }
  }

  const handleDeleteRoom = async (accommodationId: string, roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return
    
    try {
      await accommodationsAPI.deleteRoom(accommodationId, roomId)
      await fetchData()
    } catch (error) {
      console.error('Error deleting room:', error)
      setError('Failed to delete room')
    }
  }

  const handleEditRoom = (accommodationId: string, room: Room) => {
    setSelectedAccommodationForRoom(accommodationId)
    setEditingRoom(room)
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType as any,
      capacity: room.capacity,
      facilities: room.facilities,
      pricePerNight: room.pricePerNight
    })
    setShowRoomModal(true)
  }

  const resetRoomForm = () => {
    setRoomForm({
      roomNumber: '',
      roomType: 'double',
      capacity: 2,
      facilities: [],
      pricePerNight: 0
    })
    setEditingRoom(null)
  }

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || { value: category, label: category, icon: '🏨' }
  }

  const getCategoryBadge = (category: string) => {
    const categoryInfo = getCategoryInfo(category)
    const colors: Record<string, string> = {
      'hotel': 'primary',
      'cottage': 'success',
      'guest-house': 'info',
      'marriage-hall': 'warning',
      'apartment': 'secondary',
      'lodge': 'dark'
    }
    return (
      <Badge bg={colors[category] || 'secondary'}>
        {categoryInfo.icon} {categoryInfo.label}
      </Badge>
    )
  }

  const handleFacilityToggle = (facility: string, isRoom = false) => {
    if (isRoom) {
      setRoomForm(prev => ({
        ...prev,
        facilities: prev.facilities.includes(facility)
          ? prev.facilities.filter(f => f !== facility)
          : [...prev.facilities, facility]
      }))
    } else {
      setAccommodationForm(prev => ({
        ...prev,
        facilities: prev.facilities.includes(facility)
          ? prev.facilities.filter(f => f !== facility)
          : [...prev.facilities, facility]
      }))
    }
  }

  if (loading) {
    return (
      <div className="accommodationsContainer">
        <div className="loadingContainer">
          <div className="loadingSpinner"></div>
          <p className="loadingText">Loading accommodations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="accommodationsContainer">
      <Container fluid>
        <div className="pageHeader">
          <Row className="align-items-center">
            <Col>
              <p className="pageSubtitle">Experience luxury accommodation management with elegant controls for hotels, cottages, guest houses, and premium lodging facilities</p>
            </Col>
            <Col xs="auto">
              <Button 
                className="addButton"
                onClick={() => {
                  resetAccommodationForm()
                  setShowModal(true)
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add Accommodation
              </Button>
            </Col>
          </Row>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'list')} className="customTabs mb-4">
          <Tab eventKey="list" title={<span className="purpleTabTitle">📋 Accommodations List</span>}>
            {/* Filters */}
            <div className="filterSection">
              <h5 className="filterTitle">🔍 Filters</h5>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Category</Form.Label>
                    <Form.Select 
                      className="enhancedFormControl"
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">City</Form.Label>
                    <Form.Control 
                      className="enhancedFormControl"
                      type="text" 
                      value={filters.city}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city..."
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">State</Form.Label>
                    <Form.Control 
                      className="enhancedFormControl"
                      type="text" 
                      value={filters.state}
                      onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state..."
                    />
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    className="secondaryButton"
                    onClick={() => setFilters({
                      category: '',
                      city: '',
                      state: '',
                      isActive: true,
                      isVerified: false,
                      minRating: '',
                      page: 1,
                      limit: 10
                    })}
                  >
                    Clear
                  </Button>
                </Col>
              </Row>
            </div>

          {/* Accommodations Table */}
          <Card className="enhancedCard">
            <div className="cardHeader">
              <h5 className="cardTitle">🏨 Accommodations ({accommodations.length})</h5>
            </div>
            <Card.Body>
              {accommodations.length === 0 ? (
                <Alert variant="info">
                  No accommodations found. Add your first accommodation to get started.
                </Alert>
              ) : (
                <Table responsive className="enhancedTable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Rooms</th>
                      <th>Rating</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accommodations.map(accommodation => (
                      <tr key={accommodation._id}>
                        <td>
                          <strong>{accommodation.name}</strong>
                          <br />
                          <small className="text-muted">{accommodation.description?.substring(0, 50)}...</small>
                        </td>
                        <td>{getCategoryBadge(accommodation.category)}</td>
                        <td>
                          <small>
                            {accommodation.location.city}, {accommodation.location.state}
                            <br />
                            📞 {accommodation.contact.phone}
                          </small>
                        </td>
                        <td>
                          <Badge bg="info">{accommodation.rooms.length} rooms</Badge>
                          <br />
                          <small>Capacity: {accommodation.rooms.reduce((sum, room) => sum + room.capacity, 0)}</small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-1">⭐</span>
                            <span>{accommodation.rating.overall.toFixed(1)}</span>
                            <br />
                            <small>({accommodation.rating.reviewCount} reviews)</small>
                          </div>
                        </td>
                        <td>
                          <strong>₹{accommodation.pricing.basePrice.toLocaleString()}</strong>
                          <br />
                          <small>base price</small>
                        </td>
                        <td>
                          <Badge bg={accommodation.isActive ? 'success' : 'secondary'}>
                            {accommodation.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <br />
                          <Badge bg={accommodation.isVerified ? 'primary' : 'warning'}>
                            {accommodation.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              onClick={() => handleEditAccommodation(accommodation)}
                            >
                              ✏️ Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-success" 
                              onClick={() => {
                                setSelectedAccommodationForRoom(accommodation._id)
                                resetRoomForm()
                                setShowRoomModal(true)
                              }}
                            >
                              🛏️ Add Room
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              onClick={() => handleDeleteAccommodation(accommodation._id)}
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="rooms" title={<span className="purpleTabTitle">🛏️ Room Management</span>}>
          <Card>
            <Card.Body>
              <h5>🛏️ All Rooms by Accommodation</h5>
              {accommodations.length === 0 ? (
                <Alert variant="info">
                  No accommodations available. Please add accommodations first.
                </Alert>
              ) : (
                <Accordion>
                  {accommodations.map(accommodation => (
                    <Accordion.Item key={accommodation._id} eventKey={accommodation._id}>
                      <Accordion.Header>
                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                          <span>
                            {getCategoryBadge(accommodation.category)} {accommodation.name}
                          </span>
                          <Badge bg="info">{accommodation.rooms.length} rooms</Badge>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6>Rooms in {accommodation.name}</h6>
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => {
                              setSelectedAccommodationForRoom(accommodation._id)
                              resetRoomForm()
                              setShowRoomModal(true)
                            }}
                          >
                            + Add Room
                          </Button>
                        </div>
                        
                        {accommodation.rooms.length === 0 ? (
                          <Alert variant="light">No rooms added yet.</Alert>
                        ) : (
                          <Table size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Room #</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Price/Night</th>
                                <th>Facilities</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {accommodation.rooms.map(room => (
                                <tr key={room._id}>
                                  <td><strong>{room.roomNumber}</strong></td>
                                  <td>
                                    <Badge bg="secondary">{room.roomType}</Badge>
                                  </td>
                                  <td>{room.capacity} guests</td>
                                  <td>₹{room.pricePerNight.toLocaleString()}</td>
                                  <td>
                                    {room.facilities.slice(0, 3).map(facility => (
                                      <Badge key={facility} bg="light" text="dark" className="me-1">
                                        {facility}
                                      </Badge>
                                    ))}
                                    {room.facilities.length > 3 && (
                                      <Badge bg="light" text="dark">+{room.facilities.length - 3}</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Badge bg={room.isAvailable ? 'success' : 'danger'}>
                                      {room.isAvailable ? 'Available' : 'Booked'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      size="sm" 
                                      variant="outline-primary" 
                                      onClick={() => handleEditRoom(accommodation._id, room)}
                                      className="me-1"
                                    >
                                      ✏️
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline-danger" 
                                      onClick={() => handleDeleteRoom(accommodation._id, room._id!)}
                                    >
                                      🗑️
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="itinerary" title={<span className="purpleTabTitle">🗺️ Itinerary View</span>}>
          <Card>
            <Card.Body>
              <h5>🗺️ Accommodations by Tour Itinerary</h5>
              <ItineraryView />
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="bookings" title={<span className="bookingTabTitle">📋 Book an Assignment</span>}>
          <Card>
            <Card.Body>
              <h5>📋 Room Booking Assignments</h5>
              <BookingAssignments />
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add/Edit Accommodation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAccommodation ? '✏️ Edit Accommodation' : '➕ Add New Accommodation'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveAccommodation}>
          <Modal.Body>
            <Tabs defaultActiveKey="basic" className="mb-3">
              <Tab eventKey="basic" title="Basic Info">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control 
                        type="text" 
                        required
                        value={accommodationForm.name}
                        onChange={(e) => setAccommodationForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter accommodation name..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select 
                        required
                        value={accommodationForm.category}
                        onChange={(e) => setAccommodationForm(prev => ({ ...prev, category: e.target.value as any }))}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3}
                    value={accommodationForm.description}
                    onChange={(e) => setAccommodationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the accommodation..."
                  />
                </Form.Group>

                <h6>📍 Location Information</h6>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address *</Form.Label>
                      <Form.Control 
                        type="text" 
                        required
                        value={accommodationForm.location.address}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          location: { ...prev.location, address: e.target.value }
                        }))}
                        placeholder="Enter full address..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control 
                        type="text" 
                        required
                        value={accommodationForm.location.city}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          location: { ...prev.location, city: e.target.value }
                        }))}
                        placeholder="City"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Control 
                        type="text" 
                        required
                        value={accommodationForm.location.state}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          location: { ...prev.location, state: e.target.value }
                        }))}
                        placeholder="State"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pincode *</Form.Label>
                      <Form.Control 
                        type="text" 
                        required
                        pattern="[0-9]{6}"
                        value={accommodationForm.location.pincode}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          location: { ...prev.location, pincode: e.target.value }
                        }))}
                        placeholder="6-digit pincode"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="contact" title="Contact & Owner">
                <h6>📞 Contact Information</h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone *</Form.Label>
                      <Form.Control 
                        type="tel" 
                        required
                        pattern="[0-9]{10}"
                        value={accommodationForm.contact.phone}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, phone: e.target.value }
                        }))}
                        placeholder="10-digit phone number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={accommodationForm.contact.email}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, email: e.target.value }
                        }))}
                        placeholder="contact@accommodation.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Website</Form.Label>
                      <Form.Control 
                        type="url" 
                        value={accommodationForm.contact.website}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, website: e.target.value }
                        }))}
                        placeholder="https://website.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6>👤 Owner Information</h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Owner Name *</Form.Label>
                      <Form.Control 
                        type="text" 
                        required
                        value={accommodationForm.owner.name}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          owner: { ...prev.owner, name: e.target.value }
                        }))}
                        placeholder="Owner full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Owner Phone *</Form.Label>
                      <Form.Control 
                        type="tel" 
                        required
                        pattern="[0-9]{10}"
                        value={accommodationForm.owner.phone}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          owner: { ...prev.owner, phone: e.target.value }
                        }))}
                        placeholder="10-digit phone number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Owner Email</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={accommodationForm.owner.email}
                        onChange={(e) => setAccommodationForm(prev => ({ 
                          ...prev, 
                          owner: { ...prev.owner, email: e.target.value }
                        }))}
                        placeholder="owner@email.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="facilities" title="Facilities & Pricing">
                <h6>🏠 Facilities</h6>
                <Row>
                  {facilitiesOptions.map(facility => (
                    <Col md={3} key={facility} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id={`facility-${facility}`}
                        label={facility.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        checked={accommodationForm.facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                      />
                    </Col>
                  ))}
                </Row>

                <h6 className="mt-4">💰 Pricing</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Base Price (₹) *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>₹</InputGroup.Text>
                        <Form.Control 
                          type="number" 
                          required
                          min="0"
                          step="1"
                          value={accommodationForm.pricing.basePrice}
                          onChange={(e) => setAccommodationForm(prev => ({ 
                            ...prev, 
                            pricing: { ...prev.pricing, basePrice: parseFloat(e.target.value) || 0 }
                          }))}
                          placeholder="0"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Extra Person Charge (₹)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>₹</InputGroup.Text>
                        <Form.Control 
                          type="number" 
                          min="0"
                          step="1"
                          value={accommodationForm.pricing.extraPersonCharge}
                          onChange={(e) => setAccommodationForm(prev => ({ 
                            ...prev, 
                            pricing: { ...prev.pricing, extraPersonCharge: parseFloat(e.target.value) || 0 }
                          }))}
                          placeholder="0"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="policies" title="Policies">
                <Form.Group className="mb-3">
                  <Form.Label>Cancellation Policy</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={accommodationForm.policies.cancellationPolicy}
                    onChange={(e) => setAccommodationForm(prev => ({ 
                      ...prev, 
                      policies: { ...prev.policies, cancellationPolicy: e.target.value }
                    }))}
                    placeholder="Describe cancellation policy..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Check-in Policy</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={accommodationForm.policies.checkInPolicy}
                    onChange={(e) => setAccommodationForm(prev => ({ 
                      ...prev, 
                      policies: { ...prev.policies, checkInPolicy: e.target.value }
                    }))}
                    placeholder="Describe check-in/check-out policies..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Child Policy</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={accommodationForm.policies.childPolicy}
                    onChange={(e) => setAccommodationForm(prev => ({ 
                      ...prev, 
                      policies: { ...prev.policies, childPolicy: e.target.value }
                    }))}
                    placeholder="Describe child/infant policies..."
                  />
                </Form.Group>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {editingAccommodation ? 'Update Accommodation' : 'Save Accommodation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add/Edit Room Modal */}
      <Modal show={showRoomModal} onHide={() => setShowRoomModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRoom ? '✏️ Edit Room' : '🛏️ Add New Room'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRoom}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Room Number *</Form.Label>
                  <Form.Control 
                    type="text" 
                    required
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g., 101, A1, etc."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Room Type *</Form.Label>
                  <Form.Select 
                    required
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, roomType: e.target.value as any }))}
                  >
                    {roomTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity *</Form.Label>
                  <Form.Control 
                    type="number" 
                    required
                    min="1"
                    max="20"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price per Night (₹) *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      required
                      min="0"
                      step="1"
                      value={roomForm.pricePerNight}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, pricePerNight: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <h6>🛠️ Room Facilities</h6>
            <Row>
              {facilitiesOptions.slice(0, 12).map(facility => (
                <Col md={4} key={facility} className="mb-2">
                  <Form.Check 
                    type="checkbox"
                    id={`room-facility-${facility}`}
                    label={facility.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    checked={roomForm.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility, true)}
                  />
                </Col>
              ))}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRoomModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {editingRoom ? 'Update Room' : 'Save Room'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      </Container>
    </div>
  )
}

// Itinerary View Component
const ItineraryView: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedTour, setSelectedTour] = useState<string>('')
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [itineraryAccommodations, setItineraryAccommodations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    try {
      const response = await toursAPI.getAll({ limit: 100 })
      setTours(response.data.tours || [])
    } catch (error) {
      console.error('Error fetching tours:', error)
    }
  }

  const handleTourChange = async (tourId: string) => {
    setSelectedTour(tourId)
    if (tourId) {
      await fetchItineraryAccommodations(tourId)
    } else {
      setItineraryAccommodations([])
    }
  }

  const fetchItineraryAccommodations = async (tourId: string) => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedDestination) params.destination = selectedDestination
      if (selectedDate) params.date = selectedDate

      const response = await accommodationsAPI.getByItinerary(tourId, params)
      setItineraryAccommodations(response.data.accommodations || [])
    } catch (error) {
      console.error('Error fetching itinerary accommodations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedTourData = tours.find(tour => tour._id === selectedTour)

  return (
    <div>
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Select Tour</Form.Label>
            <Form.Select 
              value={selectedTour}
              onChange={(e) => handleTourChange(e.target.value)}
            >
              <option value="">Choose a tour...</option>
              {tours.map(tour => (
                <option key={tour._id} value={tour._id}>
                  {tour.title}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Destination</Form.Label>
            <Form.Control
              type="text"
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              placeholder="Enter destination..."
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Check Availability Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {selectedTour && (
        <Row className="mb-3">
          <Col>
            <Button 
              variant="primary" 
              onClick={() => fetchItineraryAccommodations(selectedTour)}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" className="me-2" /> : '🔍'} Search Accommodations
            </Button>
          </Col>
        </Row>
      )}

      {selectedTourData && (
        <Card className="mb-4">
          <Card.Body>
            <h6>🗺️ Tour Details</h6>
            <p><strong>Title:</strong> {selectedTourData.title}</p>
            <p><strong>Duration:</strong> {selectedTourData.duration.days} days, {selectedTourData.duration.nights} nights</p>
            <p><strong>Destinations:</strong> {selectedTourData.destinations?.map(d => d.name).join(', ')}</p>
          </Card.Body>
        </Card>
      )}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading accommodations...</p>
        </div>
      ) : itineraryAccommodations.length > 0 ? (
        <Card>
          <Card.Body>
            <h6>🏨 Available Accommodations ({itineraryAccommodations.length})</h6>
            <Row>
              {itineraryAccommodations.map(accommodation => (
                <Col md={6} lg={4} key={accommodation._id} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title">{accommodation.name}</h6>
                        <Badge bg="primary">{accommodation.category}</Badge>
                      </div>
                      <p className="text-muted small mb-2">
                        📍 {accommodation.location.city}, {accommodation.location.state}
                      </p>
                      <p className="small mb-2">
                        🛏️ {accommodation.rooms.length} rooms | 
                        👥 {accommodation.rooms.reduce((sum: number, room: any) => sum + room.capacity, 0)} capacity
                      </p>
                      <p className="small mb-2">
                        💰 From ₹{Math.min(...accommodation.rooms.map((room: any) => room.pricePerNight)).toLocaleString()}/night
                      </p>
                      {selectedDate && (
                        <p className="small">
                          <Badge bg={accommodation.rooms.some((room: any) => room.isAvailableOnDate !== false) ? 'success' : 'danger'}>
                            {accommodation.rooms.some((room: any) => room.isAvailableOnDate !== false) ? 'Available' : 'Fully Booked'}
                          </Badge>
                        </p>
                      )}
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {accommodation.facilities.slice(0, 3).map((facility: string) => (
                          <Badge key={facility} bg="light" text="dark" className="small">
                            {facility}
                          </Badge>
                        ))}
                        {accommodation.facilities.length > 3 && (
                          <Badge bg="light" text="dark" className="small">+{accommodation.facilities.length - 3}</Badge>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      ) : selectedTour ? (
        <Alert variant="info">
          No accommodations found for the selected criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <Alert variant="light">
          Please select a tour to view available accommodations.
        </Alert>
      )}
    </div>
  )
}

// Booking Assignments Component
const BookingAssignments: React.FC = () => {
  const [bookingId, setBookingId] = useState<string>('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomAssignments, setRoomAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: [] as Array<{ name: string; age: number; relation: string }>
  })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAll()
      setBookings(response.data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleBookingSelect = async (selectedBookingId: string) => {
    setBookingId(selectedBookingId)
    if (selectedBookingId) {
      await fetchRoomAssignments(selectedBookingId)
    } else {
      setRoomAssignments([])
    }
  }

  const fetchRoomAssignments = async (selectedBookingId: string) => {
    try {
      setLoading(true)
      const response = await accommodationsAPI.getBookingRoomAssignments(selectedBookingId)
      setRoomAssignments(response.data.roomAssignments || [])
    } catch (error) {
      console.error('Error fetching room assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async (accommodationId: string, roomId: string) => {
    if (!confirm('Remove this room assignment?')) return
    
    try {
      await accommodationsAPI.removeRoomBooking(accommodationId, roomId, bookingId)
      await fetchRoomAssignments(bookingId)
    } catch (error) {
      console.error('Error removing assignment:', error)
    }
  }

  const selectedBooking = bookings.find(booking => booking._id === bookingId)

  return (
    <div>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Booking</Form.Label>
            <Form.Select 
              value={bookingId}
              onChange={(e) => handleBookingSelect(e.target.value)}
            >
              <option value="">Choose a booking...</option>
              {bookings.map(booking => (
                <option key={booking._id} value={booking._id}>
                  Booking #{booking._id.slice(-6)} - {booking.tour?.title || 'Unknown Tour'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button 
            variant="success" 
            onClick={() => setShowAssignModal(true)}
            disabled={!bookingId}
          >
            + Assign Room
          </Button>
        </Col>
      </Row>

      {selectedBooking && (
        <Card className="mb-4">
          <Card.Body>
            <h6>📋 Booking Details</h6>
            <Row>
              <Col md={6}>
                <p><strong>Booking ID:</strong> #{selectedBooking._id.slice(-6)}</p>
                <p><strong>Tour:</strong> {selectedBooking.tour?.title || 'Unknown'}</p>
                <p><strong>Status:</strong> <Badge bg="primary">{selectedBooking.status}</Badge></p>
              </Col>
              <Col md={6}>
                <p><strong>Participants:</strong> {selectedBooking.participants.length}</p>
                <p><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount.toLocaleString()}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading room assignments...</p>
        </div>
      ) : roomAssignments.length > 0 ? (
        <Card>
          <Card.Body>
            <h6>🛏️ Room Assignments ({roomAssignments.length})</h6>
            <Table responsive>
              <thead>
                <tr>
                  <th>Accommodation</th>
                  <th>Room</th>
                  <th>Location</th>
                  <th>Check-in/out</th>
                  <th>Guests</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomAssignments.map(assignment => (
                  <tr key={`${assignment.accommodationId}-${assignment.roomId}`}>
                    <td>
                      <strong>{assignment.accommodationName}</strong>
                      <br />
                      <Badge bg="secondary">{assignment.accommodationCategory}</Badge>
                    </td>
                    <td>
                      <strong>Room {assignment.roomNumber}</strong>
                      <br />
                      <small>{assignment.roomType} | 👥 {assignment.capacity}</small>
                    </td>
                    <td>
                      <small>
                        {assignment.location.city}, {assignment.location.state}
                      </small>
                    </td>
                    <td>
                      <small>
                        <strong>In:</strong> {new Date(assignment.checkIn).toLocaleDateString()}
                        <br />
                        <strong>Out:</strong> {new Date(assignment.checkOut).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <small>{assignment.guests.length} guests assigned</small>
                    </td>
                    <td>
                      <strong>₹{assignment.pricePerNight.toLocaleString()}</strong>
                      <br />
                      <small>per night</small>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="outline-danger"
                        onClick={() => handleRemoveAssignment(assignment.accommodationId, assignment.roomId)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : bookingId ? (
        <Alert variant="info">
          No room assignments found for this booking. Click "Assign Room" to add accommodations.
        </Alert>
      ) : (
        <Alert variant="light">
          Please select a booking to view room assignments.
        </Alert>
      )}

      {/* Room Assignment Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🛏️ Assign Room to Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Check-in Date *</Form.Label>
                  <Form.Control 
                    type="date"
                    required
                    value={assignmentForm.checkIn}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Check-out Date *</Form.Label>
                  <Form.Control 
                    type="date"
                    required
                    value={assignmentForm.checkOut}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {assignmentForm.checkIn && assignmentForm.checkOut && (
              <Alert variant="info">
                Available rooms will be shown here based on selected dates. This is a placeholder for room selection UI.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button variant="success" disabled={!assignmentForm.checkIn || !assignmentForm.checkOut}>
            Assign Room
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AccommodationsPage