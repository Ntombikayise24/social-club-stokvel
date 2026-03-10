import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { generatePDF, generateExcel, generateCSV, formatRowData } from '../utils/reports.js';

const router = Router();
router.use(authenticate);
router.use(updateLastActive);

// ────────────────── LIST CONTRIBUTIONS ──────────────────
router.get('/', async (req, res) => {
  try {
    const { stokvelId, status, profileId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE c.user_id = ?';
    const params = [req.user.id];

    if (stokvelId) {
      where += ' AND c.stokvel_id = ?';
      params.push(stokvelId);
    }
    if (status && status !== 'all') {
      where += ' AND c.status = ?';
      params.push(status);
    }
    if (profileId) {
      where += ' AND c.profile_id = ?';
      params.push(profileId);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM contributions c ${where}`,
      params
    );

    const [contributions] = await pool.query(
      `SELECT c.id, c.amount, c.payment_method, c.reference, c.status,
              c.confirmed_at, c.created_at, c.contribution_type,
              s.name AS stokvel_name, s.icon,
              u2.full_name AS confirmed_by_name
       FROM contributions c
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
        amount: parseFloat(c.amount),
        paymentMethod: c.payment_method,
        reference: c.reference,
        status: c.status,
        contributionType: c.contribution_type || 'your-target',
        stokvelName: c.stokvel_name,
        stokvelIcon: c.icon,
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
    console.error('List contributions error:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// ────────────────── DOWNLOAD CONTRIBUTIONS REPORT ──────────────────
router.get('/download', async (req, res) => {
  try {
    const { profileId, format = 'pdf' } = req.query;

    let where = 'WHERE c.user_id = ?';
    const params = [req.user.id];
    if (profileId) { where += ' AND c.profile_id = ?'; params.push(profileId); }

    const [contributions] = await pool.query(
      `SELECT c.id, u.full_name, s.name AS stokvel_name, c.amount, c.status, c.payment_method, c.reference, c.created_at, c.confirmed_at
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       JOIN stokvels s ON s.id = c.stokvel_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );

    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'stokvel_name', header: 'Stokvel' },
      { key: 'amount', header: 'Amount (R)' },
      { key: 'status', header: 'Status' },
      { key: 'payment_method', header: 'Payment Method' },
      { key: 'reference', header: 'Reference' },
      { key: 'created_at', header: 'Date' },
      { key: 'confirmed_at', header: 'Confirmed At' },
    ];
    const rows = formatRowData(contributions, 'contributions');
    const title = 'Contribution History Report';

    if (format === 'pdf') {
      const buffer = await generatePDF(title, columns, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="contribution-history.pdf"');
      return res.send(buffer);
    }
    if (format === 'excel') {
      const buffer = await generateExcel(title, columns, rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="contribution-history.xlsx"');
      return res.send(Buffer.from(buffer));
    }
    if (format === 'csv') {
      const csv = generateCSV(columns, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contribution-history.csv"');
      return res.send(csv);
    }
    res.json({ data: rows });
  } catch (err) {
    console.error('Download contributions error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ────────────────── CONTRIBUTION STATS ──────────────────
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { stokvelId, profileId } = req.query;

    let where = "WHERE c.user_id = ? AND c.status = 'confirmed'";
    const params = [userId];

    if (stokvelId) { where += ' AND c.stokvel_id = ?'; params.push(stokvelId); }
    if (profileId) { where += ' AND c.profile_id = ?'; params.push(profileId); }

    const [stats] = await pool.query(
      `SELECT 
        COALESCE(SUM(c.amount), 0) AS total_amount,
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN MONTH(c.created_at) = MONTH(NOW()) AND YEAR(c.created_at) = YEAR(NOW()) THEN c.amount ELSE 0 END), 0) AS this_month,
        COALESCE(AVG(c.amount), 0) AS average_amount
       FROM contributions c
       ${where}`,
      params
    );

    // Monthly breakdown (last 6 months)
    const [monthly] = await pool.query(
      `SELECT 
        DATE_FORMAT(c.created_at, '%Y-%m') AS month,
        SUM(c.amount) AS total
       FROM contributions c
       ${where}
       AND c.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(c.created_at, '%Y-%m')
       ORDER BY month`,
      params
    );

    res.json({
      totalAmount: parseFloat(stats[0].total_amount),
      totalCount: parseInt(stats[0].total_count),
      thisMonth: parseFloat(stats[0].this_month),
      averageAmount: parseFloat(stats[0].average_amount),
      monthly: monthly.map(m => ({
        month: m.month,
        total: parseFloat(m.total),
      })),
    });
  } catch (err) {
    console.error('Contribution stats error:', err);
    res.status(500).json({ error: 'Failed to fetch contribution stats' });
  }
});

// ────────────────── MAKE CONTRIBUTION ──────────────────
router.post(
  '/',
  [
    body('amount').isFloat({ min: 100 }).withMessage('Minimum contribution is R100'),
    body('profileId').isInt().withMessage('Profile is required'),
    body('stokvelId').optional().isInt(),
    body('cardId').optional().isInt(),
    body('paymentMethod').optional().isIn(['card', 'bank', 'cash']),
    validate,
  ],
  async (req, res) => {
    try {
      const { amount, profileId, stokvelId, cardId, paymentMethod = 'card' } = req.body;

      // Verify profile belongs to user
      let [profiles] = await pool.query(
        'SELECT id, stokvel_id, user_id, target_amount, saved_amount FROM profiles WHERE id = ? AND user_id = ?',
        [profileId, req.user.id]
      );

      // Fallback: if not found by profile ID, try by stokvelId + userId
      if (profiles.length === 0 && stokvelId) {
        console.warn(`Contribution: Profile not found by id=${profileId} for user=${req.user.id}, trying stokvelId=${stokvelId} fallback`);
        [profiles] = await pool.query(
          "SELECT id, stokvel_id, user_id, target_amount, saved_amount FROM profiles WHERE stokvel_id = ? AND user_id = ? AND status = 'active'",
          [stokvelId, req.user.id]
        );
      }

      if (profiles.length === 0) {
        console.error(`No profile found for user=${req.user.id}. profileId=${profileId}, stokvelId=${stokvelId}`);
        return res.status(404).json({ error: 'Profile not found. Please ensure you are assigned to a stokvel.' });
      }

      // Check contribution does not exceed target
      const profile = profiles[0];
      const remaining = parseFloat(profile.target_amount) - parseFloat(profile.saved_amount);
      if (remaining <= 0) {
        return res.status(400).json({ error: 'You have already reached your contribution target.' });
      }
      if (amount > remaining) {
        return res.status(400).json({
          error: `Amount exceeds your remaining target. You can contribute up to R${remaining.toLocaleString()}.`,
          maxAmount: remaining,
        });
      }

      // Check if user has at least one card (for card payments)
      if (paymentMethod === 'card') {
        const [cards] = await pool.query(
          'SELECT id FROM cards WHERE user_id = ? LIMIT 1',
          [req.user.id]
        );

        if (cards.length === 0) {
          return res.status(400).json({ 
            error: 'No card found. Please add a card before making contributions.',
            code: 'NO_CARD'
          });
        }
      }

      const reference = `CON-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

      const [result] = await pool.query(
        `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status, card_id)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [req.user.id, profileId, profiles[0].stokvel_id, amount, paymentMethod, reference, cardId || null]
      );

      // Create notification
      const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [profiles[0].stokvel_id]);
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'contribution', 'Contribution Submitted', `Your R${amount.toLocaleString()} contribution to ${stokvel[0].name} is pending confirmation.`]
      );

      res.status(201).json({
        message: 'Contribution submitted successfully',
        contribution: {
          id: result.insertId,
          amount,
          reference,
          status: 'pending',
        },
      });
    } catch (err) {
      console.error('Make contribution error:', err);
      res.status(500).json({ error: 'Failed to submit contribution' });
    }
  }
);

export default router;
