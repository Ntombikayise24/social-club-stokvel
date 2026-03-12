import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import pool from '../database/connection.js';
import { sendApprovalEmail, sendJoinRequestApprovedEmail, sendStokvelAssignmentEmail, sendStokvelUnassignmentEmail, sendAccountDeletionEmail, sendWelcomeEmail, sendLoanApprovalEmail } from '../utils/email.js';
import { generatePDF, generateExcel, generateCSV, REPORT_COLUMNS, formatRowData } from '../utils/reports.js';

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
      "SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = 'confirmed'"
    );

    // Interest pot stats
    const [interestPot] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'repaid' THEN interest ELSE 0 END), 0) as total_earned,
        COUNT(CASE WHEN status = 'repaid' THEN 1 END) as repaid_count,
        COALESCE(SUM(CASE WHEN status IN ('active', 'overdue') THEN interest ELSE 0 END), 0) as pending_interest,
        COUNT(CASE WHEN status IN ('active', 'overdue') THEN 1 END) as active_count
       FROM loans`
    );

    // All members with savings
    const [allMembers] = await pool.query(
      `SELECT u.id, u.full_name, u.status as user_status, p.saved_amount, p.target_amount, s.name as stokvel_name
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       JOIN stokvels s ON s.id = p.stokvel_id
       WHERE p.status = 'active'
       ORDER BY u.full_name`
    );

    // Madala Side contributions per member
    const [madalaSideData] = await pool.query(
      `SELECT u.id, u.full_name, s.name as stokvel_name,
              COALESCE(SUM(c.amount), 0) as madala_saved
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       JOIN stokvels s ON s.id = p.stokvel_id
       LEFT JOIN contributions c ON c.user_id = u.id AND c.stokvel_id = s.id 
         AND c.contribution_type = 'madala-side' AND c.status = 'confirmed'
       WHERE p.status = 'active'
       GROUP BY u.id, u.full_name, s.name
       ORDER BY u.full_name`
    );

    // All loans (active, overdue, pending)
    const [allLoans] = await pool.query(
      `SELECT l.*, u.full_name, s.name as stokvel_name
       FROM loans l
       JOIN users u ON u.id = l.user_id
       JOIN stokvels s ON s.id = l.stokvel_id
       WHERE l.status IN ('active', 'overdue', 'pending')
       ORDER BY l.created_at DESC`
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
      interestPot: {
        totalEarned: parseFloat(interestPot[0].total_earned),
        repaidLoans: parseInt(interestPot[0].repaid_count),
        pendingInterest: parseFloat(interestPot[0].pending_interest),
        activeLoansCount: parseInt(interestPot[0].active_count),
      },
      allMembers: allMembers.map(m => ({
        id: m.id,
        name: m.full_name,
        savedAmount: parseFloat(m.saved_amount),
        targetAmount: parseFloat(m.target_amount),
        stokvelName: m.stokvel_name,
        progress: m.target_amount > 0 ? Math.round((m.saved_amount / m.target_amount) * 100) : 0,
      })),
      madalaSideMembers: madalaSideData.map(m => ({
        id: m.id,
        name: m.full_name,
        stokvelName: m.stokvel_name,
        madalaSaved: parseFloat(m.madala_saved),
        madalaTarget: 2200,
        progress: Math.round((parseFloat(m.madala_saved) / 2200) * 100),
      })),
      allActiveLoans: allLoans.map(l => ({
        id: l.id,
        userName: l.full_name,
        stokvelName: l.stokvel_name,
        amount: parseFloat(l.amount),
        interest: parseFloat(l.interest),
        totalRepayable: parseFloat(l.total_repayable),
        status: l.status,
        dueDate: l.due_date,
        borrowedDate: l.borrowed_date,
        createdAt: l.created_at,
        loanTarget: l.loan_target || 'your-target',
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

      // Get stokvel names for email
      let stokvelNames = [];
      if (stokvelIds.length > 0) {
        const [stokvels] = await pool.query(
          'SELECT name FROM stokvels WHERE id IN (?)',
          [stokvelIds]
        );
        stokvelNames = stokvels.map(s => s.name);
      }

      // Send welcome email with credentials and stokvel assignments
      try {
        await sendWelcomeEmail(email, fullName, tempPassword, stokvelNames);
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr.message);
      }

      res.status(201).json({
        message: 'User created successfully',
        userId,
        tempPassword, // Also sent via email
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
            try {
              await sendStokvelAssignmentEmail(assignedUser[0].email, assignedUser[0].full_name, newlyAssignedStokvelNames);
            } catch (emailErr) {
              console.error('Stokvel assignment email failed:', emailErr.message);
            }
          }
        }

        // Send email notification for removed stokvels
        if (removedStokvelNames.length > 0) {
          const [removedUser] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [userId]);
          if (removedUser.length > 0) {
            try {
              await sendStokvelUnassignmentEmail(removedUser[0].email, removedUser[0].full_name, removedStokvelNames);
            } catch (emailErr) {
              console.error('Stokvel unassignment email failed:', emailErr.message);
            }
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
          try {
            await sendApprovalEmail(activatedUser[0].email, activatedUser[0].full_name, stokvelNames);
          } catch (emailErr) {
            console.error('Approval email failed:', emailErr.message);
          }
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

    // Accept users with any non-deleted status (pending, inactive, or even active for re-approval)
    const [users] = await pool.query("SELECT id, full_name, email, status FROM users WHERE id = ? AND status != 'deleted'", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set status to active (no-op if already active)
    if (users[0].status !== 'active') {
      await pool.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);
    }

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
    // Always send approval email (await to ensure it completes)
    try {
      await sendApprovalEmail(users[0].email, users[0].full_name, stokvelNames);
      console.log(`📧 Approval email sent to ${users[0].email}`);
    } catch (emailErr) {
      console.error(`⚠️ Failed to send approval email:`, emailErr.message);
    }

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

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    const [users] = await pool.query("SELECT id, full_name, email, role FROM users WHERE id = ? AND status != 'deleted'", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting other admin accounts
    if (users[0].role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts cannot be deleted' });
    }

    const deleteReason = reason || 'Removed by admin';

    await pool.query(
      "UPDATE users SET status = 'deleted', deleted_at = NOW(), deleted_by = ?, delete_reason = ? WHERE id = ?",
      [req.user.id, deleteReason, userId]
    );

    // Deactivate all profiles
    await pool.query("UPDATE profiles SET status = 'inactive' WHERE user_id = ?", [userId]);

    // Send deletion notification email (don't let email failure block the response)
    try {
      await sendAccountDeletionEmail(users[0].email, users[0].full_name, deleteReason);
    } catch (emailErr) {
      console.error('Email notification failed (user still deleted):', emailErr.message);
    }

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

    // Check if user had any inactive profiles (deactivated during soft delete)
    const [existingProfiles] = await pool.query(
      "SELECT COUNT(*) as count FROM profiles WHERE user_id = ? AND status = 'inactive'",
      [userId]
    );

    // If user had profiles that were deactivated, restore them; otherwise set to pending for stokvel assignment
    const newStatus = existingProfiles[0].count > 0 ? 'active' : 'pending';

    await pool.query(
      "UPDATE users SET status = ?, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE id = ?",
      [newStatus, userId]
    );

    // Reactivate only inactive profiles (the ones deactivated during deletion)
    if (existingProfiles[0].count > 0) {
      await pool.query("UPDATE profiles SET status = 'active' WHERE user_id = ? AND status = 'inactive'", [userId]);
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

    // Update profile saved amount
    await pool.query(
      'UPDATE profiles SET saved_amount = saved_amount + ? WHERE id = ?',
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

// ── Confirm contribution with adjusted amount ──
router.post('/contributions/:id/confirm-adjusted', async (req, res) => {
  try {
    const contributionId = req.params.id;
    const { adjustedAmount } = req.body;

    if (!adjustedAmount || adjustedAmount <= 0) {
      return res.status(400).json({ error: 'Adjusted amount must be greater than 0' });
    }

    const [contributions] = await pool.query(
      "SELECT * FROM contributions WHERE id = ? AND status = 'pending'",
      [contributionId]
    );

    if (contributions.length === 0) {
      return res.status(404).json({ error: 'Pending contribution not found' });
    }

    const contribution = contributions[0];

    // Update with adjusted amount and confirm
    await pool.query(
      'UPDATE contributions SET amount = ?, status = ?, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?',
      [adjustedAmount, 'confirmed', req.user.id, contributionId]
    );

    // Only update saved_amount if not madala-side
    if (contribution.contribution_type !== 'madala-side') {
      await pool.query(
        'UPDATE profiles SET saved_amount = saved_amount + ? WHERE id = ?',
        [adjustedAmount, contribution.profile_id]
      );
    }

    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [contribution.stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [contribution.user_id, 'success', 'Contribution Confirmed',
        `Your cash contribution of R${parseFloat(adjustedAmount).toLocaleString()} to ${stokvel[0].name} has been confirmed by admin.`]
    );

    res.json({ message: 'Contribution confirmed with adjusted amount' });
  } catch (err) {
    console.error('Confirm adjusted contribution error:', err);
    res.status(500).json({ error: 'Failed to confirm contribution' });
  }
});

// ── Reject contribution ──
router.post('/contributions/:id/reject', async (req, res) => {
  try {
    const contributionId = req.params.id;
    const { reason } = req.body;

    const [contributions] = await pool.query(
      "SELECT * FROM contributions WHERE id = ? AND status = 'pending'",
      [contributionId]
    );

    if (contributions.length === 0) {
      return res.status(404).json({ error: 'Pending contribution not found' });
    }

    const contribution = contributions[0];

    await pool.query(
      'UPDATE contributions SET status = ? WHERE id = ?',
      ['failed', contributionId]
    );

    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [contribution.stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [contribution.user_id, 'error', 'Payment Rejected',
        `Your cash contribution of R${parseFloat(contribution.amount).toLocaleString()} to ${stokvel[0].name} was rejected.${reason ? ' Reason: ' + reason : ''}`]
    );

    res.json({ message: 'Contribution rejected' });
  } catch (err) {
    console.error('Reject contribution error:', err);
    res.status(500).json({ error: 'Failed to reject contribution' });
  }
});

// ══════════════════════════════════════════════════
//  LOAN MANAGEMENT (ADMIN)
// ══════════════════════════════════════════════════

// ── List pending loans ──
router.get('/loans', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      where += ' AND l.status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM loans l ${where}`,
      params
    );

    const [loans] = await pool.query(
      `SELECT l.*, u.full_name AS user_name, s.name AS stokvel_name
       FROM loans l
       JOIN users u ON u.id = l.user_id
       JOIN stokvels s ON s.id = l.stokvel_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: loans.map(l => ({
        id: l.id,
        userId: l.user_id,
        userName: l.full_name || l.user_name,
        userInitials: (l.full_name || l.user_name || '').split(' ').map(n => n[0]).join('').toUpperCase(),
        stokvelName: l.stokvel_name,
        amount: parseFloat(l.amount),
        interestRate: parseFloat(l.interest_rate),
        interest: parseFloat(l.interest),
        totalRepayable: parseFloat(l.total_repayable),
        status: l.status,
        purpose: l.purpose,
        borrowedDate: l.borrowed_date,
        dueDate: l.due_date,
        createdAt: l.created_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (err) {
    console.error('Admin list loans error:', err);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// ── Approve loan ──
router.post('/loans/:id/approve', async (req, res) => {
  try {
    const loanId = req.params.id;

    const [loans] = await pool.query(
      "SELECT * FROM loans WHERE id = ? AND status = 'pending'",
      [loanId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }

    const loan = loans[0];

    // Set due date to 30 days from now (approval date)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Approve the loan
    await pool.query(
      'UPDATE loans SET status = ?, borrowed_date = NOW(), due_date = ? WHERE id = ?',
      ['active', dueDate, loanId]
    );

    // Deduct the principal from saved_amount
    await pool.query(
      'UPDATE profiles SET saved_amount = GREATEST(saved_amount - ?, 0) WHERE id = ?',
      [parseFloat(loan.amount), loan.profile_id]
    );

    // Notify user
    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [loan.user_id, 'success', 'Loan Approved',
        `Your loan of R${parseFloat(loan.amount).toLocaleString()} from ${stokvel[0].name} has been approved! Repayment of R${parseFloat(loan.total_repayable).toLocaleString()} is due by ${dueDate.toLocaleDateString()}.`]
    );

    // Send loan approval email
    try {
      const [user] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [loan.user_id]);
      if (user.length > 0) {
        await sendLoanApprovalEmail(user[0].email, user[0].full_name, {
          amount: parseFloat(loan.amount),
          interestRate: parseFloat(loan.interest_rate),
          interest: parseFloat(loan.interest),
          totalRepayable: parseFloat(loan.total_repayable),
          stokvelName: stokvel[0].name,
          borrowedDate: new Date(),
          dueDate,
        });
      }
    } catch (emailErr) {
      console.error('Loan approval email failed:', emailErr.message);
    }

    res.json({ message: 'Loan approved successfully' });
  } catch (err) {
    console.error('Approve loan error:', err);
    res.status(500).json({ error: 'Failed to approve loan' });
  }
});

// ── Reject loan ──
router.post('/loans/:id/reject', async (req, res) => {
  try {
    const loanId = req.params.id;
    const { reason } = req.body;

    const [loans] = await pool.query(
      "SELECT * FROM loans WHERE id = ? AND status = 'pending'",
      [loanId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }

    const loan = loans[0];

    // Reject the loan
    await pool.query(
      'UPDATE loans SET status = ? WHERE id = ?',
      ['rejected', loanId]
    );

    // Notify user with reason
    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [loan.user_id, 'error', 'Loan Request Rejected',
        `Your loan request of R${parseFloat(loan.amount).toLocaleString()} from ${stokvel[0].name} was rejected.${reason ? ' Reason: ' + reason : ''}`]
    );

    res.json({ message: 'Loan rejected' });
  } catch (err) {
    console.error('Reject loan error:', err);
    res.status(500).json({ error: 'Failed to reject loan' });
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
      try {
        result[s.setting_key] = JSON.parse(s.setting_value);
      } catch {
        result[s.setting_key] = s.setting_value;
      }
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
      const storedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, storedValue, storedValue]
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

    if (!reportType) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    let data;
    const startDate = dateRange?.start || '2020-01-01';
    const endDateRaw = dateRange?.end || new Date().toISOString().split('T')[0];
    // Ensure end date covers the full day (datetime columns need 23:59:59)
    const endDate = endDateRaw.includes(' ') ? endDateRaw : `${endDateRaw} 23:59:59`;

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
      case 'users':
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
      case 'stokvels': {
        const [rows] = await pool.query(
          `SELECT s.id, s.name, s.type, s.target_amount, s.max_members, s.cycle, s.status, s.created_at,
                  (SELECT COUNT(DISTINCT p.user_id) FROM profiles p WHERE p.stokvel_id = s.id AND p.status = 'active') AS member_count,
                  (SELECT COALESCE(SUM(c.amount), 0) FROM contributions c WHERE c.stokvel_id = s.id AND c.status = 'confirmed') AS total_contributions
           FROM stokvels s
           WHERE s.created_at BETWEEN ? AND ?
           ORDER BY s.created_at DESC`,
          [startDate, endDate]
        );
        data = rows;
        break;
      }
      case 'payments': {
        const [rows] = await pool.query(
          `SELECT c.id, u.full_name, s.name AS stokvel_name, c.amount, c.payment_method, c.reference, c.status, c.confirmed_at, c.created_at
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
      case 'financial': {
        const [contribs] = await pool.query(
          `SELECT COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) AS total_contributions,
                  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_count,
                  COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
           FROM contributions
           WHERE created_at BETWEEN ? AND ?`,
          [startDate, endDate]
        );
        const [loanData] = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total_loans,
                  COALESCE(SUM(interest), 0) AS total_interest,
                  COUNT(*) AS loan_count
           FROM loans
           WHERE created_at BETWEEN ? AND ?`,
          [startDate, endDate]
        );
        data = { contributions: contribs[0], loans: loanData[0] };
        break;
      }
      case 'deleted': {
        const [rows] = await pool.query(
          `SELECT u.id, u.full_name, u.email, u.phone, u.deleted_at, u.delete_reason,
                  du.full_name AS deleted_by_name
           FROM users u
           LEFT JOIN users du ON du.id = u.deleted_by
           WHERE u.status = 'deleted'
           AND u.deleted_at BETWEEN ? AND ?
           ORDER BY u.deleted_at DESC`,
          [startDate, endDate]
        );
        data = rows;
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Determine columns and format data
    const colKey = reportType === 'members' ? 'users' : reportType;
    const columns = REPORT_COLUMNS[colKey] || REPORT_COLUMNS.users;
    const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    const range = { start: startDate, end: endDate };

    // Handle financial report (object, not array)
    let rows;
    if (reportType === 'financial') {
      const fin = data;
      rows = [
        { metric: 'Total Contributions', value: `R ${parseFloat(fin.contributions?.total_contributions || 0).toFixed(2)}` },
        { metric: 'Confirmed Contributions', value: fin.contributions?.confirmed_count || 0 },
        { metric: 'Pending Contributions', value: fin.contributions?.pending_count || 0 },
        { metric: 'Total Loans Issued', value: `R ${parseFloat(fin.loans?.total_loans || 0).toFixed(2)}` },
        { metric: 'Total Interest Earned', value: `R ${parseFloat(fin.loans?.total_interest || 0).toFixed(2)}` },
        { metric: 'Total Loan Count', value: fin.loans?.loan_count || 0 },
      ];
    } else {
      rows = formatRowData(Array.isArray(data) ? data : [], reportType);
    }

    // Generate file based on format
    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(title, columns, rows, range);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      return res.send(pdfBuffer);
    }

    if (format === 'excel') {
      const excelBuffer = await generateExcel(title, columns, rows, range);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
      return res.send(Buffer.from(excelBuffer));
    }

    if (format === 'csv') {
      const csvContent = generateCSV(columns, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
      return res.send(csvContent);
    }

    // Default: JSON
    res.json({
      reportType,
      dateRange: range,
      format,
      recordCount: rows.length,
      data: rows,
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
      try {
        await sendJoinRequestApprovedEmail(userInfo[0].email, userInfo[0].full_name, stokvelInfo[0].name);
      } catch (emailErr) {
        console.error('Join request approval email failed:', emailErr.message);
      }
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

// ══════════════════════════════════════════════════
//  ADMIN FINES MANAGEMENT
// ══════════════════════════════════════════════════

const FINE_AMOUNTS = {
  no_banking: 30,
  no_attendance: 20,
  sending: 30,
  late_coming: 20,
};

const FINE_LABELS = {
  no_banking: 'No Banking',
  no_attendance: 'No Attendance',
  sending: 'Sending',
  late_coming: 'Late Coming',
};

// List all fines
router.get('/fines', async (_req, res) => {
  try {
    const [fines] = await pool.query(
      `SELECT f.*, u.full_name, s.name AS stokvel_name, iu.full_name AS issued_by_name
       FROM fines f
       JOIN users u ON u.id = f.user_id
       JOIN stokvels s ON s.id = f.stokvel_id
       LEFT JOIN users iu ON iu.id = f.issued_by
       ORDER BY f.created_at DESC`
    );

    const [summary] = await pool.query(
      "SELECT COALESCE(SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END), 0) as unpaid_total, COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_total, COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_total, COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count, COUNT(*) as total_count FROM fines"
    );

    res.json({
      data: fines.map(f => ({
        id: f.id,
        userId: f.user_id,
        userName: f.full_name,
        stokvelName: f.stokvel_name,
        fineType: f.fine_type,
        fineLabel: FINE_LABELS[f.fine_type] || f.fine_type,
        amount: parseFloat(f.amount),
        status: f.status,
        reason: f.reason,
        issuedBy: f.issued_by_name,
        paidDate: f.paid_date,
        paymentMethod: f.payment_method,
        createdAt: f.created_at,
      })),
      summary: {
        unpaidTotal: parseFloat(summary[0].unpaid_total),
        paidTotal: parseFloat(summary[0].paid_total),
        pendingTotal: parseFloat(summary[0].pending_total),
        unpaidCount: parseInt(summary[0].unpaid_count),
        pendingCount: parseInt(summary[0].pending_count),
        totalCount: parseInt(summary[0].total_count),
      },
      fineTypes: Object.entries(FINE_AMOUNTS).map(([key, amount]) => ({
        value: key,
        label: FINE_LABELS[key],
        amount,
      })),
    });
  } catch (err) {
    console.error('Admin list fines error:', err);
    res.status(500).json({ error: 'Failed to fetch fines' });
  }
});

// Issue a fine to a member
router.post('/fines', [
  body('userId').isInt().withMessage('User is required'),
  body('fineType').isIn(['no_banking', 'no_attendance', 'sending', 'late_coming']).withMessage('Invalid fine type'),
  body('reason').optional().trim(),
  validate,
], async (req, res) => {
  try {
    const { userId, fineType, reason } = req.body;
    const amount = FINE_AMOUNTS[fineType];

    // Get user's stokvel
    const [profiles] = await pool.query(
      "SELECT p.stokvel_id, s.name as stokvel_name FROM profiles p JOIN stokvels s ON s.id = p.stokvel_id WHERE p.user_id = ? AND p.status = 'active' LIMIT 1",
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'User has no active stokvel membership' });
    }

    const [result] = await pool.query(
      'INSERT INTO fines (user_id, stokvel_id, fine_type, amount, status, reason, issued_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, profiles[0].stokvel_id, fineType, amount, 'unpaid', reason || null, req.user.id]
    );

    // Notify the user
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, 'warning', 'Fine Issued', `You have been fined R${amount} for ${FINE_LABELS[fineType]}.${reason ? ' Reason: ' + reason : ''}`]
    );

    const [user] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);

    res.status(201).json({
      message: `Fine of R${amount} issued to ${user[0].full_name} for ${FINE_LABELS[fineType]}`,
      fine: {
        id: result.insertId,
        userId,
        userName: user[0].full_name,
        fineType,
        fineLabel: FINE_LABELS[fineType],
        amount,
        status: 'unpaid',
      },
    });
  } catch (err) {
    console.error('Issue fine error:', err);
    res.status(500).json({ error: 'Failed to issue fine' });
  }
});

// Delete / cancel a fine (admin)
router.delete('/fines/:id', async (req, res) => {
  try {
    const [fines] = await pool.query('SELECT * FROM fines WHERE id = ?', [req.params.id]);
    if (fines.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    await pool.query('DELETE FROM fines WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fine removed' });
  } catch (err) {
    console.error('Delete fine error:', err);
    res.status(500).json({ error: 'Failed to delete fine' });
  }
});

// Confirm a pending fine payment (admin)
router.post('/fines/:id/confirm', async (req, res) => {
  try {
    const [fines] = await pool.query('SELECT * FROM fines WHERE id = ? AND status = ?', [req.params.id, 'pending']);
    if (fines.length === 0) {
      return res.status(404).json({ error: 'Pending fine not found' });
    }

    await pool.query(
      'UPDATE fines SET status = ?, paid_date = NOW() WHERE id = ?',
      ['paid', req.params.id]
    );

    const fine = fines[0];
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [fine.user_id, 'success', 'Fine Payment Confirmed', `Your cash payment of R${parseFloat(fine.amount).toFixed(0)} for your fine has been confirmed by admin.`]
    );

    res.json({ message: 'Fine payment confirmed' });
  } catch (err) {
    console.error('Confirm fine error:', err);
    res.status(500).json({ error: 'Failed to confirm fine' });
  }
});

export default router;
