import React from 'react';
import { Spinner, Card, Placeholder, Container, Row, Col } from 'react-bootstrap';

// Main loading spinner
export const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? { width: '3rem', height: '3rem' } : undefined;
  
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center p-4 ${className}`}>
      <Spinner
        animation="border"
        variant="primary"
        size={spinnerSize}
        style={size === 'lg' ? spinnerSize : undefined}
      />
      {text && <div className="mt-2 text-muted">{text}</div>}
    </div>
  );
};

// Card skeleton for loading states
export const CardSkeleton = ({ count = 1, height = '200px' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="mb-3">
          <Card.Header>
            <Placeholder as={Card.Title} animation="glow">
              <Placeholder xs={6} />
            </Placeholder>
          </Card.Header>
          <Card.Body style={{ height }}>
            <Placeholder as={Card.Text} animation="glow">
              <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />
              <Placeholder xs={6} /> <Placeholder xs={8} />
            </Placeholder>
            <Placeholder.Button xs={4} aria-hidden="true" />
          </Card.Body>
        </Card>
      ))}
    </>
  );
};

// Table skeleton for loading data tables
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <Placeholder animation="glow">
                  <Placeholder xs={8} />
                </Placeholder>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <Placeholder animation="glow">
                    <Placeholder xs={6} />
                  </Placeholder>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <Container className="mt-4">
      {/* Header skeleton */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Placeholder as="h2" animation="glow">
          <Placeholder xs={4} />
        </Placeholder>
        <div className="d-flex gap-2">
          <Placeholder.Button xs={6} aria-hidden="true" />
          <Placeholder.Button xs={6} aria-hidden="true" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <Row className="mb-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Col md={3} key={index}>
            <Card className="text-center">
              <Card.Body>
                <Placeholder animation="glow">
                  <div className="mb-2">
                    <Placeholder xs={3} size="lg" />
                  </div>
                  <Placeholder as={Card.Title}>
                    <Placeholder xs={4} />
                  </Placeholder>
                  <Placeholder as={Card.Text}>
                    <Placeholder xs={6} />
                  </Placeholder>
                </Placeholder>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Content skeleton */}
      <Row>
        <Col lg={8}>
          <CardSkeleton count={1} height="300px" />
        </Col>
        <Col lg={4}>
          <CardSkeleton count={1} height="300px" />
        </Col>
      </Row>
    </Container>
  );
};

// Tour card skeleton
export const TourCardSkeleton = ({ count = 6 }) => {
  return (
    <Row>
      {Array.from({ length: count }).map((_, index) => (
        <Col lg={4} md={6} key={index} className="mb-4">
          <Card className="h-100">
            <Placeholder animation="glow">
              <div style={{ height: '200px', backgroundColor: '#dee2e6' }} className="card-img-top" />
            </Placeholder>
            <Card.Body>
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={8} />
              </Placeholder>
              <Placeholder as={Card.Text} animation="glow">
                <Placeholder xs={7} /> <Placeholder xs={4} />
                <Placeholder xs={6} /> <Placeholder xs={8} />
              </Placeholder>
              <div className="d-flex justify-content-between align-items-center">
                <Placeholder animation="glow">
                  <Placeholder xs={4} />
                </Placeholder>
                <Placeholder.Button variant="primary" xs={4} aria-hidden="true" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// List item skeleton
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="list-group">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="list-group-item d-flex justify-content-between align-items-start">
          <div className="ms-2 me-auto flex-grow-1">
            <Placeholder animation="glow">
              <Placeholder as="div" className="fw-bold">
                <Placeholder xs={6} />
              </Placeholder>
              <Placeholder as="p" className="mb-1">
                <Placeholder xs={8} /> <Placeholder xs={4} />
              </Placeholder>
              <Placeholder as="small">
                <Placeholder xs={5} />
              </Placeholder>
            </Placeholder>
          </div>
          <div className="text-end">
            <Placeholder animation="glow">
              <Placeholder xs={3} className="mb-1" />
              <br />
              <Placeholder xs={4} />
            </Placeholder>
          </div>
        </div>
      ))}
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  loading = false, 
  children, 
  disabled = false, 
  spinnerSize = 'sm',
  ...props 
}) => {
  return (
    <button 
      {...props} 
      disabled={disabled || loading}
      className={`btn ${props.className || 'btn-primary'}`}
    >
      {loading && (
        <Spinner
          as="span"
          animation="border"
          size={spinnerSize}
          role="status"
          aria-hidden="true"
          className="me-2"
        />
      )}
      {children}
    </button>
  );
};

// Page loading overlay
export const PageLoadingOverlay = ({ show = false, text = 'Loading...' }) => {
  if (!show) return null;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        zIndex: 9999,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div className="text-center">
        <Spinner
          animation="border"
          variant="primary"
          style={{ width: '3rem', height: '3rem' }}
        />
        <div className="mt-3 fw-bold text-primary">{text}</div>
      </div>
    </div>
  );
};

// Search loading state
export const SearchLoading = () => {
  return (
    <div className="text-center py-4">
      <Spinner animation="border" variant="primary" className="mb-2" />
      <div className="text-muted">Searching...</div>
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`text-center py-5 ${className}`}>
      {Icon && <Icon size={48} className="text-muted mb-3" />}
      <h5 className="text-muted">{title}</h5>
      {description && <p className="text-muted mb-3">{description}</p>}
      {action}
    </div>
  );
};

export default {
  LoadingSpinner,
  CardSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  TourCardSkeleton,
  ListSkeleton,
  LoadingButton,
  PageLoadingOverlay,
  SearchLoading,
  EmptyState
};