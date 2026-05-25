const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});

/**
 * Send OTP email for email verification
 */
const sendOTPEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"Aptitude Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify your email - Aptitude Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1d4ed8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Aptitude Platform</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hello ${name},</h2>
          <p>Your email verification code is:</p>
          <div style="background: #1d4ed8; color: white; font-size: 32px; font-weight: bold; 
                      text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px;">
            ${otp}
          </div>
          <p style="color: #6b7280; margin-top: 20px;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetLink) => {
  const mailOptions = {
    from: `"Aptitude Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset your password - Aptitude Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1d4ed8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Aptitude Platform</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hello ${name},</h2>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #1d4ed8; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280;">
            This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy this link: ${resetLink}
          </p>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Send test assignment notification
 */
const sendTestAssignedEmail = async (email, name, testTitle, startTime) => {
  const mailOptions = {
    from: `"Aptitude Platform" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `New test assigned: ${testTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1d4ed8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Aptitude Platform</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hello ${name},</h2>
          <p>A new test has been assigned to you: <strong>${testTitle}</strong></p>
          ${startTime ? `<p>Available from: <strong>${new Date(startTime).toLocaleString()}</strong></p>` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/student/tests" 
               style="background: #1d4ed8; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-size: 16px;">
              View Test
            </a>
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendTestAssignedEmail };
