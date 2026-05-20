const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  register, verifyOTP, resendOTP, login, refreshToken,
  logout, forgotPassword, resetPassword, changePassword, getMe
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register
router.post('/register', [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('college').optional().isLength({ max: 200 }),
  body('branch').optional().isLength({ max: 50 }),
  body('year').optional().isInt({ min: 1, max: 4 }),
], validate, register);

// Verify OTP
router.post('/verify-otp', [
  body('user_id').notEmpty(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
], validate, verifyOTP);

// Resend OTP
router.post('/resend-otp', [
  body('user_id').notEmpty(),
], validate, resendOTP);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, login);

// Refresh token
router.post('/refresh', [
  body('refresh_token').notEmpty(),
], validate, refreshToken);

// Logout
router.post('/logout', logout);

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], validate, forgotPassword);

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], validate, resetPassword);

// Change password (authenticated)
router.post('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
], validate, changePassword);

// Get current user
router.get('/me', authenticate, getMe);

module.exports = router;
