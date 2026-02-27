import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(updateLastActive);

// ────────────────── GET CURRENT USER PROFILE ──────────────────
router.get('/me', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, phone, role, status, avatar_url, last_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    const [profiles] = await pool.query(
      `SELECT p.id, p.stokvel_id, s.name AS stokvel_name, p.role, p.target_amount, 
              p.saved_amount, p.status, p.joined_date,
              ROUND((p.saved_amount / NULLIF(p.target_amount, 0)) * 100, 1) AS progress
       FROM profiles p
       JOIN stokvels s ON s.id = p.stokvel_id
       WHERE p.user_id = ? AND p.status != 'inactive'`,
      [req.user.id]
    );

    // Get pending join requests so frontend can show "pending" status on stokvels
    const [pendingJoinRequests] = await pool.query(
      `SELECT jr.id, jr.stokvel_id, s.name AS stokvel_name, jr.status, jr.created_at
       FROM join_requests jr
       JOIN stokvels s ON s.id = jr.stokvel_id
       WHERE jr.user_id = ? AND jr.status = 'pending'`,
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
      pendingJoinRequests: pendingJoinRequests.map(jr => ({
        id: jr.id,
        stokvelId: jr.stokvel_id,
        stokvelName: jr.stokvel_name,
        status: jr.status,
        createdAt: jr.created_at,
      })),
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ────────────────── UPDATE PROFILE ──────────────────
router.put(
  '/me',
  [
    body('fullName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim().notEmpty(),
    validate,
  ],
  async (req, res) => {
    try {
      const { fullName, email, phone } = req.body;
      const updates = [];
      const values = [];

      if (fullName) { updates.push('full_name = ?'); values.push(fullName); }
      if (email) {
        // Check if email is taken
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existing.length > 0) {
          return res.status(409).json({ error: 'Email already in use' });
        }
        updates.push('email = ?');
        values.push(email);
      }
      if (phone) { updates.push('phone = ?'); values.push(phone); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.user.id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

      res.json({ message: 'Profile updated successfully' });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// ────────────────── CHANGE PASSWORD ──────────────────
router.put(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    validate,
  ],
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// ────────────────── GET USER PROFILES (memberships) ──────────────────
router.get('/me/profiles', async (req, res) => {
  try {
    const [profiles] = await pool.query(
      `SELECT p.id, p.stokvel_id, s.name AS stokvel_name, s.type AS stokvel_type,
              s.icon, s.color, s.interest_rate, p.role, p.target_amount, p.saved_amount, p.status, p.joined_date,
              ROUND((p.saved_amount / NULLIF(p.target_amount, 0)) * 100, 1) AS progress
       FROM profiles p
       JOIN stokvels s ON s.id = p.stokvel_id
       WHERE p.user_id = ?
       ORDER BY p.joined_date DESC`,
      [req.user.id]
    );

    res.json(profiles.map(p => ({
      id: p.id,
      stokvelId: p.stokvel_id,
      stokvelName: p.stokvel_name,
      stokvelType: p.stokvel_type,
      icon: p.icon,
      color: p.color,
      interestRate: parseFloat(p.interest_rate || 30),
      role: p.role,
      targetAmount: parseFloat(p.target_amount),
      savedAmount: parseFloat(p.saved_amount),
      progress: parseFloat(p.progress || 0),
      status: p.status,
      joinedDate: p.joined_date,
    })));
  } catch (err) {
    console.error('Get profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// ────────────────── GET DASHBOARD STATS ──────────────────
router.get('/me/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Total savings across all profiles
    const [savingsResult] = await pool.query(
      'SELECT COALESCE(SUM(saved_amount), 0) as total FROM profiles WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    // Active loans
    const [loansResult] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_repayable), 0) as total 
       FROM loans WHERE user_id = ? AND status IN ('active', 'overdue')`,
      [userId]
    );

    // Contributions this month
    const [monthlyResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM contributions 
       WHERE user_id = ? AND status = 'confirmed'
       AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      [userId]
    );

    // Total contributions all time
    const [totalContribResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM contributions 
       WHERE user_id = ? AND status = 'confirmed'`,
      [userId]
    );

    // Unread notifications count
    const [unreadResult] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    // Active profiles count
    const [profilesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM profiles WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    res.json({
      totalSavings: parseFloat(savingsResult[0].total),
      activeLoans: parseInt(loansResult[0].count),
      outstandingLoanAmount: parseFloat(loansResult[0].total),
      monthlyContribution: parseFloat(monthlyResult[0].total),
      totalContributions: parseFloat(totalContribResult[0].total),
      totalContributionCount: parseInt(totalContribResult[0].count),
      unreadNotifications: parseInt(unreadResult[0].count),
      activeProfiles: parseInt(profilesResult[0].count),
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ────────────────── DELETE OWN ACCOUNT ──────────────────
router.delete(
  '/me',
  [
    body('password').notEmpty().withMessage('Password is required to confirm account deletion'),
    validate,
  ],
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      const { password } = req.body;
      const userId = req.user.id;

      // Verify password
      const [users] = await conn.query('SELECT password_hash, role FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from deleting themselves
      if (users[0].role === 'admin') {
        return res.status(403).json({ error: 'Admin accounts cannot be self-deleted. Contact another admin.' });
      }

      const isValid = await bcrypt.compare(password, users[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Incorrect password' });
      }

      // Check for active/overdue loans
      const [activeLoans] = await conn.query(
        "SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status IN ('active', 'overdue')",
        [userId]
      );
      if (activeLoans[0].count > 0) {
        return res.status(400).json({ error: 'You have outstanding loans. Please repay all loans before deleting your account.' });
      }

      await conn.beginTransaction();

      // Soft-delete: set status to 'deleted' and anonymize
      await conn.query(
        "UPDATE users SET status = 'deleted', email = CONCAT('deleted_', id, '@removed.com'), phone = '', full_name = 'Deleted User' WHERE id = ?",
        [userId]
      );

      // Deactivate all profiles
      await conn.query("UPDATE profiles SET status = 'inactive' WHERE user_id = ?", [userId]);

      // Delete notifications
      await conn.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

      // Delete settings
      await conn.query('DELETE FROM user_settings WHERE user_id = ?', [userId]);

      // Delete cards
      await conn.query('DELETE FROM cards WHERE user_id = ?', [userId]);

      // Delete password reset tokens
      await conn.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

      await conn.commit();

      res.json({ message: 'Account deleted successfully' });
    } catch (err) {
      await conn.rollback();
      console.error('Delete account error:', err);
      res.status(500).json({ error: 'Failed to delete account' });
    } finally {
      conn.release();
    }
  }
);

export default router;
