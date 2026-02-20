const crypto = require('crypto');
const PaymentTransaction = require('../models/PaymentTransaction');
const Contribution = require('../models/Contribution');
const Notification = require('../models/Notification');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify webhook signature from Paystack
 */
const verifyWebhookSignature = (req) => {
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
    return hash === req.headers['x-paystack-signature'];
};

/**
 * Handle Paystack webhook events
 */
const handlePaystackWebhook = async (req, res) => {
    try {
        // Verify webhook signature
        if (!verifyWebhookSignature(req)) {
            console.warn('Invalid Paystack webhook signature');
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const event = req.body;

        // Handle different event types
        switch (event.event) {
            case 'charge.success':
                await handleChargeSuccess(event.data);
                break;
            case 'charge.failed':
                await handleChargeFailed(event.data);
                break;
            case 'transfer.success':
                await handleTransferSuccess(event.data);
                break;
            case 'transfer.failed':
                await handleTransferFailed(event.data);
                break;
            default:
                console.log(`Unhandled event: ${event.event}`);
        }

        // Acknowledge receipt of webhook
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ success: false, message: 'Webhook processing error' });
    }
};

/**
 * Handle successful charge event
 */
const handleChargeSuccess = async (data) => {
    try {
        const reference = data.reference;
        const amount = data.amount / 100; // Convert from kobo to ZAR

        // Find transaction
        const transaction = await PaymentTransaction.findByReference(reference);

        if (!transaction) {
            console.log(`Transaction not found for reference: ${reference}`);
            return;
        }

        // Update transaction status
        await PaymentTransaction.updateStatus(transaction.id, 'completed');

        // Create or update contribution
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
            message: `✅ Payment of R${transaction.amount.toFixed(2)} confirmed! Your contribution has been recorded.`,
            type: 'contribution',
            related_id: contribution.id,
            related_model: 'Contribution'
        });

        console.log(`✅ Payment successful: ${reference}`);
    } catch (error) {
        console.error('Error handling charge success:', error.message);
    }
};

/**
 * Handle failed charge event
 */
const handleChargeFailed = async (data) => {
    try {
        const reference = data.reference;

        // Find transaction
        const transaction = await PaymentTransaction.findByReference(reference);

        if (!transaction) {
            console.log(`Transaction not found for reference: ${reference}`);
            return;
        }

        // Update transaction status
        await PaymentTransaction.updateStatus(transaction.id, 'failed');

        // Create notification
        await Notification.create({
            userId: transaction.user_id,
            message: `❌ Payment failed for reference ${reference}. Please try again.`,
            type: 'system',
            related_id: transaction.id
        });

        console.log(`❌ Payment failed: ${reference}`);
    } catch (error) {
        console.error('Error handling charge failed:', error.message);
    }
};

/**
 * Handle successful transfer event (settlement)
 */
const handleTransferSuccess = async (data) => {
    try {
        console.log(`✅ Transfer successful: ${data.reference}`);
        // Implement settlement logic here if needed
    } catch (error) {
        console.error('Error handling transfer success:', error.message);
    }
};

/**
 * Handle failed transfer event
 */
const handleTransferFailed = async (data) => {
    try {
        console.log(`❌ Transfer failed: ${data.reference}`);
        // Implement settlement failure logic here if needed
    } catch (error) {
        console.error('Error handling transfer failed:', error.message);
    }
};

module.exports = {
    handlePaystackWebhook,
    verifyWebhookSignature
};
