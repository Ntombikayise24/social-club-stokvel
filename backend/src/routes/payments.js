import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);
router.use(updateLastActive);

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE = 'https://api.paystack.co';

// ────────────────── INITIALIZE PAYMENT ──────────────────
router.post(
  '/initialize',
  [
    body('amount').isFloat({ min: 100 }).withMessage('Minimum contribution is R100'),
    body('profileId').isInt().withMessage('Profile is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const { amount, profileId } = req.body;

      // Verify profile belongs to user
      const [profiles] = await pool.query(
        'SELECT id, stokvel_id, user_id FROM profiles WHERE id = ? AND user_id = ?',
        [profileId, req.user.id]
      );
      if (profiles.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Get user email
      const [users] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [req.user.id]);
      const user = users[0];

      const reference = `STK-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

      // Create pending contribution record
      const [result] = await pool.query(
        `INSERT INTO contributions (user_id, profile_id, stokvel_id, amount, payment_method, reference, status)
         VALUES (?, ?, ?, ?, 'paystack', ?, 'pending')`,
        [req.user.id, profileId, profiles[0].stokvel_id, amount, reference]
      );

      // Initialize Paystack transaction
      const paystackRes = await axios.post(
        `${PAYSTACK_BASE}/transaction/initialize`,
        {
          email: user.email,
          amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
          currency: 'ZAR',
          reference,
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`,
          metadata: {
            contributionId: result.insertId,
            profileId,
            stokvelId: profiles[0].stokvel_id,
            userName: user.full_name,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json({
        status: true,
        message: 'Payment initialized',
        data: {
          authorizationUrl: paystackRes.data.data.authorization_url,
          accessCode: paystackRes.data.data.access_code,
          reference: paystackRes.data.data.reference,
          contributionId: result.insertId,
        },
      });
    } catch (err) {
      console.error('Payment init error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to initialize payment' });
    }
  }
);

// ────────────────── VERIFY PAYMENT ──────────────────
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify with Paystack
    const paystackRes = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET()}`,
        },
      }
    );

    const paystackData = paystackRes.data.data;

    if (paystackData.status === 'success') {
      // Update contribution status to confirmed
      await pool.query(
        "UPDATE contributions SET status = 'confirmed' WHERE reference = ?",
        [reference]
      );

      // Get the contribution to update profile saved_amount
      const [contributions] = await pool.query(
        'SELECT id, profile_id, amount, stokvel_id FROM contributions WHERE reference = ?',
        [reference]
      );

      if (contributions.length > 0) {
        const contrib = contributions[0];

        // Update saved amount on profile
        await pool.query(
          'UPDATE profiles SET saved_amount = saved_amount + ? WHERE id = ?',
          [contrib.amount, contrib.profile_id]
        );

        // Create success notification
        const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [contrib.stokvel_id]);
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [
            req.user.id,
            'contribution',
            'Payment Confirmed ✅',
            `Your R${parseFloat(contrib.amount).toLocaleString()} contribution to ${stokvel[0]?.name || 'your stokvel'} has been confirmed.`,
          ]
        );
      }

      res.json({
        status: true,
        message: 'Payment verified successfully',
        data: {
          reference,
          amount: paystackData.amount / 100,
          status: 'success',
        },
      });
    } else {
      // Payment failed - update contribution
      await pool.query(
        "UPDATE contributions SET status = 'failed' WHERE reference = ?",
        [reference]
      );

      res.json({
        status: false,
        message: 'Payment was not successful',
        data: {
          reference,
          status: paystackData.status,
        },
      });
    }
  } catch (err) {
    console.error('Payment verify error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ────────────────── PAYSTACK WEBHOOK ──────────────────
// This handles automatic notifications from Paystack
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const crypto = await import('crypto');
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET())
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference } = event.data;

      // Mark contribution as confirmed
      const [contributions] = await pool.query(
        "SELECT id, profile_id, amount, stokvel_id, user_id FROM contributions WHERE reference = ? AND status = 'pending'",
        [reference]
      );

      if (contributions.length > 0) {
        const contrib = contributions[0];

        await pool.query("UPDATE contributions SET status = 'confirmed' WHERE id = ?", [contrib.id]);
        await pool.query('UPDATE profiles SET saved_amount = saved_amount + ? WHERE id = ?', [contrib.amount, contrib.profile_id]);

        const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [contrib.stokvel_id]);
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [contrib.user_id, 'contribution', 'Payment Confirmed ✅', `Your R${parseFloat(contrib.amount).toLocaleString()} contribution to ${stokvel[0]?.name || 'your stokvel'} has been confirmed.`]
        );
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

export default router;
