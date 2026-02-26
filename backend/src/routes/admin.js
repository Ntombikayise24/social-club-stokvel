import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import pool from '../database/connection.js';
import { sendApprovalEmail, sendJoinRequestApprovedEmail, sendStokvelAssignmentEmail, sendStokvelUnassignmentEmail } from '../utils/email.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// ══════════════════════════════════════════════════
//  ADMIN DASHBOARD STATS
// ══════════════════════════════════════════════════

router.get('/stats', async (_req, res) => {
  try {
    const [totalMembers] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE status = 'active' AND role = 'member'"
    );
    const [pendingApprovals] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE status = 'pending'"
    );
    const [totalContributions] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = 'confirmed'"
    );
    const [pendingContributions] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = 'pending'"
    );
    const [activeLoans] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_repayable), 0) as total FROM loans WHERE status IN ('active', 'overdue')"
    );
    const [overdueLoans] = await pool.query(
      "SELECT COUNT(*) as count FROM loans WHERE status = 'overdue'"
    );
    const [totalStokvels] = await pool.query(
      "SELECT COUNT(*) as count FROM stokvels WHERE status = 'active'"
    );
    const [deletedUsers] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE status = 'deleted'"
    );
    const [totalSaved] = await pool.query(
      "SELECT COALESCE(SUM(saved_amount), 0) as total FROM profiles WHERE status = 'active'"
    );

    // Monthly contributions (last 6 months)
    const [monthlyData] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              SUM(amount) AS total,
              COUNT(*) AS count
       FROM contributions
       WHERE status = 'confirmed' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`
    );

    // New members per month (last 6 months)
    const [memberGrowth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`
    );

    res.json({
      totalMembers: totalMembers[0].count,
      pendingApprovals: pendingApprovals[0].count,
      totalContributions: parseFloat(totalContributions[0].total),
      pendingContributionCount: pendingContributions[0].count,
      pendingContributionAmount: parseFloat(pendingContributions[0].total),
      activeLoans: activeLoans[0].count,
      activeLoanAmount: parseFloat(activeLoans[0].total),
      overdueLoans: overdueLoans[0].count,
      totalStokvels: totalStokvels[0].count,
      deletedUsers: deletedUsers[0].count,
      totalSaved: parseFloat(totalSaved[0].total),
      monthlyContributions: monthlyData.map(m => ({
        month: m.month,
        total: parseFloat(m.total),
        count: m.count,
      })),
      memberGrowth: memberGrowth.map(m => ({
        month: m.month,
        count: m.count,
      })),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// ══════════════════════════════════════════════════
//  USER MANAGEMENT
// ══════════════════════════════════════════════════

// ── List users ──
router.get('/users', async (req, res) => {
  try {
    const { search, stokvelId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = "WHERE u.status != 'deleted'";
    const params = [];

    if (search) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) {
      where += ' AND u.status = ?';
      params.push(status);
    }
    if (stokvelId) {
      where += ' AND u.id IN (SELECT user_id FROM profiles WHERE stokvel_id = ?)';
      params.push(stokvelId);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${where}`,
      params
    );

    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.last_active, u.created_at
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get profiles for each user
    const userIds = users.map(u => u.id);
    let profilesMap = {};
    if (userIds.length > 0) {
      const [profiles] = await pool.query(
        `SELECT p.user_id, p.id as profile_id, p.role, p.status, s.id as stokvel_id, s.name as stokvel_name
         FROM profiles p
         JOIN stokvels s ON s.id = p.stokvel_id
         WHERE p.user_id IN (?) AND p.status = 'active'`,
        [userIds]
      );
      for (const p of profiles) {
        if (!profilesMap[p.user_id]) profilesMap[p.user_id] = [];
        profilesMap[p.user_id].push({
          profileId: p.profile_id,
          stokvelId: p.stokvel_id,
          stokvelName: p.stokvel_name,
          role: p.role,
          status: p.status,
        });
      }
    }

    res.json({
      data: users.map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        lastActive: u.last_active,
        joinedDate: u.created_at,
        initials: u.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
        stokvels: profilesMap[u.id] || [],
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Create user ──
router.post(
  '/users',
  [
    body('fullName').trim().notEmpty(),
    body('email').isEmail(),
    body('phone').trim().notEmpty(),
    body('status').optional().isIn(['active', 'pending', 'inactive']),
    body('role').optional().isIn(['member', 'admin']),
    body('stokvelIds').optional().isArray(),
    validate,
  ],
  async (req, res) => {
    try {
      const { fullName, email, phone, status = 'active', role = 'member', stokvelIds = [] } = req.body;

      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Generate temporary password
      const tempPassword = `Temp@${Math.random().toString(36).slice(-8)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const [result] = await pool.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [fullName, email, phone, passwordHash, role, status]
      );

      const userId = result.insertId;

      // Create settings
      await pool.query('INSERT INTO user_settings (user_id) VALUES (?)', [userId]);

      // Assign to stokvels
      for (const stokvelId of stokvelIds) {
        const [stokvel] = await pool.query('SELECT target_amount FROM stokvels WHERE id = ?', [stokvelId]);
        if (stokvel.length > 0) {
          await pool.query(
            'INSERT INTO profiles (user_id, stokvel_id, role, target_amount, status, joined_date) VALUES (?, ?, ?, ?, ?, CURDATE())',
            [userId, stokvelId, 'member', stokvel[0].target_amount, 'active']
          );
        }
      }

      // Welcome notification
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [userId, 'info', 'Welcome!', 'Your account has been created. Welcome to the Stokvel Management System!']
      );

      res.status(201).json({
        message: 'User created successfully',
        userId,
        tempPassword, // In production, send via email instead
      });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// ── Update user ──
router.put(
  '/users/:id',
  [
    body('fullName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim().notEmpty(),
    body('status').optional().isIn(['active', 'inactive', 'pending']),
    body('role').optional().isIn(['member', 'admin']),
    body('stokvelIds').optional().isArray(),
    validate,
  ],
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { fullName, email, phone, status, role, stokvelIds } = req.body;

      const [users] = await pool.query('SELECT id, status AS currentStatus FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Detect if user is being activated from pending
      const wasPending = users[0].currentStatus === 'pending' && status === 'active';

      const updates = [];
      const values = [];

      if (fullName) { updates.push('full_name = ?'); values.push(fullName); }
      if (email) {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existing.length > 0) return res.status(409).json({ error: 'Email already in use' });
        updates.push('email = ?'); values.push(email);
      }
      if (phone) { updates.push('phone = ?'); values.push(phone); }
      if (status) { updates.push('status = ?'); values.push(status); }
      if (role) { updates.push('role = ?'); values.push(role); }

      if (updates.length > 0) {
        values.push(userId);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      // Update stokvel memberships if provided
      if (stokvelIds !== undefined) {
        // Get current ACTIVE profiles only
        const [currentActiveProfiles] = await pool.query(
          "SELECT stokvel_id FROM profiles WHERE user_id = ? AND status = 'active'",
          [userId]
        );
        const currentActiveStokvelIds = currentActiveProfiles.map(p => p.stokvel_id);

        // Also get ALL profiles (including inactive) to check for reactivation
        const [allProfiles] = await pool.query(
          'SELECT stokvel_id, status FROM profiles WHERE user_id = ?',
          [userId]
        );
        const inactiveStokvelIds = allProfiles.filter(p => p.status === 'inactive').map(p => p.stokvel_id);

        // Track newly assigned stokvels for email notification
        const newlyAssignedStokvelNames = [];

        // Add new memberships or reactivate inactive ones
        for (const stokvelId of stokvelIds) {
          if (!currentActiveStokvelIds.includes(stokvelId)) {
            if (inactiveStokvelIds.includes(stokvelId)) {
              // Reactivate previously inactive profile
              await pool.query(
                "UPDATE profiles SET status = 'active' WHERE user_id = ? AND stokvel_id = ?",
                [userId, stokvelId]
              );
              const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [stokvelId]);
              if (stokvel.length > 0) newlyAssignedStokvelNames.push(stokvel[0].name);
            } else {
              // Create new profile
              const [stokvel] = await pool.query('SELECT name, target_amount FROM stokvels WHERE id = ?', [stokvelId]);
              if (stokvel.length > 0) {
                await pool.query(
                  'INSERT INTO profiles (user_id, stokvel_id, role, target_amount, status, joined_date) VALUES (?, ?, ?, ?, ?, CURDATE())',
                  [userId, stokvelId, 'member', stokvel[0].target_amount, 'active']
                );
                newlyAssignedStokvelNames.push(stokvel[0].name);
              }
            }
          }
        }

        // Deactivate memberships no longer in list
        const removedStokvelNames = [];
        for (const currentId of currentActiveStokvelIds) {
          if (!stokvelIds.includes(currentId)) {
            await pool.query(
              "UPDATE profiles SET status = 'inactive' WHERE user_id = ? AND stokvel_id = ?",
              [userId, currentId]
            );
            const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [currentId]);
            if (stokvel.length > 0) removedStokvelNames.push(stokvel[0].name);
          }
        }

        // Send email notification for newly assigned stokvels
        if (newlyAssignedStokvelNames.length > 0) {
          const [assignedUser] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [userId]);
          if (assignedUser.length > 0) {
            sendStokvelAssignmentEmail(assignedUser[0].email, assignedUser[0].full_name, newlyAssignedStokvelNames);
          }
        }

        // Send email notification for removed stokvels
        if (removedStokvelNames.length > 0) {
          const [removedUser] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [userId]);
          if (removedUser.length > 0) {
            sendStokvelUnassignmentEmail(removedUser[0].email, removedUser[0].full_name, removedStokvelNames);
          }
        }
      }

      // Send approval email if user was activated
      if (wasPending) {
        const [activatedUser] = await pool.query('SELECT full_name, email, status FROM users WHERE id = ?', [userId]);
        if (activatedUser.length > 0 && activatedUser[0].status === 'active') {
          const [userProfiles] = await pool.query(
            'SELECT s.name FROM profiles p JOIN stokvels s ON s.id = p.stokvel_id WHERE p.user_id = ? AND p.status = "active"',
            [userId]
          );
          const stokvelNames = userProfiles.map(p => p.name);
          sendApprovalEmail(activatedUser[0].email, activatedUser[0].full_name, stokvelNames);
        }
      }

      res.json({ message: 'User updated successfully' });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// ── Get join requests for a specific user ──
router.get('/users/:id/join-requests', async (req, res) => {
  try {
    const userId = req.params.id;
    const [requests] = await pool.query(
      `SELECT jr.id, jr.stokvel_id AS stokvelId, s.name AS stokvelName, jr.status, jr.created_at AS createdAt
       FROM join_requests jr
       JOIN stokvels s ON s.id = jr.stokvel_id
       WHERE jr.user_id = ?
       ORDER BY jr.created_at DESC`,
      [userId]
    );
    res.json(requests);
  } catch (err) {
    console.error('Get user join requests error:', err);
    res.status(500).json({ error: 'Failed to fetch user join requests' });
  }
});

// ── Approve user ──
router.post('/users/:id/approve', async (req, res) => {
  try {
    const userId = req.params.id;
    const { stokvelIds = [] } = req.body;

    const [users] = await pool.query("SELECT id, full_name, email FROM users WHERE id = ? AND status = 'pending'", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    await pool.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);

    // Assign to stokvels
    for (const stokvelId of stokvelIds) {
      const [stokvel] = await pool.query('SELECT target_amount FROM stokvels WHERE id = ?', [stokvelId]);
      if (stokvel.length > 0) {
        await pool.query(
          `INSERT INTO profiles (user_id, stokvel_id, role, target_amount, status, joined_date) 
           VALUES (?, ?, 'member', ?, 'active', CURDATE())
           ON DUPLICATE KEY UPDATE status = 'active'`,
          [userId, stokvelId, stokvel[0].target_amount]
        );
      }
    }

    // Also approve any pending join requests
    if (stokvelIds.length > 0) {
      await pool.query(
        "UPDATE join_requests SET status = 'approved' WHERE user_id = ? AND stokvel_id IN (?)",
        [userId, stokvelIds]
      );
    }

    // Notify user
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, 'success', 'Account Approved!', 'Your account has been approved. You can now log in and start contributing.']
    );

    // Send approval email with login link
    const stokvelNames = [];
    for (const sid of stokvelIds) {
      const [sv] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [sid]);
      if (sv.length > 0) stokvelNames.push(sv[0].name);
    }
    sendApprovalEmail(users[0].email, users[0].full_name, stokvelNames);

    res.json({ message: `${users[0].full_name} has been approved` });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// ── Soft delete user ──
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    const [users] = await pool.query("SELECT id, full_name FROM users WHERE id = ? AND status != 'deleted'", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      "UPDATE users SET status = 'deleted', deleted_at = NOW(), deleted_by = ?, delete_reason = ? WHERE id = ?",
      [req.user.id, reason || 'Removed by admin', userId]
    );

    // Deactivate all profiles
    await pool.query("UPDATE profiles SET status = 'inactive' WHERE user_id = ?", [userId]);

    res.json({ message: `${users[0].full_name} has been archived` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── Restore user ──
router.post('/users/:id/restore', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query("SELECT id, full_name FROM users WHERE id = ? AND status = 'deleted'", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Deleted user not found' });
    }

    // Check if user had any active profiles before deletion
    const [existingProfiles] = await pool.query(
      "SELECT COUNT(*) as count FROM profiles WHERE user_id = ?",
      [userId]
    );

    // If user had profiles, restore them to active; otherwise set to pending for stokvel assignment
    const newStatus = existingProfiles[0].count > 0 ? 'active' : 'pending';

    await pool.query(
      "UPDATE users SET status = ?, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE id = ?",
      [newStatus, userId]
    );

    // Reactivate profiles if they existed
    if (existingProfiles[0].count > 0) {
      await pool.query("UPDATE profiles SET status = 'active' WHERE user_id = ?", [userId]);
    }

    const notificationMessage = newStatus === 'active' 
      ? 'Your account has been restored. Welcome back!'
      : 'Your account has been restored but needs stokvel assignment. Please wait for admin approval.';

    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, 'info', 'Account Restored', notificationMessage]
    );

    res.json({ message: `${users[0].full_name} has been restored${newStatus === 'pending' ? ' (pending stokvel assignment)' : ''}` });
  } catch (err) {
    console.error('Restore user error:', err);
    res.status(500).json({ error: 'Failed to restore user' });
  }
});

// ── Permanent delete ──
router.delete('/users/:id/permanent', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query('SELECT id, full_name FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cascading delete handled by foreign keys
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: `${users[0].full_name} has been permanently deleted` });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ error: 'Failed to permanently delete user' });
  }
});

