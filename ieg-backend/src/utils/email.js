const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) {
    logger.warn(`[Email skipped - no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'IEG Platform <no-reply@ieg.com>',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed: ${err.message}`);
  }
};

const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to IEG — International Export Gateway',
    html: `<h2>Welcome, ${name}!</h2><p>Your account has been created. Start exploring the global marketplace.</p>`,
  }),
  verificationApproved: (name) => ({
    subject: 'Your IEG Account is Verified ✅',
    html: `<h2>Congratulations, ${name}!</h2><p>Your business has been verified. You can now list products and start exporting.</p>`,
  }),
  verificationRejected: (name, reason) => ({
    subject: 'IEG Verification Update',
    html: `<h2>Hi ${name},</h2><p>Your verification was not approved. Reason: <strong>${reason}</strong>. Please resubmit with correct documents.</p>`,
  }),
  newOrder: (name, orderNumber) => ({
    subject: `New Order Received: ${orderNumber}`,
    html: `<h2>Hi ${name},</h2><p>You have received a new order <strong>${orderNumber}</strong>. Log in to review and process it.</p>`,
  }),
  orderStatusUpdate: (name, orderNumber, status) => ({
    subject: `Order ${orderNumber} — Status Updated`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>${orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>`,
  }),
  passwordReset: (name, resetUrl) => ({
    subject: 'Reset Your IEG Password',
    html: `<h2>Hi ${name},</h2><p>Click the link below to reset your password. This link expires in 1 hour.</p><a href="${resetUrl}">Reset Password</a>`,
  }),
};

module.exports = { sendEmail, emailTemplates };
