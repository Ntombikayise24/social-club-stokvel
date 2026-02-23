import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();

// ────────────────── GET USER SETTINGS ──────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    if (settings.length === 0) {
      // Create defaults
      await pool.query('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
      const [newSettings] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
      return res.json(formatSettings(newSettings[0]));
    }

    res.json(formatSettings(settings[0]));
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ────────────────── UPDATE USER SETTINGS ──────────────────
router.put(
  '/',
  authenticate,
  [
    body('emailNotifications').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
    body('smsNotifications').optional().isBoolean(),
    body('contributionReminders').optional().isBoolean(),
    body('loanAlerts').optional().isBoolean(),
    body('twoFactorAuth').optional().isBoolean(),
    body('loginAlerts').optional().isBoolean(),
    body('language').optional().isString(),
    validate,
  ],
  async (req, res) => {
    try {
      const fields = [
        'emailNotifications', 'pushNotifications', 'smsNotifications',
        'contributionReminders', 'loanAlerts', 'twoFactorAuth', 'loginAlerts', 'language'
      ];

      const dbFieldMap = {
        emailNotifications: 'email_notifications',
        pushNotifications: 'push_notifications',
        smsNotifications: 'sms_notifications',
        contributionReminders: 'contribution_reminders',
        loanAlerts: 'loan_alerts',
        twoFactorAuth: 'two_factor_auth',
        loginAlerts: 'login_alerts',
        language: 'language',
      };

      const updates = [];
      const values = [];

      for (const field of fields) {
        if (req.body[field] !== undefined) {
          updates.push(`${dbFieldMap[field]} = ?`);
          values.push(req.body[field]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.user.id);
      await pool.query(
        `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );

      res.json({ message: 'Settings updated successfully' });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

function formatSettings(s) {
  return {
    emailNotifications: !!s.email_notifications,
    pushNotifications: !!s.push_notifications,
    smsNotifications: !!s.sms_notifications,
    contributionReminders: !!s.contribution_reminders,
    loanAlerts: !!s.loan_alerts,
    twoFactorAuth: !!s.two_factor_auth,
    loginAlerts: !!s.login_alerts,
    language: s.language,
  };
}

export default router;
