import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';
import { generatePDF, generateExcel, generateCSV, formatRowData } from '../utils/reports.js';
import { sendLoanApprovalEmail } from '../utils/email.js';

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

    // Auto-mark overdue loans in the database
    const overdueIds = loans
      .filter(l => l.status === 'active' && l.due_date && new Date(l.due_date) < new Date())
      .map(l => l.id);
    if (overdueIds.length > 0) {
      await pool.query('UPDATE loans SET status = ? WHERE id IN (?)', ['overdue', overdueIds]);
    }

    res.json({
      data: loans.map(l => {
        const daysRemaining = l.due_date
          ? Math.max(0, Math.ceil((new Date(l.due_date) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0;

        // Calculate overdue penalty: 30% of original loan amount per month overdue
        let overdueMonths = 0;
        let penaltyAmount = 0;
        let currentTotalRepayable = parseFloat(l.total_repayable);
        if (l.due_date && (l.status === 'active' || l.status === 'overdue') && new Date(l.due_date) < new Date()) {
          const msOverdue = new Date() - new Date(l.due_date);
          overdueMonths = Math.ceil(msOverdue / (1000 * 60 * 60 * 24 * 30)); // each 30-day period counts
          penaltyAmount = parseFloat(l.amount) * 0.3 * overdueMonths;
          currentTotalRepayable = parseFloat(l.amount) + parseFloat(l.interest) + penaltyAmount;
        }

        return {
          id: l.id,
          profileId: l.profile_id,
          stokvelName: l.stokvel_name,
          stokvelIcon: l.stokvel_icon,
          amount: parseFloat(l.amount),
          interestRate: parseFloat(l.interest_rate),
          interest: parseFloat(l.interest),
          totalRepayable: currentTotalRepayable,
          status: l.due_date && (l.status === 'active') && new Date(l.due_date) < new Date() ? 'overdue' : l.status,
          purpose: l.purpose,
          borrowedDate: l.borrowed_date,
          dueDate: l.due_date,
          repaidDate: l.repaid_date,
          daysRemaining,
          overdueMonths,
          penaltyAmount,
          loanTarget: l.loan_target || 'your-target',
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

// ────────────────── DOWNLOAD LOAN REPORT ──────────────────
router.get('/download', async (req, res) => {
  try {
    const { profileId, format = 'pdf' } = req.query;

    let where = 'WHERE l.user_id = ?';
    const params = [req.user.id];
    if (profileId) { where += ' AND l.profile_id = ?'; params.push(profileId); }

    const [loans] = await pool.query(
      `SELECT l.id, u.full_name, s.name AS stokvel_name, l.amount, l.interest, l.total_repayable, l.interest_rate, l.status, l.purpose, l.borrowed_date, l.due_date, l.repaid_date
       FROM loans l
       JOIN users u ON u.id = l.user_id
       JOIN stokvels s ON s.id = l.stokvel_id
       ${where}
       ORDER BY l.created_at DESC`,
      params
    );

    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'stokvel_name', header: 'Stokvel' },
      { key: 'amount', header: 'Principal (R)' },
      { key: 'interest', header: 'Interest (R)' },
      { key: 'total_repayable', header: 'Total (R)' },
      { key: 'status', header: 'Status' },
      { key: 'borrowed_date', header: 'Borrowed' },
      { key: 'due_date', header: 'Due Date' },
      { key: 'repaid_date', header: 'Repaid' },
    ];
    const rows = formatRowData(loans, 'loans');
    const title = 'Loan History Report';

    if (format === 'pdf') {
      const buffer = await generatePDF(title, columns, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="loan-history.pdf"');
      return res.send(buffer);
    }
    if (format === 'excel') {
      const buffer = await generateExcel(title, columns, rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="loan-history.xlsx"');
      return res.send(Buffer.from(buffer));
    }
    if (format === 'csv') {
      const csv = generateCSV(columns, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="loan-history.csv"');
      return res.send(csv);
    }
    res.json({ data: rows });
  } catch (err) {
    console.error('Download loans error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ────────────────── LOAN STATS ──────────────────
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const [active] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM loans WHERE user_id = ? AND status IN ('active', 'overdue')",
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
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least R1'),
    body('profileId').isInt().withMessage('Profile is required'),
    body('stokvelId').optional().isInt(),
    body('purpose').optional().trim(),
    body('cardId').optional().isInt(),
    validate,
  ],
  async (req, res) => {
    try {
      const { amount, profileId, stokvelId, purpose, cardId, loanTarget } = req.body;

      // Verify profile
      let [profiles] = await pool.query(
        'SELECT id, stokvel_id, saved_amount FROM profiles WHERE id = ? AND user_id = ?',
        [profileId, req.user.id]
      );

      // Fallback: if not found by profile ID, try by stokvelId + userId
      if (profiles.length === 0 && stokvelId) {
        console.warn(`Loan: Profile not found by id=${profileId} for user=${req.user.id}, trying stokvelId=${stokvelId} fallback`);
        [profiles] = await pool.query(
          "SELECT id, stokvel_id, saved_amount FROM profiles WHERE stokvel_id = ? AND user_id = ? AND status = 'active'",
          [stokvelId, req.user.id]
        );
      }

      if (profiles.length === 0) {
        console.error(`No profile found for loan request. user=${req.user.id}, profileId=${profileId}, stokvelId=${stokvelId}`);
        return res.status(404).json({ error: 'Profile not found. Please ensure you are assigned to a stokvel.' });
      }

      const profile = profiles[0];
      const actualProfileId = profile.id;
      
      // Get active loan principal to calculate total contributions
      const [activeLoanRows] = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE profile_id = ? AND status IN ('active', 'overdue')",
        [actualProfileId]
      );
      const activeLoanPrincipal = parseFloat(activeLoanRows[0].total);
      // Limit is 50% of total contributions (current savings + any active loan principal already deducted)
      const totalContributions = parseFloat(profile.saved_amount) + activeLoanPrincipal;
      const maxLoanable = totalContributions * 0.5;

      if (amount > maxLoanable) {
        return res.status(400).json({
          error: `Maximum loanable amount is R${maxLoanable.toFixed(2)} (50% of your total contributions)`,
        });
      }

      // Check if user has at least one card
      const [cards] = await pool.query(
        'SELECT id FROM cards WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );

      if (cards.length === 0) {
        return res.status(400).json({ 
          error: 'No card found. Please add a card before requesting loans.',
          code: 'NO_CARD'
        });
      }

      // Check remaining borrowable amount (allow multiple loans up to 50% of total contributions)
      const remainingToBorrow = maxLoanable - activeLoanPrincipal;

      if (remainingToBorrow <= 0) {
        return res.status(400).json({ error: 'You have already borrowed the maximum allowed amount. Repay existing loans first.' });
      }

      if (amount > remainingToBorrow) {
        return res.status(400).json({
          error: `You can only borrow up to R${remainingToBorrow.toFixed(2)} more. You already have R${activeLoanPrincipal.toFixed(2)} in active loans.`,
        });
      }

      // Block loan if user's total outstanding interest >= R2,000
      const [interestCheck] = await pool.query(
        "SELECT COALESCE(SUM(interest), 0) as totalInterest FROM loans WHERE user_id = ? AND status IN ('active', 'overdue')",
        [req.user.id]
      );
      const currentInterest = parseFloat(interestCheck[0].totalInterest);
      if (currentInterest >= 2000) {
        return res.status(400).json({
          error: `Your outstanding loan interest has reached R${currentInterest.toFixed(2)}. You cannot take out new loans until your interest is below R2,000.`,
        });
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
        `INSERT INTO loans (user_id, profile_id, stokvel_id, amount, interest_rate, interest, total_repayable, status, purpose, borrowed_date, due_date, card_id, loan_target)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
        [req.user.id, actualProfileId, profile.stokvel_id, amount, interestRate, interest, totalRepayable, purpose || null, borrowedDate, dueDate, cardId || null, loanTarget || 'your-target']
      );

      // Notification - loan request submitted
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'info', 'Loan Request Submitted',
          `Your loan request of R${amount.toLocaleString()} from ${stokvel[0].name} has been submitted and is awaiting admin approval.`]
      );

      res.status(201).json({
        message: 'Loan request submitted for approval',
        loan: {
          id: result.insertId,
          amount,
          interest,
          totalRepayable,
          borrowedDate,
          dueDate,
          status: 'pending',
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
    body('paymentMethod').optional().isIn(['card', 'cash']),
    validate,
  ],
  async (req, res) => {
    try {
      const loanId = req.params.id;
      const { cardId, paymentMethod = 'card' } = req.body;

      const [loans] = await pool.query(
        "SELECT * FROM loans WHERE id = ? AND user_id = ? AND status IN ('active', 'overdue', 'pending_repayment')",
        [loanId, req.user.id]
      );

      if (loans.length === 0) {
        return res.status(404).json({ error: 'Active loan not found' });
      }

      const loan = loans[0];

      // Only require card for card payments
      if (paymentMethod === 'card') {
        const [cards] = await pool.query(
          'SELECT id FROM cards WHERE user_id = ? LIMIT 1',
          [req.user.id]
        );

        if (cards.length === 0) {
          return res.status(400).json({ 
            error: 'No card found. Please add a card before repaying loans.',
            code: 'NO_CARD'
          });
        }
      }

      const interest = parseFloat(loan.interest);
      const principal = parseFloat(loan.amount);
      
      // Calculate overdue penalty: 30% of original loan amount per month overdue
      let penaltyAmount = 0;
      if (loan.due_date && new Date(loan.due_date) < new Date()) {
        const msOverdue = new Date() - new Date(loan.due_date);
        const overdueMonths = Math.ceil(msOverdue / (1000 * 60 * 60 * 24 * 30));
        penaltyAmount = principal * 0.3 * overdueMonths;
      }
      
      const totalRepayable = principal + interest + penaltyAmount;

      if (paymentMethod === 'cash') {
        // Cash: mark as pending_repayment, admin confirms at meeting
        await pool.query(
          'UPDATE loans SET status = ? WHERE id = ?',
          ['pending_repayment', loanId]
        );

        // Notification
        const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [req.user.id, 'info', 'Loan Repayment Pending',
            `Your cash repayment of R${totalRepayable.toLocaleString()} for ${stokvel[0].name} has been submitted. It will be confirmed by admin at the next Sunday meeting.`]
        );

        return res.json({ message: 'Cash repayment submitted. Pending admin confirmation.', status: 'pending' });
      }

      // Card payment: mark as repaid immediately
      await pool.query(
        'UPDATE loans SET status = ?, repaid_date = NOW() WHERE id = ?',
        ['repaid', loanId]
      );

      // Record interest + penalty as a confirmed contribution for the interest pot records
      const totalInterestAndPenalty = interest + penaltyAmount;
      const reference = `LOAN-INT-${loanId}-${Date.now()}`;
      await pool.query(
        `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status, confirmed_at, card_id)
         VALUES (?, ?, ?, ?, 'loan_repayment', ?, 'confirmed', NOW(), ?)`,
        [req.user.id, loan.profile_id, loan.stokvel_id, totalInterestAndPenalty, reference, cardId || loan.card_id || null]
      );

      // Return the principal back to saved_amount on repay
      await pool.query(
        'UPDATE profiles SET saved_amount = LEAST(saved_amount + ?, target_amount) WHERE id = ?',
        [principal, loan.profile_id]
      );

      // Notification
      const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);
      const penaltyNote = penaltyAmount > 0 ? ` (includes R${penaltyAmount.toLocaleString()} overdue penalty)` : '';
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'success', 'Loan Repaid',
          `Your loan of R${totalRepayable.toLocaleString()} to ${stokvel[0].name} has been repaid. R${totalInterestAndPenalty.toLocaleString()} interest added to the group pot${penaltyNote}.`]
      );

      res.json({ message: 'Loan repaid successfully', principalReturned: principal, interestPaid: interest, penaltyPaid: penaltyAmount });
    } catch (err) {
      console.error('Repay loan error:', err);
      res.status(500).json({ error: 'Failed to repay loan' });
    }
  }
);

export default router;
