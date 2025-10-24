import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row>
                  <Col md={6}>
          <Row>
            <h5>Sri Vishnu Chitta Yatra</h5>
            <p>Your trusted partner for spiritual journeys</p>
          </Row>
        </Col>
        <Col md={6} className="text-md-end">
            <p>&copy; 2025 Sri Vishnu Chitta Yatra. All rights reserved.</p>
        </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer