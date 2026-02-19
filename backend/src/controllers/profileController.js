const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Membership = require('../models/Membership');

/**
 * GET /api/profile
 * Get current user's profile with all stokvel memberships
 */
exports.getProfile = async (req, res) => {
    try {
        const user = req.user;

        // findByUser already JOINs with stokvels
        const memberships = await Membership.findByUser(user.id);

        const profiles = memberships.map((m) => ({
            id: m.id,
            stokvelName: m.stokvelName,
            stokvelId: m.stokvelId,
            stokvelIcon: m.stokvelIcon,
            stokvelColor: m.stokvelColor,
            role: m.role,
            targetAmount: m.targetAmount,
            savedAmount: m.savedAmount,
            progress: m.targetAmount > 0 ? Math.round((m.savedAmount / m.targetAmount) * 100) : 0,
            joinedDate: m.createdAt,
            status: m.status,
        }));

        const stats = {
            totalSaved: profiles.reduce((sum, p) => sum + p.savedAmount, 0),
            totalTarget: profiles.reduce((sum, p) => sum + p.targetAmount, 0),
            activeGroups: profiles.filter((p) => p.status === 'active').length,
        };

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    memberSince: user.created_at,
                },
                profiles,
                stats,
            },
        });
    } catch (error) {
        console.error('GetProfile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
        });
    }
};

/**
 * PUT /api/profile
 * Update current user's personal information
 */
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;
        const user = req.user;

        // Check email uniqueness if changing
        if (email && email !== user.email) {
            const existing = await User.findByEmail(email);
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use',
                });
            }
        }

        const updates = {};
        if (fullName) updates.full_name = fullName;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;

        await User.updateById(user.id, updates);
        const updated = await User.findById(user.id);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updated.id,
                fullName: updated.full_name,
                email: updated.email,
                phone: updated.phone,
            },
        });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
};

/**
 * PUT /api/profile/password
 * Change password
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByIdWithPassword(req.user.id);

        const isMatch = await User.comparePassword(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updateById(req.user.id, { password: hashedPassword });

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('ChangePassword error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
        });
    }
};
