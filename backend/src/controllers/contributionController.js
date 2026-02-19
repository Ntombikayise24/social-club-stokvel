const Contribution = require('../models/Contribution');
const Membership = require('../models/Membership');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * POST /api/contributions
 * Add a new contribution
 */
exports.addContribution = async (req, res) => {
    try {
        const { membershipId, amount, paymentMethod } = req.body;

        // Find the membership
        const membership = await Membership.findByIdWithStokvel(membershipId);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found',
            });
        }

        // Verify the user owns this membership
        if (membership.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to contribute to this membership',
            });
        }

        // Check remaining amount
        const remaining = membership.targetAmount - membership.savedAmount;
        if (amount > remaining) {
            return res.status(400).json({
                success: false,
                message: `Amount exceeds remaining target. Max contribution: R${remaining}`,
            });
        }

        // Create contribution
        const contribution = await Contribution.create({
            userId: req.user.id,
            stokvelId: membership.stokvelId,
            membershipId: membership.id,
            amount,
            paymentMethod: paymentMethod || 'card',
            status: 'pending',
        });

        // Notify admins
        const admins = await User.find({ role: 'admin', status: 'active' });
        const notifications = admins.map((admin) => ({
            userId: admin.id,
            message: `New contribution of R${amount} from ${req.user.full_name} to ${membership.stokvel.name}`,
            type: 'contribution',
            relatedId: contribution.id,
            relatedModel: 'Contribution',
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({
            success: true,
            message: `Contribution of R${amount} to ${membership.stokvel.name} submitted!`,
            data: {
                id: contribution.id,
                amount: contribution.amount,
                status: contribution.status,
                reference: contribution.reference,
                stokvelName: membership.stokvel.name,
            },
        });
    } catch (error) {
        console.error('AddContribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add contribution',
            error: error.message,
        });
    }
};

/**
 * GET /api/contributions?membershipId=xxx
 * Get contributions for a membership (group-level: all members' contributions for that stokvel)
 */
exports.getContributions = async (req, res) => {
    try {
        const { membershipId, status, memberId } = req.query;

        if (!membershipId) {
            return res.status(400).json({
                success: false,
                message: 'membershipId query param is required',
            });
        }

        // Find the membership to get the stokvel
        const membership = await Membership.findById(membershipId);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found',
            });
        }

        const contributions = await Contribution.findByStokvel(membership.stokvelId, {
            status,
            userId: memberId,
        });

        const data = contributions.map((c) => ({
            id: c.id,
            memberName: c.userName,
            memberInitials: c.userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase(),
            amount: c.amount,
            date: c.createdAt,
            status: c.status,
            paymentMethod: c.paymentMethod,
            reference: c.reference,
            confirmedBy: c.confirmedByName || null,
            confirmedAt: c.confirmedAt,
        }));

        // Stats
        const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
        const confirmedCount = contributions.filter((c) => c.status === 'confirmed').length;
        const pendingCount = contributions.filter((c) => c.status === 'pending').length;
        const uniqueMembers = new Set(contributions.map((c) => c.userId)).size;

        res.json({
            success: true,
            data: {
                contributions: data,
                stats: {
                    totalCollected,
                    totalContributions: contributions.length,
                    confirmedCount,
                    pendingCount,
                    uniqueMembers,
                },
            },
        });
    } catch (error) {
        console.error('GetContributions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contributions',
        });
    }
};

/**
 * PUT /api/contributions/:id/confirm
 * Confirm a pending contribution (admin only)
 */
exports.confirmContribution = async (req, res) => {
    try {
        const contribution = await Contribution.findById(req.params.id);
        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found',
            });
        }

        if (contribution.status === 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Contribution already confirmed',
            });
        }

        // Confirm
        await Contribution.updateById(contribution.id, {
            status: 'confirmed',
            confirmedBy: req.user.id,
            confirmedAt: new Date(),
        });

        // Update membership savedAmount
        await Membership.updateSavedAmount(contribution.membershipId, contribution.amount);

        // Notify the user
        await Notification.create({
            userId: contribution.userId,
            message: `Your contribution of R${contribution.amount} has been confirmed`,
            type: 'contribution',
            relatedId: contribution.id,
            relatedModel: 'Contribution',
        });

        res.json({
            success: true,
            message: 'Contribution confirmed successfully',
            data: {
                id: contribution.id,
                amount: contribution.amount,
                status: 'confirmed',
            },
        });
    } catch (error) {
        console.error('ConfirmContribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm contribution',
        });
    }
};
