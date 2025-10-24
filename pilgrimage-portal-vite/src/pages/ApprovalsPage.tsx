import React from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import PilgrimageAdminSidebar from '../components/PilgrimageAdminSidebar';

const ApprovalsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('approvals');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const pendingApprovals = [
    { id: 1, type: 'Booking', customer: 'John Doe', tour: 'Kailash Mansarovar', amount: 50000, date: '2024-10-08' },
    { id: 2, type: 'Expense', description: 'Hotel Booking', amount: 15000, date: '2024-10-07' },
    { id: 3, type: 'Refund', customer: 'Jane Smith', amount: 25000, date: '2024-10-06' },
  ];

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
            <h1 className="pilgrimage-page-title">Approvals</h1>
          </div>
        </nav>

        <div className="pilgrimage-dashboard-content">
          <Container fluid>
            <Row>
              <Col>
                <Card className="pilgrimage-table-card">
                  <Card.Header className="pilgrimage-card-header">
                    <h5>Pending Approvals</h5>
                    <Badge bg="warning">{pendingApprovals.length} Pending</Badge>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive className="pilgrimage-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApprovals.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <Badge bg="info">{item.type}</Badge>
                            </td>
                            <td>
                              {item.type === 'Booking' ? `${item.customer} - ${item.tour}` : 
                               item.type === 'Expense' ? item.description :
                               `Refund for ${item.customer}`}
                            </td>
                            <td>₹{item.amount.toLocaleString()}</td>
                            <td>{item.date}</td>
                            <td>
                              <Badge bg="warning">Pending</Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button size="sm" variant="success">
                                  <i className="fas fa-check"></i> Approve
                                </Button>
                                <Button size="sm" variant="danger">
                                  <i className="fas fa-times"></i> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsPage;