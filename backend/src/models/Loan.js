const { getPool } = require('../config/db');

const Loan = {
    async create({ userId, stokvelId, membershipId, amount, interestRate = 30, interest,
        totalRepayable, status = 'active', purpose = '', dueDate, repaidDate = null }) {
        const pool = getPool();
        const [result] = await pool.query(
            `INSERT INTO loans (user_id, stokvel_id, membership_id, amount, interest_rate, interest,
             total_repayable, status, purpose, due_date, repaid_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, stokvelId, membershipId, amount, interestRate, interest,
             totalRepayable, status, purpose, dueDate, repaidDate]
        );
        return { id: result.insertId, userId, stokvelId, membershipId, amount, interestRate,
            interest, totalRepayable, status, purpose, dueDate };
    },

    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM loans WHERE id = ?', [id]);
        return rows[0] ? Loan._format(rows[0]) : null;
    },

    async findByIdWithStokvel(id) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT l.*, s.name as stokvel_name, s.overdue_interest_rate as stokvel_overdue_rate
             FROM loans l JOIN stokvels s ON l.stokvel_id = s.id WHERE l.id = ?`,
            [id]
        );
        if (!rows[0]) return null;
        const row = rows[0];
        return {
            ...Loan._format(row),
            stokvel: { id: row.stokvel_id, name: row.stokvel_name, overdueInterestRate: parseFloat(row.stokvel_overdue_rate) },
        };
    },

    async findByMembership(membershipId, { status } = {}) {
        const pool = getPool();
        let query = `SELECT l.*, s.name as stokvel_name
            FROM loans l JOIN stokvels s ON l.stokvel_id = s.id WHERE l.membership_id = ?`;
        const params = [membershipId];
        if (status && status !== 'all') { query += ' AND l.status = ?'; params.push(status); }
        query += ' ORDER BY l.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map((row) => ({
            ...Loan._format(row),
            stokvelName: row.stokvel_name,
        }));
    },

    async findOutstandingByMembership(membershipId) {
        const pool = getPool();
        const [rows] = await pool.query(
            "SELECT * FROM loans WHERE membership_id = ? AND status IN ('active', 'overdue')",
            [membershipId]
        );
        return rows.map(Loan._format);
    },

    async findByStokvel(stokvelId, { statusList } = {}) {
        const pool = getPool();
        let query = `SELECT l.*, u.full_name as user_name
            FROM loans l JOIN users u ON l.user_id = u.id WHERE l.stokvel_id = ?`;
        const params = [stokvelId];
        if (statusList && statusList.length > 0) {
            query += ` AND l.status IN (${statusList.map(() => '?').join(',')})`;
            params.push(...statusList);
        }
        query += ' ORDER BY l.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map((row) => ({
            ...Loan._format(row),
            userName: row.user_name,
        }));
    },

    async updateById(id, updates) {
        const pool = getPool();
        const fields = [];
        const params = [];
        if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
        if (updates.repaidDate !== undefined) { fields.push('repaid_date = ?'); params.push(updates.repaidDate); }
        if (updates.interest !== undefined) { fields.push('interest = ?'); params.push(updates.interest); }
        if (updates.interestRate !== undefined) { fields.push('interest_rate = ?'); params.push(updates.interestRate); }
        if (updates.totalRepayable !== undefined) { fields.push('total_repayable = ?'); params.push(updates.totalRepayable); }
        if (fields.length === 0) return;
        params.push(id);
        await pool.query(`UPDATE loans SET ${fields.join(', ')} WHERE id = ?`, params);
    },

    async countDocuments(conditions = {}) {
        const pool = getPool();
        let query = 'SELECT COUNT(*) as count FROM loans';
        const params = [];
        const clauses = [];
        if (conditions.userId) { clauses.push('user_id = ?'); params.push(conditions.userId); }
        if (conditions.statusList) {
            clauses.push(`status IN (${conditions.statusList.map(() => '?').join(',')})`);
            params.push(...conditions.statusList);
        }
        if (conditions.status) { clauses.push('status = ?'); params.push(conditions.status); }
        if (clauses.length > 0) query += ' WHERE ' + clauses.join(' AND ');
        const [rows] = await pool.query(query, params);
        return rows[0].count;
    },

    _format(row) {
        if (!row) return null;
        return {
            id: row.id,
            userId: row.user_id,
            stokvelId: row.stokvel_id,
            membershipId: row.membership_id,
            amount: parseFloat(row.amount),
            interestRate: parseFloat(row.interest_rate),
            interest: parseFloat(row.interest),
            totalRepayable: parseFloat(row.total_repayable),
            status: row.status,
            purpose: row.purpose,
            dueDate: row.due_date,
            repaidDate: row.repaid_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
};

module.exports = Loan;