// ── List deleted/archived users ──
router.get('/deleted-users', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.deleted_at, u.delete_reason,
              du.full_name AS deleted_by_name
       FROM users u
       LEFT JOIN users du ON du.id = u.deleted_by
       WHERE u.status = 'deleted'
       ORDER BY u.deleted_at DESC`
    );

    // Get join requests and profiles for each deleted user
    const userIds = users.map(u => u.id);
    let joinRequestsMap = {};
    let profilesMap = {};

    if (userIds.length > 0) {
      const [joinRequests] = await pool.query(
        `SELECT jr.user_id, jr.stokvel_id, s.name AS stokvel_name, jr.status
         FROM join_requests jr
         JOIN stokvels s ON s.id = jr.stokvel_id
         WHERE jr.user_id IN (?)`,
        [userIds]
      );
      for (const jr of joinRequests) {
        if (!joinRequestsMap[jr.user_id]) joinRequestsMap[jr.user_id] = [];
        joinRequestsMap[jr.user_id].push({
          stokvelId: jr.stokvel_id,
          stokvelName: jr.stokvel_name,
          status: jr.status,
        });
      }

      const [profiles] = await pool.query(
        `SELECT p.user_id, p.stokvel_id, s.name AS stokvel_name, p.status
         FROM profiles p
         JOIN stokvels s ON s.id = p.stokvel_id
         WHERE p.user_id IN (?)`,
        [userIds]
      );
      for (const p of profiles) {
        if (!profilesMap[p.user_id]) profilesMap[p.user_id] = [];
        profilesMap[p.user_id].push({
          stokvelId: p.stokvel_id,
          stokvelName: p.stokvel_name,
          status: p.status,
        });
      }
    }

    res.json(users.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      phone: u.phone,
      deletedAt: u.deleted_at,
      deletedBy: u.deleted_by_name,
      reason: u.delete_reason,
      joinRequests: joinRequestsMap[u.id] || [],
      stokvels: profilesMap[u.id] || [],
    })));
  } catch (err) {
    console.error('List deleted users error:', err);
    res.status(500).json({ error: 'Failed to fetch deleted users' });
  }
});

// ══════════════════════════════════════════════════
//  STOKVEL MANAGEMENT
// ══════════════════════════════════════════════════

// ── List stokvels (admin view) ──
router.get('/stokvels', async (_req, res) => {
  try {
    const [stokvels] = await pool.query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM profiles p WHERE p.stokvel_id = s.id AND p.status = 'active') AS current_members,
              (SELECT COALESCE(SUM(p.saved_amount), 0) FROM profiles p WHERE p.stokvel_id = s.id AND p.status = 'active') AS total_pool,
              u.full_name AS created_by_name
       FROM stokvels s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.name`
    );

    res.json(stokvels.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      description: s.description,
      targetAmount: parseFloat(s.target_amount),
      maxMembers: s.max_members,
      currentMembers: parseInt(s.current_members),
      interestRate: parseFloat(s.interest_rate),
      cycle: s.cycle,
      meetingDay: s.meeting_day,
      nextPayout: s.next_payout,
      status: s.status,
      icon: s.icon,
      color: s.color,
      totalPool: parseFloat(s.total_pool),
      createdBy: s.created_by_name,
      createdAt: s.created_at,
    })));
  } catch (err) {
    console.error('Admin list stokvels error:', err);
    res.status(500).json({ error: 'Failed to fetch stokvels' });
  }
});

