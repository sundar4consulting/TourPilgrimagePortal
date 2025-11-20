import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { miscAPI, partsAPI, Member as MemberBase, Part } from '../services/api';
// Extend Member type locally to allow extra fields for UI editing
type Member = Omit<MemberBase, 'persons'> & {
  persons?: number | null;
  sram?: string;
  fwdJny?: string;
  rtnJny?: string;
  notes?: string;
};

const MiscPage: React.FC = () => {
  // State and hooks
  const [members, setMembers] = useState<Member[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Removed unused: totalPages, totalMembers
  const [filters, setFilters] = useState({
    gender: '',
    search: '',
    sortBy: 's_no',
    sortOrder: 'asc' as 'asc' | 'desc',
  });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Edit modal state
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({
    s_no: 1,
    mob_s_no: 1,
    group_s_no: 1,
    name_aadhar: '',
    gender: 'M',
    age: null as number | null,
    aadhar_no: '',
    fwdJny: '',
    rtnJny: '',
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('list');
  const [statistics, setStatistics] = useState<any>({
    totalMembers: 0,
    maleCount: 0,
    femaleCount: 0,
    averageAge: 0,
    sectionStats: [],
  });


  // Real fetch functions
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await miscAPI.getAll({
        gender: filters.gender,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: currentPage,
        limit: 20
      });
  setMembers(res.data.members as Member[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    setError(null);
    try {
      const res = await partsAPI.getAll();
      setParts(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch PARTS');
      setParts([]);
    }
  };

  const fetchStatistics = async () => {
    setError(null);
    try {
      const res = await miscAPI.getStats();
      setStatistics({
        ...res.data.summary,
        sectionStats: res.data.sectionStats || []
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      setStatistics({
        totalMembers: 0,
        maleCount: 0,
        femaleCount: 0,
        averageAge: 0,
        sectionStats: [],
      });
    }
  };

  // Load data on mount and when filters/page change
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, [filters.gender, filters.search, filters.sortBy, filters.sortOrder, currentPage]);

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Handlers
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await miscAPI.delete(id);
      setSuccess('Member deleted successfully');
      fetchMembers();
      if (activeTab === 'statistics') fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete member');
      console.error('Error deleting member:', err);
    }
  };
  const handleEdit = (member: Member) => {
    setCurrentMember(member);
    setIsEditing(true);
    setShowModal(true);
    setMemberForm({
      s_no: member.s_no,
      mob_s_no: member.mob_s_no,
      group_s_no: member.group_s_no,
      name_aadhar: member.name_aadhar,
      gender: member.gender,
      age: member.age ?? null,
      aadhar_no: member.aadhar_no ?? '',
      fwdJny: member.fwdJny ?? '',
      rtnJny: member.rtnJny ?? '',
      notes: member.notes ?? ''
    });
  };

  const handleCreate = () => {
    // No-op: create not implemented
    alert('Create functionality is not implemented in this version.');
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // Optionally, handle pagination if needed

  // Handle save for edit modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;
    try {
      // Optional: AI suggestion for gender
      let gender = memberForm.gender;
      if (!gender && memberForm.name_aadhar) {
        const name = memberForm.name_aadhar.toLowerCase();
        if (name.endsWith('a') || name.endsWith('i')) gender = 'F';
        else gender = 'M';
      }
  await miscAPI.update(currentMember._id, { ...memberForm, gender: gender as 'M' | 'F' });
      setSuccess('Member updated successfully');
      setShowModal(false);
      fetchMembers();
      if (activeTab === 'statistics') fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  // Render members list tab
  const renderListTab = () => (
    <div className="miscListTab">
      {/* Filters Section */}
      <Card className="mb-4 filterCard">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="filterLabel">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or AADAR..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="enhancedFormControl"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="filterLabel">Gender</Form.Label>
                <Form.Select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="enhancedFormControl"
                >
                  <option value="">All</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="filterLabel">Sort By</Form.Label>
                <Form.Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="enhancedFormControl"
                >
                  <option value="s_no">Serial Number</option>
                  <option value="mob_s_no">Mob S No</option>
                  <option value="group_s_no">Group S No</option>
                  <option value="name_aadhar">Name</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={handleCreate}
                className="w-100 createButton"
              >
                <i className="fas fa-plus me-2"></i>
                Add Member
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card className="tableCard">
        <Card.Body>
          <div className="table-responsive">
            <Table className="membersTable" hover>
              <thead>
                <tr>
                  <th onClick={() => handleSort('s_no')} style={{ cursor: 'pointer' }}>
                    S.No {filters.sortBy === 's_no' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('mob_s_no')} style={{ cursor: 'pointer' }}>
                    Mob S No {filters.sortBy === 'mob_s_no' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('group_s_no')} style={{ cursor: 'pointer' }}>
                    Group S No {filters.sortBy === 'group_s_no' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name_aadhar')} style={{ cursor: 'pointer' }}>
                    Name {filters.sortBy === 'name_aadhar' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Aadhar Number</th>
                  <th>FWD-JNY</th>
                  <th>RTN-JNY</th>
                  <th>Notes</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4">
                      No members found
                    </td>
                  </tr>
                ) : (
                  <>
                    {members.map((member) => (
                      <tr key={member._id}>
                        <td>{member.s_no}</td>
                        <td>{member.mob_s_no}</td>
                        <td>{member.group_s_no}</td>
                        <td>{member.name_aadhar}</td>
                        <td>{member.aadhar_no}</td>
                        <td>{member.fwdJny ?? ''}</td>
                        <td>{member.rtnJny ?? ''}</td>
                        <td>{member.notes ?? ''}</td>
                        <td>
                          <Badge bg={member.gender === 'M' ? 'info' : 'danger'}>
                            {member.gender === 'M' ? 'Male' : 'Female'}
                          </Badge>
                        </td>
                        <td>{member.age || 'N/A'}</td>
                        <td>
                          <Button variant="outline-primary" size="sm" onClick={() => handleEdit(member)} className="me-2">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(member._id)}>
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  // Render statistics tab
  const renderStatisticsTab = () => {
    // PART counts
    const partCounts = { A: 0, B: 0, C: 0, D: 0 };
    if (Array.isArray(parts)) {
      parts.forEach((p) => {
        const key = (p.section || '').toUpperCase();
        if (partCounts.hasOwnProperty(key)) partCounts[key as keyof typeof partCounts]++;
      });
    }

    return (
      <div className="statisticsTab">
  <Row className="mb-4 g-3" xs={1} sm={2} md={5}>
          <Col>
            <Card className="statsCard statsCardPrimary">
              <Card.Body>
                <div className="statsIcon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="statsContent">
                  <h3 className="statsValue">{statistics.totalMembers}</h3>
                  <p className="statsLabel">Total Members</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="statsCard statsCardInfo">
              <Card.Body>
                <div className="statsIcon">A</div>
                <div className="statsContent">
                  <h3 className="statsValue">{partCounts.A}</h3>
                  <p className="statsLabel">PART A Count</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="statsCard statsCardInfo">
              <Card.Body>
                <div className="statsIcon">B</div>
                <div className="statsContent">
                  <h3 className="statsValue">{partCounts.B}</h3>
                  <p className="statsLabel">PART B Count</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="statsCard statsCardInfo">
              <Card.Body>
                <div className="statsIcon">C</div>
                <div className="statsContent">
                  <h3 className="statsValue">{partCounts.C}</h3>
                  <p className="statsLabel">PART C Count</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="statsCard statsCardInfo">
              <Card.Body>
                <div className="statsIcon">D</div>
                <div className="statsContent">
                  <h3 className="statsValue">{partCounts.D}</h3>
                  <p className="statsLabel">PART D Count</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Card className="tableCard">
          <Card.Header>
            <h5 className="mb-0">Section-wise Distribution</h5>
          </Card.Header>
          <Card.Body>
            <Table className="statisticsTable" hover>
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Member Count</th>
                  <th>Average Age</th>
                </tr>
              </thead>
              <tbody>
                {statistics.sectionStats && statistics.sectionStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No statistics available
                    </td>
                  </tr>
                ) : (
                  statistics.sectionStats && statistics.sectionStats.map((stat: any) => (
                    <tr key={stat._id}>
                      <td>
                        <Badge bg="primary" className="sectionBadge">
                          {stat._id}
                        </Badge>
                      </td>
                      <td><strong>{stat.count}</strong></td>
                      <td>{stat.avgAge ? stat.avgAge.toFixed(1) : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="miscPage">
        {/* Main Content */}
        <Container className="mt-4">
        {/* Alert Messages */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'list')}
          className="customTabs mb-4"
        >
          <Tab 
            eventKey="list" 
            title={<span className="tabTitle">Members List</span>}
          >
            {renderListTab()}
          </Tab>
          <Tab 
            eventKey="parts" 
            title={<span className="tabTitle">PARTS Details</span>}
          >
            {/* Tour Participants Table (Parts A, B, C, D) moved here */}
            <Card className="mb-4">
              <Card.Header>
                <h5>PARTS Details (A, B, C, D)</h5>
              </Card.Header>
              <Card.Body>
                {['A','B','C','D'].map((partKey) => {
                  const grouped = parts.filter((p: any) => (p.section || '').toUpperCase() === partKey);
                  if (grouped.length === 0) return null;
                  // Find the first row with a sectionDescription for the header
                  const descRow = grouped.find((row: any) => row.sectionDescription && row.sectionDescription.trim() !== '');
                  return (
                    <div key={partKey} style={{ marginBottom: '2.5rem' }}>
                      {/* Section Header Row */}
                      {descRow && (
                        <div style={{ marginBottom: '0.5rem', background: '#f8f9fa', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #dee2e6' }}>
                          <strong>Section: PART {partKey}</strong>
                          <span style={{ marginLeft: 16, color: '#555' }}>{descRow.sectionDescription}</span>
                        </div>
                      )}
                      <Table bordered responsive size="sm" className="mb-0">
                        <thead>
                          <tr style={{ background: '#f1f3f4' }}>
                            <th style={{ width: 60 }}>S. No.</th>
                            <th style={{ width: 100 }}>Section</th>
                            <th>Member</th>
                            <th style={{ width: 120 }}>No. of Person</th>
                            <th style={{ width: 120 }}>Sradam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grouped.map((row: any, idx: number) => (
                            <tr key={row._id || idx}>
                              <td>{idx + 1}</td>
                              <td>PART {partKey}</td>
                              <td>{row.memberName}</td>
                              <td>{row.noOfPersons}</td>
                              <td>{row.sradam}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Tab>
          <Tab 
            eventKey="statistics" 
            title={<span className="tabTitle">Statistics</span>}
          >
            {renderStatisticsTab()}
          </Tab>
        </Tabs>
      </Container>

      {/* Add/Edit Member Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="modalHeader">
          <Modal.Title>
            {isEditing ? '✏️ Edit Member' : '➕ Add New Member'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Tabs defaultActiveKey="basic" className="mb-3 modalTabs">
              <Tab eventKey="basic" title="📋 Basic Info">
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Serial Number</Form.Label>
                      <Form.Control type="number" value={memberForm.s_no} onChange={e => setMemberForm(f => ({ ...f, s_no: Number(e.target.value) }))} required placeholder="Enter S.No" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mob S No</Form.Label>
                      <Form.Control type="number" value={memberForm.mob_s_no} onChange={e => setMemberForm(f => ({ ...f, mob_s_no: Number(e.target.value) }))} required placeholder="Enter Mob S No" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Group S No</Form.Label>
                      <Form.Control type="number" value={memberForm.group_s_no} onChange={e => setMemberForm(f => ({ ...f, group_s_no: Number(e.target.value) }))} required placeholder="Enter Group S No" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name (AADHAR)</Form.Label>
                      <Form.Control type="text" value={memberForm.name_aadhar} onChange={e => setMemberForm(f => ({ ...f, name_aadhar: e.target.value }))} required placeholder="Enter name as per AADHAR" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age</Form.Label>
                      <Form.Control type="number" value={memberForm.age ?? ''} onChange={e => setMemberForm(f => ({ ...f, age: e.target.value ? Number(e.target.value) : null }))} placeholder="Enter age" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select value={memberForm.gender} onChange={e => setMemberForm(f => ({ ...f, gender: e.target.value as 'M' | 'F' }))} required>
                        <option value="M">👨 Male</option>
                        <option value="F">👩 Female</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Aadhar Number</Form.Label>
                      <Form.Control type="text" value={memberForm.aadhar_no} onChange={e => setMemberForm(f => ({ ...f, aadhar_no: e.target.value }))} placeholder="Enter AADHAR number" maxLength={12} />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>
              <Tab eventKey="journey" title="✈️ Journey Details">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Forward Journey (FWD-JNY)</Form.Label>
                      <Form.Control type="text" value={memberForm.fwdJny} onChange={e => setMemberForm(f => ({ ...f, fwdJny: e.target.value }))} placeholder="Enter forward journey details" />
                      <Form.Text className="text-muted">
                        Travel details for outbound trip
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Return Journey (RTN-JNY)</Form.Label>
                      <Form.Control type="text" value={memberForm.rtnJny} onChange={e => setMemberForm(f => ({ ...f, rtnJny: e.target.value }))} placeholder="Enter return journey details" />
                      <Form.Text className="text-muted">
                        Travel details for return trip
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Notes</Form.Label>
                      <Form.Control as="textarea" rows={3} value={memberForm.notes} onChange={e => setMemberForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add any additional notes or special requirements..." />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              <i className="fas fa-times me-2"></i>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="saveButton">
              <i className="fas fa-save me-2"></i>
              {isEditing ? 'Update Member' : 'Add Member'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
    </React.Fragment>
  );
};

export default MiscPage;
