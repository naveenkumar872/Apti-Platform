const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/database');

// Throttle the last_login UPDATEs so we don't write on every request — once
// every 5 minutes per user is plenty for "active today" reporting.
const TOUCH_WINDOW_MS = 5 * 60 * 1000;
const lastTouchAt = new Map();

function touchActivity(userId) {
  if (!userId) return;
  const now = Date.now();
  const prev = lastTouchAt.get(userId) || 0;
  if (now - prev < TOUCH_WINDOW_MS) return;
  lastTouchAt.set(userId, now);
  // Fire-and-forget — never block the request on this update.
  query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userId]).catch(() => {
    lastTouchAt.delete(userId); // allow a retry next time
  });
}

/**
 * Middleware: Verify JWT access token
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    touchActivity(decoded?.user_id);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware: Require specific role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
