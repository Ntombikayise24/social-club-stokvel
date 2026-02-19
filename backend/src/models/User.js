const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');

const User = {
    async create({ fullName, email, phone, password, role = 'member', status = 'pending', message = '' }) {
        const pool = getPool();
        const hashedPassword = await bcrypt.hash(password, 12);
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, phone, password, role, status, message, last_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [fullName, email, phone, hashedPassword, role, status, message]
        );
        return { id: result.insertId, fullName, email, phone, role, status, message };
    },

    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async findByIdWithPassword(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async findByEmail(email) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },

    async findByEmailWithPassword(email) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },

    async find(conditions = {}) {
        const pool = getPool();
        let query = 'SELECT id, full_name, email, phone, role, status, message, last_active, created_at, updated_at FROM users';
        const params = [];
        const clauses = [];

        if (conditions.role) { clauses.push('role = ?'); params.push(conditions.role); }
        if (conditions.status) { clauses.push('status = ?'); params.push(conditions.status); }
        if (conditions.search) {
            clauses.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
            params.push(`%${conditions.search}%`, `%${conditions.search}%`, `%${conditions.search}%`);
        }

        if (clauses.length > 0) query += ' WHERE ' + clauses.join(' AND ');
        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    async countDocuments(conditions = {}) {
        const pool = getPool();
        let query = 'SELECT COUNT(*) as count FROM users';
        const params = [];
        const clauses = [];

        if (conditions.role) { clauses.push('role = ?'); params.push(conditions.role); }
        if (conditions.status) { clauses.push('status = ?'); params.push(conditions.status); }

        if (clauses.length > 0) query += ' WHERE ' + clauses.join(' AND ');

        const [rows] = await pool.query(query, params);
        return rows[0].count;
    },

    async updateById(id, updates) {
        const pool = getPool();
        const fields = [];
        const params = [];

        if (updates.fullName !== undefined) { fields.push('full_name = ?'); params.push(updates.fullName); }
        if (updates.email !== undefined) { fields.push('email = ?'); params.push(updates.email); }
        if (updates.phone !== undefined) { fields.push('phone = ?'); params.push(updates.phone); }
        if (updates.password !== undefined) {
            const hashed = await bcrypt.hash(updates.password, 12);
            fields.push('password = ?'); params.push(hashed);
        }
        if (updates.role !== undefined) { fields.push('role = ?'); params.push(updates.role); }
        if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
        if (updates.message !== undefined) { fields.push('message = ?'); params.push(updates.message); }
        if (updates.lastActive !== undefined) { fields.push('last_active = ?'); params.push(updates.lastActive); }

        if (fields.length === 0) return;

        params.push(id);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
        return await User.findById(id);
    },

    async deleteById(id) {
        const pool = getPool();
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
    },

    async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    async setPreferredGroups(userId, stokvelIds) {
        const pool = getPool();
        await pool.query('DELETE FROM user_preferred_groups WHERE user_id = ?', [userId]);
        for (const stokvelId of stokvelIds) {
            await pool.query(
                'INSERT IGNORE INTO user_preferred_groups (user_id, stokvel_id) VALUES (?, ?)',
                [userId, stokvelId]
            );
        }
    },

    async getPreferredGroups(userId) {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT stokvel_id FROM user_preferred_groups WHERE user_id = ?',
            [userId]
        );
        return rows.map((r) => r.stokvel_id);
    },

    /** Insert a user with pre-hashed password (for seeding) */
    async createRaw({ fullName, email, phone, hashedPassword, role = 'member', status = 'pending', message = '' }) {
        const pool = getPool();
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, phone, password, role, status, message, last_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [fullName, email, phone, hashedPassword, role, status, message]
        );
        return { id: result.insertId, fullName, email, phone, role, status };
    },
};

module.exports = User;
