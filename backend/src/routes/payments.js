import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, updateLastActive } from '../middleware/auth.js';
import pool from '../database/connection.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE = 'https://api.paystack.co';

// ────────────────── PAYSTACK WEBHOOK (before auth middleware) ──────────────────
// Paystack sends webhooks server-side without JWT, so this must be unprotected
router.post('/webhook', async (req, res) => {
  try {
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

      const [contributions] = await pool.query(
        "SELECT id, profile_id, amount, stokvel_id, user_id FROM contributions WHERE reference = ? AND status = 'pending'",
        [reference]
      );

      if (contributions.length > 0) {
        const contrib = contributions[0];

        await pool.query(
          "UPDATE contributions SET status = 'confirmed', confirmed_at = NOW() WHERE id = ?",
          [contrib.id]
        );
        await pool.query(
          'UPDATE profiles SET saved_amount = saved_amount + ? WHERE id = ?',
          [contrib.amount, contrib.profile_id]
        );

        const [stokvel] = await pool.query('SELECT name FROM stokvels WHERE id = ?', [contrib.stokvel_id]);
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [
            contrib.user_id,
            'contribution',
            'Payment Confirmed ✅',
            `Your R${parseFloat(contrib.amount).toLocaleString()} contribution to ${stokvel[0]?.name || 'your stokvel'} has been confirmed.`,
          ]
        );
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

// ── Auth middleware for all routes below ──
router.use(authenticate);
router.use(updateLastActive);

// ────────────────── INITIALIZE PAYMENT ──────────────────
router.post(
  '/initialize',
  [
    body('amount').isFloat({ min: 100 }).withMessage('Minimum contribution is R100'),
    body('profileId').isInt().withMessage('Profile is required'),
    body('stokvelId').optional().isInt(),
    validate,
  ],
  async (req, res) => {
    try {
      const { amount, profileId, stokvelId } = req.body;

      // Verify profile belongs to user
      let [profiles] = await pool.query(
        'SELECT id, stokvel_id, user_id, target_amount, saved_amount FROM profiles WHERE id = ? AND user_id = ?',
        [profileId, req.user.id]
      );

      // Fallback: if not found by profile ID, try by stokvelId + userId
      if (profiles.length === 0 && stokvelId) {
        console.warn(`Profile not found by id=${profileId} for user=${req.user.id}, trying stokvelId=${stokvelId} fallback`);
        [profiles] = await pool.query(
          "SELECT id, stokvel_id, user_id, target_amount, saved_amount FROM profiles WHERE stokvel_id = ? AND user_id = ? AND status = 'active'",
          [stokvelId, req.user.id]
        );
      }

      // Fallback: try finding ANY active profile for this user
      if (profiles.length === 0) {
        console.warn(`Profile not found for user=${req.user.id}, profileId=${profileId}, stokvelId=${stokvelId}. Trying any active profile...`);
        [profiles] = await pool.query(
          "SELECT id, stokvel_id, user_id, target_amount, saved_amount FROM profiles WHERE user_id = ? AND status = 'active' LIMIT 1",
          [req.user.id]
        );
      }

      if (profiles.length === 0) {
        console.error(`No profile found at all for user=${req.user.id}. profileId=${profileId}, stokvelId=${stokvelId}`);
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

      // Check if user has at least one card
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
      const paystackError = err.response?.data?.message || err.message;
      res.status(err.response?.status || 500).json({ 
        error: `Payment initialization failed: ${paystackError}`,
        details: err.response?.data?.data || null
      });
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
        "UPDATE contributions SET status = 'confirmed', confirmed_at = NOW() WHERE reference = ?",
        [reference]
      );

      // Get the contribution to update profile saved_amount
      const [contributions] = await pool.query(
        'SELECT id, profile_id, amount, stokvel_id FROM contributions WHERE reference = ?',
        [reference]
      );

      if (contributions.length > 0) {
        const contrib = contributions[0];

        // Cap saved_amount so it never exceeds target_amount
        const [profileRows] = await pool.query(
          'SELECT target_amount, saved_amount FROM profiles WHERE id = ?',
          [contrib.profile_id]
        );
        const profileTarget = parseFloat(profileRows[0].target_amount);
        const currentSaved = parseFloat(profileRows[0].saved_amount);
        const addAmount = Math.min(parseFloat(contrib.amount), Math.max(profileTarget - currentSaved, 0));

        // Update saved amount on profile (capped at target)
        await pool.query(
          'UPDATE profiles SET saved_amount = LEAST(saved_amount + ?, target_amount) WHERE id = ?',
          [addAmount, contrib.profile_id]
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
        "UPDATE contributions SET status = 'deleted', deleted_at = NOW() WHERE reference = ?",
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

export default router;
