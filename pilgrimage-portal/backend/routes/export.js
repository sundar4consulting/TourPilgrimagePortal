const express = require('express');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { adminAuth } = require('../middleware/auth');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const Destination = require('../models/Destination');

const router = express.Router();

// Helper function to apply filters
const applyFilters = (query, filters) => {
  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    query.createdAt = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  return query;
};

// Generate CSV export
const generateCSV = (data, fields) => {
  const parser = new Parser({ fields });
  return parser.parse(data);
};

// Generate Excel export
const generateExcel = async (data, sheetName, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  // Add header
  worksheet.columns = columns;
  
  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' }
  };
  
  // Add data
  data.forEach(row => {
    worksheet.addRow(row);
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(12, column.header.length + 2);
  });
  
  return workbook;
};

// Generate PDF export
const generatePDF = (data, title, columns) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      
      // Date
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();
      
      // Table header
      const startY = doc.y;
      const rowHeight = 20;
      const colWidth = (doc.page.width - 100) / columns.length;
      
      doc.fontSize(10).fillColor('black');
      
      columns.forEach((col, i) => {
        doc.rect(50 + i * colWidth, startY, colWidth, rowHeight)
           .fillAndStroke('#f0f0f0', '#000000')
           .fillColor('black')
           .text(col.header, 50 + i * colWidth + 5, startY + 5, {
             width: colWidth - 10,
             height: rowHeight - 10
           });
      });
      
      // Table data
      let currentY = startY + rowHeight;
      data.slice(0, 50).forEach((row, rowIndex) => { // Limit to 50 rows for PDF
        columns.forEach((col, colIndex) => {
          const value = row[col.key] || '';
          doc.rect(50 + colIndex * colWidth, currentY, colWidth, rowHeight)
             .stroke('#cccccc')
             .fillColor('black')
             .text(String(value), 50 + colIndex * colWidth + 5, currentY + 5, {
               width: colWidth - 10,
               height: rowHeight - 10
             });
        });
        currentY += rowHeight;
        
        // Add new page if needed
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }
      });
      
      if (data.length > 50) {
        doc.addPage()
           .fontSize(12)
           .text(`Note: Only first 50 records shown. Total records: ${data.length}`, 50, 50);
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Export tours
router.post('/data', adminAuth, async (req, res) => {
  try {
    const { dataType, format, dateRange, filters } = req.body;
    
    let data = [];
    let filename = '';
    let columns = [];
    
    switch (dataType) {
      case 'tours':
        const tourQuery = applyFilters({}, filters);
        const tours = await Tour.find(tourQuery).lean();
        
        data = tours.map(tour => ({
          id: tour._id,
          name: tour.name,
          category: tour.category,
          destinations: tour.destinations?.join(', '),
          startDate: tour.startDate ? new Date(tour.startDate).toLocaleDateString() : '',
          endDate: tour.endDate ? new Date(tour.endDate).toLocaleDateString() : '',
          duration: tour.duration,
          price: tour.price,
          maxParticipants: tour.maxParticipants,
          currentParticipants: tour.currentParticipants || 0,
          status: tour.status || 'active',
          createdAt: new Date(tour.createdAt).toLocaleDateString()
        }));
        
        columns = [
          { header: 'ID', key: 'id', width: 25 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Destinations', key: 'destinations', width: 40 },
          { header: 'Start Date', key: 'startDate', width: 15 },
          { header: 'End Date', key: 'endDate', width: 15 },
          { header: 'Duration', key: 'duration', width: 10 },
          { header: 'Price', key: 'price', width: 15 },
          { header: 'Max Participants', key: 'maxParticipants', width: 15 },
          { header: 'Current Participants', key: 'currentParticipants', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Created', key: 'createdAt', width: 15 }
        ];
        
        filename = 'tours_export';
        break;
        
      case 'bookings':
        const bookingQuery = applyFilters({}, filters);
        const bookings = await Booking.find(bookingQuery)
          .populate('user', 'name email phone')
          .populate('tour', 'name startDate')
          .lean();
        
        data = bookings.map(booking => ({
          id: booking._id,
          userName: booking.user?.name || 'N/A',
          userEmail: booking.user?.email || 'N/A',
          userPhone: booking.user?.phone || 'N/A',
          tourName: booking.tour?.name || 'N/A',
          tourStartDate: booking.tour?.startDate ? new Date(booking.tour.startDate).toLocaleDateString() : '',
          participants: booking.participants,
          totalAmount: booking.totalAmount,
          status: booking.status,
          bookingDate: new Date(booking.createdAt).toLocaleDateString(),
          specialRequests: booking.specialRequests || ''
        }));
        
        columns = [
          { header: 'Booking ID', key: 'id', width: 25 },
          { header: 'User Name', key: 'userName', width: 20 },
          { header: 'Email', key: 'userEmail', width: 25 },
          { header: 'Phone', key: 'userPhone', width: 15 },
          { header: 'Tour Name', key: 'tourName', width: 30 },
          { header: 'Tour Start Date', key: 'tourStartDate', width: 15 },
          { header: 'Participants', key: 'participants', width: 12 },
          { header: 'Amount', key: 'totalAmount', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Booking Date', key: 'bookingDate', width: 15 },
          { header: 'Special Requests', key: 'specialRequests', width: 30 }
        ];
        
        filename = 'bookings_export';
        break;
        
      case 'users':
        const userQuery = applyFilters({}, filters);
        const users = await User.find(userQuery).select('-password').lean();
        
        data = users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isActive: user.isActive ? 'Yes' : 'No',
          joinDate: new Date(user.createdAt).toLocaleDateString(),
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
        }));
        
        columns = [
          { header: 'User ID', key: 'id', width: 25 },
          { header: 'Name', key: 'name', width: 20 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Role', key: 'role', width: 10 },
          { header: 'Active', key: 'isActive', width: 10 },
          { header: 'Join Date', key: 'joinDate', width: 15 },
          { header: 'Last Login', key: 'lastLogin', width: 15 }
        ];
        
        filename = 'users_export';
        break;
        
      case 'expenses':
        const expenseQuery = applyFilters({}, filters);
        const expenses = await Expense.find(expenseQuery)
          .populate('user', 'name email')
          .lean();
        
        data = expenses.map(expense => ({
          id: expense._id,
          userName: expense.user?.name || 'N/A',
          userEmail: expense.user?.email || 'N/A',
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: new Date(expense.date).toLocaleDateString(),
          status: expense.status,
          submissionDate: new Date(expense.createdAt).toLocaleDateString(),
          approvedBy: expense.approvedBy || '',
          receipts: expense.receipts ? 'Yes' : 'No'
        }));
        
        columns = [
          { header: 'Expense ID', key: 'id', width: 25 },
          { header: 'User Name', key: 'userName', width: 20 },
          { header: 'Email', key: 'userEmail', width: 25 },
          { header: 'Description', key: 'description', width: 30 },
          { header: 'Amount', key: 'amount', width: 15 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Submitted', key: 'submissionDate', width: 15 },
          { header: 'Approved By', key: 'approvedBy', width: 20 },
          { header: 'Has Receipts', key: 'receipts', width: 12 }
        ];
        
        filename = 'expenses_export';
        break;
        
      case 'destinations':
        const destinations = await Destination.find({}).lean();
        
        data = destinations.map(dest => ({
          id: dest._id,
          name: dest.name,
          description: dest.description || '',
          country: dest.country,
          state: dest.state,
          category: dest.category,
          significance: dest.significance || '',
          createdAt: new Date(dest.createdAt).toLocaleDateString()
        }));
        
        columns = [
          { header: 'ID', key: 'id', width: 25 },
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Description', key: 'description', width: 40 },
          { header: 'Country', key: 'country', width: 15 },
          { header: 'State', key: 'state', width: 15 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Significance', key: 'significance', width: 30 },
          { header: 'Created', key: 'createdAt', width: 15 }
        ];
        
        filename = 'destinations_export';
        break;
        
      case 'analytics':
        // Generate analytics report
        const totalUsers = await User.countDocuments();
        const totalTours = await Tour.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalRevenue = await Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        const monthlyBookings = await Booking.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 },
              revenue: { $sum: '$totalAmount' }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ]);
        
        data = [
          { metric: 'Total Users', value: totalUsers },
          { metric: 'Total Tours', value: totalTours },
          { metric: 'Total Bookings', value: totalBookings },
          { metric: 'Total Revenue', value: totalRevenue[0]?.total || 0 },
          ...monthlyBookings.map(item => ({
            metric: `${item._id.year}-${String(item._id.month).padStart(2, '0')} Bookings`,
            value: item.count
          })),
          ...monthlyBookings.map(item => ({
            metric: `${item._id.year}-${String(item._id.month).padStart(2, '0')} Revenue`,
            value: item.revenue
          }))
        ];
        
        columns = [
          { header: 'Metric', key: 'metric', width: 30 },
          { header: 'Value', key: 'value', width: 20 }
        ];
        
        filename = 'analytics_report';
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid data type' });
    }
    
    // Add timestamp to filename
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}`;
    
    // Generate file based on format
    switch (format) {
      case 'csv':
        const csvData = generateCSV(data, columns.map(col => col.key));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${finalFilename}.csv`);
        return res.send(csvData);
        
      case 'excel':
        const workbook = await generateExcel(data, dataType.charAt(0).toUpperCase() + dataType.slice(1), columns);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${finalFilename}.xlsx`);
        return workbook.xlsx.write(res).then(() => res.end());
        
      case 'pdf':
        const pdfBuffer = await generatePDF(data, `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Report`, columns);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${finalFilename}.pdf`);
        return res.send(pdfBuffer);
        
      default:
        return res.status(400).json({ message: 'Invalid format' });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

// Get export statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = {
      availableDataTypes: [
        { value: 'tours', label: 'Tours', count: await Tour.countDocuments() },
        { value: 'bookings', label: 'Bookings', count: await Booking.countDocuments() },
        { value: 'users', label: 'Users', count: await User.countDocuments() },
        { value: 'expenses', label: 'Expenses', count: await Expense.countDocuments() },
        { value: 'destinations', label: 'Destinations', count: await Destination.countDocuments() }
      ],
      supportedFormats: ['csv', 'excel', 'pdf'],
      lastExportDate: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Export stats error:', error);
    res.status(500).json({ message: 'Failed to get export statistics' });
  }
});

module.exports = router;