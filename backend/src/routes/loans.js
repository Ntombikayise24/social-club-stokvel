import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';
import { generatePDF, generateExcel, generateCSV, formatRowData } from '../utils/reports.js';
import { sendLoanApprovalEmail } from '../utils/email.js';
import axios from 'axios';

const router = Router();

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE = 'https://api.paystack.co';

router.use(authenticate);
router.use(updateLastActive);

// ────────────────── LIST LOANS ──────────────────
router.get('/', async (req, res) => {
  try {
    const { profileId, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
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

    // Mark overdue loans in the response (status update is handled by scheduled checks)
    const overdueIds = loans
      .filter(l => l.status === 'active' && l.due_date && new Date(l.due_date) < new Date())
      .map(l => l.id);
    if (overdueIds.length > 0) {
      // Update overdue status in background — does not affect current response
      pool.query('UPDATE loans SET status = ? WHERE id IN (?)', ['overdue', overdueIds]).catch(() => {});
    }

    res.json({
      data: loans.map(l => {
        const daysRemaining = l.due_date
          ? Math.max(0, Math.ceil((new Date(l.due_date) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0;

        // Calculate overdue penalty: 30% of remaining principal per month overdue
        let overdueMonths = 0;
        let penaltyAmount = 0;
        const remainingPrincipal = parseFloat(l.amount) - parseFloat(l.amount_paid || 0);
        let currentTotalRepayable = parseFloat(l.total_repayable);
        if (l.due_date && (l.status === 'active' || l.status === 'overdue') && new Date(l.due_date) < new Date()) {
          const msOverdue = new Date() - new Date(l.due_date);
          overdueMonths = Math.ceil(msOverdue / (1000 * 60 * 60 * 24 * 28)); // each 28-day period counts
          penaltyAmount = remainingPrincipal * 0.3 * overdueMonths;
          currentTotalRepayable = remainingPrincipal + parseFloat(l.interest) + penaltyAmount;
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
          repaymentType: l.repayment_type || null,
          amountPaid: parseFloat(l.amount_paid || 0),
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
    body('amount').isFloat({ min: 100 }).withMessage('Minimum loan amount is R100'),
    body('profileId').isInt().withMessage('Profile is required'),
    body('stokvelId').optional().isInt(),
    body('purpose').optional().trim(),
    body('cardId').optional().isInt(),
    validate,
  ],
  async (req, res) => {
    try {
      const { amount, profileId, stokvelId, purpose, cardId, loanTarget } = req.body;

      // Block loans on madala side
      if (loanTarget === 'madala-side') {
        return res.status(400).json({ error: 'Loans are not allowed on Madala Side. You can only borrow against Your Target.' });
      }

      // Enforce minimum loan amount of R100
      if (amount < 100) {
        return res.status(400).json({ error: 'Minimum loan amount is R100.' });
      }

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
      dueDate.setDate(dueDate.getDate() + 28);

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
    body('repaymentType').optional().isIn(['full', 'blk', 'installment', 'ftp']),
    body('installmentAmount').optional().isFloat({ min: 1 }),
    validate,
  ],
  async (req, res) => {
    try {
      const loanId = req.params.id;
      const { cardId, paymentMethod = 'card', repaymentType = 'full', installmentAmount } = req.body;

      const [loans] = await pool.query(
        "SELECT * FROM loans WHERE id = ? AND user_id = ? AND status IN ('active', 'overdue', 'pending_repayment', 'blk', 'ftp')",
        [loanId, req.user.id]
      );

      if (loans.length === 0) {
        return res.status(404).json({ error: 'Active loan not found' });
      }

      const loan = loans[0];
      const interest = parseFloat(loan.interest);
      const principal = parseFloat(loan.amount);
      const amountPaid = parseFloat(loan.amount_paid || 0);
      const remainingPrincipal = principal - amountPaid;

      // Only require card for card payments
      if (paymentMethod === 'card') {
        const [cards] = await pool.query(
          'SELECT id FROM cards WHERE user_id = ? LIMIT 1',
          [req.user.id]
        );
        if (cards.length === 0) {
          return res.status(400).json({ error: 'No card found. Please add a card before repaying loans.', code: 'NO_CARD' });
        }
      }

      const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);

      // ── BLK: Pay only interest to renew for 28 more days ──
      if (repaymentType === 'blk') {
        const interestPayment = remainingPrincipal * 0.3;

        // Record interest payment as contribution
        const reference = `LOAN-BLK-${loanId}-${Date.now()}`;
        await pool.query(
          `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status, confirmed_at, card_id)
           VALUES (?, ?, ?, ?, 'loan_repayment', ?, 'confirmed', NOW(), ?)`,
          [req.user.id, loan.profile_id, loan.stokvel_id, interestPayment, reference, cardId || loan.card_id || null]
        );

        // Extend due date by 28 days from now
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 28);

        await pool.query(
          'UPDATE loans SET status = ?, repayment_type = ?, due_date = ?, interest = ?, total_repayable = ? WHERE id = ?',
          ['blk', 'blk', newDueDate, interestPayment, remainingPrincipal, loanId]
        );

        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [req.user.id, 'info', 'BLK Renewal Applied',
            `You paid R${interestPayment.toFixed(2)} interest to renew your R${remainingPrincipal.toFixed(2)} loan from ${stokvel[0].name} for 28 more days.`]
        );

        return res.json({
          message: 'BLK applied. Loan renewed for 28 days.',
          interestPaid: interestPayment,
          newDueDate,
          remainingPrincipal
        });
      }

      // ── FTP: Failure To Pay - 30% charged monthly ──
      if (repaymentType === 'ftp') {
        await pool.query(
          'UPDATE loans SET status = ?, repayment_type = ? WHERE id = ?',
          ['ftp', 'ftp', loanId]
        );

        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [req.user.id, 'warning', 'FTP Status Applied',
            `Your loan of R${remainingPrincipal.toFixed(2)} from ${stokvel[0].name} is now marked as Failure To Pay (FTP). 30% interest will be charged monthly until the loan is fully repaid.`]
        );

        return res.json({
          message: 'Loan marked as FTP. 30% interest will be charged monthly.',
          remainingPrincipal,
          monthlyCharge: remainingPrincipal * 0.3
        });
      }

      // ── Card payments (full/installment): Initialize Paystack ──
      if (paymentMethod === 'card' && (repaymentType === 'full' || repaymentType === 'installment')) {
        // Validate installment amount
        if (repaymentType === 'installment') {
          if (!installmentAmount || installmentAmount <= 0) {
            return res.status(400).json({ error: 'Please enter a valid installment amount.' });
          }
          if (installmentAmount > remainingPrincipal + interest) {
            return res.status(400).json({ error: `Installment amount exceeds remaining balance of R${(remainingPrincipal + interest).toFixed(2)}.` });
          }
        }

        // Check card exists
        const [cards] = await pool.query('SELECT id FROM cards WHERE user_id = ? LIMIT 1', [req.user.id]);
        if (cards.length === 0) {
          return res.status(400).json({ error: 'No card found. Please add a card before repaying loans.', code: 'NO_CARD' });
        }

        // Calculate charge amount
        let chargeAmount;
        if (repaymentType === 'installment') {
          chargeAmount = installmentAmount;
        } else {
          // Full repayment
          let penaltyAmount = 0;
          if (loan.due_date && new Date(loan.due_date) < new Date()) {
            const msOverdue = new Date() - new Date(loan.due_date);
            const overdueMonths = Math.ceil(msOverdue / (1000 * 60 * 60 * 24 * 28));
            penaltyAmount = remainingPrincipal * 0.3 * overdueMonths;
          }
          chargeAmount = remainingPrincipal + interest + penaltyAmount;
        }

        // Get user email
        const [users] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [req.user.id]);
        const reference = `LOAN-${repaymentType.toUpperCase()}-${loanId}-${Date.now()}`;

        try {
          const paystackRes = await axios.post(
            `${PAYSTACK_BASE}/transaction/initialize`,
            {
              email: users[0].email,
              amount: Math.round(chargeAmount * 100),
              currency: 'ZAR',
              reference,
              callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/loans?profile=${loan.profile_id}`,
              metadata: {
                loanId: parseInt(loanId),
                repaymentType,
                installmentAmount: installmentAmount || null,
                cardId: cardId || loan.card_id || null,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET()}`,
                'Content-Type': 'application/json',
              },
            }
          );

          return res.json({
            requiresPayment: true,
            message: 'Payment initialized',
            accessCode: paystackRes.data.data.access_code,
            reference: paystackRes.data.data.reference,
            chargeAmount,
          });
        } catch (paystackErr) {
          console.error('Loan Paystack init error:', paystackErr.response?.data || paystackErr.message);
          return res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
        }
      }

      // ── PAY INSTALLMENT (cash): Partial payment ──
      if (repaymentType === 'installment') {
        if (!installmentAmount || installmentAmount <= 0) {
          return res.status(400).json({ error: 'Please enter a valid installment amount.' });
        }
        if (installmentAmount > remainingPrincipal + interest) {
          return res.status(400).json({ error: `Installment amount exceeds remaining balance of R${(remainingPrincipal + interest).toFixed(2)}.` });
        }

        const newAmountPaid = amountPaid + installmentAmount;
        const fullyPaid = newAmountPaid >= principal + interest;

        // Record installment as contribution
        const reference = `LOAN-INST-${loanId}-${Date.now()}`;
        await pool.query(
          `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status, confirmed_at, card_id)
           VALUES (?, ?, ?, ?, 'loan_repayment', ?, 'confirmed', NOW(), ?)`,
          [req.user.id, loan.profile_id, loan.stokvel_id, installmentAmount, reference, cardId || loan.card_id || null]
        );

        if (fullyPaid) {
          // Fully repaid via installments
          await pool.query(
            'UPDATE loans SET status = ?, repaid_date = NOW(), repayment_type = ?, amount_paid = ? WHERE id = ?',
            ['repaid', 'installment', newAmountPaid, loanId]
          );

          // Return principal to saved_amount
          await pool.query(
            'UPDATE profiles SET saved_amount = LEAST(saved_amount + ?, target_amount) WHERE id = ?',
            [principal, loan.profile_id]
          );

          await pool.query(
            'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
            [req.user.id, 'success', 'Loan Fully Repaid',
              `Your loan from ${stokvel[0].name} has been fully repaid via installments. Total paid: R${newAmountPaid.toFixed(2)}.`]
          );

          return res.json({ message: 'Loan fully repaid via installments.', amountPaid: newAmountPaid, status: 'repaid' });
        }

        // Partial payment - extend due date by 28 days if within current period
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 28);

        await pool.query(
          'UPDATE loans SET repayment_type = ?, amount_paid = ?, due_date = ? WHERE id = ?',
          ['installment', newAmountPaid, newDueDate, loanId]
        );

        const newRemaining = principal + interest - newAmountPaid;
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [req.user.id, 'info', 'Installment Payment Received',
            `R${installmentAmount.toFixed(2)} installment received for your ${stokvel[0].name} loan. Remaining: R${newRemaining.toFixed(2)}. If not fully repaid within 28 days, 30% additional interest will be charged.`]
        );

        return res.json({
          message: 'Installment payment recorded.',
          installmentPaid: installmentAmount,
          totalPaid: newAmountPaid,
          remaining: newRemaining,
          newDueDate
        });
      }

      // ── FULL REPAYMENT (original logic) ──
      // Calculate overdue penalty: 30% of original loan amount per month overdue
      let penaltyAmount = 0;
      if (loan.due_date && new Date(loan.due_date) < new Date()) {
        const msOverdue = new Date() - new Date(loan.due_date);
        const overdueMonths = Math.ceil(msOverdue / (1000 * 60 * 60 * 24 * 28));
        penaltyAmount = remainingPrincipal * 0.3 * overdueMonths;
      }
      
      const totalRepayable = remainingPrincipal + interest + penaltyAmount;

      if (paymentMethod === 'cash') {
        await pool.query(
          'UPDATE loans SET status = ? WHERE id = ?',
          ['pending_repayment', loanId]
        );

        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [req.user.id, 'info', 'Loan Repayment Pending',
            `Your cash repayment of R${totalRepayable.toLocaleString()} for ${stokvel[0].name} has been submitted. It will be confirmed by admin at the next Sunday meeting.`]
        );

        return res.json({ message: 'Cash repayment submitted. Pending admin confirmation.', status: 'pending' });
      }

      // Card payment: mark as repaid immediately
      await pool.query(
        'UPDATE loans SET status = ?, repaid_date = NOW(), repayment_type = ?, amount_paid = ? WHERE id = ?',
        ['repaid', 'full', principal + interest, loanId]
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
        [remainingPrincipal, loan.profile_id]
      );

      const penaltyNote = penaltyAmount > 0 ? ` (includes R${penaltyAmount.toLocaleString()} overdue penalty)` : '';
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'success', 'Loan Repaid',
          `Your loan of R${totalRepayable.toLocaleString()} to ${stokvel[0].name} has been repaid. R${totalInterestAndPenalty.toLocaleString()} interest added to the group pot${penaltyNote}.`]
      );

      res.json({ message: 'Loan repaid successfully', principalReturned: remainingPrincipal, interestPaid: interest, penaltyPaid: penaltyAmount });
    } catch (err) {
      console.error('Repay loan error:', err);
      res.status(500).json({ error: 'Failed to repay loan' });
    }
  }
);

