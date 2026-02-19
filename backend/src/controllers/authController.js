const User = require('../models/User');
const Membership = require('../models/Membership');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/helpers');

/**
 * POST /api/auth/register
 * Register a new user (status: pending until admin approves)
 */
exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, password, preferredGroups, message } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        // Create user with pending status
        const user = await User.create({
            fullName,
            email,
            phone,
            password,
            message: message || '',
            status: 'pending',
            role: 'member',
        });

        // Save preferred groups
        if (preferredGroups && preferredGroups.length > 0) {
            await User.setPreferredGroups(user.id, preferredGroups);
        }

        // Create notification for admins
        const admins = await User.find({ role: 'admin', status: 'active' });
        const adminNotifications = admins.map((admin) => ({
            userId: admin.id,
            message: `New registration request from ${fullName} (${email})`,
            type: 'approval',
            relatedId: user.id,
            relatedModel: 'User',
        }));
        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }

        res.status(201).json({
            success: true,
            message:
                'Registration successful! Your preferences have been submitted for admin approval. You will receive an email once approved.',
            data: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message,
        });
    }
};

/**
 * POST /api/auth/login
 * Login user
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findByEmailWithPassword(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check password
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check if account is pending
        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval',
            });
        }

        // Check if account is inactive
        if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Contact admin.',
            });
        }

        // Update last active
        await User.updateById(user.id, { lastActive: new Date() });

        // Get user's memberships (profiles)
        const memberships = await Membership.findByUser(user.id);

        const profiles = memberships.map((m) => ({
            id: m.id,
            stokvelName: m.stokvel.name,
            stokvelId: m.stokvel.id,
            stokvelIcon: m.stokvel.icon,
            stokvelColor: m.stokvel.color,
            role: m.role,
            targetAmount: m.targetAmount,
            savedAmount: m.savedAmount,
            progress: m.targetAmount > 0 ? Math.round((m.savedAmount / m.targetAmount) * 100) : 0,
        }));

        // Generate token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    memberSince: user.created_at,
                },
                profiles,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
    }
};

/**
 * GET /api/auth/me
 * Get current user info
 */
exports.getMe = async (req, res) => {
    try {
        const user = req.user;

        const memberships = await Membership.findByUser(user.id);

        const profiles = memberships.map((m) => ({
            id: m.id,
            stokvelName: m.stokvel.name,
            stokvelId: m.stokvel.id,
            stokvelIcon: m.stokvel.icon,
            stokvelColor: m.stokvel.color,
            role: m.role,
            targetAmount: m.targetAmount,
            savedAmount: m.savedAmount,
            progress: m.targetAmount > 0 ? Math.round((m.savedAmount / m.targetAmount) * 100) : 0,
            joinedDate: m.createdAt,
        }));

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    memberSince: user.created_at,
                    lastActive: user.last_active,
                },
                profiles,
            },
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data',
        });
    }
};
