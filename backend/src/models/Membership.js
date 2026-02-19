const { getPool } = require('../config/db');

const Membership = {
    async create({ userId, stokvelId, role = 'member', targetAmount, savedAmount = 0, status = 'active' }) {
        const pool = getPool();
        const [result] = await pool.query(
            `INSERT INTO memberships (user_id, stokvel_id, role, target_amount, saved_amount, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, stokvelId, role, targetAmount, savedAmount, status]
        );
        return { id: result.insertId, userId, stokvelId, role, targetAmount, savedAmount, status };
    },

    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM memberships WHERE id = ?', [id]);
        return rows[0] ? Membership._format(rows[0]) : null;
    },

    async findByIdWithStokvel(id) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT m.*, s.name as stokvel_name, s.icon as stokvel_icon, s.color as stokvel_color,
             s.type as stokvel_type, s.cycle as stokvel_cycle, s.next_payout as stokvel_next_payout,
             s.target_amount as stokvel_target_amount, s.interest_rate as stokvel_interest_rate,
             s.overdue_interest_rate as stokvel_overdue_interest_rate,
             s.loan_percentage_limit as stokvel_loan_percentage_limit,
             s.loan_repayment_days as stokvel_loan_repayment_days,
             s.max_members as stokvel_max_members
             FROM memberships m JOIN stokvels s ON m.stokvel_id = s.id WHERE m.id = ?`,
            [id]
        );
        if (!rows[0]) return null;
        const row = rows[0];
        return {
            ...Membership._format(row),
            stokvel: {
                id: row.stokvel_id,
                name: row.stokvel_name,
                icon: row.stokvel_icon,
                color: row.stokvel_color,
                type: row.stokvel_type,
                cycle: row.stokvel_cycle,
                nextPayout: row.stokvel_next_payout,
                targetAmount: parseFloat(row.stokvel_target_amount),
                interestRate: parseFloat(row.stokvel_interest_rate),
                overdueInterestRate: parseFloat(row.stokvel_overdue_interest_rate),
                loanPercentageLimit: parseFloat(row.stokvel_loan_percentage_limit),
                loanRepaymentDays: row.stokvel_loan_repayment_days,
                maxMembers: row.stokvel_max_members,
            },
        };
    },

    async findByUser(userId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT m.*, s.name as stokvel_name, s.icon as stokvel_icon, s.color as stokvel_color,
             s.type as stokvel_type, s.cycle as stokvel_cycle, s.next_payout as stokvel_next_payout
             FROM memberships m JOIN stokvels s ON m.stokvel_id = s.id WHERE m.user_id = ?`,
            [userId]
        );
        return rows.map((row) => ({
            ...Membership._format(row),
            stokvel: {
                id: row.stokvel_id,
                name: row.stokvel_name,
                icon: row.stokvel_icon,
                color: row.stokvel_color,
                type: row.stokvel_type,
                cycle: row.stokvel_cycle,
                nextPayout: row.stokvel_next_payout,
            },
        }));
    },

    async findByStokvel(stokvelId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT m.*, u.full_name, u.email, u.last_active
             FROM memberships m JOIN users u ON m.user_id = u.id WHERE m.stokvel_id = ?`,
            [stokvelId]
        );
        return rows.map((row) => ({
            ...Membership._format(row),
            user: {
                id: row.user_id,
                fullName: row.full_name,
                email: row.email,
                lastActive: row.last_active,
            },
        }));
    },

    async countByStokvel(stokvelId, statusFilter) {
        const pool = getPool();
        let query = 'SELECT COUNT(*) as count FROM memberships WHERE stokvel_id = ?';
        const params = [stokvelId];
        if (statusFilter) { query += ' AND status = ?'; params.push(statusFilter); }
        const [rows] = await pool.query(query, params);
        return rows[0].count;
    },

    async findOne(conditions) {
        const pool = getPool();
        let query = 'SELECT * FROM memberships WHERE 1=1';
        const params = [];
        if (conditions.userId) { query += ' AND user_id = ?'; params.push(conditions.userId); }
        if (conditions.stokvelId) { query += ' AND stokvel_id = ?'; params.push(conditions.stokvelId); }
        query += ' LIMIT 1';
        const [rows] = await pool.query(query, params);
        return rows[0] ? Membership._format(rows[0]) : null;
    },

    async updateSavedAmount(id, increment) {
        const pool = getPool();
        await pool.query('UPDATE memberships SET saved_amount = saved_amount + ? WHERE id = ?', [increment, id]);
    },

    async deleteByUser(userId) {
        const pool = getPool();
        await pool.query('DELETE FROM memberships WHERE user_id = ?', [userId]);
    },

    _format(row) {
        if (!row) return null;
        return {
            id: row.id,
            userId: row.user_id,
            stokvelId: row.stokvel_id,
            role: row.role,
            targetAmount: parseFloat(row.target_amount),
            savedAmount: parseFloat(row.saved_amount),
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
};

module.exports = Membership;
