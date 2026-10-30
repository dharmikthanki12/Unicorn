const nodemailer = require('nodemailer');

const createTransporter = () => {
  // If SMTP is configured in .env, use real SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development simulation transporter (logs clearly to console)
  return {
    sendMail: async (options) => {
      console.log('--------------------------------------------------');
      console.log(`[Email Service Simulation] Sent to: ${options.to}`);
      console.log(`[Subject]: ${options.subject}`);
      console.log(`[Text Body]:\n${options.text || options.html}`);
      console.log('--------------------------------------------------');
      return { messageId: 'simulated_' + Date.now() };
    }
  };
};

const transporter = createTransporter();

exports.sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const subject = 'UNICORN Protocol — Password Reset Request';
  const text = `You recently requested to reset your UNICORN platform password.\n\nPlease use the following verification token: ${resetToken}\nOr visit: ${resetUrl}\n\nThis token will expire in 15 minutes. If you did not request this, please ignore this email.`;

  return await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'UNICORN Protocol'}" <${process.env.FROM_EMAIL || 'no-reply@unicorn.io'}>`,
    to: email,
    subject,
    text
  });
};

exports.sendWithdrawalOtpEmail = async (email, otpCode) => {
  const subject = 'UNICORN Protocol — Withdrawal Verification Code (2FA)';
  const text = `Your one-time security code (2FA) for withdrawal authorization is:\n\n${otpCode}\n\nThis code will expire in 10 minutes. Never share this code with anyone.`;

  return await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'UNICORN Security'}" <${process.env.FROM_EMAIL || 'security@unicorn.io'}>`,
    to: email,
    subject,
    text
  });
};

