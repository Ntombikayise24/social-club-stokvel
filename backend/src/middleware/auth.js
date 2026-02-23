import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';

/**
 * Authenticate JWT token from Authorization header
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Optional auth - attach user if token present, but don't fail
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * Update last_active timestamp
 */
export async function updateLastActive(req, _res, next) {
  if (req.user?.id) {
    try {
      await pool.query('UPDATE users SET last_active = NOW() WHERE id = ?', [req.user.id]);
    } catch {
      // Don't fail request if this fails
    }
  }
  next();
}
