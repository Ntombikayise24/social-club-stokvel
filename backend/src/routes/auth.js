import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import pool from '../database/connection.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const router = Router();

// ────────────────── SET PASSWORD (for admin-created users) ──────────────────
router.post(
  '/set-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('Invalid token'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, token, password } = req.body;

      // Verify the token
      const [tokens] = await pool.query(
        `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE u.email = ? AND prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
        [email, token]
      );

      if (tokens.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired setup token. Please contact your administrator.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      // Set the password and ensure user is active
      await pool.query('UPDATE users SET password_hash = ?, status = ? WHERE id = ?', [passwordHash, 'active', tokens[0].user_id]);
      await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = ?', [tokens[0].id]);

      res.json({ message: 'Password set successfully. You can now log in.' });
    } catch (err) {
      console.error('Set password error:', err);
      res.status(500).json({ error: 'Failed to set password' });
    }
  }
);

// ────────────────── LOGIN ──────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;

      const [users] = await pool.query(
        'SELECT id, full_name, email, phone, password_hash, role, status, avatar_url FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = users[0];

      if (user.status === 'deleted') {
        return res.status(401).json({ error: 'This account has been deactivated' });
      }

      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Your account is not yet activated. Please check your email to set your password.' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ error: 'Your account has been suspended. Contact an administrator.' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last active
      await pool.query('UPDATE users SET last_active = NOW() WHERE id = ?', [user.id]);

      const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatar_url,
        },
      });
    } catch (err) {
      console.error('Login error:', err.message || err);
      // Distinguish DB connection errors from other server errors
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
        return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
      }
      res.status(500).json({ error: 'Login failed. Server error.' });
    }
  }
);

// ────────────────── FORGOT PASSWORD ──────────────────
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const { email } = req.body;

      const [users] = await pool.query('SELECT id FROM users WHERE email = ? AND status != ?', [email, 'deleted']);
      if (users.length === 0) {
        // Don't reveal whether email exists
        return res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
      }

      // Generate 6-digit code (cryptographically secure)
      const { randomInt } = await import('crypto');
      const code = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Invalidate previous tokens
      await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ?', [users[0].id]);

      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [users[0].id, code, expiresAt]
      );

      // In production, send email. For dev, log it.
      console.log(`\n📧 Password reset code for ${email}: ${code}\n`);

      // Send email with the reset code
      await sendPasswordResetEmail(email, code);

      res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// ────────────────── VERIFY RESET CODE ──────────────────
router.post(
  '/verify-code',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid code'),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, code } = req.body;

      const [tokens] = await pool.query(
        `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE u.email = ? AND prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
        [email, code]
      );

      if (tokens.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      res.json({ message: 'Code verified', valid: true });
    } catch (err) {
      console.error('Verify code error:', err);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// ────────────────── RESET PASSWORD ──────────────────
router.post(
  '/reset-password',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      const [tokens] = await pool.query(
        `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE u.email = ? AND prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
        [email, code]
      );

      if (tokens.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, tokens[0].user_id]);
      await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = ?', [tokens[0].id]);

      res.json({ message: 'Password reset successful' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

// ────────────────── GET CURRENT USER ──────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, phone, role, status, avatar_url, last_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get profiles
    const [profiles] = await pool.query(
      `SELECT p.id, p.stokvel_id, s.name AS stokvel_name, p.role, p.target_amount, 
              p.saved_amount, p.status, p.joined_date,
              ROUND((p.saved_amount / NULLIF(p.target_amount, 0)) * 100, 1) AS progress
       FROM profiles p
       JOIN stokvels s ON s.id = p.stokvel_id
       WHERE p.user_id = ? AND p.status != 'inactive'`,
      [req.user.id]
    );

    res.json({
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatar_url,
      lastActive: user.last_active,
      joinedDate: user.created_at,
      profiles: profiles.map(p => ({
        id: p.id,
        stokvelId: p.stokvel_id,
        stokvelName: p.stokvel_name,
        role: p.role,
        targetAmount: parseFloat(p.target_amount),
        savedAmount: parseFloat(p.saved_amount),
        progress: parseFloat(p.progress || 0),
        status: p.status,
        joinedDate: p.joined_date,
      })),
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
