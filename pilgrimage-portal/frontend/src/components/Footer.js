import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row>
          <Col md={4}>
            <div className="d-flex align-items-center mb-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #ff9a56 0%, #ffad56 100%)',
                  boxShadow: '0 4px 15px rgba(255, 154, 86, 0.2)',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="Sri Vishnu Chitra Yatra Logo" 
                  style={{
                    width: '30px',
                    height: '30px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <h5 className="mb-0 text-white">Sri Vishnu Chitra Yatra</h5>
            </div>
            <p className="text-muted">
              Your trusted companion for spiritual journeys across India. Discover sacred destinations,
              experience divine culture, and create unforgettable memories.
            </p>
          </Col>
          <Col md={2}>
            <h6>Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="/" className="text-light">Home</a></li>
              <li><a href="/tours" className="text-light">Tours</a></li>
              <li><a href="/destinations" className="text-light">Destinations</a></li>
              <li><a href="/about" className="text-light">About Us</a></li>
            </ul>
          </Col>
          <Col md={2}>
            <h6>Regions</h6>
            <ul className="list-unstyled">
              <li><a href="/tours?region=south-india" className="text-light">South India</a></li>
              <li><a href="/tours?region=north-india" className="text-light">North India</a></li>
              <li><a href="/tours?region=west-india" className="text-light">West India</a></li>
              <li><a href="/tours?region=east-india" className="text-light">East India</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h6>Contact Info</h6>
            <p>
              📞 +91 9876543210<br />
              ✉️ info@srivishnu-chitrayatra.com<br />
              📍 123 Temple Street, Sacred City, India 560001
            </p>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row>
          <Col md={12} className="text-center pt-3 border-top">
            <p>&copy; 2024 Sri Vishnu Chitra Yatra. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;