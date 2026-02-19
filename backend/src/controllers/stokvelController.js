const Stokvel = require('../models/Stokvel');
const Membership = require('../models/Membership');
const Loan = require('../models/Loan');

/**
 * GET /api/stokvels
 * Get all stokvels (with member counts)
 */
exports.getAllStokvels = async (req, res) => {
    try {
        const stokvels = await Stokvel.findAll();

        const stokvelData = await Promise.all(
            stokvels.map(async (stokvel) => {
                const memberships = await Membership.findByStokvel(stokvel.id);
                const totalSaved = memberships.reduce((sum, m) => sum + m.savedAmount, 0);
                const memberCount = memberships.length;
                const groupTarget = stokvel.targetAmount * stokvel.maxMembers;
                const progress = groupTarget > 0 ? Math.round((totalSaved / groupTarget) * 100) : 0;

                return {
                    id: stokvel.id,
                    name: stokvel.name,
                    type: stokvel.type,
                    description: stokvel.description,
                    icon: stokvel.icon,
                    color: stokvel.color,
                    targetAmount: stokvel.targetAmount,
                    groupTarget,
                    totalSaved,
                    maxMembers: stokvel.maxMembers,
                    currentMembers: memberCount,
                    progress,
                    interestRate: stokvel.interestRate,
                    cycle: stokvel.cycle,
                    meetingDay: stokvel.meetingDay,
                    nextPayout: stokvel.nextPayout,
                    status: stokvel.status,
                    createdAt: stokvel.createdAt,
                };
            })
        );

        res.json({
            success: true,
            data: stokvelData,
        });
    } catch (error) {
        console.error('GetAllStokvels error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stokvels',
        });
    }
};

/**
 * GET /api/stokvels/:id
 * Get stokvel details with members and active loans
 */
exports.getStokvelDetails = async (req, res) => {
    try {
        const stokvel = await Stokvel.findById(req.params.id);
        if (!stokvel) {
            return res.status(404).json({
                success: false,
                message: 'Stokvel not found',
            });
        }

        // Get members
        const memberships = await Membership.findByStokvel(stokvel.id);

        const members = memberships.map((m) => ({
            id: m.userId,
            membershipId: m.id,
            name: m.user.fullName,
            initials: m.user.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase(),
            joinedDate: m.createdAt,
            totalContributed: m.savedAmount,
            targetAmount: m.targetAmount,
            progress: m.targetAmount > 0 ? Math.round((m.savedAmount / m.targetAmount) * 100) : 0,
            status: m.status,
            lastActive: m.user.lastActive,
            role: m.role,
        }));

        // Get active loans
        const activeLoans = await Loan.findByStokvel(stokvel.id, { statusList: ['active', 'overdue'] });

        const loans = activeLoans.map((l) => ({
            id: l.id,
            memberName: l.userName,
            memberInitials: l.userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase(),
            amount: l.amount,
            interest: l.interest,
            totalRepayable: l.totalRepayable,
            status: l.status,
            borrowedDate: l.createdAt,
            dueDate: l.dueDate,
            daysRemaining: l.status === 'repaid' ? null : Math.ceil((new Date(l.dueDate) - new Date()) / (1000 * 60 * 60 * 24)),
        }));

        // Aggregates
        const totalSaved = memberships.reduce((sum, m) => sum + m.savedAmount, 0);
        const groupTarget = stokvel.targetAmount * stokvel.maxMembers;
        const progress = groupTarget > 0 ? Math.round((totalSaved / groupTarget) * 100) : 0;

        res.json({
            success: true,
            data: {
                id: stokvel.id,
                name: stokvel.name,
                type: stokvel.type,
                description: stokvel.description,
                icon: stokvel.icon,
                color: stokvel.color,
                targetAmount: stokvel.targetAmount,
                groupTarget,
                totalSaved,
                maxMembers: stokvel.maxMembers,
                currentMembers: memberships.length,
                progress,
                interestRate: stokvel.interestRate,
                cycle: stokvel.cycle,
                meetingDay: stokvel.meetingDay,
                nextPayout: stokvel.nextPayout,
                status: stokvel.status,
                createdAt: stokvel.createdAt,
                members,
                activeLoans: loans,
            },
        });
    } catch (error) {
        console.error('GetStokvelDetails error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stokvel details',
        });
    }
};

/**
 * POST /api/stokvels
 * Create a new stokvel (admin only)
 */
exports.createStokvel = async (req, res) => {
    try {
        const {
            name, type, description, icon, color, targetAmount, maxMembers,
            interestRate, cycle, meetingDay, nextPayout, status,
        } = req.body;

        const stokvel = await Stokvel.create({
            name,
            type: type || 'traditional',
            description,
            icon: icon || '🌱',
            color: color || 'primary',
            targetAmount,
            maxMembers,
            interestRate: interestRate || 30,
            cycle: cycle || 'weekly',
            meetingDay,
            nextPayout,
            status: status || 'active',
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Stokvel created successfully',
            data: stokvel,
        });
    } catch (error) {
        console.error('CreateStokvel error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create stokvel',
            error: error.message,
        });
    }
};

/**
 * PUT /api/stokvels/:id
 * Update a stokvel (admin only)
 */
exports.updateStokvel = async (req, res) => {
    try {
        const stokvel = await Stokvel.updateById(req.params.id, req.body);

        if (!stokvel) {
            return res.status(404).json({
                success: false,
                message: 'Stokvel not found',
            });
        }

        res.json({
            success: true,
            message: 'Stokvel updated successfully',
            data: stokvel,
        });
    } catch (error) {
        console.error('UpdateStokvel error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stokvel',
        });
    }
};

/**
 * DELETE /api/stokvels/:id
 * Delete a stokvel (admin only)
 */
exports.deleteStokvel = async (req, res) => {
    try {
        const stokvel = await Stokvel.findById(req.params.id);
        if (!stokvel) {
            return res.status(404).json({
                success: false,
                message: 'Stokvel not found',
            });
        }

        // Check for active members
        const memberCount = await Membership.countByStokvel(stokvel.id, 'active');
        if (memberCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete stokvel with ${memberCount} active members`,
            });
        }

        await Stokvel.deleteById(stokvel.id);

        res.json({
            success: true,
            message: 'Stokvel deleted successfully',
        });
    } catch (error) {
        console.error('DeleteStokvel error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete stokvel',
        });
    }
};
