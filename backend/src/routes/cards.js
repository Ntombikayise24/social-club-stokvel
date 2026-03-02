import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();
router.use(authenticate);

// Luhn algorithm to validate card numbers
function luhnCheck(cardNumber) {
  let sum = 0;
  let alternate = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let n = parseInt(cardNumber.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ────────────────── LIST CARDS ──────────────────
router.get('/', async (req, res) => {
  try {
    const [cards] = await pool.query(
      'SELECT * FROM cards WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json(cards.map(c => ({
      id: c.id,
      cardType: c.card_type,
      last4: c.last4,
      expiryMonth: c.expiry_month,
      expiryYear: c.expiry_year,
      cardholderName: c.cardholder_name,
      isDefault: !!c.is_default,
    })));
  } catch (err) {
    console.error('List cards error:', err);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// ────────────────── ADD CARD ──────────────────
router.post(
  '/',
  [
    body('cardNumber').trim().isLength({ min: 13, max: 19 }).withMessage('Invalid card number'),
    body('cardholderName').trim().notEmpty().withMessage('Cardholder name is required'),
    body('expiryMonth').isInt({ min: 1, max: 12 }),
    body('expiryYear').isInt({ min: 1 }),
    body('cvv').isLength({ min: 3, max: 4 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { cardNumber, cardholderName, expiryMonth, expiryYear } = req.body;

      // Validate card number with Luhn algorithm
      const cleanNumber = cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cleanNumber)) {
        return res.status(400).json({ error: 'Card number must be 13–19 digits' });
      }
      if (!luhnCheck(cleanNumber)) {
        return res.status(400).json({ error: 'Invalid card number' });
      }

      // Normalize 2-digit year to 4-digit
      const normalizedYear = expiryYear < 100 ? 2000 + expiryYear : expiryYear;

      // Validate expiry isn't in the past
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      if (normalizedYear < currentYear || (normalizedYear === currentYear && expiryMonth < currentMonth)) {
        return res.status(400).json({ error: 'Card has expired' });
      }

      // Detect card type
      let cardType = 'visa';
      if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) cardType = 'mastercard';
      else if (/^3[47]/.test(cleanNumber)) cardType = 'amex';

      const last4 = cleanNumber.slice(-4);

      // Check for duplicate card (same last4, card type, and expiry)
      const [duplicates] = await pool.query(
        'SELECT id FROM cards WHERE user_id = ? AND last4 = ? AND card_type = ? AND expiry_month = ? AND expiry_year = ?',
        [req.user.id, last4, cardType, expiryMonth, normalizedYear]
      );
      if (duplicates.length > 0) {
        return res.status(409).json({ error: 'This card has already been added to your account.' });
      }

      // Check if first card — make it default
      const [existing] = await pool.query('SELECT id FROM cards WHERE user_id = ?', [req.user.id]);
      const isDefault = existing.length === 0;

      const [result] = await pool.query(
        'INSERT INTO cards (user_id, card_type, last4, expiry_month, expiry_year, cardholder_name, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, cardType, last4, expiryMonth, normalizedYear, cardholderName.toUpperCase(), isDefault]
      );

      res.status(201).json({
        message: 'Card added successfully',
        card: {
          id: result.insertId,
          cardType,
          last4,
          expiryMonth,
          expiryYear: normalizedYear,
          cardholderName: cardholderName.toUpperCase(),
          isDefault,
        },
      });
    } catch (err) {
      console.error('Add card error:', err);
      res.status(500).json({ error: 'Failed to add card' });
    }
  }
);

// ────────────────── SET DEFAULT CARD ──────────────────
router.put('/:id/default', async (req, res) => {
  try {
    const cardId = req.params.id;

    // Verify ownership
    const [cards] = await pool.query('SELECT id FROM cards WHERE id = ? AND user_id = ?', [cardId, req.user.id]);
    if (cards.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Unset all defaults
    await pool.query('UPDATE cards SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    // Set new default
    await pool.query('UPDATE cards SET is_default = TRUE WHERE id = ?', [cardId]);

    res.json({ message: 'Default card updated' });
  } catch (err) {
    console.error('Set default card error:', err);
    res.status(500).json({ error: 'Failed to update default card' });
  }
});

// ────────────────── DELETE CARD ──────────────────
router.delete('/:id', async (req, res) => {
  try {
    const cardId = req.params.id;

    const [cards] = await pool.query('SELECT id, is_default FROM cards WHERE id = ? AND user_id = ?', [cardId, req.user.id]);
    if (cards.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await pool.query('DELETE FROM cards WHERE id = ?', [cardId]);

    // If deleted card was default, set first remaining card as default
    if (cards[0].is_default) {
      await pool.query(
        'UPDATE cards SET is_default = TRUE WHERE user_id = ? ORDER BY created_at ASC LIMIT 1',
        [req.user.id]
      );
    }

    res.json({ message: 'Card removed successfully' });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

export default router;
