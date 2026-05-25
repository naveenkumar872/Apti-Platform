const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOTP, addMinutes, addHours, isExpired } = require('../utils/helpers');
const { sendOTPEmail, sendPasswordResetEmail } = require('../config/email');
const { createError } = require('../middleware/errorHandler');

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const {
      name, email, password, college, branch, year, target_companies, target_exam_date
    } = req.body;

    // Check if email exists
    const existing = await query('SELECT user_id, name, is_verified FROM users WHERE email = ?', [email]);
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      // If the account exists but is NOT yet verified, resend OTP and let them verify
      if (!existingUser.is_verified) {
        const otp = generateOTP();
        const otp_expires = addMinutes(10);
        await query(
          `INSERT INTO email_otps (user_id, otp, expires_at)
           VALUES (?,?,?)
           ON DUPLICATE KEY UPDATE otp=VALUES(otp), expires_at=VALUES(expires_at), created_at=NOW()`,
          [existingUser.user_id, otp, otp_expires]
        );
        let email_sent = true;
        try {
          await sendOTPEmail(email, existingUser.name, otp);
        } catch (emailErr) {
          email_sent = false;
          console.error('[OTP email failed]', emailErr.message);
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV OTP for ${email}] ${otp}  (expires in 10m)`);
          }
        }
        return res.status(200).json({
          message: 'Account already registered but not verified. A new OTP has been sent.',
          user_id: existingUser.user_id,
          email_sent,
          needs_verification: true,
        });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);
    const user_id = uuidv4();

    // Create user
    await query(
      `INSERT INTO users (user_id, name, email, password_hash, role, college, branch, year,
        target_companies, target_exam_date)
       VALUES (?,?,?,?,'student',?,?,?,?,?)`,
      [user_id, name, email, password_hash, college || null, branch || null,
       year || null, JSON.stringify(target_companies || []), target_exam_date || null]
    );

    // Generate and store OTP
    const otp = generateOTP();
    const otp_expires = addMinutes(10);
    await query(
      `INSERT INTO email_otps (user_id, otp, expires_at)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE otp=VALUES(otp), expires_at=VALUES(expires_at), created_at=NOW()`,
      [user_id, otp, otp_expires]
    );

    // Send OTP email — surface delivery status so the frontend can guide the user.
    let email_sent = true;
    try {
      await sendOTPEmail(email, name, otp);
    } catch (emailErr) {
      email_sent = false;
      console.error('[OTP email failed]', emailErr.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP for ${email}] ${otp}  (expires in 10m)`);
      }
    }

    res.status(201).json({
      message: email_sent
        ? 'Registration successful. Check your email for the OTP.'
        : 'Registration successful, but the OTP email failed to send. Use Resend to try again.',
      user_id,
      email_sent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/verify-otp
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { user_id, otp } = req.body;

    const result = await query(
      'SELECT otp, expires_at FROM email_otps WHERE user_id = ?',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'OTP not found. Request a new one.' });
    }

    const { otp: stored_otp, expires_at } = result.rows[0];

    if (isExpired(expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    }

    if (stored_otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark user as verified
    await query('UPDATE users SET is_verified = 1 WHERE user_id = ?', [user_id]);
    await query('DELETE FROM email_otps WHERE user_id = ?', [user_id]);

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/resend-otp
 */
const resendOTP = async (req, res, next) => {
  try {
    const { user_id } = req.body;

    const user = await query(
      'SELECT name, email, is_verified FROM users WHERE user_id = ?',
      [user_id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.rows[0].is_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const otp = generateOTP();
    const otp_expires = addMinutes(10);

    await query(
      `INSERT INTO email_otps (user_id, otp, expires_at)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE otp=VALUES(otp), expires_at=VALUES(expires_at), created_at=NOW()`,
      [user_id, otp, otp_expires]
    );

    let email_sent = true;
    try {
      await sendOTPEmail(user.rows[0].email, user.rows[0].name, otp);
    } catch (emailErr) {
      email_sent = false;
      console.error('[OTP email failed]', emailErr.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP for ${user.rows[0].email}] ${otp}  (expires in 10m)`);
      }
    }

    res.json({
      message: email_sent ? 'OTP resent successfully' : 'Could not send OTP email. Please try again in a minute.',
      email_sent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT user_id, name, email, password_hash, role, is_verified, is_active,
              college, branch, year, target_companies, profile_photo_url,
              diagnostic_completed_at
       FROM users WHERE email = ?`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended. Contact admin.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        user_id: user.user_id
      });
    }

    // TiDB/mysql2 may return VARCHAR fields as Buffer — convert to string
    const hashStr = Buffer.isBuffer(user.password_hash)
      ? user.password_hash.toString('utf8')
      : String(user.password_hash);
    const isMatch = await bcrypt.compare(password, hashStr);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    const tokenPayload = { user_id: user.user_id, role: user.role, email: user.email };
    const access_token = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken(tokenPayload);

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.user_id, refresh_token]
    );

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      access_token,
      refresh_token,
      user: userWithoutPassword
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Check if token is in DB (not blacklisted)
    const stored = await query(
      'SELECT user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refresh_token]
    );

    if (stored.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const access_token = generateAccessToken({
      user_id: decoded.user_id,
      role: decoded.role,
      email: decoded.email
    });

    res.json({ access_token });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await query('DELETE FROM refresh_tokens WHERE token = ?', [refresh_token]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await query(
      'SELECT user_id, name FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email is registered, you will receive a reset link.' });
    }

    const { user_id, name } = result.rows[0];
    const reset_token = uuidv4();
    const expires_at = addHours(1);

    await query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE token=VALUES(token), expires_at=VALUES(expires_at), created_at=NOW()`,
      [user_id, reset_token, expires_at]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${reset_token}`;
    try {
      await sendPasswordResetEmail(email, name, resetLink);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json({ message: 'If that email is registered, you will receive a reset link.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const result = await query(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ?',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (isExpired(result.rows[0].expires_at)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [password_hash, result.rows[0].user_id]);
    await query('DELETE FROM password_resets WHERE token = ?', [token]);
    // Invalidate all refresh tokens
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [result.rows[0].user_id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user_id = req.user.user_id;

    const result = await query('SELECT password_hash FROM users WHERE user_id = ?', [user_id]);
    const rawHash = result.rows[0].password_hash;
    const hashStr = Buffer.isBuffer(rawHash) ? rawHash.toString('utf8') : String(rawHash);
    const isMatch = await bcrypt.compare(current_password, hashStr);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [password_hash, user_id]);
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [user_id]);

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT user_id, name, email, role, college, branch, year, target_companies,
              target_exam_date, profile_photo_url, batch_id, is_verified, created_at, last_login,
              diagnostic_completed_at
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, verifyOTP, resendOTP, login, refreshToken,
  logout, forgotPassword, resetPassword, changePassword, getMe
};
