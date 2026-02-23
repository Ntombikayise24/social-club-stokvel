import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();

// ────────────────── GET FAQS ──────────────────
router.get('/faq', async (_req, res) => {
  try {
    const [faqs] = await pool.query('SELECT * FROM faqs ORDER BY sort_order, id');

    // Group by category
    const grouped = {};
    for (const faq of faqs) {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
      });
    }

    const categories = Object.entries(grouped).map(([category, questions]) => ({
      category,
      questions,
    }));

    res.json(categories);
  } catch (err) {
    console.error('Get FAQs error:', err);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// ────────────────── SUBMIT CONTACT FORM ──────────────────
router.post(
  '/contact',
  optionalAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const { name, email, message } = req.body;

      await pool.query(
        'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
        [name, email, message]
      );

      // Notify admins
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
      for (const admin of admins) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [admin.id, 'info', 'New Contact Message', `${name} (${email}) sent a message via the contact form.`]
        );
      }

      res.status(201).json({ message: 'Message sent successfully. We\'ll get back to you soon!' });
    } catch (err) {
      console.error('Contact form error:', err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

export default router;
