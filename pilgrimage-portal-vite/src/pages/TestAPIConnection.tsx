import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { toursAPI, bookingsAPI, expensesAPI } from '../services/api';

const TestAPIConnection: React.FC = () => {
  const [results, setResults] = React.useState<any>({});
  const [loading, setLoading] = React.useState(false);

  const testAPIs = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      console.log('Testing Tours API...');
      const toursResponse = await toursAPI.getAll({ limit: 5 });
      testResults.tours = {
        success: true,
        data: toursResponse.data,
        count: toursResponse.data?.tours?.length || 0
      };
    } catch (error: any) {
      testResults.tours = {
        success: false,
        error: error.message || 'Unknown error'
      };
    }

    try {
      console.log('Testing Bookings API...');
      const bookingsResponse = await bookingsAPI.getAll();
      testResults.bookings = {
        success: true,
        data: bookingsResponse.data,
        count: Array.isArray(bookingsResponse.data) ? bookingsResponse.data.length : 0
      };
    } catch (error: any) {
      testResults.bookings = {
        success: false,
        error: error.message || 'Unknown error'
      };
    }

    try {
      console.log('Testing Expenses API...');
      const expensesResponse = await expensesAPI.getAll();
      testResults.expenses = {
        success: true,
        data: expensesResponse.data,
        count: Array.isArray(expensesResponse.data) ? expensesResponse.data.length : 0
      };
    } catch (error: any) {
      testResults.expenses = {
        success: false,
        error: error.message || 'Unknown error'
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4>API Connection Test</h4>
            </Card.Header>
            <Card.Body>
              <Button 
                onClick={testAPIs} 
                disabled={loading}
                className="mb-3"
              >
                {loading ? 'Testing APIs...' : 'Test API Connections'}
              </Button>

              {Object.keys(results).length > 0 && (
                <div>
                  <h5>Results:</h5>
                  
                  {Object.entries(results).map(([api, result]: [string, any]) => (
                    <Alert 
                      key={api}
                      variant={result.success ? 'success' : 'danger'}
                      className="mb-2"
                    >
                      <strong>{api.toUpperCase()} API:</strong> 
                      {result.success ? (
                        <span> ✅ Connected - {result.count} records found</span>
                      ) : (
                        <span> ❌ Failed - {result.error}</span>
                      )}
                    </Alert>
                  ))}
                  
                  <details className="mt-3">
                    <summary>Raw API Responses</summary>
                    <pre className="mt-2 p-2 bg-light rounded">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TestAPIConnection;