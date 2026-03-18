const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

// ── JWT Authentication ──────────────────────────────────────
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// ── Session Authentication ──────────────────────────────────
const authenticateSession = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ message: 'Not logged in' });
};

// ── Combined: JWT or Session ────────────────────────────────
const authenticate = (req, res, next) => {
  // Try JWT first
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) { /* fall through to session */ }
  }

  // Try Session
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  return res.status(401).json({ message: 'Authentication required' });
};

// ── Role Authorization ──────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authenticateJWT, authenticateSession, authenticate, authorize };
