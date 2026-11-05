const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = (process.env.SMTP_USER || 'dharmikthanki5050@gmail.com').trim();
  const pass = (process.env.SMTP_PASS || 'sujfiniuuqlucuah').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    }
  });
};

const transporter = createTransporter();

exports.sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const subject = 'UNICORN Protocol — Password Reset Request';
  const text = `You recently requested to reset your UNICORN platform password.\n\nPlease use the following verification token: ${resetToken}\nOr visit: ${resetUrl}\n\nThis token will expire in 15 minutes. If you did not request this, please ignore this email.`;

  return await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'UNICORN Protocol'}" <${process.env.FROM_EMAIL || 'dharmikthanki5050@gmail.com'}>`,
    to: email,
    subject,
    text
  });
};

exports.sendWithdrawalOtpEmail = async (email, otpCode) => {
  const subject = 'UNICORN Protocol — Withdrawal Verification Code (2FA)';
  const text = `Your one-time security code (2FA) for withdrawal authorization is:\n\n${otpCode}\n\nThis code will expire in 10 minutes. Never share this code with anyone.`;

  return await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'UNICORN Security'}" <${process.env.FROM_EMAIL || 'dharmikthanki5050@gmail.com'}>`,
    to: email,
    subject,
    text
  });
};

exports.sendEmailVerificationOtp = async (email, otpCode) => {
  const subject = `UNICORN Protocol — Your Email Verification Code: ${otpCode}`;
  const text = `Welcome to UNICORN Protocol!\n\nYour 6-digit email verification code is: ${otpCode}\n\nThis verification code is valid for 10 minutes. Please enter this code in the registration screen to verify your email.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f111a; color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 8px;">🦄</div>
        <h2 style="margin: 0; color: #ffffff; font-size: 22px;">Verify Your Email Address</h2>
        <p style="color: #8f94a8; font-size: 14px; margin-top: 6px;">UNICORN — Web3 Investment & Yield Protocol</p>
      </div>

      <div style="background: rgba(181, 92, 169, 0.12); border: 1px solid rgba(181, 92, 169, 0.35); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; color: #b55ca9; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Your 6-Digit OTP</span>
        <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-top: 8px; font-family: monospace;">${otpCode}</div>
        <span style="display: block; font-size: 12px; color: #8f94a8; margin-top: 10px;">Valid for 10 minutes. Do not share this code with anyone.</span>
      </div>

      <p style="color: #8f94a8; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
        If you did not request this email verification, you can safely ignore this message.
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'UNICORN Protocol'}" <${process.env.FROM_EMAIL || 'dharmikthanki5050@gmail.com'}>`,
    to: email,
    subject,
    text,
    html
  });
};

