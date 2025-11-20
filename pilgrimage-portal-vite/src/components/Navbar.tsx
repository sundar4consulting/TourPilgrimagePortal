import React from 'react'
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { FaUser, FaSignOutAlt } from 'react-icons/fa'

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <BootstrapNavbar bg="white" expand="lg" className="shadow-sm fixed-top">
      <Container>
        <BootstrapNavbar.Brand 
          as="div" 
          className="navbar-brand"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNavigation('/')}
        >
          <div className="d-flex align-items-center">
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle me-2"
              style={{
                width: '45px',
                height: '45px',
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
                overflow: 'hidden'
              }}
            >
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>S</span>
            </div>
            <div>
              <div className="fw-bold text-primary" style={{ fontSize: '1.3rem', lineHeight: '1.2' }}>
                Sri Vishnu Chitra Yatra
              </div>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Spiritual Journeys
              </small>
            </div>
          </div>
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              style={{ cursor: 'pointer' }}
              onClick={() => handleNavigation('/')}
            >
              Home
            </Nav.Link>
            <Nav.Link 
              style={{ cursor: 'pointer' }}
              onClick={() => handleNavigation('/tours')}
            >
              Tours
            </Nav.Link>
            {isAuthenticated && user?.role === 'admin' && (
              <Nav.Link 
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigation('/admin/home')}
              >
                Admin Dashboard
              </Nav.Link>
            )}
            {isAuthenticated && user?.role === 'member' && (
              <Nav.Link 
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigation('/member/dashboard')}
              >
                My Dashboard
              </Nav.Link>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <NavDropdown
                title={
                  <span>
                    <FaUser className="me-2" />
                    {user?.name || 'User'}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <FaSignOutAlt className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNavigation('/login')}
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNavigation('/register')}
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar