import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../database/connection.js';

const router = Router();
router.use(authenticate);

// ────────────────── LIST NOTIFICATIONS ──────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (unreadOnly === 'true') {
      where += ' AND is_read = FALSE';
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications ${where}`,
      params
    );

    const [notifications] = await pool.query(
      `SELECT * FROM notifications ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      data: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: !!n.is_read,
        actionable: !!n.actionable,
        actionLink: n.action_link,
        actionText: n.action_text,
        time: n.created_at,
      })),
      unreadCount: unreadCount[0].count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ────────────────── MARK ONE AS READ ──────────────────
router.put('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

// ────────────────── MARK ALL AS READ ──────────────────
router.put('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// ────────────────── DELETE ALL READ ──────────────────
router.delete('/read', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
      [req.user.id]
    );
    res.json({ message: 'Read notifications deleted' });
  } catch (err) {
    console.error('Delete read notifications error:', err);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

export default router;
