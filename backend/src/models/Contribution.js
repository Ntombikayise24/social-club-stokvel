const { getPool } = require('../config/db');

const Contribution = {
    async create({ userId, stokvelId, membershipId, amount, paymentMethod = 'card', status = 'pending', reference = '', confirmedBy = null, confirmedAt = null }) {
        const pool = getPool();
        if (!reference) {
            reference = `TRX-${Date.now().toString(36).toUpperCase()}`;
        }
        const [result] = await pool.query(
            `INSERT INTO contributions (user_id, stokvel_id, membership_id, amount, payment_method, reference, status, confirmed_by, confirmed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, stokvelId, membershipId, amount, paymentMethod, reference, status, confirmedBy, confirmedAt]
        );
        return { id: result.insertId, userId, stokvelId, membershipId, amount, paymentMethod, reference, status };
    },

    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM contributions WHERE id = ?', [id]);
        return rows[0] ? Contribution._format(rows[0]) : null;
    },

    async findByStokvel(stokvelId, { status, userId } = {}) {
        const pool = getPool();
        let query = `SELECT c.*, u.full_name as user_name, cb.full_name as confirmed_by_name
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN users cb ON c.confirmed_by = cb.id
            WHERE c.stokvel_id = ?`;
        const params = [stokvelId];
        if (status && status !== 'all') { query += ' AND c.status = ?'; params.push(status); }
        if (userId && userId !== 'all') { query += ' AND c.user_id = ?'; params.push(userId); }
        query += ' ORDER BY c.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map((row) => ({
            ...Contribution._format(row),
            userName: row.user_name,
            confirmedByName: row.confirmed_by_name,
        }));
    },

    async findAll({ stokvelId, status } = {}) {
        const pool = getPool();
        let query = `SELECT c.*, u.full_name as user_name, s.name as stokvel_name,
            cb.full_name as confirmed_by_name
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            JOIN stokvels s ON c.stokvel_id = s.id
            LEFT JOIN users cb ON c.confirmed_by = cb.id WHERE 1=1`;
        const params = [];
        if (stokvelId && stokvelId !== 'all') { query += ' AND c.stokvel_id = ?'; params.push(stokvelId); }
        if (status && status !== 'all') { query += ' AND c.status = ?'; params.push(status); }
        query += ' ORDER BY c.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map((row) => ({
            ...Contribution._format(row),
            userName: row.user_name,
            stokvelName: row.stokvel_name,
            confirmedByName: row.confirmed_by_name,
        }));
    },

    async updateById(id, updates) {
        const pool = getPool();
        const fields = [];
        const params = [];
        if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
        if (updates.confirmedBy !== undefined) { fields.push('confirmed_by = ?'); params.push(updates.confirmedBy); }
        if (updates.confirmedAt !== undefined) { fields.push('confirmed_at = ?'); params.push(updates.confirmedAt); }
        if (fields.length === 0) return;
        params.push(id);
        await pool.query(`UPDATE contributions SET ${fields.join(', ')} WHERE id = ?`, params);
    },

    async countDocuments(conditions = {}) {
        const pool = getPool();
        let query = 'SELECT COUNT(*) as count FROM contributions';
        const params = [];
        const clauses = [];
        if (conditions.status) { clauses.push('status = ?'); params.push(conditions.status); }
        if (clauses.length > 0) query += ' WHERE ' + clauses.join(' AND ');
        const [rows] = await pool.query(query, params);
        return rows[0].count;
    },

    async aggregate() {
        const pool = getPool();
        const [rows] = await pool.query('SELECT SUM(amount) as totalAmount, COUNT(*) as count FROM contributions');
        return { totalAmount: parseFloat(rows[0].totalAmount) || 0, count: rows[0].count };
    },

    async aggregatePending() {
        const pool = getPool();
        const [rows] = await pool.query("SELECT SUM(amount) as total FROM contributions WHERE status = 'pending'");
        return parseFloat(rows[0].total) || 0;
    },

    _format(row) {
        if (!row) return null;
        return {
            id: row.id,
            userId: row.user_id,
            stokvelId: row.stokvel_id,
            membershipId: row.membership_id,
            amount: parseFloat(row.amount),
            paymentMethod: row.payment_method,
            reference: row.reference,
            status: row.status,
            confirmedBy: row.confirmed_by,
            confirmedAt: row.confirmed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
};

module.exports = Contribution;
