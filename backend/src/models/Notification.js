const { getPool } = require('../config/db');

const Notification = {
    async create({ userId, message, type = 'system', relatedId = null, relatedModel = null }) {
        const pool = getPool();
        const [result] = await pool.query(
            'INSERT INTO notifications (user_id, message, type, related_id, related_model) VALUES (?, ?, ?, ?, ?)',
            [userId, message, type, relatedId, relatedModel]
        );
        return { id: result.insertId, userId, message, type };
    },

    async insertMany(notifications) {
        const pool = getPool();
        for (const n of notifications) {
            await pool.query(
                'INSERT INTO notifications (user_id, message, type, `read`, related_id, related_model) VALUES (?, ?, ?, ?, ?, ?)',
                [n.userId, n.message, n.type || 'system', n.read || false, n.relatedId || null, n.relatedModel || null]
            );
        }
    },

    async findByUser(userId, { limit = 20, unreadOnly = false } = {}) {
        const pool = getPool();
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];
        if (unreadOnly) { query += ' AND `read` = FALSE'; }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        const [rows] = await pool.query(query, params);
        return rows.map(Notification._format);
    },

    async countUnread(userId) {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND `read` = FALSE',
            [userId]
        );
        return rows[0].count;
    },

    async markAsRead(id, userId) {
        const pool = getPool();
        const [result] = await pool.query(
            'UPDATE notifications SET `read` = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    },

    async markAllAsRead(userId) {
        const pool = getPool();
        await pool.query(
            'UPDATE notifications SET `read` = TRUE WHERE user_id = ? AND `read` = FALSE',
            [userId]
        );
    },

    async deleteByUser(userId) {
        const pool = getPool();
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    },

    _format(row) {
        if (!row) return null;
        return {
            id: row.id,
            userId: row.user_id,
            message: row.message,
            type: row.type,
            read: !!row.read,
            relatedId: row.related_id,
            relatedModel: row.related_model,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
};

module.exports = Notification;
