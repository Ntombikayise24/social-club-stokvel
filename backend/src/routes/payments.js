const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    initializePayment,
    verifyPayment,
    getPaymentHistory,
    getPaymentStats,
    getTransaction
} = require('../controllers/paymentController');
const { handlePaystackWebhook } = require('../utils/webhookHandler');

/**
 * POST /api/payments/initialize
 * Initialize a Paystack payment transaction
 * Body: { membershipId, amount, email }
 */
router.post('/initialize', authenticate, initializePayment);

/**
 * POST /api/payments/verify
 * Verify payment with Paystack
 * Body: { reference }
 */
router.post('/verify', authenticate, verifyPayment);

/**
 * GET /api/payments/history
 * Get payment history for current user
 */
router.get('/history', authenticate, getPaymentHistory);

/**
 * GET /api/payments/transaction/:transactionId
 * Get transaction details
 */
router.get('/transaction/:transactionId', authenticate, getTransaction);

/**
 * GET /api/payments/stats/:stokvelId
 * Get payment stats for a stokvel (admin only)
 */
router.get('/stats/:stokvelId', authenticate, getPaymentStats);

/**
 * POST /api/payments/webhook
 * Paystack webhook endpoint (no authentication needed)
 */
router.post('/webhook', handlePaystackWebhook);

module.exports = router;
