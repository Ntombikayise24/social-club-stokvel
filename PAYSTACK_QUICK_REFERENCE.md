# Paystack Integration Quick Reference

## For Developers

### Using the Payment Component

```typescript
import PaymentComponent from '../components/Payment/PaymentComponent';

// In your page/component
export default function ContributionPage() {
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    // Fetch user memberships
    fetchMemberships();
  }, []);

  return (
    <div>
      <h1>Make Contribution</h1>
      <PaymentComponent 
        memberships={memberships}
        onSuccess={() => {
          // Optional: Handle success callback
          toast.success('Contribution recorded!');
        }}
      />
    </div>
  );
}
```

### API Usage

#### Initialize Payment
```typescript
import { PaymentAPI } from '../services/api';

const response = await PaymentAPI.initializePayment({
  membershipId: 1,
  amount: 500,
  email: 'user@example.com'
});

// Redirect user to payment URL
window.location.href = response.data.authorization_url;
```

#### Verify Payment
```typescript
const verifyResponse = await PaymentAPI.verifyPayment({
  reference: 'TRX-12345'
});

if (verifyResponse.success) {
  console.log('Payment verified and contribution created');
  console.log('Contribution ID:', verifyResponse.data.contribution_id);
}
```

#### Get Payment History
```typescript
const history = await PaymentAPI.getPaymentHistory();
console.log('User payment history:', history.data);
```

### Backend Usage

#### Creating Payment Endpoint
```javascript
// In a controller
const { initializePayment } = require('../controllers/paymentController');

// Use with Express
router.post('/payments/initialize', authenticate, initializePayment);
```

#### Handling Webhook
```javascript
// Webhook is automatically handled
// But you can log events:
const { handlePaystackWebhook } = require('../utils/webhookHandler');

router.post('/payments/webhook', handlePaystackWebhook);
```

#### Querying Payment Transactions
```javascript
const PaymentTransaction = require('../models/PaymentTransaction');

// Find by reference
const transaction = await PaymentTransaction.findByReference('TRX-123');

// Find by user
const userTransactions = await PaymentTransaction.findByUser(userId);

// Get stats
const stats = await PaymentTransaction.getStats(stokvelId);
```

## Payment Status Lifecycle

```
pending → [Paystack processes] → completed
       ↓
       → failed
       → cancelled
```

### Status Meanings

- **pending**: Payment initialized, awaiting user action
- **completed**: Payment successful and verified
- **failed**: Payment declined or cancelled by user
- **cancelled**: User cancelled the payment

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid payment method" | Only card payments supported | Use PaymentComponent |
| "Payment reference not found" | Transaction doesn't exist | Check reference format |
| "Webhook signature invalid" | Webhook verification failed | Check PAYSTACK_SECRET_KEY |
| "Membership not found" | Invalid membershipId | Verify membership exists |

### Logging Errors

```javascript
// Backend errors are logged to console
console.error('Payment error:', error.message);

// Frontend errors shown as toasts
toast.error('Payment failed. Please try again.');
```

## Database Queries

### Get Recent Transactions
```sql
SELECT * FROM payment_transactions 
WHERE status = 'completed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Get Payment Stats by Stokvel
```sql
SELECT 
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
FROM payment_transactions
WHERE stokvel_id = ? AND status = 'completed';
```

### Get User Payment History
```sql
SELECT pt.*, s.name as stokvel_name
FROM payment_transactions pt
LEFT JOIN stokvels s ON pt.stokvel_id = s.id
WHERE pt.user_id = ?
ORDER BY pt.created_at DESC;
```

## Environment Variables Check

Make sure these are set:

```bash
# Backend
echo $PAYSTACK_SECRET_KEY  # Should show sk_test_xxx
echo $PAYSTACK_PUBLIC_KEY  # Should show pk_test_xxx

# Frontend (in .env.local)
echo $VITE_PAYSTACK_PUBLIC_KEY  # Should show pk_test_xxx
```

## Testing Checklist

- [ ] Paystack keys configured in .env
- [ ] Database table created (check with: `DESCRIBE payment_transactions;`)
- [ ] Backend routes accessible: GET /api/payments/history
- [ ] PaymentComponent renders without errors
- [ ] Can initialize payment with test data
- [ ] Webhook endpoint accessible (use ngrok for local)
- [ ] Payment completion creates contribution record
- [ ] Notification sent on success
- [ ] Payment history shows transaction

## Paystack Test Card Numbers

**All Test Cards:**
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)
- OTP: 123456

### Success Scenarios
- `4084084084084081` - Success
- `4111111111111111` - Success (Visa)

### Failure Scenarios
- `5555555555554444` - Declined
- `3782822463100011` - Declined (Amex)

## Common Issues & Solutions

### Issue: "CORS error" when calling Paystack API
**Solution**: 
- CORS is not blocked by browser for API calls made from backend
- Check if backend and frontend URLs match PAYSTACK_SETUP.md

### Issue: Webhook not received
**Solution**:
- Check webhook URL in Paystack dashboard
- Use ngrok for local testing: `ngrok http 5000`
- Verify endpoint logs: `console.log('Webhook received:')`

### Issue: Payment status not updating
**Solution**:
- Check if webhook handler is running
- Verify webhook signature verification passes
- Check database for payment_transactions table

### Issue: "Membership not found"
**Solution**:
- Verify membershipId is correct
- Check if user belongs to that stokvel
- Query: `SELECT * FROM memberships WHERE id = ?`

## Monitoring & Debugging

### Check Payment Transaction in DB
```sql
SELECT * FROM payment_transactions 
WHERE reference = 'TRX-xxx' 
OR paystack_reference = 'xxx';
```

### Monitor Webhooks
```javascript
// Add logging in webhookHandler.js
console.log('Webhook event:', event.event);
console.log('Payment amount:', event.data.amount / 100, 'ZAR');
```

### View Error Logs
```bash
# Backend logs (if using file logging)
tail -f logs/error.log

# Or check console output
# Errors should show in terminal where backend is running
```

## Performance Tips

1. **Use indexes**: payment_transactions has indexes on:
   - status (for filtering completed payments)
   - user_id (for user-specific queries)
   - paystack_reference (for webhook lookups)

2. **Pagination**: When fetching payment history
   ```javascript
   // Implement pagination
   SELECT * FROM payment_transactions 
   WHERE user_id = ? 
   ORDER BY created_at DESC 
   LIMIT 20 OFFSET 0;
   ```

3. **Caching**: Cache payment stats for stokvels
   ```javascript
   // Cache can be invalidated on payment completion
   ```

## Related Components

- `src/components/Payment/PaymentComponent.tsx` - Main payment form
- `src/pages/payments/PaymentVerification.tsx` - Payment result page
- `backend/src/controllers/paymentController.js` - Payment logic
- `backend/src/models/PaymentTransaction.js` - Database model
- `src/services/api.ts` - API client

## Next Features to Consider

- [ ] Refund handling
- [ ] Payment reconciliation reports
- [ ] Email receipts
- [ ] SMS notifications
- [ ] Payment plans/installments
- [ ] Bulk payout settlements
- [ ] Analytics dashboard

## Support Resources

- 📖 [Paystack Documentation](https://paystack.com/docs)
- 💬 [Paystack Support](https://support.paystack.com)
- 🧪 [Test Payment Guide](https://paystack.com/docs/payments/test-payments/)
- 🔐 [Security Best Practices](https://paystack.com/docs/security)
