import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table,
  Button, 
  Form, 
  Badge, 
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaFilter,
  FaCalendar,
  FaClock,
  FaMoneyBillWave,
  FaUsers
} from 'react-icons/fa';
import { Formik, Form as FormikForm, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

const ExpensesPage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tours, setTours] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    tourId: '',
    category: '',
    isApproved: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    console.log('ExpensesPage mounted, user:', user);
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, toursRes, statsRes] = await Promise.all([
        api.get('/expenses/categories'),
        api.get('/tours'),
        isAdmin ? api.get('/expenses/stats') : Promise.resolve({ data: null })
      ]);
      
      setCategories(categoriesRes.data);
      setTours(toursRes.data.tours || []);
      if (statsRes.data) setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showAlert('Error loading data', 'danger');
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showAlert('Error loading expenses', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  const handleAddExpense = async (values, { setSubmitting, resetForm }) => {
    try {
      console.log('Adding expense with values:', values);
      const response = await api.post('/expenses', values);
      console.log('Expense added successfully:', response.data);
      showAlert('Expense added successfully');
      fetchExpenses();
      if (isAdmin) fetchInitialData(); // Refresh stats
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding expense:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error adding expense';
      showAlert(errorMessage, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpense = async (values, { setSubmitting }) => {
    try {
      console.log('Editing expense with values:', values);
      const response = await api.put(`/expenses/${selectedExpense._id}`, values);
      console.log('Expense updated successfully:', response.data);
      showAlert('Expense updated successfully');
      fetchExpenses();
      if (isAdmin) fetchInitialData();
      setShowEditModal(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating expense';
      showAlert(errorMessage, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${expenseId}`);
        showAlert('Expense deleted successfully');
        fetchExpenses();
        if (isAdmin) fetchInitialData();
      } catch (error) {
        console.error('Error deleting expense:', error);
        showAlert('Error deleting expense', 'danger');
      }
    }
  };

  const handleApproveExpense = async (expenseId) => {
    try {
      await api.put(`/expenses/${expenseId}/approve`);
      showAlert('Expense approved successfully');
      fetchExpenses();
      fetchInitialData();
    } catch (error) {
      console.error('Error approving expense:', error);
      showAlert('Error approving expense', 'danger');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedExpenses.length === 0) return;
    
    try {
      await api.put('/expenses/bulk/approve', { expenseIds: selectedExpenses });
      showAlert(`${selectedExpenses.length} expenses approved successfully`);
      setSelectedExpenses([]);
      fetchExpenses();
      fetchInitialData();
    } catch (error) {
      console.error('Error bulk approving expenses:', error);
      showAlert('Error approving expenses', 'danger');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const getCategoryIcon = (category) => {
    const categoryMap = categories.find(cat => cat.value === category);
    return categoryMap ? categoryMap.icon : '📋';
  };

  const expenseValidationSchema = Yup.object({
    tour: Yup.string().required('Tour is required'),
    category: Yup.string().required('Category is required'),
    description: Yup.string().required('Description is required'),
    amount: Yup.number().min(0, 'Amount must be positive').required('Amount is required'),
    expenseDate: Yup.date().required('Expense date is required'),
    participants: Yup.number().min(1, 'Participants must be at least 1').nullable().transform((value, originalValue) => originalValue === '' ? null : value),
    paymentMethod: Yup.string().required('Payment method is required')
  });

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {alert.show && (
          <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: '', variant: 'success' })} className="mb-4">
            {alert.message}
          </Alert>
        )}

      {/* Stats Cards for Admin */}
      {isAdmin && stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Card.Body className="text-white">
                <FaMoneyBillWave className="mb-3" size={40} style={{ opacity: 0.9 }} />
                <h4 className="fw-bold mb-1">{formatCurrency(stats.summary.totalExpenses)}</h4>
                <p className="mb-0 opacity-75">Total Expenses</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              <Card.Body className="text-white">
                <FaCheck className="mb-3" size={40} style={{ opacity: 0.9 }} />
                <h4 className="fw-bold mb-1">{formatCurrency(stats.summary.approvedExpenses)}</h4>
                <p className="mb-0 opacity-75">Approved</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Card.Body className="text-white">
                <FaClock className="mb-3" size={40} style={{ opacity: 0.9 }} />
                <h4 className="fw-bold mb-1">{formatCurrency(stats.summary.pendingExpenses)}</h4>
                <p className="mb-0 opacity-75">Pending</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Card.Body className="text-white">
                <FaCalendar className="mb-3" size={40} style={{ opacity: 0.9 }} />
                <h4 className="fw-bold mb-1">{stats.summary.totalCount}</h4>
                <p className="mb-0 opacity-75">Total Records</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Header and Controls */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1 d-flex align-items-center">
                    <div className="bg-primary bg-gradient rounded-circle p-2 me-3">
                      <FaMoneyBillWave className="text-white" size={24} />
                    </div>
                    Expense Management
                  </h2>
                  <p className="text-muted mb-0">Track and manage all tour expenses</p>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2"
                    size="lg"
                  >
                    <FaPlus className="me-2" /> Add Expense
                  </Button>
                  {isAdmin && selectedExpenses.length > 0 && (
                    <Button 
                      variant="success" 
                      onClick={handleBulkApprove}
                      className="px-4 py-2"
                      size="lg"
                    >
                      <FaCheck className="me-2" /> Approve Selected ({selectedExpenses.length})
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-light border-0">
          <div className="d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            <h6 className="mb-0 fw-bold">Filter Expenses</h6>
          </div>
        </Card.Header>
        <Card.Body className="bg-white">
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">Tour</Form.Label>
                <Form.Select
                  value={filters.tourId}
                  onChange={(e) => setFilters({...filters, tourId: e.target.value, page: 1})}
                  className="form-select-sm"
                >
                  <option value="">All Tours</option>
                  {tours.map(tour => (
                    <option key={tour._id} value={tour._id}>{tour.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">Category</Form.Label>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
                  className="form-select-sm"
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
            {isAdmin && (
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">Status</Form.Label>
                  <Form.Select
                    value={filters.isApproved}
                    onChange={(e) => setFilters({...filters, isApproved: e.target.value, page: 1})}
                    className="form-select-sm"
                  >
                    <option value="">All Status</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value, page: 1})}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value, page: 1})}
                  size="sm"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Expenses Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Expense Records</h5>
            {isAdmin && expenses.filter(e => !e.isApproved).length > 0 && (
              <Form.Check
                type="checkbox"
                label="Select All Pending"
                checked={selectedExpenses.length === expenses.filter(e => !e.isApproved).length && expenses.filter(e => !e.isApproved).length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedExpenses(expenses.filter(e => !e.isApproved).map(e => e._id));
                  } else {
                    setSelectedExpenses([]);
                  }
                }}
              />
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <div className="text-muted">Loading expenses...</div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-5">
              <FaMoneyBillWave size={64} className="text-muted mb-3" />
              <h5 className="text-muted">No expenses found</h5>
              <p className="text-muted">Start by adding your first expense</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  {isAdmin && (
                    <th className="border-0 px-3 py-3">
                      <Form.Check
                        type="checkbox"
                        checked={selectedExpenses.length === expenses.filter(e => !e.isApproved).length && expenses.filter(e => !e.isApproved).length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses(expenses.filter(e => !e.isApproved).map(e => e._id));
                          } else {
                            setSelectedExpenses([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="border-0 px-3 py-3 fw-semibold">Date</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Tour</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Category</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Description</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Amount</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Added By</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Status</th>
                  <th className="border-0 px-3 py-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr key={expense._id} className={index % 2 === 0 ? 'bg-white' : 'bg-light bg-opacity-50'}>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        {!expense.isApproved && (
                          <Form.Check
                            type="checkbox"
                            checked={selectedExpenses.includes(expense._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExpenses([...selectedExpenses, expense._id]);
                              } else {
                                setSelectedExpenses(selectedExpenses.filter(id => id !== expense._id));
                              }
                            }}
                          />
                        )}
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center">
                        <FaCalendar className="text-muted me-2" size={14} />
                        <span className="fw-medium">{formatDate(expense.expenseDate)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-muted fw-medium">{expense.tour?.title || 'N/A'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fs-5">{getCategoryIcon(expense.category)}</span>
                        <span className="fw-medium">
                          {categories.find(cat => cat.value === expense.category)?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <div className="fw-medium">{expense.description}</div>
                        {expense.participants && (
                          <small className="text-muted d-flex align-items-center mt-1">
                            <FaUsers className="me-1" size={12} />
                            {expense.participants} participants
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="fw-bold text-primary fs-6">{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-muted">
                        <div className="fw-medium">{expense.addedBy?.firstName} {expense.addedBy?.lastName}</div>
                        {expense.paymentMethod && (
                          <small className="text-muted">
                            {expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge 
                        bg={expense.isApproved ? 'success' : 'warning'} 
                        className="rounded-pill px-3 py-2"
                      >
                        {expense.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowEditModal(true);
                          }}
                          title="Edit Expense"
                        >
                          <FaEdit />
                        </Button>
                        {isAdmin && !expense.isApproved && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleApproveExpense(expense._id)}
                            title="Approve Expense"
                          >
                            <FaCheck />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense._id)}
                          title="Delete Expense"
                        >
                          <FaTrash />
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

      {/* Add Expense Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl" className="expense-modal">
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
              <FaPlus size={20} />
            </div>
            Add New Expense
          </Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            tour: '',
            category: '',
            subcategory: '',
            description: '',
            amount: '',
            expenseDate: '',
            location: { city: '', state: '', place: '' },
            vendor: { name: '', contact: '', address: '' },
            paymentMethod: 'cash',
            receiptNumber: '',
            participants: '',
            notes: ''
          }}
          validationSchema={expenseValidationSchema}
          onSubmit={handleAddExpense}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <FormikForm>
              <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
                {/* Basic Information Section */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center">
                      <FaMoneyBillWave className="me-2" />
                      Basic Information
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">🎯</span>
                            Tour *
                          </Form.Label>
                          <Field name="tour">
                            {({ field }) => (
                              <Form.Select 
                                {...field} 
                                isInvalid={touched.tour && errors.tour}
                                className="form-select-lg"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              >
                                <option value="">Select Tour Package</option>
                                {tours.map(tour => (
                                  <option key={tour._id} value={tour._id}>{tour.title}</option>
                                ))}
                              </Form.Select>
                            )}
                          </Field>
                          <Form.Control.Feedback type="invalid">{errors.tour}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">📋</span>
                            Category *
                          </Form.Label>
                          <Field name="category">
                            {({ field }) => (
                              <Form.Select 
                                {...field} 
                                isInvalid={touched.category && errors.category}
                                className="form-select-lg"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.icon} {cat.label}
                                  </option>
                                ))}
                              </Form.Select>
                            )}
                          </Field>
                          <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="g-3 mt-2">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">💰</span>
                            Amount (₹) *
                          </Form.Label>
                          <Field name="amount">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                type="number" 
                                step="0.01"
                                placeholder="Enter amount"
                                isInvalid={touched.amount && errors.amount}
                                className="form-control-lg"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                          <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <FaCalendar className="me-2 text-primary" />
                            Expense Date *
                          </Form.Label>
                          <Field name="expenseDate">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                type="date" 
                                isInvalid={touched.expenseDate && errors.expenseDate}
                                className="form-control-lg"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                          <Form.Control.Feedback type="invalid">{errors.expenseDate}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mt-2">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">📝</span>
                            Description *
                          </Form.Label>
                          <Field name="description">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                as="textarea" 
                                rows={3}
                                placeholder="Describe the expense..."
                                isInvalid={touched.description && errors.description}
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                          <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Payment & Participants Section */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold text-success d-flex align-items-center">
                      <span className="me-2">💳</span>
                      Payment & Participants
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">💳</span>
                            Payment Method *
                          </Form.Label>
                          <Field name="paymentMethod">
                            {({ field }) => (
                              <Form.Select 
                                {...field}
                                className="form-select-lg"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              >
                                <option value="cash">💵 Cash</option>
                                <option value="card">💳 Card</option>
                                <option value="upi">📱 UPI</option>
                                <option value="bank-transfer">🏦 Bank Transfer</option>
                                <option value="cheque">📄 Cheque</option>
                              </Form.Select>
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <FaUsers className="me-2 text-primary" />
                            Participants
                          </Form.Label>
                          <Field name="participants">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                type="number" 
                                min="1"
                                placeholder="Number of participants"
                                isInvalid={touched.participants && errors.participants}
                                className="form-control-lg"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                          <Form.Control.Feedback type="invalid">{errors.participants}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Location & Vendor Section */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold text-info d-flex align-items-center">
                      <span className="me-2">📍</span>
                      Location & Vendor Details
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2">City</Form.Label>
                          <Field name="location.city">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                placeholder="Enter city"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2">State</Form.Label>
                          <Field name="location.state">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                placeholder="Enter state"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2">Place</Form.Label>
                          <Field name="location.place">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                placeholder="Specific place"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mt-2">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">🏪</span>
                            Vendor Name
                          </Form.Label>
                          <Field name="vendor.name">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                placeholder="Enter vendor name"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">🧾</span>
                            Receipt Number
                          </Form.Label>
                          <Field name="receiptNumber">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                placeholder="Receipt/Bill number"
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mt-2">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2 d-flex align-items-center">
                            <span className="me-2">📝</span>
                            Additional Notes
                          </Form.Label>
                          <Field name="notes">
                            {({ field }) => (
                              <Form.Control 
                                {...field} 
                                as="textarea" 
                                rows={2}
                                placeholder="Any additional notes or remarks..."
                                style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                              />
                            )}
                          </Field>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Modal.Body>
              
              <Modal.Footer className="border-0 p-4 bg-light">
                <div className="d-flex justify-content-end gap-3 w-100">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2"
                    style={{ borderRadius: '25px' }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-5 py-2"
                    style={{ borderRadius: '25px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Add Expense
                      </>
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </FormikForm>
          )}
        </Formik>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Expense</Modal.Title>
        </Modal.Header>
        {selectedExpense && (
          <Formik
            initialValues={{
              tour: selectedExpense.tour?._id || '',
              category: selectedExpense.category || '',
              subcategory: selectedExpense.subcategory || '',
              description: selectedExpense.description || '',
              amount: selectedExpense.amount || '',
              expenseDate: selectedExpense.expenseDate ? selectedExpense.expenseDate.split('T')[0] : '',
              location: selectedExpense.location || { city: '', state: '', place: '' },
              vendor: selectedExpense.vendor || { name: '', contact: '', address: '' },
              paymentMethod: selectedExpense.paymentMethod || 'cash',
              receiptNumber: selectedExpense.receiptNumber || '',
              participants: selectedExpense.participants || '',
              notes: selectedExpense.notes || ''
            }}
            validationSchema={expenseValidationSchema}
            onSubmit={handleEditExpense}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <FormikForm>
                <Modal.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tour *</Form.Label>
                        <Field name="tour">
                          {({ field }) => (
                            <Form.Select {...field} isInvalid={touched.tour && errors.tour}>
                              <option value="">Select Tour</option>
                              {tours.map(tour => (
                                <option key={tour._id} value={tour._id}>{tour.title}</option>
                              ))}
                            </Form.Select>
                          )}
                        </Field>
                        <Form.Control.Feedback type="invalid">{errors.tour}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category *</Form.Label>
                        <Field name="category">
                          {({ field }) => (
                            <Form.Select {...field} isInvalid={touched.category && errors.category}>
                              <option value="">Select Category</option>
                              {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.icon} {cat.label}
                                </option>
                              ))}
                            </Form.Select>
                          )}
                        </Field>
                        <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Amount (₹) *</Form.Label>
                        <Field name="amount">
                          {({ field }) => (
                            <Form.Control 
                              {...field} 
                              type="number" 
                              step="0.01"
                              isInvalid={touched.amount && errors.amount}
                            />
                          )}
                        </Field>
                        <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Expense Date *</Form.Label>
                        <Field name="expenseDate">
                          {({ field }) => (
                            <Form.Control 
                              {...field} 
                              type="date" 
                              isInvalid={touched.expenseDate && errors.expenseDate}
                            />
                          )}
                        </Field>
                        <Form.Control.Feedback type="invalid">{errors.expenseDate}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description *</Form.Label>
                    <Field name="description">
                      {({ field }) => (
                        <Form.Control 
                          {...field} 
                          as="textarea" 
                          rows={2}
                          isInvalid={touched.description && errors.description}
                        />
                      )}
                    </Field>
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Method *</Form.Label>
                        <Field name="paymentMethod">
                          {({ field }) => (
                            <Form.Select {...field}>
                              <option value="cash">Cash</option>
                              <option value="card">Card</option>
                              <option value="upi">UPI</option>
                              <option value="bank-transfer">Bank Transfer</option>
                              <option value="cheque">Cheque</option>
                            </Form.Select>
                          )}
                        </Field>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Participants</Form.Label>
                        <Field name="participants">
                          {({ field }) => (
                            <Form.Control 
                              {...field} 
                              type="number" 
                              min="1"
                              isInvalid={touched.participants && errors.participants}
                            />
                          )}
                        </Field>
                        <Form.Control.Feedback type="invalid">{errors.participants}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Field name="notes">
                      {({ field }) => <Form.Control {...field} as="textarea" rows={2} />}
                    </Field>
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Expense'}
                  </Button>
                </Modal.Footer>
              </FormikForm>
            )}
          </Formik>
        )}
      </Modal>
      </Container>
    </div>
  );
};

export default ExpensesPage;