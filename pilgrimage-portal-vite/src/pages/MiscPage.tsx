import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { miscAPI, Member } from '../services/api';
import './MiscPage.css';

const MiscPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [filters, setFilters] = useState({
    section: '',
    gender: '',
    search: '',
    sortBy: 's_no',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  // Form state
  const [memberForm, setMemberForm] = useState({
    section: '',
    section_desc: '',
    s_no: 1,
    mob_s_no: 1,
    group_s_no: 1,
    name_aadhar: '',
    gender: 'M' as 'M' | 'F',
    age: null as number | null,
    aadhar_no: ''
  });

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalMembers: 0,
    maleCount: 0,
    femaleCount: 0,
    averageAge: 0,
    sectionStats: [] as Array<{ _id: string; count: number; avgAge: number }>
  });

  // Active tab
  const [activeTab, setActiveTab] = useState('list');

  // Fetch members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.section) params.section = filters.section;
      if (filters.gender) params.gender = filters.gender;
      if (filters.search) params.search = filters.search;

      const response = await miscAPI.getAll(params);
      setMembers(response.data.members);
      setTotalPages(response.data.pagination.pages);
      setTotalMembers(response.data.pagination.total);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await miscAPI.getStats();
      setStatistics({
        totalMembers: response.data.summary.totalMembers,
        maleCount: response.data.summary.maleCount,
        femaleCount: response.data.summary.femaleCount,
        averageAge: response.data.summary.averageAge,
        sectionStats: response.data.sectionStats
      });
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentPage, filters]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab]);

  // Handle filter change
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Open modal for creating new member
  const handleCreate = () => {
    setIsEditing(false);
    setCurrentMember(null);
    setMemberForm({
      section: '',
      section_desc: '',
      s_no: 1,
      mob_s_no: 1,
      group_s_no: 1,
      name_aadhar: '',
      gender: 'M',
      age: null,
      aadhar_no: ''
    });
    setShowModal(true);
  };

  // Open modal for editing member
  const handleEdit = (member: Member) => {
    setIsEditing(true);
    setCurrentMember(member);
    setMemberForm({
      section: member.section,
      section_desc: member.section_desc,
      s_no: member.s_no,
      mob_s_no: member.mob_s_no,
      group_s_no: member.group_s_no,
      name_aadhar: member.name_aadhar,
      gender: member.gender,
      age: member.age || null,
      aadhar_no: member.aadhar_no || ''
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const memberData = {
        ...memberForm,
        age: memberForm.age || null,
        aadhar_no: memberForm.aadhar_no || null
      };

      if (isEditing && currentMember) {
        await miscAPI.update(currentMember._id, memberData);
        setSuccess('Member updated successfully');
      } else {
        await miscAPI.create(memberData);
        setSuccess('Member created successfully');
      }

      setShowModal(false);
      fetchMembers();
      if (activeTab === 'statistics') {
        fetchStatistics();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
      console.error('Error saving member:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await miscAPI.delete(id);
      setSuccess('Member deleted successfully');
      fetchMembers();
      if (activeTab === 'statistics') {
        fetchStatistics();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete member');
      console.error('Error deleting member:', err);
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
                <Form.Label className="filterLabel">Section</Form.Label>
                <Form.Select
                  value={filters.section}
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                  className="enhancedFormControl"
                >
                  <option value="">All Sections</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </Form.Select>
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
                  <option value="section">Section</option>
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

      {/* Members Table */}
      <Card className="tableCard">
        <Card.Body>
          <div className="table-responsive">
            <Table className="membersTable" hover>
              <thead>
                <tr>
                  <th onClick={() => handleSort('section')} style={{ cursor: 'pointer' }}>
                    Section {filters.sortBy === 'section' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Section Description</th>
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
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5">
                      <i className="fas fa-users fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No members found</p>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <Badge bg="primary">{member.section}</Badge>
                      </td>
                      <td>{member.section_desc}</td>
                      <td>{member.s_no}</td>
                      <td>{member.mob_s_no}</td>
                      <td>{member.group_s_no}</td>
                      <td><strong>{member.name_aadhar}</strong></td>
                      <td>
                        <Badge bg={member.gender === 'M' ? 'info' : 'danger'}>
                          {member.gender === 'M' ? 'Male' : 'Female'}
                        </Badge>
                      </td>
                      <td>{member.age || 'N/A'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(member)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(member._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="paginationInfo">
                Showing page {currentPage} of {totalPages} ({totalMembers} total members)
              </div>
              <div className="paginationControls">
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="me-2"
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </Button>
                <span className="mx-3">Page {currentPage}</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // Render statistics tab
  const renderStatisticsTab = () => (
    <div className="statisticsTab">
      <Row className="mb-4">
        <Col md={3}>
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
        <Col md={3}>
          <Card className="statsCard statsCardInfo">
            <Card.Body>
              <div className="statsIcon">
                <i className="fas fa-male"></i>
              </div>
              <div className="statsContent">
                <h3 className="statsValue">{statistics.maleCount}</h3>
                <p className="statsLabel">Male Members</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="statsCard statsCardDanger">
            <Card.Body>
              <div className="statsIcon">
                <i className="fas fa-female"></i>
              </div>
              <div className="statsContent">
                <h3 className="statsValue">{statistics.femaleCount}</h3>
                <p className="statsLabel">Female Members</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="statsCard statsCardSuccess">
            <Card.Body>
              <div className="statsIcon">
                <i className="fas fa-birthday-cake"></i>
              </div>
              <div className="statsContent">
                <h3 className="statsValue">{statistics.averageAge.toFixed(1)}</h3>
                <p className="statsLabel">Average Age</p>
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
              {statistics.sectionStats.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    No statistics available
                  </td>
                </tr>
              ) : (
                statistics.sectionStats.map((stat) => (
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

  return (
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
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    required
                    maxLength={10}
                    value={memberForm.section}
                    onChange={(e) => setMemberForm({ ...memberForm, section: e.target.value })}
                    className="enhancedFormControl"
                    placeholder="e.g., A, B, C, D"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    required
                    maxLength={200}
                    value={memberForm.section_desc}
                    onChange={(e) => setMemberForm({ ...memberForm, section_desc: e.target.value })}
                    className="enhancedFormControl"
                    placeholder="Description or purpose"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Serial Number (S.No) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min={1}
                    value={memberForm.s_no}
                    onChange={(e) => setMemberForm({ ...memberForm, s_no: parseInt(e.target.value) })}
                    className="enhancedFormControl"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Mob S No <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min={1}
                    value={memberForm.mob_s_no}
                    onChange={(e) => setMemberForm({ ...memberForm, mob_s_no: parseInt(e.target.value) })}
                    className="enhancedFormControl"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Group Serial Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min={1}
                    value={memberForm.group_s_no}
                    onChange={(e) => setMemberForm({ ...memberForm, group_s_no: parseInt(e.target.value) })}
                    className="enhancedFormControl"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Name as per AADAR CARD <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    required
                    maxLength={15}
                    value={memberForm.name_aadhar}
                    onChange={(e) => setMemberForm({ ...memberForm, name_aadhar: e.target.value.toUpperCase() })}
                    className="enhancedFormControl"
                    placeholder="Max 15 characters"
                  />
                  <Form.Text className="text-muted">
                    Maximum 15 characters
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    required
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value as 'M' | 'F' })}
                    className="enhancedFormControl"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={150}
                    value={memberForm.age || ''}
                    onChange={(e) => setMemberForm({ 
                      ...memberForm, 
                      age: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="enhancedFormControl"
                    placeholder="Optional"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>AADAR Number</Form.Label>
                  <Form.Control
                    type="text"
                    maxLength={12}
                    pattern="[0-9]{12}"
                    value={memberForm.aadhar_no}
                    onChange={(e) => setMemberForm({ ...memberForm, aadhar_no: e.target.value })}
                    className="enhancedFormControl"
                    placeholder="12 digits (Optional)"
                  />
                  <Form.Text className="text-muted">
                    Optional, 12 digits
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="saveButton">
              <i className="fas fa-save me-2"></i>
              {isEditing ? 'Update' : 'Create'} Member
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MiscPage;
