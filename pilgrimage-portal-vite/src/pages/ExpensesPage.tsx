import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { expensesAPI, toursAPI, type Expense, type Tour } from '../services/api'
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
  Badge,
  InputGroup,
  Tabs,
  Tab,
  Dropdown
} from 'react-bootstrap'
import './ExpensesPage.css'

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    tourId: '',
    paymentMethod: '',
    isApproved: undefined as boolean | undefined,
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  })

  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: 0,
    category: 'accommodation',
    expenseDate: '',
    tourId: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'upi' | 'netbanking' | 'other',
    receiptNumber: '',
    notes: '',
    vendor: {
      name: '',
      contact: '',
      address: ''
    },
    location: {
      name: '',
      address: ''
    }
  })

  const expenseCategories = [
  { value: 'transportation', label: 'Transportation', icon: '🚌' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'meals', label: 'Meals', icon: '🍽️' },
  { value: 'temple-donations', label: 'Temple Donations', icon: '�' },
  { value: 'guide-fees', label: 'Guide Fees', icon: '👨‍�' },
  { value: 'entrance-fees', label: 'Entrance Fees', icon: '�' },
  { value: 'photography', label: 'Photography', icon: '📷' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'emergency', label: 'Emergency', icon: '�' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: '📝' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Card', icon: '💳' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
    { value: 'other', label: 'Other', icon: '💰' }
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
      
      const [expensesResponse, toursResponse] = await Promise.all([
        expensesAPI.getAll().catch(() => ({ data: { expenses: [] } })),
        toursAPI.getAll({ limit: 100 }).catch(() => ({ data: { tours: [] } }))
      ])

      // Support both array and object with expenses key
      const expensesArray = Array.isArray(expensesResponse.data)
        ? expensesResponse.data
        : expensesResponse.data.expenses || [];

      let filteredExpenses = expensesArray;

      // Apply filters
      if (filters.category) {
        filteredExpenses = filteredExpenses.filter(e => e.category === filters.category)
      }
      if (filters.tourId) {
        filteredExpenses = filteredExpenses.filter(e => 
          typeof e.tour === 'object' ? e.tour._id === filters.tourId : e.tour === filters.tourId
        )
      }
      if (filters.paymentMethod) {
        filteredExpenses = filteredExpenses.filter(e => e.paymentMethod === filters.paymentMethod)
      }
      if (filters.isApproved !== undefined) {
        filteredExpenses = filteredExpenses.filter(e => e.isApproved === filters.isApproved)
      }
      if (filters.minAmount) {
        filteredExpenses = filteredExpenses.filter(e => e.amount >= parseFloat(filters.minAmount))
      }
      if (filters.maxAmount) {
        filteredExpenses = filteredExpenses.filter(e => e.amount <= parseFloat(filters.maxAmount))
      }
      if (filters.dateFrom) {
        filteredExpenses = filteredExpenses.filter(e => 
          e.expenseDate && new Date(e.expenseDate) >= new Date(filters.dateFrom)
        )
      }
      if (filters.dateTo) {
        filteredExpenses = filteredExpenses.filter(e => 
          e.expenseDate && new Date(e.expenseDate) <= new Date(filters.dateTo)
        )
      }

      setExpenses(filteredExpenses)
      setTours(toursResponse.data.tours || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError('Failed to load expenses data')
      setExpenses([])
      setTours([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const expenseData = {
        ...expenseForm,
        tour: expenseForm.tourId || undefined,
        isApproved: false, // New expenses start as pending
        addedBy: user?.id
      }
      
      if (editingExpense) {
        await expensesAPI.update(editingExpense._id, expenseData)
      } else {
        await expensesAPI.create(expenseData as any)
      }
      
      setShowExpenseModal(false)
      resetExpenseForm()
      await fetchData()
    } catch (error) {
      console.error('Error saving expense:', error)
      setError('Failed to save expense')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await expensesAPI.delete(expenseId)
      await fetchData()
    } catch (error) {
      console.error('Error deleting expense:', error)
      setError('Failed to delete expense')
    }
  }

  const handleApproveExpense = async (expenseId: string, isApproved: boolean) => {
    try {
      await expensesAPI.update(expenseId, { 
        isApproved, 
        approvedBy: isApproved ? user?.id : undefined,
        approvedAt: isApproved ? new Date().toISOString() : undefined
      })
      await fetchData()
    } catch (error) {
      console.error('Error updating expense approval:', error)
      setError('Failed to update expense approval')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '',
      tourId: typeof expense.tour === 'object' ? expense.tour._id : expense.tour || '',
      paymentMethod: expense.paymentMethod as 'cash' | 'card' | 'upi' | 'netbanking' | 'other',
      receiptNumber: expense.receiptNumber || '',
      notes: expense.notes || '',
      vendor: {
        name: expense.vendor?.name || '',
        contact: expense.vendor?.contact || '',
        address: expense.vendor?.address || ''
      },
      location: {
        name: expense.location?.name || '',
        address: expense.location?.address || ''
      }
    })
    setShowExpenseModal(true)
  }

  const resetExpenseForm = () => {
    setExpenseForm({
      description: '',
      amount: 0,
      category: 'accommodation',
      expenseDate: '',
      tourId: '',
      paymentMethod: 'cash',
      receiptNumber: '',
      notes: '',
      vendor: {
        name: '',
        contact: '',
        address: ''
      },
      location: {
        name: '',
        address: ''
      }
    })
    setEditingExpense(null)
  }

  const getCategoryInfo = (category: string) => {
    return expenseCategories.find(cat => cat.value === category) || { value: category, label: category, icon: '📝' }
  }

  const getCategoryBadge = (category: string) => {
    const categoryInfo = getCategoryInfo(category)
    const colors: Record<string, string> = {
      'accommodation': 'primary',
      'transportation': 'success',
      'food': 'warning',
      'activities': 'info',
      'guides': 'secondary',
      'miscellaneous': 'dark'
    }
    return (
      <Badge bg={colors[category] || 'secondary'}>
        {categoryInfo.icon} {categoryInfo.label}
      </Badge>
    )
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodInfo = paymentMethods.find(m => m.value === method)
    return (
      <Badge bg="info">
        {methodInfo?.icon} {methodInfo?.label || method.toUpperCase()}
      </Badge>
    )
  }

  const getApprovalBadge = (isApproved: boolean) => {
    return (
      <Badge bg={isApproved ? 'success' : 'warning'}>
        {isApproved ? '✅ Approved' : '⏳ Pending'}
      </Badge>
    )
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      tourId: '',
      paymentMethod: '',
      isApproved: undefined,
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const approvedExpenses = expenses.filter(e => e.isApproved).reduce((sum, expense) => sum + expense.amount, 0)
  const pendingExpenses = expenses.filter(e => !e.isApproved).reduce((sum, expense) => sum + expense.amount, 0)
  const expensesByCategory = expenseCategories.map(cat => ({
    ...cat,
    count: expenses.filter(e => e.category === cat.value).length,
    amount: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0)
  }))

  if (loading) {
    return (
      <div className="expensesContainer">
        <div className="loadingContainer">
          <div className="loadingSpinner"></div>
          <p className="loadingText">Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="expensesContainer">
      <Container fluid>
        <div className="pageHeader">
          <Row className="align-items-center">
            <Col>
              <p className="pageSubtitle">Track and manage tour expenses across all categories</p>
            </Col>
            <Col xs="auto">
              <Button 
                className="addButton"
                onClick={() => {
                  resetExpenseForm()
                  setShowExpenseModal(true)
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add Expense
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
          <Tab eventKey="list" title="📋 Expenses List">
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
                      {expenseCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Tour</Form.Label>
                    <Form.Select 
                      className="enhancedFormControl"
                      value={filters.tourId}
                      onChange={(e) => setFilters(prev => ({ ...prev, tourId: e.target.value }))}
                    >
                      <option value="">All Tours</option>
                      {tours.map(tour => (
                        <option key={tour._id} value={tour._id}>
                          {tour.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Payment Method</Form.Label>
                    <Form.Select 
                      className="enhancedFormControl"
                      value={filters.paymentMethod}
                      onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <option value="">All Methods</option>
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.icon} {method.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Approval Status</Form.Label>
                    <Form.Select 
                      className="enhancedFormControl"
                      value={filters.isApproved === undefined ? '' : filters.isApproved.toString()}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        isApproved: e.target.value === '' ? undefined : e.target.value === 'true'
                      }))}
                    >
                      <option value="">All Status</option>
                      <option value="true">✅ Approved</option>
                      <option value="false">⏳ Pending</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Date From</Form.Label>
                    <Form.Control 
                      className="enhancedFormControl"
                      type="date" 
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Date To</Form.Label>
                    <Form.Control 
                      className="enhancedFormControl"
                      type="date" 
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Min Amount</Form.Label>
                    <Form.Control 
                      className="enhancedFormControl"
                      type="number" 
                      value={filters.minAmount}
                      onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                      placeholder="₹0"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="enhancedFormLabel">Max Amount</Form.Label>
                    <Form.Control 
                      className="enhancedFormControl"
                      type="number" 
                      value={filters.maxAmount}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                      placeholder="₹∞"
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button 
                    className="secondaryButton"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Summary Cards */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="enhancedCard text-center">
                  <Card.Body>
                    <h5 className="cardTitle">Total Expenses</h5>
                    <h3 className="text-primary">₹{totalExpenses.toLocaleString()}</h3>
                    <small className="text-muted">{expenses.length} entries</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="enhancedCard text-center">
                  <Card.Body>
                    <h5 className="cardTitle">Approved</h5>
                    <h3 className="text-success">₹{approvedExpenses.toLocaleString()}</h3>
                    <small className="text-muted">{expenses.filter(e => e.isApproved).length} entries</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="enhancedCard text-center">
                  <Card.Body>
                    <h5 className="cardTitle">Pending</h5>
                    <h3 className="text-warning">₹{pendingExpenses.toLocaleString()}</h3>
                    <small className="text-muted">{expenses.filter(e => !e.isApproved).length} entries</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="enhancedCard text-center">
                  <Card.Body>
                    <h5 className="cardTitle">Active Tours</h5>
                    <h3 className="text-info">{tours.length}</h3>
                    <small className="text-muted">available tours</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Expenses Table */}
            <Card className="enhancedCard">
              <div className="cardHeader">
                <h5 className="cardTitle">💰 Expense Records ({expenses.length})</h5>
              </div>
              <Card.Body>
                {expenses.length === 0 ? (
                  <Alert variant="info">
                    No expenses found. Add your first expense to get started.
                  </Alert>
                ) : (
                  <Table responsive className="enhancedTable">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Tour</th>
                        <th>Date</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => (
                        <tr key={expense._id}>
                          <td>
                            <strong>{expense.description}</strong>
                            {expense.notes && (
                              <>
                                <br />
                                <small className="text-muted">{expense.notes.substring(0, 50)}...</small>
                              </>
                            )}
                            {expense.receiptNumber && (
                              <>
                                <br />
                                <small className="text-primary">📄 {expense.receiptNumber}</small>
                              </>
                            )}
                          </td>
                          <td>{getCategoryBadge(expense.category)}</td>
                          <td>
                            <strong>₹{expense.amount.toLocaleString()}</strong>
                          </td>
                          <td>
                            {expense.tour && typeof expense.tour === 'object' ? (
                              <small>{expense.tour.title || expense.tour._id || 'Untitled Tour'}</small>
                            ) : (
                              <Badge bg="light" text="dark">No tour</Badge>
                            )}
                          </td>
                          <td>
                            <small>
                              {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : 'No date'}
                            </small>
                          </td>
                          <td>{getPaymentMethodBadge(expense.paymentMethod)}</td>
                          <td>{getApprovalBadge(expense.isApproved)}</td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle size="sm" variant="outline-primary">
                                Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleEditExpense(expense)}>
                                  ✏️ Edit
                                </Dropdown.Item>
                                {!expense.isApproved && (
                                  <Dropdown.Item 
                                    onClick={() => handleApproveExpense(expense._id, true)}
                                    className="text-success"
                                  >
                                    ✅ Approve
                                  </Dropdown.Item>
                                )}
                                {expense.isApproved && (
                                  <Dropdown.Item 
                                    onClick={() => handleApproveExpense(expense._id, false)}
                                    className="text-warning"
                                  >
                                    ⏳ Mark Pending
                                  </Dropdown.Item>
                                )}
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => handleDeleteExpense(expense._id)}
                                  className="text-danger"
                                >
                                  🗑️ Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="analytics" title="📊 Analytics">
            <Card className="enhancedCard">
              <div className="cardHeader">
                <h5 className="cardTitle">📊 Expense Analytics</h5>
              </div>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>💰 Expenses by Category</h6>
                    <Table responsive className="enhancedTable">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Count</th>
                          <th>Total Amount</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expensesByCategory.map(cat => (
                          <tr key={cat.value}>
                            <td>{getCategoryBadge(cat.value)}</td>
                            <td>{cat.count}</td>
                            <td>₹{cat.amount.toLocaleString()}</td>
                            <td>
                              {totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <h6>🎯 Quick Stats</h6>
                    <div className="statsGrid">
                      <div className="statCard">
                        <h4>₹{totalExpenses > 0 ? (totalExpenses / expenses.length).toFixed(0) : 0}</h4>
                        <small>Average Expense</small>
                      </div>
                      <div className="statCard">
                        <h4>{((approvedExpenses / totalExpenses) * 100).toFixed(1)}%</h4>
                        <small>Approval Rate</small>
                      </div>
                      <div className="statCard">
                        <h4>{new Set(expenses.filter(e => e.vendor?.name).map(e => e.vendor?.name)).size}</h4>
                        <small>Unique Vendors</small>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Add/Edit Expense Modal */}
        <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} size="xl" className="expensesPage">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveExpense}>
            <Modal.Body>
              <Tabs defaultActiveKey="basic" className="mb-3">
                <Tab eventKey="basic" title="📋 Basic Info">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Description *</Form.Label>
                        <Form.Control 
                          type="text" 
                          required
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter expense description..."
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category *</Form.Label>
                        <Form.Select 
                          required
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Amount (₹) *</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>₹</InputGroup.Text>
                          <Form.Control 
                            type="number" 
                            required
                            min="0"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date</Form.Label>
                        <Form.Control 
                          type="date"
                          value={expenseForm.expenseDate}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select 
                          value={expenseForm.paymentMethod}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        >
                          {paymentMethods.map(method => (
                            <option key={method.value} value={method.value}>
                              {method.icon} {method.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Associated Tour</Form.Label>
                        <Form.Select 
                          value={expenseForm.tourId}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, tourId: e.target.value }))}
                        >
                          <option value="">No specific tour</option>
                          {tours.map(tour => (
                            <option key={tour._id} value={tour._id}>
                              {tour.title}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Receipt Number</Form.Label>
                        <Form.Control 
                          type="text"
                          value={expenseForm.receiptNumber}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                          placeholder="Receipt/Invoice number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this expense..."
                    />
                  </Form.Group>
                </Tab>

                <Tab eventKey="vendor" title="📍 Vendor & Location">
                  <h6>👤 Vendor Information</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Vendor Name</Form.Label>
                        <Form.Control 
                          type="text"
                          value={expenseForm.vendor.name}
                          onChange={(e) => setExpenseForm(prev => ({ 
                            ...prev, 
                            vendor: { ...prev.vendor, name: e.target.value }
                          }))}
                          placeholder="Vendor name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact</Form.Label>
                        <Form.Control 
                          type="text"
                          value={expenseForm.vendor.contact}
                          onChange={(e) => setExpenseForm(prev => ({ 
                            ...prev, 
                            vendor: { ...prev.vendor, contact: e.target.value }
                          }))}
                          placeholder="Phone/Email"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control 
                          type="text"
                          value={expenseForm.vendor.address}
                          onChange={(e) => setExpenseForm(prev => ({ 
                            ...prev, 
                            vendor: { ...prev.vendor, address: e.target.value }
                          }))}
                          placeholder="Vendor address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6 className="mt-4">📍 Location Information</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Location Name</Form.Label>
                        <Form.Control 
                          type="text"
                          value={expenseForm.location.name}
                          onChange={(e) => setExpenseForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, name: e.target.value }
                          }))}
                          placeholder="Location/City name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control 
                          type="text"
                          value={expenseForm.location.address}
                          onChange={(e) => setExpenseForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, address: e.target.value }
                          }))}
                          placeholder="Expense location address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingExpense ? '💾 Update Expense' : '💾 Save Expense'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  )
}

export default ExpensesPage