// ── Create stokvel ──
router.post(
  '/stokvels',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['traditional', 'flexible']),
    body('description').optional().trim(),
    body('targetAmount').isFloat({ min: 0 }),
    body('maxMembers').isInt({ min: 2 }),
    body('interestRate').optional().isFloat({ min: 0, max: 100 }),
    body('cycle').isIn(['weekly', 'monthly', 'quarterly']),
    body('meetingDay').optional().trim(),
    body('icon').optional().trim(),
    body('color').optional().trim(),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        name, type, description, targetAmount, maxMembers,
        interestRate = 30, cycle, meetingDay, nextPayout, icon = '💰', color = 'blue'
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO stokvels (name, type, description, target_amount, max_members, interest_rate, cycle, meeting_day, next_payout, status, icon, color, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        [name, type, description, targetAmount, maxMembers, interestRate, cycle, meetingDay, nextPayout || null, icon, color, req.user.id]
      );

      res.status(201).json({
        message: 'Stokvel created successfully',
        stokvelId: result.insertId,
      });
    } catch (err) {
      console.error('Create stokvel error:', err);
      res.status(500).json({ error: 'Failed to create stokvel' });
    }
  }
);

// ── Update stokvel ──
router.put('/stokvels/:id', async (req, res) => {
  try {
    const stokvelId = req.params.id;
    const {
      name, type, description, targetAmount, maxMembers,
      interestRate, cycle, meetingDay, nextPayout, status, icon, color
    } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (targetAmount !== undefined) { updates.push('target_amount = ?'); values.push(targetAmount); }
    if (maxMembers !== undefined) { updates.push('max_members = ?'); values.push(maxMembers); }
    if (interestRate !== undefined) { updates.push('interest_rate = ?'); values.push(interestRate); }
    if (cycle !== undefined) { updates.push('cycle = ?'); values.push(cycle); }
    if (meetingDay !== undefined) { updates.push('meeting_day = ?'); values.push(meetingDay); }
    if (nextPayout !== undefined) { updates.push('next_payout = ?'); values.push(nextPayout); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(stokvelId);
    await pool.query(`UPDATE stokvels SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Stokvel updated successfully' });
  } catch (err) {
    console.error('Update stokvel error:', err);
    res.status(500).json({ error: 'Failed to update stokvel' });
  }
});

// ── Delete stokvel ──
router.delete('/stokvels/:id', async (req, res) => {
  try {
    const stokvelId = req.params.id;

    // Check for active members
    const [members] = await pool.query(
      "SELECT COUNT(*) as count FROM profiles WHERE stokvel_id = ? AND status = 'active'",
      [stokvelId]
    );

    if (members[0].count > 0) {
      return res.status(400).json({
        error: `Cannot delete stokvel with ${members[0].count} active member(s). Remove all members first.`,
      });
    }

    await pool.query('DELETE FROM stokvels WHERE id = ?', [stokvelId]);

    res.json({ message: 'Stokvel deleted successfully' });
  } catch (err) {
    console.error('Delete stokvel error:', err);
    res.status(500).json({ error: 'Failed to delete stokvel' });
  }
});

// ══════════════════════════════════════════════════
//  CONTRIBUTION MANAGEMENT
// ══════════════════════════════════════════════════

// ── List all contributions (admin) ──
router.get('/contributions', async (req, res) => {
  try {
    const { search, stokvelId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (u.full_name LIKE ? OR c.reference LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (stokvelId) { where += ' AND c.stokvel_id = ?'; params.push(stokvelId); }
    if (status && status !== 'all') { where += ' AND c.status = ?'; params.push(status); }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM contributions c JOIN users u ON u.id = c.user_id ${where}`,
      params
    );

    const [contributions] = await pool.query(
      `SELECT c.*, u.full_name AS user_name, s.name AS stokvel_name,
              u2.full_name AS confirmed_by_name
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       JOIN stokvels s ON s.id = c.stokvel_id
       LEFT JOIN users u2 ON u2.id = c.confirmed_by
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: contributions.map(c => ({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        userInitials: c.user_name.split(' ').map(n => n[0]).join('').toUpperCase(),
        stokvelName: c.stokvel_name,
        amount: parseFloat(c.amount),
        paymentMethod: c.payment_method,
        reference: c.reference,
        status: c.status,
        confirmedBy: c.confirmed_by_name,
        confirmedAt: c.confirmed_at,
        date: c.created_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (err) {
    console.error('Admin list contributions error:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// ── Confirm contribution ──
router.post('/contributions/:id/confirm', async (req, res) => {
  try {
    const contributionId = req.params.id;

    const [contributions] = await pool.query(
      "SELECT * FROM contributions WHERE id = ? AND status = 'pending'",
      [contributionId]
    );

    if (contributions.length === 0) {
      return res.status(404).json({ error: 'Pending contribution not found' });
    }

    const contribution = contributions[0];

    // Confirm the contribution
    await pool.query(
      'UPDATE contributions SET status = ?, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?',
      ['confirmed', req.user.id, contributionId]
    );

    // Update profile saved amount (capped at target)
    await pool.query(
      'UPDATE profiles SET saved_amount = LEAST(saved_amount + ?, target_amount) WHERE id = ?',
      [contribution.amount, contribution.profile_id]
    );

    // Notify user
    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [contribution.stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [contribution.user_id, 'success', 'Contribution Confirmed',
        `Your R${parseFloat(contribution.amount).toLocaleString()} contribution to ${stokvel[0].name} has been confirmed.`]
    );

    res.json({ message: 'Contribution confirmed' });
  } catch (err) {
    console.error('Confirm contribution error:', err);
    res.status(500).json({ error: 'Failed to confirm contribution' });
  }
});

// ══════════════════════════════════════════════════
//  SITE SETTINGS
// ══════════════════════════════════════════════════

router.get('/settings', async (_req, res) => {
  try {
    const [settings] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    const result = {};
    for (const s of settings) {
      result[s.setting_key] = s.setting_value;
    }
    res.json(result);
  } catch (err) {
    console.error('Get site settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Update site settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ══════════════════════════════════════════════════
//  REPORTS
// ══════════════════════════════════════════════════

router.post('/reports', async (req, res) => {
  try {
    const { reportType, dateRange, format = 'json' } = req.body;

    let data;
    const startDate = dateRange?.start || '2020-01-01';
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

    switch (reportType) {
      case 'contributions': {
        const [rows] = await pool.query(
          `SELECT c.id, u.full_name, s.name AS stokvel_name, c.amount, c.status, c.payment_method, c.reference, c.created_at
           FROM contributions c
           JOIN users u ON u.id = c.user_id
           JOIN stokvels s ON s.id = c.stokvel_id
           WHERE c.created_at BETWEEN ? AND ?
           ORDER BY c.created_at DESC`,
          [startDate, endDate]
        );
        data = rows;
        break;
      }
      case 'loans': {
        const [rows] = await pool.query(
          `SELECT l.id, u.full_name, s.name AS stokvel_name, l.amount, l.interest, l.total_repayable, l.status, l.borrowed_date, l.due_date, l.repaid_date
           FROM loans l
           JOIN users u ON u.id = l.user_id
           JOIN stokvels s ON s.id = l.stokvel_id
           WHERE l.created_at BETWEEN ? AND ?
           ORDER BY l.created_at DESC`,
          [startDate, endDate]
        );
        data = rows;
        break;
      }
      case 'members': {
        const [rows] = await pool.query(
          `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.role, u.created_at, u.last_active
           FROM users u
           WHERE u.created_at BETWEEN ? AND ?
           ORDER BY u.created_at DESC`,
          [startDate, endDate]
        );
        data = rows;
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // For JSON format, return data directly
    // In production, you'd generate PDF/Excel here
    res.json({
      reportType,
      dateRange: { start: startDate, end: endDate },
      format,
      recordCount: data.length,
      data,
    });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ══════════════════════════════════════════════════
//  JOIN REQUESTS
// ══════════════════════════════════════════════════

router.get('/join-requests', async (_req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT jr.*, u.full_name, u.email, s.name AS stokvel_name
       FROM join_requests jr
       JOIN users u ON u.id = jr.user_id
       JOIN stokvels s ON s.id = jr.stokvel_id
       WHERE jr.status = 'pending'
       ORDER BY jr.created_at DESC`
    );

    res.json(requests.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.full_name,
      userEmail: r.email,
      stokvelId: r.stokvel_id,
      stokvelName: r.stokvel_name,
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('List join requests error:', err);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
});

router.post('/join-requests/:id/approve', async (req, res) => {
  try {
    const requestId = req.params.id;

    const [requests] = await pool.query(
      "SELECT * FROM join_requests WHERE id = ? AND status = 'pending'",
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Pending join request not found' });
    }

    const request = requests[0];

    await pool.query("UPDATE join_requests SET status = 'approved' WHERE id = ?", [requestId]);

    // Create profile
    const [stokvel] = await pool.query('SELECT target_amount FROM stokvels WHERE id = ?', [request.stokvel_id]);
    await pool.query(
      `INSERT INTO profiles (user_id, stokvel_id, role, target_amount, status, joined_date) 
       VALUES (?, ?, 'member', ?, 'active', CURDATE())
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [request.user_id, request.stokvel_id, stokvel[0]?.target_amount || 0]
    );

    // Notify user
    const [stokvelInfo] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [request.stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [request.user_id, 'success', 'Join Request Approved', `You have been added to ${stokvelInfo[0].name}. Start contributing!`]
    );

    // Send email to user
    const [userInfo] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [request.user_id]);
    if (userInfo.length > 0) {
      sendJoinRequestApprovedEmail(userInfo[0].email, userInfo[0].full_name, stokvelInfo[0].name);
    }

    res.json({ message: 'Join request approved' });
  } catch (err) {
    console.error('Approve join request error:', err);
    res.status(500).json({ error: 'Failed to approve join request' });
  }
});

router.post('/join-requests/:id/reject', async (req, res) => {
  try {
    const requestId = req.params.id;

    const [requests] = await pool.query(
      "SELECT * FROM join_requests WHERE id = ? AND status = 'pending'",
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Pending join request not found' });
    }

    const userId = requests[0].user_id;

    await pool.query("UPDATE join_requests SET status = 'rejected' WHERE id = ?", [requestId]);

    const [stokvelInfo] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [requests[0].stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, 'warning', 'Join Request Declined', `Your request to join ${stokvelInfo[0].name} has been declined.`]
    );

    // If user is still pending and has no remaining pending join requests, mark them as deleted
    const [userCheck] = await pool.query("SELECT status FROM users WHERE id = ?", [userId]);
    if (userCheck.length > 0 && userCheck[0].status === 'pending') {
      const [remainingRequests] = await pool.query(
        "SELECT COUNT(*) as count FROM join_requests WHERE user_id = ? AND status = 'pending'",
        [userId]
      );
      if (remainingRequests[0].count === 0) {
        await pool.query("UPDATE users SET status = 'deleted', deleted_at = NOW(), delete_reason = 'All join requests rejected' WHERE id = ?", [userId]);
      }
    }

    res.json({ message: 'Join request rejected' });
  } catch (err) {
    console.error('Reject join request error:', err);
    res.status(500).json({ error: 'Failed to reject join request' });
  }
});

// ── Reject pending user entirely ──
router.post('/users/:id/reject', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query("SELECT id, full_name, email FROM users WHERE id = ? AND status = 'pending'", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    // Reject all pending join requests for this user
    await pool.query("UPDATE join_requests SET status = 'rejected' WHERE user_id = ? AND status = 'pending'", [userId]);

    // Set user as deleted
    await pool.query(
      "UPDATE users SET status = 'deleted', deleted_at = NOW(), delete_reason = 'Registration rejected by admin' WHERE id = ?",
      [userId]
    );

    // Notify user
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, 'warning', 'Registration Declined', 'Your registration request has been declined by an administrator.']
    );

    res.json({ message: `${users[0].full_name} has been rejected` });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

export default router;
