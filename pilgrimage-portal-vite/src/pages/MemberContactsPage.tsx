import React, { useState, useEffect } from 'react';
import './MemberContactsPage.css';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Tabs,
  Tab,
  InputGroup,
  Spinner,
  Alert
} from 'react-bootstrap';
import { memberContactsAPI } from '../services/api';
import {
  MemberContact,
  MemberContactFormData,
  DEITY_OPTIONS,
  UTSAVAM_OPTIONS,
  GOTHRA_OPTIONS,
  NAKSHATRA_OPTIONS,
  RASHI_OPTIONS,
  INDIAN_STATES
} from '../types/member';

const MemberContactsPage: React.FC = () => {
  const [members, setMembers] = useState<MemberContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState<MemberContactFormData>({
    memberId: '',
    personalInfo: {
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      gender: 'Male',
      maritalStatus: 'Single',
      bloodGroup: '',
      occupation: '',
      education: ''
    },
    addressInfo: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contactInfo: {
      primaryPhone: '',
      alternatePhone: '',
      email: '',
      whatsappNumber: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    },
    spiritualInfo: {
      gothra: '',
      nakshatra: '',
      rashi: '',
      acharyanName: '',
      guruName: '',
      initiationDate: '',
      spiritualLineage: ''
    },
    templePreferences: {
      preferredDeity: [],
      preferredUtsavams: [],
      visitFrequency: 'Monthly',
      preferredTemples: [],
      volunteerInterest: false,
      donationPreference: undefined
    },
    religiousActivities: {
      dailyPuja: false,
      vedicChanting: false,
      bhajansInterest: false,
      scriptureStudy: false,
      meditationPractice: false,
      yogaPractice: false,
      participatesInSatsang: false,
      languagesKnown: []
    },
    pilgrimageHistory: [],
    dietaryRestrictions: [],
    specialNeeds: '',
    membershipType: 'Regular',
    membershipStartDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (formData.personalInfo.dateOfBirth) {
      const age = calculateAge(formData.personalInfo.dateOfBirth);
      setFormData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, age }
      }));
    }
  }, [formData.personalInfo.dateOfBirth]);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await memberContactsAPI.getAll();
      setMembers(response.data.members || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch member contacts');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMemberId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MEM-${year}-${random}`;
  };

  const handleOpenModal = (member?: MemberContact) => {
    if (member) {
      setSelectedMember(member);
      setFormData(member);
    } else {
      setSelectedMember(null);
      resetForm();
      setFormData(prev => ({ ...prev, memberId: generateMemberId() }));
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMember(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      personalInfo: {
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        age: 0,
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: '',
        occupation: '',
        education: ''
      },
      addressInfo: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      contactInfo: {
        primaryPhone: '',
        alternatePhone: '',
        email: '',
        whatsappNumber: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        }
      },
      spiritualInfo: {
        gothra: '',
        nakshatra: '',
        rashi: '',
        acharyanName: '',
        guruName: '',
        initiationDate: '',
        spiritualLineage: ''
      },
      templePreferences: {
        preferredDeity: [],
        preferredUtsavams: [],
        visitFrequency: 'Monthly',
        preferredTemples: [],
        volunteerInterest: false,
        donationPreference: undefined
      },
      religiousActivities: {
        dailyPuja: false,
        vedicChanting: false,
        bhajansInterest: false,
        scriptureStudy: false,
        meditationPractice: false,
        yogaPractice: false,
        participatesInSatsang: false,
        languagesKnown: []
      },
      pilgrimageHistory: [],
      dietaryRestrictions: [],
      specialNeeds: '',
      membershipType: 'Regular',
      membershipStartDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedMember?._id) {
        await memberContactsAPI.update(selectedMember._id, formData);
      } else {
        await memberContactsAPI.create(formData);
      }
      await fetchMembers();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save member contact');
      console.error('Error saving member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member contact?')) {
      try {
        await memberContactsAPI.delete(id);
        await fetchMembers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete member contact');
      }
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contactInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fas fa-users me-2"></i>
            Member Contacts
          </h2>
          <p className="text-muted">Manage spiritual community member details and preferences</p>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="d-flex align-items-center"
          >
            <i className="fas fa-plus me-2"></i>
            Add New Member
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{members.length}</h3>
              <p className="text-muted mb-0">Total Members</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{members.filter(m => m.status === 'Active').length}</h3>
              <p className="text-muted mb-0">Active Members</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">
                {members.filter(m => m.templePreferences.volunteerInterest).length}
              </h3>
              <p className="text-muted mb-0">Volunteers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">
                {members.filter(m => m.membershipType === 'Lifetime').length}
              </h3>
              <p className="text-muted mb-0">Lifetime Members</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by name, member ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </Form.Select>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Members Table */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading member contacts...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No members found</h5>
              <p className="text-muted">Add your first member to get started</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Spiritual Info</th>
                  <th>Membership</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <strong>{member.memberId}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>
                          {member.personalInfo.firstName} {member.personalInfo.lastName}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {member.personalInfo.age} years, {member.personalInfo.gender}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <i className="fas fa-phone me-1"></i>
                        {member.contactInfo.primaryPhone}
                        <br />
                        <i className="fas fa-envelope me-1"></i>
                        <small>{member.contactInfo.email}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <Badge bg="info" className="me-1">
                          {member.spiritualInfo.gothra}
                        </Badge>
                        <br />
                        <small className="text-muted">{member.spiritualInfo.nakshatra}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary">{member.membershipType}</Badge>
                    </td>
                    <td>
                      <Badge
                        bg={
                          member.status === 'Active'
                            ? 'success'
                            : member.status === 'Inactive'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {member.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenModal(member)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(member._id!)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl" backdrop="static" className="memberContactsPage">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMember ? '✏️ Edit Member Contact' : '➕ Add New Member Contact'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Tabs defaultActiveKey="personal" className="mb-3">
              {/* Personal Information Tab */}
              <Tab eventKey="personal" title="Personal Info">
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Member ID *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.memberId}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                        required
                        readOnly={!!selectedMember}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.personalInfo.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, firstName: e.target.value }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Middle Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.personalInfo.middleName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, middleName: e.target.value }
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.personalInfo.lastName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, lastName: e.target.value }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, dateOfBirth: e.target.value }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age</Form.Label>
                      <Form.Control type="number" value={formData.personalInfo.age} readOnly />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender *</Form.Label>
                      <Form.Select
                        value={formData.personalInfo.gender}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: {
                              ...formData.personalInfo,
                              gender: e.target.value as 'Male' | 'Female' | 'Other'
                            }
                          })
                        }
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Marital Status</Form.Label>
                      <Form.Select
                        value={formData.personalInfo.maritalStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: {
                              ...formData.personalInfo,
                              maritalStatus: e.target.value as any
                            }
                          })
                        }
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Select
                        value={formData.personalInfo.bloodGroup || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, bloodGroup: e.target.value }
                          })
                        }
                      >
                        <option value="">Select...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Occupation</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.personalInfo.occupation || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, occupation: e.target.value }
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Education</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.personalInfo.education || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, education: e.target.value }
                      })
                    }
                  />
                </Form.Group>
              </Tab>

              {/* Address & Contact Tab */}
              <Tab eventKey="contact" title="Address & Contact">
                <h6 className="mb-3">Address Information</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Address Line 1 *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.addressInfo.addressLine1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        addressInfo: { ...formData.addressInfo, addressLine1: e.target.value }
                      })
                    }
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address Line 2</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.addressInfo.addressLine2 || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        addressInfo: { ...formData.addressInfo, addressLine2: e.target.value }
                      })
                    }
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.addressInfo.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressInfo: { ...formData.addressInfo, city: e.target.value }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Select
                        value={formData.addressInfo.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressInfo: { ...formData.addressInfo, state: e.target.value }
                          })
                        }
                        required
                      >
                        <option value="">Select State...</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pincode *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.addressInfo.pincode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressInfo: { ...formData.addressInfo, pincode: e.target.value }
                          })
                        }
                        pattern="[0-9]{6}"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />
                <h6 className="mb-3">Contact Information</h6>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Primary Phone *</Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.contactInfo.primaryPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: { ...formData.contactInfo, primaryPhone: e.target.value }
                          })
                        }
                        pattern="[0-9]{10}"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Alternate Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.contactInfo.alternatePhone || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: { ...formData.contactInfo, alternatePhone: e.target.value }
                          })
                        }
                        pattern="[0-9]{10}"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: { ...formData.contactInfo, email: e.target.value }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>WhatsApp Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.contactInfo.whatsappNumber || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: { ...formData.contactInfo, whatsappNumber: e.target.value }
                          })
                        }
                        pattern="[0-9]{10}"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />
                <h6 className="mb-3">Emergency Contact</h6>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.contactInfo.emergencyContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              emergencyContact: {
                                ...formData.contactInfo.emergencyContact,
                                name: e.target.value
                              }
                            }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Relationship *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.contactInfo.emergencyContact.relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              emergencyContact: {
                                ...formData.contactInfo.emergencyContact,
                                relationship: e.target.value
                              }
                            }
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone *</Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.contactInfo.emergencyContact.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              emergencyContact: {
                                ...formData.contactInfo.emergencyContact,
                                phone: e.target.value
                              }
                            }
                          })
                        }
                        pattern="[0-9]{10}"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              {/* Spiritual Information Tab */}
              <Tab eventKey="spiritual" title="Spiritual Info">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gothra *</Form.Label>
                      <Form.Select
                        value={formData.spiritualInfo.gothra}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spiritualInfo: { ...formData.spiritualInfo, gothra: e.target.value }
                          })
                        }
                        required
                      >
                        <option value="">Select Gothra...</option>
                        {GOTHRA_OPTIONS.map((gothra) => (
                          <option key={gothra} value={gothra}>
                            {gothra}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nakshatra *</Form.Label>
                      <Form.Select
                        value={formData.spiritualInfo.nakshatra}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spiritualInfo: { ...formData.spiritualInfo, nakshatra: e.target.value }
                          })
                        }
                        required
                      >
                        <option value="">Select Nakshatra...</option>
                        {NAKSHATRA_OPTIONS.map((nakshatra) => (
                          <option key={nakshatra} value={nakshatra}>
                            {nakshatra}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rashi</Form.Label>
                      <Form.Select
                        value={formData.spiritualInfo.rashi || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spiritualInfo: { ...formData.spiritualInfo, rashi: e.target.value }
                          })
                        }
                      >
                        <option value="">Select Rashi...</option>
                        {RASHI_OPTIONS.map((rashi) => (
                          <option key={rashi} value={rashi}>
                            {rashi}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Acharyan Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.spiritualInfo.acharyanName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spiritualInfo: { ...formData.spiritualInfo, acharyanName: e.target.value }
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Guru Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.spiritualInfo.guruName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spiritualInfo: { ...formData.spiritualInfo, guruName: e.target.value }
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Initiation Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.spiritualInfo.initiationDate || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spiritualInfo: { ...formData.spiritualInfo, initiationDate: e.target.value }
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Spiritual Lineage</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.spiritualInfo.spiritualLineage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        spiritualInfo: { ...formData.spiritualInfo, spiritualLineage: e.target.value }
                      })
                    }
                    placeholder="E.g., Ramanuja Sampradaya, Madhva Sampradaya, etc."
                  />
                </Form.Group>

                <hr className="my-4" />
                <h6 className="mb-3">Religious Activities</h6>

                <Row>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Daily Puja"
                      checked={formData.religiousActivities.dailyPuja}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            dailyPuja: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Vedic Chanting"
                      checked={formData.religiousActivities.vedicChanting}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            vedicChanting: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Bhajans Interest"
                      checked={formData.religiousActivities.bhajansInterest}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            bhajansInterest: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                </Row>

                <Row className="mt-2">
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Scripture Study"
                      checked={formData.religiousActivities.scriptureStudy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            scriptureStudy: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Meditation Practice"
                      checked={formData.religiousActivities.meditationPractice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            meditationPractice: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Yoga Practice"
                      checked={formData.religiousActivities.yogaPractice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            yogaPractice: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                </Row>

                <Row className="mt-2">
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Participates in Satsang"
                      checked={formData.religiousActivities.participatesInSatsang}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          religiousActivities: {
                            ...formData.religiousActivities,
                            participatesInSatsang: e.target.checked
                          }
                        })
                      }
                    />
                  </Col>
                </Row>
              </Tab>

              {/* Temple Preferences Tab */}
              <Tab eventKey="temple" title="Temple Preferences">
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Deities</Form.Label>
                  <div className="border rounded p-3">
                    <Row className="px-3">
                      {DEITY_OPTIONS.map((deity) => (
                        <Col xs={6} md={4} lg={3} key={deity} className="mb-2">
                          <Form.Check
                            type="checkbox"
                            label={deity}
                            checked={formData.templePreferences.preferredDeity.includes(deity)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...formData.templePreferences.preferredDeity, deity]
                                : formData.templePreferences.preferredDeity.filter((d) => d !== deity);
                              setFormData({
                                ...formData,
                                templePreferences: { ...formData.templePreferences, preferredDeity: updated }
                              });
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Preferred Utsavams</Form.Label>
                  <div className="border rounded p-3">
                    <Row className="px-3">
                      {UTSAVAM_OPTIONS.map((utsavam) => (
                        <Col xs={6} md={4} lg={3} key={utsavam} className="mb-2">
                          <Form.Check
                            type="checkbox"
                            label={utsavam}
                            checked={formData.templePreferences.preferredUtsavams.includes(utsavam)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...formData.templePreferences.preferredUtsavams, utsavam]
                                : formData.templePreferences.preferredUtsavams.filter((u) => u !== utsavam);
                              setFormData({
                                ...formData,
                                templePreferences: {
                                  ...formData.templePreferences,
                                  preferredUtsavams: updated
                                }
                              });
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Visit Frequency</Form.Label>
                      <Form.Select
                        value={formData.templePreferences.visitFrequency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            templePreferences: {
                              ...formData.templePreferences,
                              visitFrequency: e.target.value as any
                            }
                          })
                        }
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Occasionally">Occasionally</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Donation Preference</Form.Label>
                      <Form.Select
                        value={formData.templePreferences.donationPreference || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            templePreferences: {
                              ...formData.templePreferences,
                              donationPreference: e.target.value as any
                            }
                          })
                        }
                      >
                        <option value="">Select...</option>
                        <option value="Anna Dhanam">Anna Dhanam</option>
                        <option value="Temple Maintenance">Temple Maintenance</option>
                        <option value="Festivals">Festivals</option>
                        <option value="General">General</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Check
                  type="checkbox"
                  label="Interested in Volunteering"
                  checked={formData.templePreferences.volunteerInterest}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      templePreferences: {
                        ...formData.templePreferences,
                        volunteerInterest: e.target.checked
                      }
                    })
                  }
                  className="mb-3"
                />
              </Tab>

              {/* Membership Tab */}
              <Tab eventKey="membership" title="Membership">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Membership Type *</Form.Label>
                      <Form.Select
                        value={formData.membershipType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            membershipType: e.target.value as any
                          })
                        }
                        required
                      >
                        <option value="Regular">Regular</option>
                        <option value="Premium">Premium</option>
                        <option value="Lifetime">Lifetime</option>
                        <option value="Family">Family</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Membership Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.membershipStartDate}
                        onChange={(e) =>
                          setFormData({ ...formData, membershipStartDate: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status *</Form.Label>
                      <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Special Needs / Dietary Restrictions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.specialNeeds || ''}
                    onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                    placeholder="Any special needs, health conditions, or dietary restrictions..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information about the member..."
                  />
                </Form.Group>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  {selectedMember ? 'Update Member' : 'Add Member'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MemberContactsPage;
