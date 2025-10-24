import React, { useState } from 'react';
import { Button, Modal, Form, Row, Col, Alert, ButtonGroup, Spinner } from 'react-bootstrap';
import { FaDownload, FaFileExcel, FaFilePdf, FaFileCsv, FaCalendar, FaFilter } from 'react-icons/fa';
import api from '../services/api';

const ExportComponent = ({ show, onHide, title = "Export Data" }) => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [exportConfig, setExportConfig] = useState({
    dataType: 'tours',
    format: 'excel',
    dateRange: {
      start: '',
      end: ''
    },
    filters: {
      status: '',
      category: '',
      includeDetails: true,
      includeStats: false
    }
  });

  const dataTypes = [
    { value: 'tours', label: 'Tours', icon: FaCalendar },
    { value: 'bookings', label: 'Bookings', icon: FaCalendar },
    { value: 'users', label: 'Users', icon: FaCalendar },
    { value: 'expenses', label: 'Expenses', icon: FaCalendar },
    { value: 'destinations', label: 'Destinations', icon: FaCalendar },
    { value: 'analytics', label: 'Analytics Report', icon: FaCalendar }
  ];

  const formats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: FaFileExcel, color: '#28a745' },
    { value: 'csv', label: 'CSV (.csv)', icon: FaFileCsv, color: '#007bff' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: FaFilePdf, color: '#dc3545' }
  ];

  const handleExport = async () => {
    setLoading(true);
    setAlert(null);

    try {
      const response = await api.post('/export/data', exportConfig, {
        responseType: 'blob',
        timeout: 60000 // 60 seconds timeout
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determine file extension
      const extensions = { excel: 'xlsx', csv: 'csv', pdf: 'pdf' };
      const extension = extensions[exportConfig.format];
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${exportConfig.dataType}_export_${timestamp}.${extension}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setAlert({ type: 'success', message: `${exportConfig.dataType} exported successfully!` });
      
      // Auto-close modal after success
      setTimeout(() => {
        onHide();
        setAlert(null);
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setAlert({ 
        type: 'danger', 
        message: error.response?.data?.message || 'Export failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setExportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (filter, value) => {
    setExportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filter]: value
      }
    }));
  };

  const handleDateRangeChange = (field, value) => {
    setExportConfig(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const resetConfig = () => {
    setExportConfig({
      dataType: 'tours',
      format: 'excel',
      dateRange: { start: '', end: '' },
      filters: {
        status: '',
        category: '',
        includeDetails: true,
        includeStats: false
      }
    });
    setAlert(null);
  };

  const getFormatIcon = (format) => {
    const formatData = formats.find(f => f.value === format);
    if (formatData) {
      const IconComponent = formatData.icon;
      return <IconComponent style={{ color: formatData.color }} />;
    }
    return <FaDownload />;
  };

  const getEstimatedSize = () => {
    // Mock estimation based on data type and filters
    const baseSizes = {
      tours: '2-5 MB',
      bookings: '1-10 MB',
      users: '500 KB - 2 MB',
      expenses: '1-5 MB',
      destinations: '500 KB - 1 MB',
      analytics: '3-15 MB'
    };
    return baseSizes[exportConfig.dataType] || '1-5 MB';
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaDownload className="me-2" />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {alert && (
          <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
            {alert.message}
          </Alert>
        )}

        <Form>
          {/* Data Type Selection */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              <FaFilter className="me-2" />
              Select Data Type
            </Form.Label>
            <Row>
              {dataTypes.map(type => (
                <Col md={4} key={type.value} className="mb-2">
                  <Form.Check
                    type="radio"
                    name="dataType"
                    id={`dataType-${type.value}`}
                    label={type.label}
                    checked={exportConfig.dataType === type.value}
                    onChange={() => handleConfigChange('dataType', type.value)}
                    className="border rounded p-2"
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>

          {/* Format Selection */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Export Format</Form.Label>
            <ButtonGroup className="w-100">
              {formats.map(format => (
                <Button
                  key={format.value}
                  variant={exportConfig.format === format.value ? 'primary' : 'outline-primary'}
                  onClick={() => handleConfigChange('format', format.value)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <format.icon className="me-2" style={{ color: format.color }} />
                  {format.label}
                </Button>
              ))}
            </ButtonGroup>
          </Form.Group>

          {/* Date Range */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              <FaCalendar className="me-2" />
              Date Range (Optional)
            </Form.Label>
            <Row>
              <Col md={6}>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={exportConfig.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </Col>
              <Col md={6}>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={exportConfig.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </Col>
            </Row>
          </Form.Group>

          {/* Filters */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Filters</Form.Label>
            <Row>
              <Col md={6}>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={exportConfig.filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={exportConfig.filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="cultural">Cultural</option>
                  <option value="adventure">Adventure</option>
                  <option value="heritage">Heritage</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="transport">Transport</option>
                  <option value="food">Food</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </Form.Select>
              </Col>
            </Row>
          </Form.Group>

          {/* Additional Options */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Additional Options</Form.Label>
            <Form.Check
              type="checkbox"
              id="includeDetails"
              label="Include detailed information"
              checked={exportConfig.filters.includeDetails}
              onChange={(e) => handleFilterChange('includeDetails', e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="checkbox"
              id="includeStats"
              label="Include statistical summary"
              checked={exportConfig.filters.includeStats}
              onChange={(e) => handleFilterChange('includeStats', e.target.checked)}
            />
            <Form.Text className="text-muted">
              Detailed information includes all available fields, while summary includes only essential data.
            </Form.Text>
          </Form.Group>

          {/* Export Preview */}
          <div className="bg-light rounded p-3 mb-3">
            <h6>Export Preview</h6>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold">Data:</span> {exportConfig.dataType.charAt(0).toUpperCase() + exportConfig.dataType.slice(1)}<br />
                <span className="fw-bold">Format:</span> {getFormatIcon(exportConfig.format)} {exportConfig.format.toUpperCase()}<br />
                {(exportConfig.dateRange.start || exportConfig.dateRange.end) && (
                  <><span className="fw-bold">Date Range:</span> {exportConfig.dateRange.start || 'Beginning'} to {exportConfig.dateRange.end || 'Now'}<br /></>
                )}
                <span className="fw-bold">Estimated Size:</span> {getEstimatedSize()}
              </div>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={resetConfig} disabled={loading}>
          Reset
        </Button>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleExport} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Exporting...
            </>
          ) : (
            <>
              {getFormatIcon(exportConfig.format)}
              <span className="ms-2">Export {exportConfig.format.toUpperCase()}</span>
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ExportComponent;