// ────────────────── VERIFY LOAN REPAYMENT (after Paystack payment) ──────────────────
router.post('/:id/repay/verify', async (req, res) => {
  try {
    const loanId = req.params.id;
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    // Verify with Paystack
    const paystackRes = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` } }
    );

    const paystackData = paystackRes.data.data;

    if (paystackData.status !== 'success') {
      return res.status(400).json({ error: 'Payment was not successful', paymentStatus: paystackData.status });
    }

    const metadata = paystackData.metadata || {};
    const repaymentType = metadata.repaymentType || 'full';
    const installmentAmount = metadata.installmentAmount ? parseFloat(metadata.installmentAmount) : null;
    const cardId = metadata.cardId;

    // Fetch loan
    const [loans] = await pool.query(
      "SELECT * FROM loans WHERE id = ? AND user_id = ? AND status IN ('active', 'overdue', 'pending_repayment', 'blk', 'ftp')",
      [loanId, req.user.id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ error: 'Active loan not found' });
    }

    const loan = loans[0];
    const interest = parseFloat(loan.interest);
    const principal = parseFloat(loan.amount);
    const amountPaid = parseFloat(loan.amount_paid || 0);
    const remainingPrincipal = principal - amountPaid;

    const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [loan.stokvel_id]);

    // ── Process installment ──
    if (repaymentType === 'installment' && installmentAmount) {
      const newAmountPaid = amountPaid + installmentAmount;
      const fullyPaid = newAmountPaid >= principal + interest;

      // Record installment as contribution
      await pool.query(
        `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status, confirmed_at, card_id)
         VALUES (?, ?, ?, ?, 'loan_repayment', ?, 'confirmed', NOW(), ?)`,
        [req.user.id, loan.profile_id, loan.stokvel_id, installmentAmount, reference, cardId || loan.card_id || null]
      );

      if (fullyPaid) {
        await pool.query(
          'UPDATE loans SET status = ?, repaid_date = NOW(), repayment_type = ?, amount_paid = ? WHERE id = ?',
          ['repaid', 'installment', newAmountPaid, loanId]
        );

        await pool.query(
          'UPDATE profiles SET saved_amount = LEAST(saved_amount + ?, target_amount) WHERE id = ?',
          [principal, loan.profile_id]
        );

        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [req.user.id, 'success', 'Loan Fully Repaid \u2705',
            `Your loan from ${stokvel[0]?.name} has been fully repaid via installments. Total paid: R${newAmountPaid.toFixed(2)}.`]
        );

        return res.json({ message: 'Loan fully repaid via installments.', amountPaid: newAmountPaid, status: 'repaid' });
      }

      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 28);

      await pool.query(
        'UPDATE loans SET repayment_type = ?, amount_paid = ?, due_date = ? WHERE id = ?',
        ['installment', newAmountPaid, newDueDate, loanId]
      );

      const newRemaining = principal + interest - newAmountPaid;
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [req.user.id, 'info', 'Installment Payment Confirmed \u2705',
          `R${installmentAmount.toFixed(2)} installment confirmed for your ${stokvel[0]?.name} loan. Remaining: R${newRemaining.toFixed(2)}.`]
      );

      return res.json({
        message: 'Installment payment confirmed.',
        installmentPaid: installmentAmount,
        totalPaid: newAmountPaid,
        remaining: newRemaining,
        newDueDate,
      });
    }

    // ── Process full repayment ──
    let penaltyAmount = 0;
    if (loan.due_date && new Date(loan.due_date) < new Date()) {
      const msOverdue = new Date() - new Date(loan.due_date);
      const overdueMonths = Math.ceil(msOverdue / (1000 * 60 * 60 * 24 * 28));
      penaltyAmount = remainingPrincipal * 0.3 * overdueMonths;
    }
    const totalRepayable = remainingPrincipal + interest + penaltyAmount;

    await pool.query(
      'UPDATE loans SET status = ?, repaid_date = NOW(), repayment_type = ?, amount_paid = ? WHERE id = ?',
      ['repaid', 'full', principal + interest, loanId]
    );

    const totalInterestAndPenalty = interest + penaltyAmount;
    await pool.query(
      `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status, confirmed_at, card_id)
       VALUES (?, ?, ?, ?, 'loan_repayment', ?, 'confirmed', NOW(), ?)`,
      [req.user.id, loan.profile_id, loan.stokvel_id, totalInterestAndPenalty, reference, cardId || loan.card_id || null]
    );

    await pool.query(
      'UPDATE profiles SET saved_amount = LEAST(saved_amount + ?, target_amount) WHERE id = ?',
      [remainingPrincipal, loan.profile_id]
    );

    const penaltyNote = penaltyAmount > 0 ? ` (includes R${penaltyAmount.toLocaleString()} overdue penalty)` : '';
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [req.user.id, 'success', 'Loan Repaid \u2705',
        `Your loan of R${totalRepayable.toLocaleString()} to ${stokvel[0]?.name} has been repaid. R${totalInterestAndPenalty.toLocaleString()} interest added to the group pot${penaltyNote}.`]
    );

    res.json({ message: 'Loan repaid successfully', principalReturned: remainingPrincipal, interestPaid: interest, penaltyPaid: penaltyAmount });
  } catch (err) {
    console.error('Verify repayment error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to verify repayment' });
  }
});

export default router;
