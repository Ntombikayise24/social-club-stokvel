const { getPool } = require('../config/db');

const PaymentTransaction = {
    async create({ userId, stokvelId, membershipId, amount, paymentMethod, reference, paystackReference, status = 'pending' }) {
        const pool = getPool();
        const [result] = await pool.query(
            `INSERT INTO payment_transactions (user_id, stokvel_id, membership_id, amount, payment_method, reference, paystack_reference, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [userId, stokvelId, membershipId, amount, paymentMethod, reference, paystackReference, status]
        );
        return { 
            id: result.insertId, 
            userId, 
            stokvelId, 
            membershipId, 
            amount, 
            paymentMethod, 
            reference, 
            paystackReference, 
            status 
        };
    },

    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM payment_transactions WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async findByReference(reference) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM payment_transactions WHERE reference = ?', [reference]);
        return rows[0] || null;
    },

    async findByPaystackReference(paystackReference) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM payment_transactions WHERE paystack_reference = ?', [paystackReference]);
        return rows[0] || null;
    },

    async findByUser(userId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT pt.*, s.name as stokvel_name, u.full_name as user_name
             FROM payment_transactions pt
             LEFT JOIN stokvels s ON pt.stokvel_id = s.id
             LEFT JOIN users u ON pt.user_id = u.id
             WHERE pt.user_id = ? ORDER BY pt.created_at DESC`,
            [userId]
        );
        return rows;
    },

    async updateStatus(id, status) {
        const pool = getPool();
        const [result] = await pool.query(
            'UPDATE payment_transactions SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    },

    async findByStokvel(stokvelId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT pt.*, u.full_name as user_name
             FROM payment_transactions pt
             LEFT JOIN users u ON pt.user_id = u.id
             WHERE pt.stokvel_id = ? ORDER BY pt.created_at DESC`,
            [stokvelId]
        );
        return rows;
    },

    async getStats(stokvelId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed,
                SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
             FROM payment_transactions 
             WHERE stokvel_id = ?`,
            [stokvelId]
        );
        return rows[0];
    }
};

module.exports = PaymentTransaction;
