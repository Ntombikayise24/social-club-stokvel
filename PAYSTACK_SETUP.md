# Paystack Integration Setup Guide

This document explains how to set up Paystack payment integration for the STOCKVEL application.

## Prerequisites

- Paystack account (free sign-up at https://paystack.com)
- Backend and Frontend environments configured

## Step 1: Create Paystack Account

1. Visit https://paystack.com/signup
2. Create your account (select South Africa as your country)
3. Access your Dashboard

## Step 2: Get Your API Keys

1. Go to **Settings** → **API Keys & Webhooks**
2. You'll see two types of keys:
   - **Public Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

⚠️ **Important**: Keep your Secret Key private! Never commit it to version control.

## Step 3: Configure Environment Variables

### Backend (.env file)

Create or update the `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=social_club

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
```

### Frontend (.env.local file)

Create or update the `.env.local` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

## Step 4: Configure Paystack Webhook

1. In Paystack Dashboard, go to **Settings** → **API Keys & Webhooks**
2. Scroll to "Webhooks" section
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/payments/webhook
   ```
   
   For local development with ngrok:
   ```
   https://your-ngrok-url.ngrok.io/api/payments/webhook
   ```

4. Select events to monitor:
   - ✅ charge.success
   - ✅ charge.failed
   - ✅ transfer.success
   - ✅ transfer.failed

5. Click **Save**

## Step 5: Install Required Dependencies

### Backend

```bash
cd backend
npm install axios
```

### Frontend

```bash
npm install @paystack/inline-js
# or
npm install paystack-react
```

## Step 6: Database Setup

The payment transactions table will be automatically created when the server starts.

### Payment Transactions Table Structure

```sql
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stokvel_id INT NOT NULL,
    membership_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('card', 'bank', 'cash', 'mobile') DEFAULT 'card',
    reference VARCHAR(100) UNIQUE,
    paystack_reference VARCHAR(100) UNIQUE,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_paystack_ref (paystack_reference)
);
```

## Step 7: Testing Payment Flow

### Test Credentials

Paystack provides test cards for testing:

**Success Scenario:**
- Card Number: `4084084084084081`
- Expiry: `12/25`
- CVV: `123`
- OTP: `123456`

**Failure Scenario:**
- Card Number: `5555555555554444`
- Expiry: `12/25`
- CVV: `123`

### Testing Steps

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Navigate to Payment:**
   - Go to Dashboard
   - Select a Stokvel
   - Click on "Make Contribution"
   - Fill in the payment form

4. **Complete Payment:**
   - You'll be redirected to Paystack payment page
   - Enter test card credentials
   - Complete the payment
   - System will verify and record the contribution

## API Endpoints

### Initialize Payment
```
POST /api/payments/initialize
Headers: Authorization: Bearer <token>
Body: {
  "membershipId": 1,
  "amount": 1000,
  "email": "user@example.com"
}
Response: {
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "some_code",
    "reference": "TRX-XXXXX",
    "transaction_id": 1
  }
}
```

### Verify Payment
```
POST /api/payments/verify
Headers: Authorization: Bearer <token>
Body: {
  "reference": "TRX-XXXXX"
}
Response: {
  "success": true,
  "data": {
    "transaction_id": 1,
    "contribution_id": 1,
    "amount": 1000,
    "reference": "TRX-XXXXX",
    "status": "completed"
  }
}
```

### Get Payment History
```
GET /api/payments/history
Headers: Authorization: Bearer <token>
Response: [
  {
    "id": 1,
    "user_id": 1,
    "amount": 1000,
    "status": "completed",
    "created_at": "2026-02-20T10:30:00Z"
  }
]
```

## Webhook Flow

The system automatically handles Paystack webhooks:

1. **Payment Success**: 
   - Status updated to `completed`
   - Contribution record created
   - User notification sent

2. **Payment Failed**:
   - Status updated to `failed`
   - User notification sent with retry option

## Security Considerations

### ✅ Best Practices Implemented

1. **Webhook Signature Verification**: All webhooks are verified using HMAC-SHA512
2. **Server-Side Verification**: Payments are verified on the backend, not just frontend
3. **HTTPS Only**: Always use HTTPS in production
4. **API Key Rotation**: Rotate keys regularly in Paystack dashboard
5. **Rate Limiting**: Implement rate limiting on payment endpoints
6. **PCI Compliance**: Never store card details locally; Paystack handles this

### ⚠️ Do NOT

- ❌ Commit `.env` files to version control
- ❌ Expose Secret Keys in frontend code
- ❌ Trust only frontend verification
- ❌ Store card details in your database
- ❌ Log sensitive payment information

## Production Checklist

Before going live:

- [ ] Switch from test to live Paystack keys
- [ ] Update webhook URL to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Set up error logging and monitoring
- [ ] Test with real transactions
- [ ] Configure email notifications
- [ ] Set up payment reconciliation cron jobs
- [ ] Test refund process
- [ ] Document payment flow for support team

## Troubleshooting

### Payment not initializing
- Check if Paystack keys are correct in `.env`
- Verify email format is valid
- Check browser console for CORS errors

### Webhook not received
- Verify webhook URL in Paystack dashboard
- Check network logs for failed webhook calls
- Ensure backend is accessible from internet (use ngrok for local testing)

### Transaction not verified
- Check if reference is correct
- Verify Paystack API is responding
- Check transaction logs in Paystack dashboard

## Support

- Paystack Support: https://support.paystack.com
- Documentation: https://paystack.com/docs
- GitHub: https://github.com/PaystackHQ

## Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api)
- [Paystack Integration Guide](https://paystack.com/docs)
- [Test Card Numbers](https://paystack.com/docs/payments/test-payments/)
