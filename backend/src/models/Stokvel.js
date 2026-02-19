const { getPool } = require('../config/db');

const Stokvel = {
    async create({ name, type = 'traditional', description = '', icon = '🌱', color = 'primary',
        targetAmount, maxMembers, interestRate = 30, overdueInterestRate = 60,
        loanPercentageLimit = 50, loanRepaymentDays = 30, cycle = 'weekly',
        meetingDay = '', nextPayout, status = 'active', createdBy }) {
        const pool = getPool();
        const [result] = await pool.query(
            `INSERT INTO stokvels (name, type, description, icon, color, target_amount, max_members,
             interest_rate, overdue_interest_rate, loan_percentage_limit, loan_repayment_days,
             cycle, meeting_day, next_payout, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, description, icon, color, targetAmount, maxMembers,
             interestRate, overdueInterestRate, loanPercentageLimit, loanRepaymentDays,
             cycle, meetingDay, nextPayout, status, createdBy]
        );
        return { id: result.insertId, name, type, description, icon, color, targetAmount, maxMembers,
            interestRate, overdueInterestRate, loanPercentageLimit, loanRepaymentDays,
            cycle, meetingDay, nextPayout, status, createdBy };
    },

    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM stokvels WHERE id = ?', [id]);
        return rows[0] ? Stokvel._format(rows[0]) : null;
    },

    async findAll() {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM stokvels ORDER BY created_at DESC');
        return rows.map(Stokvel._format);
    },

    async countDocuments(conditions = {}) {
        const pool = getPool();
        let query = 'SELECT COUNT(*) as count FROM stokvels';
        const params = [];
        const clauses = [];

        if (conditions.status) { clauses.push('status = ?'); params.push(conditions.status); }
        if (clauses.length > 0) query += ' WHERE ' + clauses.join(' AND ');

        const [rows] = await pool.query(query, params);
        return rows[0].count;
    },

    async updateById(id, updates) {
        const pool = getPool();
        const fields = [];
        const params = [];

        const mapping = {
            name: 'name', type: 'type', description: 'description', icon: 'icon',
            color: 'color', targetAmount: 'target_amount', maxMembers: 'max_members',
            interestRate: 'interest_rate', overdueInterestRate: 'overdue_interest_rate',
            loanPercentageLimit: 'loan_percentage_limit', loanRepaymentDays: 'loan_repayment_days',
            cycle: 'cycle', meetingDay: 'meeting_day', nextPayout: 'next_payout', status: 'status',
        };

        for (const [key, col] of Object.entries(mapping)) {
            if (updates[key] !== undefined) { fields.push(`${col} = ?`); params.push(updates[key]); }
        }

        if (fields.length === 0) return;
        params.push(id);
        await pool.query(`UPDATE stokvels SET ${fields.join(', ')} WHERE id = ?`, params);
        return await Stokvel.findById(id);
    },

    async deleteById(id) {
        const pool = getPool();
        await pool.query('DELETE FROM stokvels WHERE id = ?', [id]);
    },

    _format(row) {
        if (!row) return null;
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            description: row.description,
            icon: row.icon,
            color: row.color,
            targetAmount: parseFloat(row.target_amount),
            maxMembers: row.max_members,
            interestRate: parseFloat(row.interest_rate),
            overdueInterestRate: parseFloat(row.overdue_interest_rate),
            loanPercentageLimit: parseFloat(row.loan_percentage_limit),
            loanRepaymentDays: row.loan_repayment_days,
            cycle: row.cycle,
            meetingDay: row.meeting_day,
            nextPayout: row.next_payout,
            status: row.status,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
};

module.exports = Stokvel;
