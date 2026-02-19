const { getPool } = require('../config/db');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Stokvel = require('../models/Stokvel');
const Contribution = require('../models/Contribution');
const Loan = require('../models/Loan');
const Notification = require('../models/Notification');

/**
 * GET /api/admin/overview
 * Admin dashboard overview stats
 */
exports.getOverview = async (req, res) => {
    try {
        const pool = getPool();

        // Users
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const pendingUsers = await User.countDocuments({ status: 'pending' });

        // Stokvels
        const totalStokvels = await Stokvel.countDocuments();
        const activeStokvels = await Stokvel.countDocuments({ status: 'active' });
        const upcomingStokvels = await Stokvel.countDocuments({ status: 'upcoming' });

        // Contributions aggregate
        const contribAgg = await Contribution.aggregate();
        const pendingContributions = await Contribution.countDocuments({ status: 'pending' });
        const pendingAmount = await Contribution.aggregatePending();

        // Loans
        const [loanRows] = await pool.query(
            `SELECT 
                SUM(CASE WHEN status IN ('active','overdue') THEN 1 ELSE 0 END) as activeLoans,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdueLoans
             FROM loans`
        );
        const loanStats = loanRows[0] || { activeLoans: 0, overdueLoans: 0 };

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    pending: pendingUsers,
                },
                stokvels: {
                    total: totalStokvels,
                    active: activeStokvels,
                    upcoming: upcomingStokvels,
                },
                contributions: {
                    totalAmount: contribAgg.totalAmount || 0,
                    count: contribAgg.count || 0,
                    pending: pendingContributions,
                    pendingAmount: pendingAmount || 0,
                },
                loans: {
                    active: Number(loanStats.activeLoans) || 0,
                    overdue: Number(loanStats.overdueLoans) || 0,
                },
            },
        });
    } catch (error) {
        console.error('AdminOverview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin overview',
        });
    }
};

/**
 * GET /api/admin/users
 * Get all users with their memberships
 */
exports.getUsers = async (req, res) => {
    try {
        const { search, stokvelId, status } = req.query;

        const conditions = {};
        if (status && status !== 'all') {
            conditions.status = status;
        }
        if (search) {
            conditions.search = search;
        }

        const users = await User.find(conditions);

        // Get memberships for each user
        const usersWithProfiles = await Promise.all(
            users.map(async (user) => {
                const memberships = await Membership.findByUser(user.id);

                const profiles = memberships.map((m) => ({
                    id: m.id,
                    stokvelId: m.stokvelId,
                    stokvelName: m.stokvelName,
                    role: m.role,
                    targetAmount: m.targetAmount,
                    savedAmount: m.savedAmount,
                    joinedDate: m.createdAt,
                }));

                return {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    joinedDate: user.created_at,
                    lastActive: user.last_active,
                    profiles,
                };
            })
        );

        // Filter by stokvel if specified
        let filtered = usersWithProfiles;
        if (stokvelId && stokvelId !== 'all') {
            const sid = parseInt(stokvelId);
            filtered = usersWithProfiles.filter(
                (u) =>
                    u.profiles.some((p) => p.stokvelId === sid) ||
                    u.status === 'pending'
            );
        }

        res.json({
            success: true,
            data: filtered,
        });
    } catch (error) {
        console.error('AdminGetUsers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
        });
    }
};

/**
 * PUT /api/admin/users/:id/approve
 * Approve a pending user and assign them to stokvels
 */
