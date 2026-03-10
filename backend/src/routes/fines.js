import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();
router.use(authenticate);
router.use(updateLastActive);

// Fine type amounts
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

// ────────────────── LIST MY FINES ──────────────────
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let where = 'WHERE f.user_id = ?';
    const params = [req.user.id];

    if (status && status !== 'all') {
      where += ' AND f.status = ?';
      params.push(status);
    }

    const [fines] = await pool.query(
      `SELECT f.*, s.name AS stokvel_name, u.full_name AS issued_by_name
       FROM fines f
       JOIN stokvels s ON s.id = f.stokvel_id
       LEFT JOIN users u ON u.id = f.issued_by
       ${where}
       ORDER BY f.created_at DESC`,
      params
    );

    const [totals] = await pool.query(
      "SELECT COALESCE(SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END), 0) as unpaid_total, COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_total, COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count FROM fines WHERE user_id = ?",
      [req.user.id]
    );

    res.json({
      data: fines.map(f => ({
        id: f.id,
        fineType: f.fine_type,
        fineLabel: FINE_LABELS[f.fine_type] || f.fine_type,
        amount: parseFloat(f.amount),
        status: f.status,
        reason: f.reason,
        stokvelName: f.stokvel_name,
        issuedBy: f.issued_by_name,
        paidDate: f.paid_date,
        createdAt: f.created_at,
      })),
      summary: {
        unpaidTotal: parseFloat(totals[0].unpaid_total),
        paidTotal: parseFloat(totals[0].paid_total),
        unpaidCount: parseInt(totals[0].unpaid_count),
      },
    });
  } catch (err) {
    console.error('List fines error:', err);
    res.status(500).json({ error: 'Failed to fetch fines' });
  }
});

// ────────────────── PAY A FINE ──────────────────
router.post('/:id/pay', async (req, res) => {
  try {
    const fineId = req.params.id;
    const { paymentMethod = 'card', cardId } = req.body;

    const [fines] = await pool.query(
      'SELECT * FROM fines WHERE id = ? AND user_id = ?',
      [fineId, req.user.id]
    );

    if (fines.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    if (fines[0].status === 'paid') {
      return res.status(400).json({ error: 'This fine has already been paid' });
    }

    if (paymentMethod === 'cash') {
      // Cash payment: mark as pending, admin confirms at meeting
      await pool.query(
        'UPDATE fines SET status = ?, payment_method = ? WHERE id = ?',
        ['pending', 'cash', fineId]
      );

      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'info', 'Fine Payment Pending', `Your cash payment of R${parseFloat(fines[0].amount).toFixed(0)} for ${FINE_LABELS[fines[0].fine_type]} has been submitted. Pending admin confirmation at the next meeting.`]
      );

      return res.json({ message: 'Cash payment submitted. Pending admin confirmation.' });
    }

    // Card payment: mark as paid immediately
    await pool.query(
      'UPDATE fines SET status = ?, paid_date = NOW(), payment_method = ? WHERE id = ?',
      ['paid', 'card', fineId]
    );

    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [req.user.id, 'success', 'Fine Paid', `Your R${parseFloat(fines[0].amount).toFixed(0)} fine for ${FINE_LABELS[fines[0].fine_type]} has been paid.`]
    );

    res.json({ message: 'Fine paid successfully' });
  } catch (err) {
    console.error('Pay fine error:', err);
    res.status(500).json({ error: 'Failed to pay fine' });
  }
});

export default router;
export { FINE_AMOUNTS, FINE_LABELS };
