import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { expensesAPI, toursAPI, type Expense, type Tour } from '../services/api';
import PilgrimageAdminSidebar from '../components/PilgrimageAdminSidebar';

const AnalyticsPage: React.FC = () => {
  // Example: You may want to fetch these from backend or context
  // For now, import from ExpensesPage logic
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [tours, setTours] = React.useState<Tour[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [expensesResponse, toursResponse] = await Promise.all([
          expensesAPI.getAll().catch(() => ({ data: { expenses: [] } })),
          toursAPI.getAll({ limit: 100 }).catch(() => ({ data: { tours: [] } }))
        ]);
        const expensesArray = Array.isArray(expensesResponse.data)
          ? expensesResponse.data
          : expensesResponse.data.expenses || [];
        setExpenses(expensesArray);
        setTours(toursResponse.data.tours || []);
      } catch (error) {
        setExpenses([]);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // You may want to fetch these via API in useEffect
  // For demo, you can pass as props or use context
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('analytics');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="pilgrimage-admin-layout">
      <PilgrimageAdminSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className={`pilgrimage-main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <nav className="pilgrimage-topbar">
          <div className="pilgrimage-topbar-content">
            <button
              className="pilgrimage-sidebar-toggle d-md-none btn btn-link"
              onClick={toggleSidebar}
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="pilgrimage-page-title">Analytics</h1>
          </div>
        </nav>

        <div className="pilgrimage-dashboard-content">
          <Container fluid>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="enhancedCard text-center">
                    <Card.Body>
                      <h5 className="cardTitle">Total Expenses</h5>
                      <h3 className="text-primary">₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}</h3>
                      <small className="text-muted">{expenses.length} entries</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="enhancedCard text-center">
                    <Card.Body>
                      <h5 className="cardTitle">Approved</h5>
                      <h3 className="text-success">₹{expenses.filter(e => e.isApproved).reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}</h3>
                      <small className="text-muted">{expenses.filter(e => e.isApproved).length} entries</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="enhancedCard text-center">
                    <Card.Body>
                      <h5 className="cardTitle">Pending</h5>
                      <h3 className="text-warning">₹{expenses.filter(e => !e.isApproved).reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}</h3>
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
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;