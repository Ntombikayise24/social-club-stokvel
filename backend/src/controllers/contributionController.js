const Contribution = require('../models/Contribution');
const Membership = require('../models/Membership');
const Notification = require('../models/Notification');
const User = require('../models/User');
const {
    validateContributionAmount,
    calculateProgress,
    wouldCompleteTarget,
    isValidPaymentMethod,
    generateReference,
} = require('../utils/helpers');

/**
 * POST /api/contributions
 * Add a new contribution with comprehensive validation
 * BUSINESS LOGIC:
 * - Validate amount against remaining target
 * - Check payment method validity
 * - Generate transaction reference
 * - Notify admins for approval
 * - Trigger notifications if target would be met
 */
exports.addContribution = async (req, res) => {
    try {
        const { membershipId, amount, paymentMethod } = req.body;

        // Validate input
        if (!membershipId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'membershipId and amount are required',
            });
        }

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

        // Parse amount as number
        const contributionAmount = parseFloat(amount);

        // BUSINESS LOGIC: Validate contribution amount
        const remaining = membership.targetAmount - membership.savedAmount;
        const validation = validateContributionAmount(contributionAmount, remaining, 50);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join('; '),
            });
        }

        // BUSINESS LOGIC: Validate payment method
        if (!isValidPaymentMethod(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Use: card, bank, cash, or mobile',
            });
        }

        // Create contribution with generated reference
        const reference = generateReference('CONT');
        const contribution = await Contribution.create({
            userId: req.user.id,
            stokvelId: membership.stokvelId,
            membershipId: membership.id,
            amount: contributionAmount,
            paymentMethod: paymentMethod || 'card',
            status: 'pending',
            reference,
        });

        // BUSINESS LOGIC: Check if contribution would complete target
        const wouldComplete = wouldCompleteTarget(membership.savedAmount, contributionAmount, membership.targetAmount);

        // Notify admins for approval
        const admins = await User.find({ role: 'admin', status: 'active' });
        const adminNotifications = admins.map((admin) => ({
            userId: admin.id,
            message: `New contribution of R${contributionAmount} from ${req.user.full_name} to ${membership.stokvel.name} (${paymentMethod})`,
            type: 'contribution',
            relatedId: contribution.id,
            relatedModel: 'Contribution',
        }));
        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }

        // Notify user of submission
        await Notification.create({
            userId: req.user.id,
            message: `Contribution of R${contributionAmount} to ${membership.stokvel.name} submitted for approval (Ref: ${reference})`,
            type: 'submission',
            relatedId: contribution.id,
            relatedModel: 'Contribution',
        });

        res.status(201).json({
            success: true,
            message: `Contribution of R${contributionAmount} to ${membership.stokvel.name} submitted for approval!`,
            data: {
                id: contribution.id,
                amount: contributionAmount,
                status: contribution.status,
                reference,
                paymentMethod,
                stokvelName: membership.stokvel.name,
                wouldCompleteTarget: wouldComplete,
                remainingAfterContribution: remaining - contributionAmount,
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
 * Confirm a pending contribution with comprehensive business logic
 * BUSINESS LOGIC:
 * - Verify contribution is pending
 * - Update membership savings
 * - Check if member completed their target (milestone)
 * - Trigger notifications
 * - Check if stokvel group target was reached
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

        if (contribution.status === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Rejected contributions cannot be confirmed',
            });
        }

        // Get membership and stokvel details
        const membership = await Membership.findByIdWithStokvel(contribution.membershipId);
        const user = await User.findById(contribution.userId);

        // BUSINESS LOGIC: Confirm the contribution
        await Contribution.updateById(contribution.id, {
            status: 'confirmed',
            confirmedBy: req.user.id,
            confirmedAt: new Date(),
        });

        // Update membership savedAmount with new contribution
        const newSavedAmount = membership.savedAmount + contribution.amount;
        await Membership.updateSavedAmount(contribution.membershipId, contribution.amount);

        // BUSINESS LOGIC: Check if member completed their individual target
        const memberTargetMet = newSavedAmount >= membership.targetAmount;
        
        let milestone = null;
        if (memberTargetMet) {
            milestone = 'target_completed';
        }

        // BUSINESS LOGIC: Fetch updated membership to get group stats
        const updatedMembership = await Membership.findByIdWithStokvel(contribution.membershipId);
        const allMemberships = await Membership.findByStokvel(updatedMembership.stokvelId);
        const totalGroupSaved = allMemberships.reduce((sum, m) => sum + m.savedAmount, 0);
        const groupTarget = updatedMembership.stokvel.targetAmount * updatedMembership.stokvel.maxMembers;
        const groupTargetMet = totalGroupSaved >= groupTarget;

        // Notify the user of confirmation
        const messages = [`Your contribution of R${contribution.amount} has been confirmed`];
        if (memberTargetMet) {
            messages.push(' - Congratulations! You have completed your individual target!');
        }

        await Notification.create({
            userId: contribution.userId,
            message: messages.join(''),
            type: 'contribution',
            relatedId: contribution.id,
            relatedModel: 'Contribution',
        });

        // If group target is met, notify all members
        if (groupTargetMet) {
            const groupMembers = allMemberships.map((m) => m.userId);
            const groupNotifications = groupMembers
                .filter((uid) => uid !== contribution.userId) // Don't double-notify
                .map((userId) => ({
                    userId,
                    message: `${updatedMembership.stokvel.name} has reached its group target! Payout processing begins soon.`,
                    type: 'milestone',
                    relatedId: updatedMembership.stokvelId,
                    relatedModel: 'Stokvel',
                }));

            if (groupNotifications.length > 0) {
                await Notification.insertMany(groupNotifications);
            }
        }

        res.json({
            success: true,
            message: 'Contribution confirmed successfully',
            data: {
                id: contribution.id,
                amount: contribution.amount,
                status: 'confirmed',
                reference: contribution.reference,
                memberName: user.full_name,
                memberTargetMet: memberTargetMet,
                memberSavedAmount: newSavedAmount,
                memberTargetAmount: membership.targetAmount,
                groupTargetMet,
                groupTotalSaved: totalGroupSaved,
                groupTarget,
                milestone,
            },
        });
    } catch (error) {
        console.error('ConfirmContribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm contribution',
            error: error.message,
        });
    }
};
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
