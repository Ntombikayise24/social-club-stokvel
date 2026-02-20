const axios = require('axios');
const PaymentTransaction = require('../models/PaymentTransaction');
const Contribution = require('../models/Contribution');
const Notification = require('../models/Notification');
const { generateTransactionReference } = require('../utils/helpers');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

/**
 * Initialize payment transaction
 * Creates a payment in Paystack and returns authorization URL
 */
const initializePayment = async (req, res) => {
    try {
        const { membershipId, amount, email } = req.body;
        const userId = req.user?.id;

        // Validate inputs
        if (!membershipId || !amount || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide membershipId, amount, and email'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Get membership to find stokvel
        const Membership = require('../models/Membership');
        const membership = await Membership.findById(membershipId);

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        // Generate reference
        const reference = generateTransactionReference();

        // Create payment transaction record
        const transaction = await PaymentTransaction.create({
            userId,
            stokvelId: membership.stokvelId,
            membershipId,
            amount,
            paymentMethod: 'card',
            reference,
            paystackReference: null,
            status: 'pending'
        });

        // Amount in kobo (Paystack uses smallest currency unit)
        const amountInKobo = Math.round(amount * 100);

        // Initialize Paystack payment
        const paystackResponse = await axios.post(
            `${PAYSTACK_API_URL}/transaction/initialize`,
            {
                email,
                amount: amountInKobo,
                reference,
                metadata: {
                    user_id: userId,
                    membership_id: membershipId,
                    stokvel_id: membership.stokvelId,
                    transaction_id: transaction.id,
                    description: `STOCKVEL Contribution - ${amount} ZAR`
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!paystackResponse.data.status) {
            return res.status(400).json({
                success: false,
                message: 'Failed to initialize payment with Paystack'
            });
        }

        // Update transaction with Paystack reference
        await PaymentTransaction.findById(transaction.id);

        return res.status(200).json({
            success: true,
            message: 'Payment initialized successfully',
            data: {
                authorization_url: paystackResponse.data.data.authorization_url,
                access_code: paystackResponse.data.data.access_code,
                reference: paystackResponse.data.data.reference,
                transaction_id: transaction.id
            }
        });
    } catch (error) {
        console.error('Payment initialization error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error initializing payment: ' + error.message
        });
    }
};

/**
 * Verify payment with Paystack
 * Called after user completes payment
 */
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.body;
        const userId = req.user?.id;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Payment reference is required'
            });
        }

        // Find transaction
        const transaction = await PaymentTransaction.findByReference(reference);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Verify with Paystack
        const paystackResponse = await axios.get(
            `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const paymentData = paystackResponse.data.data;

        if (!paystackResponse.data.status) {
            // Payment verification failed
            await PaymentTransaction.updateStatus(transaction.id, 'failed');
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        if (paymentData.status !== 'success') {
            // Payment was not successful
            await PaymentTransaction.updateStatus(transaction.id, 'failed');
            return res.status(400).json({
                success: false,
                message: 'Payment was not successful. Status: ' + paymentData.status
            });
        }

        // Payment successful - update transaction status
        await PaymentTransaction.updateStatus(transaction.id, 'completed');

        // Create contribution record
        const contribution = await Contribution.create({
            userId: transaction.user_id,
            stokvelId: transaction.stokvel_id,
            membershipId: transaction.membership_id,
            amount: transaction.amount,
            paymentMethod: 'card',
            reference: reference,
            status: 'confirmed'
        });

        // Create notification
        await Notification.create({
            userId: transaction.user_id,
            message: `Payment of R${transaction.amount.toFixed(2)} confirmed for STOCKVEL contribution`,
            type: 'contribution',
            related_id: contribution.id,
            related_model: 'Contribution'
        });

        return res.status(200).json({
            success: true,
            message: 'Payment verified and contribution recorded',
            data: {
                transaction_id: transaction.id,
                contribution_id: contribution.id,
                amount: transaction.amount,
                reference: reference,
                status: 'completed'
            }
        });
    } catch (error) {
        console.error('Payment verification error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error verifying payment: ' + error.message
        });
    }
};

/**
 * Get payment history for user
 */
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user?.id;

        const transactions = await PaymentTransaction.findByUser(userId);

        return res.status(200).json({
            success: true,
            message: 'Payment history retrieved',
            data: transactions
        });
    } catch (error) {
        console.error('Get payment history error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving payment history: ' + error.message
        });
    }
};

/**
 * Get payment stats for stokvel (admin only)
 */
const getPaymentStats = async (req, res) => {
    try {
        const { stokvelId } = req.params;

        const stats = await PaymentTransaction.getStats(stokvelId);

        return res.status(200).json({
            success: true,
            message: 'Payment stats retrieved',
            data: stats
        });
    } catch (error) {
        console.error('Get payment stats error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving payment stats: ' + error.message
        });
    }
};

/**
 * Get transaction details
 */
const getTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await PaymentTransaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction retrieved',
            data: transaction
        });
    } catch (error) {
        console.error('Get transaction error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving transaction: ' + error.message
        });
    }
};

module.exports = {
    initializePayment,
    verifyPayment,
    getPaymentHistory,
    getPaymentStats,
    getTransaction
};
