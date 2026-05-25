// Uses Resend HTTP API (https://resend.com) — works on Render free tier.
// Nodemailer SMTP is blocked on Render because ports 25/465/587 are firewalled.

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not set');

  const from = process.env.EMAIL_FROM || 'AptitudePrep <onboarding@resend.dev>';

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend API ${res.status}: ${body.message || res.statusText}`);
  }

  return res.json();
}

/**
 * Send OTP email for email verification
 */
const sendOTPEmail = async (email, name, otp) => {
  return sendViaResend({
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
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetLink) => {
  return sendViaResend({
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
  });
};

/**
 * Send test assignment notification
 */
const sendTestAssignedEmail = async (email, name, testTitle, startTime) => {
  return sendViaResend({
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
  });
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendTestAssignedEmail };
