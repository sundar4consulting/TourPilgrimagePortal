import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import PilgrimageAdminSidebar from '../components/PilgrimageAdminSidebar';

const AnalyticsPage: React.FC = () => {
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
            <Row>
              <Col>
                <Card>
                  <Card.Body>
                    <h4>Analytics Dashboard</h4>
                    <p>Detailed analytics and reports will be displayed here.</p>
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

export default AnalyticsPage;