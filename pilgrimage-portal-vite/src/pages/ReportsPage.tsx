import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table,
  Form,
  Button,
  Badge,
  Alert,
  Spinner
} from 'react-bootstrap'
import { expensesAPI, bookingsAPI, toursAPI, Tour, Booking, Expense } from '../services/api'

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportType, setReportType] = useState('overview')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedTour, setSelectedTour] = useState('')
  
  // Data states
  const [tours, setTours] = useState<Tour[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [toursResponse, bookingsResponse, expensesResponse] = await Promise.all([
        toursAPI.getAll({ limit: 100 }).catch(() => ({ data: { tours: [] } })),
        bookingsAPI.getAll().catch(() => ({ data: [] })),
        expensesAPI.getAll().catch(() => ({ data: [] }))
      ])
      
      setTours(toursResponse.data.tours)
      setBookings(bookingsResponse.data)
      setExpenses(expensesResponse.data)
    } catch (error: any) {
      console.error('Error fetching reports data:', error)
      setError('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on selected criteria
  const getFilteredData = () => {
    let filteredBookings = bookings
    let filteredExpenses = expenses

    if (dateFrom) {
      filteredBookings = filteredBookings.filter(b => b.createdAt >= dateFrom)
      filteredExpenses = filteredExpenses.filter(e => e.expenseDate >= dateFrom)
    }

    if (dateTo) {
      filteredBookings = filteredBookings.filter(b => b.createdAt <= dateTo)
      filteredExpenses = filteredExpenses.filter(e => e.expenseDate <= dateTo)
    }

    if (selectedTour) {
      filteredBookings = filteredBookings.filter(b => b.tourId === selectedTour)
      filteredExpenses = filteredExpenses.filter(e => 
        typeof e.tour === 'string' ? e.tour === selectedTour : e.tour._id === selectedTour
      )
    }

    return { filteredBookings, filteredExpenses }
  }

  const { filteredBookings, filteredExpenses } = getFilteredData()

  // Calculate analytics
  const analytics = {
    totalRevenue: filteredBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0),
    totalExpenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    totalBookings: filteredBookings.length,
    confirmedBookings: filteredBookings.filter(b => b.status === 'confirmed').length,
    pendingBookings: filteredBookings.filter(b => b.status === 'pending').length,
    cancelledBookings: filteredBookings.filter(b => b.status === 'cancelled').length,
    totalParticipants: filteredBookings.reduce((sum, b) => sum + b.participants.length, 0)
  }

  const profit = analytics.totalRevenue - analytics.totalExpenses

  // Tour-wise analytics
  const tourAnalytics = tours.map(tour => {
    const tourBookings = filteredBookings.filter(b => b.tourId === tour._id)
    const tourExpenses = filteredExpenses.filter(e => 
      typeof e.tour === 'string' ? e.tour === tour._id : e.tour._id === tour._id
    )
    const revenue = tourBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0)
    const expenses = tourExpenses.reduce((sum, e) => sum + e.amount, 0)
    
    return {
      tour,
      bookings: tourBookings.length,
      confirmedBookings: tourBookings.filter(b => b.status === 'confirmed').length,
      participants: tourBookings.reduce((sum, b) => sum + b.participants.length, 0),
      revenue,
      expenses,
      profit: revenue - expenses
    }
  }).filter(ta => ta.bookings > 0 || ta.expenses > 0)

  // Expense category breakdown
  const expenseCategories = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  // Monthly trends (last 12 months)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStr = date.toISOString().slice(0, 7) // YYYY-MM format
    
    const monthBookings = bookings.filter(b => b.createdAt.startsWith(monthStr))
    const monthExpenses = expenses.filter(e => e.expenseDate && e.expenseDate.startsWith(monthStr))
    
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: monthBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0),
      expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      bookings: monthBookings.length
    }
  }).reverse()

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading reports...</p>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-6 fw-bold text-primary">Reports & Analytics</h1>
          <p className="text-muted">Comprehensive business insights and financial reports</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">Report Filters</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label className="small">Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="overview">Overview</option>
                  <option value="financial">Financial</option>
                  <option value="tours">Tour Performance</option>
                  <option value="trends">Monthly Trends</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label className="small">Tour</Form.Label>
                <Form.Select
                  value={selectedTour}
                  onChange={(e) => setSelectedTour(e.target.value)}
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
              <Form.Group className="mb-3">
                <Form.Label className="small">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label className="small">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => {
              setSelectedTour('')
              setDateFrom('')
              setDateTo('')
            }}
          >
            Clear Filters
          </Button>
        </Card.Body>
      </Card>

      {/* Overview Dashboard */}
      {reportType === 'overview' && (
        <>
          {/* Key Metrics */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-primary">
                <Card.Body className="text-center">
                  <div className="text-primary mb-2">
                    <i className="fas fa-rupee-sign fa-2x"></i>
                  </div>
                  <h4 className="text-primary">₹{analytics.totalRevenue.toLocaleString()}</h4>
                  <p className="text-muted mb-0">Total Revenue</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="border-danger">
                <Card.Body className="text-center">
                  <div className="text-danger mb-2">
                    <i className="fas fa-receipt fa-2x"></i>
                  </div>
                  <h4 className="text-danger">₹{analytics.totalExpenses.toLocaleString()}</h4>
                  <p className="text-muted mb-0">Total Expenses</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className={`border-${profit >= 0 ? 'success' : 'warning'}`}>
                <Card.Body className="text-center">
                  <div className={`text-${profit >= 0 ? 'success' : 'warning'} mb-2`}>
                    <i className="fas fa-chart-line fa-2x"></i>
                  </div>
                  <h4 className={`text-${profit >= 0 ? 'success' : 'warning'}`}>
                    ₹{profit.toLocaleString()}
                  </h4>
                  <p className="text-muted mb-0">Net Profit</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="border-info">
                <Card.Body className="text-center">
                  <div className="text-info mb-2">
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                  <h4 className="text-info">{analytics.totalParticipants}</h4>
                  <p className="text-muted mb-0">Total Participants</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Booking Status Breakdown */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-success">
                <Card.Body className="text-center">
                  <h5 className="text-success">{analytics.confirmedBookings}</h5>
                  <p className="text-muted mb-0">Confirmed</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="border-warning">
                <Card.Body className="text-center">
                  <h5 className="text-warning">{analytics.pendingBookings}</h5>
                  <p className="text-muted mb-0">Pending</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="border-secondary">
                <Card.Body className="text-center">
                  <h5 className="text-secondary">{analytics.cancelledBookings}</h5>
                  <p className="text-muted mb-0">Cancelled</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="border-primary">
                <Card.Body className="text-center">
                  <h5 className="text-primary">{analytics.totalBookings}</h5>
                  <p className="text-muted mb-0">Total Bookings</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Financial Report */}
      {reportType === 'financial' && (
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Revenue vs Expenses</h6>
              </Card.Header>
              <Card.Body>
                <Table>
                  <tbody>
                    <tr>
                      <td><strong>Total Revenue</strong></td>
                      <td className="text-end text-success">
                        ₹{analytics.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Total Expenses</strong></td>
                      <td className="text-end text-danger">
                        ₹{analytics.totalExpenses.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="table-light">
                      <td><strong>Net Profit/Loss</strong></td>
                      <td className={`text-end fw-bold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        ₹{profit.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Profit Margin</strong></td>
                      <td className="text-end">
                        {analytics.totalRevenue > 0 
                          ? ((profit / analytics.totalRevenue) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Expense Breakdown</h6>
              </Card.Header>
              <Card.Body>
                <Table size="sm">
                  <tbody>
                    {Object.entries(expenseCategories)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, amount]) => (
                        <tr key={category}>
                          <td>
                            <Badge bg="light" text="dark">{category}</Badge>
                          </td>
                          <td className="text-end">₹{amount.toLocaleString()}</td>
                          <td className="text-end text-muted">
                            {analytics.totalExpenses > 0 
                              ? ((amount / analytics.totalExpenses) * 100).toFixed(1) + '%'
                              : '0%'
                            }
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tour Performance */}
      {reportType === 'tours' && (
        <Card>
          <Card.Header>
            <h6 className="mb-0">Tour Performance Analysis</h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Bookings</th>
                    <th>Confirmed</th>
                    <th>Participants</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Profit</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {tourAnalytics.map((ta) => (
                    <tr key={ta.tour._id}>
                      <td>
                        <strong>{ta.tour.title}</strong>
                        <br />
                        <small className="text-muted">{ta.tour.category}</small>
                      </td>
                      <td>{ta.bookings}</td>
                      <td>{ta.confirmedBookings}</td>
                      <td>{ta.participants}</td>
                      <td className="text-success">₹{ta.revenue.toLocaleString()}</td>
                      <td className="text-danger">₹{ta.expenses.toLocaleString()}</td>
                      <td className={ta.profit >= 0 ? 'text-success' : 'text-danger'}>
                        ₹{ta.profit.toLocaleString()}
                      </td>
                      <td>
                        {ta.expenses > 0 
                          ? ((ta.profit / ta.expenses) * 100).toFixed(1) + '%'
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Monthly Trends */}
      {reportType === 'trends' && (
        <Card>
          <Card.Header>
            <h6 className="mb-0">Monthly Trends (Last 12 Months)</h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, index) => {
                    const monthProfit = month.revenue - month.expenses
                    return (
                      <tr key={index}>
                        <td>{month.month}</td>
                        <td>{month.bookings}</td>
                        <td className="text-success">₹{month.revenue.toLocaleString()}</td>
                        <td className="text-danger">₹{month.expenses.toLocaleString()}</td>
                        <td className={monthProfit >= 0 ? 'text-success' : 'text-danger'}>
                          ₹{monthProfit.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default ReportsPage