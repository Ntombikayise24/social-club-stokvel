import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();

// ────────────────── LIST STOKVELS (public) ──────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const [stokvels] = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM profiles p WHERE p.stokvel_id = s.id AND p.status = 'active') AS current_members
       FROM stokvels s
       WHERE s.status != 'inactive'
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
      createdAt: s.created_at,
    })));
  } catch (err) {
    console.error('List stokvels error:', err);
    res.status(500).json({ error: 'Failed to fetch stokvels' });
  }
});

// ────────────────── GET STOKVEL DETAILS ──────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [stokvels] = await pool.query('SELECT * FROM stokvels WHERE id = ?', [req.params.id]);
    if (stokvels.length === 0) {
      return res.status(404).json({ error: 'Stokvel not found' });
    }

    const stokvel = stokvels[0];

    // Get members
    const [members] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, p.role, p.saved_amount, p.joined_date
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.stokvel_id = ? AND p.status = 'active'
       ORDER BY p.role DESC, u.full_name`,
      [req.params.id]
    );

    // Get total pool
    const [poolResult] = await pool.query(
      "SELECT COALESCE(SUM(saved_amount), 0) as total FROM profiles WHERE stokvel_id = ? AND status = 'active'",
      [req.params.id]
    );

    // Get active loans
    const [activeLoans] = await pool.query(
      `SELECT l.id, l.amount, l.total_repayable, l.status, l.due_date, u.full_name
       FROM loans l
       JOIN users u ON u.id = l.user_id
       WHERE l.stokvel_id = ? AND l.status IN ('active', 'overdue')`,
      [req.params.id]
    );

    // Recent contributions
    const [recentContributions] = await pool.query(
      `SELECT c.id, c.amount, c.status, c.created_at, u.full_name, u.avatar_url
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       WHERE c.stokvel_id = ? AND c.status = 'confirmed'
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [req.params.id]
    );

    // Interest Pot: sum of interest from all repaid loans in this stokvel
    const [interestPotResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'repaid' THEN interest ELSE 0 END), 0) as total_interest_earned,
        COUNT(CASE WHEN status = 'repaid' THEN 1 END) as repaid_count,
        COALESCE(SUM(CASE WHEN status IN ('active', 'overdue') THEN interest ELSE 0 END), 0) as pending_interest
       FROM loans WHERE stokvel_id = ?`,
      [req.params.id]
    );

    res.json({
      id: stokvel.id,
      name: stokvel.name,
      type: stokvel.type,
      description: stokvel.description,
      targetAmount: parseFloat(stokvel.target_amount),
      maxMembers: stokvel.max_members,
      currentMembers: members.length,
      interestRate: parseFloat(stokvel.interest_rate),
      cycle: stokvel.cycle,
      meetingDay: stokvel.meeting_day,
      nextPayout: stokvel.next_payout,
      status: stokvel.status,
      icon: stokvel.icon,
      color: stokvel.color,
      totalPool: parseFloat(poolResult[0].total),
      members: members.map(m => ({
        id: m.id,
        name: m.full_name,
        email: m.email,
        avatarUrl: m.avatar_url,
        role: m.role,
        savedAmount: parseFloat(m.saved_amount),
        joinedDate: m.joined_date,
        initials: m.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
      })),
      activeLoans: activeLoans.map(l => ({
        id: l.id,
        borrower: l.full_name,
        amount: parseFloat(l.amount),
        totalRepayable: parseFloat(l.total_repayable),
        status: l.status,
        dueDate: l.due_date,
      })),
      recentContributions: recentContributions.map(c => ({
        id: c.id,
        member: c.full_name,
        avatarUrl: c.avatar_url,
        amount: parseFloat(c.amount),
        status: c.status,
        date: c.created_at,
      })),
      interestPot: {
        totalEarned: parseFloat(interestPotResult[0].total_interest_earned),
        repaidLoans: parseInt(interestPotResult[0].repaid_count),
        pendingInterest: parseFloat(interestPotResult[0].pending_interest),
      },
    });
  } catch (err) {
    console.error('Get stokvel error:', err);
    res.status(500).json({ error: 'Failed to fetch stokvel details' });
  }
});

// ────────────────── JOIN REQUEST ──────────────────
router.post('/:id/join-request', authenticate, async (req, res) => {
  try {
    const stokvelId = req.params.id;
    const userId = req.user.id;

    // Admin users cannot join stokvels — they are system-level only
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot join stokvels' });
    }

    // Check if already a member
    const [existing] = await pool.query(
      'SELECT id FROM profiles WHERE user_id = ? AND stokvel_id = ?',
      [userId, stokvelId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already a member of this stokvel' });
    }

    // Check for existing pending request
    const [existingReq] = await pool.query(
      "SELECT id, status FROM join_requests WHERE user_id = ? AND stokvel_id = ?",
      [userId, stokvelId]
    );
    if (existingReq.length > 0) {
      if (existingReq[0].status === 'pending') {
        return res.status(409).json({ error: 'Join request already pending' });
      }
      // If previously rejected, update existing row back to pending
      await pool.query(
        "UPDATE join_requests SET status = 'pending', updated_at = NOW() WHERE id = ?",
        [existingReq[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO join_requests (user_id, stokvel_id, status) VALUES (?, ?, ?)',
        [userId, stokvelId, 'pending']
      );
    }

    // Notify stokvel admins
    const [admins] = await pool.query(
      "SELECT user_id FROM profiles WHERE stokvel_id = ? AND role = 'admin'",
      [stokvelId]
    );
    const [user] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [stokvelId]);

    for (const admin of admins) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, actionable, action_link, action_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [admin.user_id, 'approval', 'Join Request', `${user[0].full_name} wants to join ${stokvel[0].name}.`, true, '/admin', 'Review']
      );
    }

    res.status(201).json({ message: 'Join request submitted' });
  } catch (err) {
    console.error('Join request error:', err);
    res.status(500).json({ error: 'Failed to submit join request' });
  }
});

export default router;
