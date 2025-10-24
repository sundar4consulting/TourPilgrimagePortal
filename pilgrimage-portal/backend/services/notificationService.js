const nodemailer = require('nodemailer');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  bookingConfirmation: (booking, user, tour) => ({
    subject: `Booking Confirmation - ${tour.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Booking Confirmation</h2>
        <p>Dear ${user.name},</p>
        <p>Your booking for <strong>${tour.name}</strong> has been confirmed!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Tour:</strong> ${tour.name}</li>
            <li><strong>Start Date:</strong> ${new Date(tour.startDate).toLocaleDateString()}</li>
            <li><strong>Duration:</strong> ${tour.duration} days</li>
            <li><strong>Participants:</strong> ${booking.participants}</li>
            <li><strong>Total Amount:</strong> ₹${booking.totalAmount.toLocaleString()}</li>
            <li><strong>Booking ID:</strong> ${booking._id}</li>
          </ul>
        </div>
        
        <p><strong>Important Instructions:</strong></p>
        <ul>
          <li>Please carry a valid ID proof during the tour</li>
          <li>Reach the departure point 30 minutes before scheduled time</li>
          <li>Contact us at +91-XXXXXXXXXX for any queries</li>
        </ul>
        
        <p>We look forward to providing you with a memorable spiritual journey!</p>
        <p>Best regards,<br>Pilgrimage Portal Team</p>
      </div>
    `
  }),

  bookingStatusUpdate: (booking, user, tour, status) => ({
    subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${tour.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'cancelled' ? '#dc3545' : '#667eea'};">Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Dear ${user.name},</p>
        <p>Your booking for <strong>${tour.name}</strong> has been ${status}.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${booking._id}</li>
            <li><strong>Tour:</strong> ${tour.name}</li>
            <li><strong>Status:</strong> <span style="color: ${status === 'cancelled' ? '#dc3545' : '#28a745'}; font-weight: bold;">${status.toUpperCase()}</span></li>
            <li><strong>Total Amount:</strong> ₹${booking.totalAmount.toLocaleString()}</li>
          </ul>
        </div>
        
        ${status === 'cancelled' ? 
          '<p><strong>Refund Information:</strong><br>Your refund will be processed within 5-7 business days.</p>' : 
          '<p>Thank you for choosing our pilgrimage tours!</p>'
        }
        
        <p>For any queries, please contact us at support@pilgrimageportal.com</p>
        <p>Best regards,<br>Pilgrimage Portal Team</p>
      </div>
    `
  }),

  expenseStatusUpdate: (expense, user, status) => ({
    subject: `Expense ${status.charAt(0).toUpperCase() + status.slice(1)} - ₹${expense.amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'rejected' ? '#dc3545' : '#28a745'};">Expense ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Dear ${user.name},</p>
        <p>Your expense claim has been ${status}.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Expense Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Description:</strong> ${expense.description}</li>
            <li><strong>Amount:</strong> ₹${expense.amount.toLocaleString()}</li>
            <li><strong>Category:</strong> ${expense.category}</li>
            <li><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</li>
            <li><strong>Status:</strong> <span style="color: ${status === 'rejected' ? '#dc3545' : '#28a745'}; font-weight: bold;">${status.toUpperCase()}</span></li>
          </ul>
        </div>
        
        ${status === 'approved' ? 
          '<p><strong>Reimbursement:</strong><br>The approved amount will be credited to your account within 3-5 business days.</p>' : 
          status === 'rejected' ? 
          '<p><strong>Rejection Reason:</strong><br>Please contact the administrator for more details.</p>' :
          '<p>Your expense is currently under review.</p>'
        }
        
        <p>For any queries, please contact us at finance@pilgrimageportal.com</p>
        <p>Best regards,<br>Finance Team</p>
      </div>
    `
  }),

  tourReminder: (booking, user, tour) => ({
    subject: `Tour Reminder - ${tour.name} starts tomorrow!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Tour Reminder</h2>
        <p>Dear ${user.name},</p>
        <p>This is a friendly reminder that your tour <strong>${tour.name}</strong> starts tomorrow!</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Tomorrow's Schedule:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Tour:</strong> ${tour.name}</li>
            <li><strong>Start Date:</strong> ${new Date(tour.startDate).toLocaleDateString()}</li>
            <li><strong>Departure Time:</strong> 6:00 AM</li>
            <li><strong>Participants:</strong> ${booking.participants}</li>
          </ul>
        </div>
        
        <p><strong>Pre-departure Checklist:</strong></p>
        <ul>
          <li>✓ Valid ID proof</li>
          <li>✓ Comfortable walking shoes</li>
          <li>✓ Weather-appropriate clothing</li>
          <li>✓ Any personal medications</li>
          <li>✓ Water bottle</li>
        </ul>
        
        <p>We're excited to have you join us on this spiritual journey!</p>
        <p>Safe travels,<br>Pilgrimage Portal Team</p>
      </div>
    `
  }),

  adminNotification: (type, data) => ({
    subject: `Admin Alert: ${type}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Admin Notification</h2>
        <p>A new ${type} requires your attention:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
        <p>Please log in to the admin dashboard to take action.</p>
      </div>
    `
  })
};

// Notification service class
class NotificationService {
  constructor() {
    this.transporter = transporter;
  }

  async sendEmail(to, template) {
    try {
      const mailOptions = {
        from: `"Pilgrimage Portal" <${process.env.SMTP_USER || 'noreply@pilgrimageportal.com'}>`,
        to,
        subject: template.subject,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Booking notifications
  async sendBookingConfirmation(bookingId) {
    try {
      const booking = await Booking.findById(bookingId).populate('user tour');
      if (!booking || !booking.user || !booking.tour) {
        throw new Error('Booking, user, or tour not found');
      }

      const template = emailTemplates.bookingConfirmation(booking, booking.user, booking.tour);
      return await this.sendEmail(booking.user.email, template);
    } catch (error) {
      console.error('Booking confirmation email failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingStatusUpdate(bookingId, status) {
    try {
      const booking = await Booking.findById(bookingId).populate('user tour');
      if (!booking || !booking.user || !booking.tour) {
        throw new Error('Booking, user, or tour not found');
      }

      const template = emailTemplates.bookingStatusUpdate(booking, booking.user, booking.tour, status);
      return await this.sendEmail(booking.user.email, template);
    } catch (error) {
      console.error('Booking status update email failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Expense notifications
  async sendExpenseStatusUpdate(expenseId, status) {
    try {
      const expense = await Expense.findById(expenseId).populate('user');
      if (!expense || !expense.user) {
        throw new Error('Expense or user not found');
      }

      const template = emailTemplates.expenseStatusUpdate(expense, expense.user, status);
      return await this.sendEmail(expense.user.email, template);
    } catch (error) {
      console.error('Expense status update email failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Tour reminders
  async sendTourReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      const upcomingTours = await Tour.find({
        startDate: {
          $gte: tomorrow,
          $lt: nextDay
        }
      });

      const bookings = await Booking.find({
        tour: { $in: upcomingTours.map(t => t._id) },
        status: 'confirmed'
      }).populate('user tour');

      const results = [];
      for (const booking of bookings) {
        const template = emailTemplates.tourReminder(booking, booking.user, booking.tour);
        const result = await this.sendEmail(booking.user.email, template);
        results.push({ bookingId: booking._id, result });
      }

      console.log(`Tour reminders sent for ${results.length} bookings`);
      return results;
    } catch (error) {
      console.error('Tour reminder emails failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin notifications
  async notifyAdmins(type, data) {
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      const template = emailTemplates.adminNotification(type, data);
      
      const results = [];
      for (const admin of admins) {
        const result = await this.sendEmail(admin.email, template);
        results.push({ adminId: admin._id, result });
      }

      console.log(`Admin notifications sent to ${results.length} admins`);
      return results;
    } catch (error) {
      console.error('Admin notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk notifications
  async sendBulkNotification(userIds, subject, htmlContent) {
    try {
      const users = await User.find({ _id: { $in: userIds }, isActive: true });
      const template = { subject, html: htmlContent };
      
      const results = [];
      for (const user of users) {
        const result = await this.sendEmail(user.email, template);
        results.push({ userId: user._id, result });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Bulk notification sent to ${results.length} users`);
      return results;
    } catch (error) {
      console.error('Bulk notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email function
  async sendTestEmail(to) {
    const template = {
      subject: 'Test Email from Pilgrimage Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Test Email</h2>
          <p>This is a test email to verify the email configuration.</p>
          <p>If you receive this email, the notification service is working correctly!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    return await this.sendEmail(to, template);
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();

// Schedule periodic tour reminders (if using in production, consider using a proper job scheduler)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    notificationService.sendTourReminders();
  }, 24 * 60 * 60 * 1000); // Run once daily
}

module.exports = notificationService;