exports.approveUser = async (req, res) => {
    try {
        const { stokvelIds } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `User is already ${user.status}`,
            });
        }

        // Activate the user
        await User.updateById(user.id, { status: 'active' });

        // Create memberships for assigned stokvels
        const preferredGroups = await User.getPreferredGroups(user.id);
        const stokvelsToAssign =
            stokvelIds && stokvelIds.length > 0
                ? stokvelIds
                : preferredGroups;

        const membershipsCreated = [];
        for (const stokvelId of stokvelsToAssign) {
            const stokvel = await Stokvel.findById(stokvelId);
            if (!stokvel) continue;

            // Check capacity
            const currentMembers = await Membership.countByStokvel(stokvelId);
            if (currentMembers >= stokvel.maxMembers) continue;

            // Check for duplicate
            const existing = await Membership.findOne({
                userId: user.id,
                stokvelId,
            });
            if (existing) continue;

            try {
                const membership = await Membership.create({
                    userId: user.id,
                    stokvelId,
                    role: 'member',
                    targetAmount: stokvel.targetAmount,
                    savedAmount: 0,
                    status: 'active',
                });
                membershipsCreated.push({
                    stokvelName: stokvel.name,
                    membershipId: membership.id,
                });
            } catch (err) {
                // Duplicate entry - skip
                if (err.code !== 'ER_DUP_ENTRY') throw err;
            }
        }

        // Notify user
        await Notification.create({
            userId: user.id,
            message: `Welcome to SOCIAL CLUB! You've been approved and added to ${membershipsCreated.length} stokvel(s).`,
            type: 'approval',
            relatedId: user.id,
            relatedModel: 'User',
        });

        res.json({
            success: true,
            message: `User ${user.full_name} approved and added to ${membershipsCreated.length} stokvel(s)`,
            data: {
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    status: 'active',
                },
                memberships: membershipsCreated,
            },
        });
    } catch (error) {
        console.error('ApproveUser error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve user',
            error: error.message,
        });
    }
};

/**
 * PUT /api/admin/users/:id/status
 * Update user status (activate/deactivate)
 */
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        await User.updateById(req.params.id, { status });
        const updated = await User.findById(req.params.id);

        res.json({
            success: true,
            message: `User status updated to ${status}`,
            data: updated,
        });
    } catch (error) {
        console.error('UpdateUserStatus error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
        });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Prevent deleting admins
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin users',
            });
        }

        // Check for active loans
        const pool = getPool();
        const [loanRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM loans WHERE user_id = ? AND status IN ('active','overdue')`,
            [user.id]
        );
        const activeLoans = loanRows[0].cnt;
        if (activeLoans > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user with ${activeLoans} outstanding loan(s)`,
            });
        }

        // Remove memberships
        await Membership.deleteByUser(user.id);
        // Remove notifications
        await Notification.deleteByUser(user.id);
        // Delete user
        await User.deleteById(user.id);

        res.json({
            success: true,
            message: `User ${user.full_name} deleted successfully`,
        });
    } catch (error) {
        console.error('DeleteUser error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
        });
    }
};

/**
 * POST /api/admin/users/:id/membership
 * Add a user to a stokvel
 */
exports.addUserToStokvel = async (req, res) => {
    try {
        const { stokvelId, role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const stokvel = await Stokvel.findById(stokvelId);
        if (!stokvel) {
            return res.status(404).json({
                success: false,
                message: 'Stokvel not found',
            });
        }

        // Check capacity
        const currentMembers = await Membership.countByStokvel(stokvelId);
        if (currentMembers >= stokvel.maxMembers) {
            return res.status(400).json({
                success: false,
                message: 'Stokvel is at full capacity',
            });
        }

        // Check if already a member
        const existing = await Membership.findOne({
            userId: user.id,
            stokvelId,
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member of this stokvel',
            });
        }

        const membership = await Membership.create({
            userId: user.id,
            stokvelId,
            role: role || 'member',
            targetAmount: stokvel.targetAmount,
            savedAmount: 0,
            status: 'active',
        });

        res.status(201).json({
            success: true,
            message: `${user.full_name} added to ${stokvel.name}`,
            data: membership,
        });
    } catch (error) {
        console.error('AddUserToStokvel error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add user to stokvel',
        });
    }
};

/**
 * GET /api/admin/contributions
 * Get all contributions across all stokvels
 */
exports.getAllContributions = async (req, res) => {
    try {
        const { stokvelId, status } = req.query;

        const filters = {};
        if (stokvelId && stokvelId !== 'all') {
            filters.stokvelId = stokvelId;
        }
        if (status && status !== 'all') {
            filters.status = status;
        }

        const contributions = await Contribution.findAll(filters);

        const data = contributions.map((c) => ({
            id: c.id,
            userId: c.userId,
            userName: c.userName,
            userInitials: c.userName
                ? c.userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                : '',
            stokvelId: c.stokvelId,
            stokvelName: c.stokvelName,
            amount: c.amount,
            date: c.createdAt,
            status: c.status,
            paymentMethod: c.paymentMethod,
            reference: c.reference,
            confirmedBy: c.confirmedByName || null,
            confirmedAt: c.confirmedAt,
        }));

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('AdminGetContributions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contributions',
        });
    }
};
