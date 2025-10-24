import React, { useState } from 'react'
import { 
  Modal, 
  Form, 
  Button, 
  Row, 
  Col, 
  Table, 
  Alert, 
  Spinner,
  Card
} from 'react-bootstrap'
import { bookingsAPI, FamilyMember, Tour } from '../services/api'
import { useAuth } from '../services/AuthContext'

interface TourBookingProps {
  show: boolean
  onHide: () => void
  tour: Tour
  onBookingSuccess: () => void
}

const TourBooking: React.FC<TourBookingProps> = ({ 
  show, 
  onHide, 
  tour, 
  onBookingSuccess 
}) => {
  const [participants, setParticipants] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const { user } = useAuth()

  const [newParticipant, setNewParticipant] = useState({
    name: '',
    age: '',
    aadhar: '',
    relation: ''
  })

  const addParticipant = () => {
    if (!newParticipant.name || !newParticipant.age || !newParticipant.aadhar) {
      setError('Please fill all participant details')
      return
    }

    if (newParticipant.aadhar.length !== 12) {
      setError('Aadhar number must be 12 digits')
      return
    }

    const participant: FamilyMember = {
      name: newParticipant.name,
      age: parseInt(newParticipant.age),
      aadhar: newParticipant.aadhar,
      relation: newParticipant.relation || 'Self'
    }

    setParticipants(prev => [...prev, participant])
    setNewParticipant({ name: '', age: '', aadhar: '', relation: '' })
    setError(null)
  }

  const removeParticipant = (index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return participants.reduce((total, participant) => {
      if (participant.age < 5) return total // Free for children under 5
      if (participant.age < 18) return total + tour.pricing.child
      if (participant.age >= 60) return total + tour.pricing.senior
      return total + tour.pricing.adult
    }, 0)
  }

  const handleBooking = async () => {
    if (participants.length === 0) {
      setError('Please add at least one participant')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Transform participants to match backend validation requirements
      const transformedParticipants = participants.map((participant, index) => {
        // Determine price category based on age
        let priceCategory: 'adult' | 'child' | 'senior' = 'adult'
        if (participant.age < 5) {
          priceCategory = 'child' // Free but still considered child category
        } else if (participant.age < 18) {
          priceCategory = 'child'
        } else if (participant.age >= 60) {
          priceCategory = 'senior'
        }

        return {
          type: index === 0 ? 'primary' : 'family', // First participant is primary, rest are family
          name: participant.name,
          age: participant.age,
          aadharNumber: participant.aadhar, // Map aadhar -> aadharNumber
          relationship: participant.relation.toLowerCase(), // Map relation -> relationship
          priceCategory: priceCategory // Add required priceCategory field
        }
      })

      await bookingsAPI.create({
        tourId: tour._id,
        participants: transformedParticipants
      })
      
      onBookingSuccess()
      onHide()
      setParticipants([])
      setCurrentStep(1)
    } catch (error: any) {
      console.error('Booking error:', error)
      setError(error.response?.data?.message || 'Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setParticipants([])
    setNewParticipant({ name: '', age: '', aadhar: '', relation: '' })
    setCurrentStep(1)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Book Tour: {tour.title}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Tour Summary */}
        <Card className="mb-4 bg-light">
          <Card.Body className="py-3">
            <Row>
              <Col md={8}>
                <h6 className="mb-1">{tour.title}</h6>
                <small className="text-muted">
                  {tour.duration.days}D/{tour.duration.nights}N • {tour.category}
                </small>
              </Col>
              <Col md={4} className="text-end">
                <strong className="text-primary">
                  Starting from ₹{tour.pricing.adult.toLocaleString()}
                </strong>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {currentStep === 1 && (
          <>
            <h6 className="mb-3">Add Participants</h6>
            
            {/* Add Participant Form */}
            <Card className="mb-3">
              <Card.Header className="py-2">
                <small className="fw-bold">Add New Participant</small>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Full Name</Form.Label>
                      <Form.Control
                        size="sm"
                        type="text"
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant(prev => ({ 
                          ...prev, 
                          name: e.target.value 
                        }))}
                        placeholder="Enter full name"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Age</Form.Label>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={newParticipant.age}
                        onChange={(e) => setNewParticipant(prev => ({ 
                          ...prev, 
                          age: e.target.value 
                        }))}
                        min="1"
                        max="120"
                        placeholder="Age"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Relation</Form.Label>
                      <Form.Select
                        size="sm"
                        value={newParticipant.relation}
                        onChange={(e) => setNewParticipant(prev => ({ 
                          ...prev, 
                          relation: e.target.value 
                        }))}
                      >
                        <option value="Self">Self</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small">Aadhar Number</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    value={newParticipant.aadhar}
                    onChange={(e) => setNewParticipant(prev => ({ 
                      ...prev, 
                      aadhar: e.target.value.replace(/\D/g, '').slice(0, 12)
                    }))}
                    placeholder="12-digit Aadhar number"
                    maxLength={12}
                  />
                </Form.Group>
                
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={addParticipant}
                >
                  Add Participant
                </Button>
              </Card.Body>
            </Card>

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="mb-3">
                <h6 className="mb-2">Selected Participants ({participants.length})</h6>
                <div className="table-responsive">
                  <Table size="sm" bordered>
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Relation</th>
                        <th>Price Category</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => {
                        let priceCategory = 'Adult'
                        let amount = tour.pricing.adult
                        
                        if (participant.age < 5) {
                          priceCategory = 'Free'
                          amount = 0
                        } else if (participant.age < 18) {
                          priceCategory = 'Child'
                          amount = tour.pricing.child
                        } else if (participant.age >= 60) {
                          priceCategory = 'Senior'
                          amount = tour.pricing.senior
                        }
                        
                        return (
                          <tr key={index}>
                            <td>{participant.name}</td>
                            <td>{participant.age}</td>
                            <td>{participant.relation}</td>
                            <td>{priceCategory}</td>
                            <td>₹{amount.toLocaleString()}</td>
                            <td>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => removeParticipant(index)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan={4} className="text-end">Total Amount:</th>
                        <th>₹{calculateTotal().toLocaleString()}</th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </div>
            )}

            {participants.length > 0 && (
              <div className="text-end">
                <Button 
                  variant="primary"
                  onClick={() => setCurrentStep(2)}
                >
                  Continue to Review
                </Button>
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <h6 className="mb-3">Booking Review</h6>
            
            <Row className="mb-3">
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header className="py-2">
                    <small className="fw-bold">Tour Details</small>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-1"><strong>{tour.title}</strong></p>
                    <p className="mb-1">Duration: {tour.duration.days}D/{tour.duration.nights}N</p>
                    <p className="mb-1">Category: {tour.category}</p>
                    <p className="mb-0">Difficulty: {tour.difficulty}</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header className="py-2">
                    <small className="fw-bold">Booking Summary</small>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-1">Total Participants: {participants.length}</p>
                    <p className="mb-1">Booked by: {user?.name}</p>
                    <p className="mb-1">Contact: {user?.email}</p>
                    <p className="mb-0 text-primary">
                      <strong>Total Amount: ₹{calculateTotal().toLocaleString()}</strong>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Alert variant="info" className="mb-3">
              <small>
                <i className="fas fa-info-circle me-2"></i>
                <strong>Note:</strong> This booking is subject to confirmation. 
                You will receive an email confirmation with payment details once your booking is approved.
              </small>
            </Alert>

            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary"
                onClick={() => setCurrentStep(1)}
              >
                Back to Edit
              </Button>
              
              <Button 
                variant="primary"
                onClick={handleBooking}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default TourBooking