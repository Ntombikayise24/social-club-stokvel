import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();
router.use(authenticate);
router.use(updateLastActive);

// ────────────────── LIST LOANS ──────────────────
router.get('/', async (req, res) => {
  try {
    const { profileId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE l.user_id = ?';
    const params = [req.user.id];

    if (profileId) { where += ' AND l.profile_id = ?'; params.push(profileId); }
    if (status && status !== 'all') { where += ' AND l.status = ?'; params.push(status); }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM loans l ${where}`,
      params
    );

    const [loans] = await pool.query(
      `SELECT l.*, s.name AS stokvel_name, s.icon AS stokvel_icon,
              p.saved_amount, p.target_amount
       FROM loans l
       JOIN stokvels s ON s.id = l.stokvel_id
       JOIN profiles p ON p.id = l.profile_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: loans.map(l => {
        const daysRemaining = l.due_date
          ? Math.max(0, Math.ceil((new Date(l.due_date) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          id: l.id,
          profileId: l.profile_id,
          stokvelName: l.stokvel_name,
          stokvelIcon: l.stokvel_icon,
          amount: parseFloat(l.amount),
          interestRate: parseFloat(l.interest_rate),
          interest: parseFloat(l.interest),
          totalRepayable: parseFloat(l.total_repayable),
          status: l.status,
          purpose: l.purpose,
          borrowedDate: l.borrowed_date,
          dueDate: l.due_date,
          repaidDate: l.repaid_date,
          daysRemaining,
          maxLoanable: parseFloat(l.saved_amount) * 0.5,
        };
      }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (err) {
    console.error('List loans error:', err);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// ────────────────── LOAN STATS ──────────────────
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const [active] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_repayable), 0) as total FROM loans WHERE user_id = ? AND status IN ('active', 'overdue')",
      [userId]
    );

    const [repaid] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_repayable), 0) as total FROM loans WHERE user_id = ? AND status = 'repaid'",
      [userId]
    );

    const [totalBorrowed] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE user_id = ?',
      [userId]
    );

    res.json({
      activeLoans: parseInt(active[0].count),
      activeAmount: parseFloat(active[0].total),
      repaidLoans: parseInt(repaid[0].count),
      repaidAmount: parseFloat(repaid[0].total),
      totalBorrowed: parseFloat(totalBorrowed[0].total),
    });
  } catch (err) {
    console.error('Loan stats error:', err);
    res.status(500).json({ error: 'Failed to fetch loan stats' });
  }
});

// ────────────────── REQUEST LOAN ──────────────────
router.post(
  '/request',
  [
    body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least R100'),
    body('profileId').isInt().withMessage('Profile is required'),
    body('purpose').optional().trim(),
    body('cardId').optional().isInt(),
    validate,
  ],
  async (req, res) => {
    try {
      const { amount, profileId, purpose, cardId } = req.body;

      // Verify profile
      const [profiles] = await pool.query(
        'SELECT id, stokvel_id, saved_amount FROM profiles WHERE id = ? AND user_id = ?',
        [profileId, req.user.id]
      );

      if (profiles.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const profile = profiles[0];
      const maxLoanable = parseFloat(profile.saved_amount) * 0.5;

      if (amount > maxLoanable) {
        return res.status(400).json({
          error: `Maximum loanable amount is R${maxLoanable.toFixed(2)} (50% of your savings)`,
        });
      }

      // Check for existing active loan in this stokvel
      const [existingLoan] = await pool.query(
        "SELECT id FROM loans WHERE user_id = ? AND stokvel_id = ? AND status IN ('active', 'overdue', 'pending')",
        [req.user.id, profile.stokvel_id]
      );

      if (existingLoan.length > 0) {
        return res.status(400).json({ error: 'You already have an active loan in this stokvel. Repay it first.' });
      }

      // Get interest rate from stokvel
      const [stokvel] = await pool.query('SELECT interest_rate, name FROM stokvels WHERE id = ?', [profile.stokvel_id]);
      const interestRate = parseFloat(stokvel[0].interest_rate);
      const interest = amount * (interestRate / 100);
      const totalRepayable = amount + interest;

      const borrowedDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const [result] = await pool.query(
        `INSERT INTO loans (user_id, profile_id, stokvel_id, amount, interest_rate, interest, total_repayable, status, purpose, borrowed_date, due_date, card_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
        [req.user.id, profileId, profile.stokvel_id, amount, interestRate, interest, totalRepayable, purpose || null, borrowedDate, dueDate, cardId || null]
      );

      // Notification
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'loan', 'Loan Approved',
          `Your loan of R${amount.toLocaleString()} from ${stokvel[0].name} has been approved. Repayment of R${totalRepayable.toLocaleString()} due by ${dueDate.toLocaleDateString()}.`]
      );

      res.status(201).json({
        message: 'Loan approved',
        loan: {
          id: result.insertId,
          amount,
          interest,
          totalRepayable,
          borrowedDate,
          dueDate,
          status: 'active',
        },
      });
    } catch (err) {
      console.error('Loan request error:', err);
      res.status(500).json({ error: 'Failed to process loan request' });
    }
  }
);

// ────────────────── REPAY LOAN ──────────────────
router.post(
  '/:id/repay',
  [
    body('cardId').optional().isInt(),
    validate,
  ],
  async (req, res) => {
    try {
      const loanId = req.params.id;
      const { cardId } = req.body;

      const [loans] = await pool.query(
        "SELECT * FROM loans WHERE id = ? AND user_id = ? AND status IN ('active', 'overdue')",
        [loanId, req.user.id]
      );

      if (loans.length === 0) {
        return res.status(404).json({ error: 'Active loan not found' });
      }

      const loan = loans[0];

      // Mark as repaid
      await pool.query(
        'UPDATE loans SET status = ?, repaid_date = NOW() WHERE id = ?',
        ['repaid', loanId]
      );

      // Add the interest back to the profile (earned by the group)
      // Optionally update saved_amount — in real system this would be more complex
      
      // Notification
      const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'success', 'Loan Repaid',
          `Your loan of R${parseFloat(loan.total_repayable).toLocaleString()} to ${stokvel[0].name} has been repaid successfully.`]
      );

      res.json({ message: 'Loan repaid successfully' });
    } catch (err) {
      console.error('Repay loan error:', err);
      res.status(500).json({ error: 'Failed to repay loan' });
    }
  }
);

export default router;
