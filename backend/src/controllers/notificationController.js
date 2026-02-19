const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Get user's notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const { limit = 20, unreadOnly } = req.query;

        const onlyUnread = unreadOnly === 'true';
        const notifications = await Notification.findByUser(req.user.id, {
            limit: parseInt(limit),
            unreadOnly: onlyUnread,
        });

        const unreadCount = await Notification.countUnread(req.user.id);

        res.json({
            success: true,
            data: {
                notifications: notifications.map((n) => ({
                    id: n.id,
                    message: n.message,
                    type: n.type,
                    read: n.read,
                    createdAt: n.createdAt,
                })),
                unreadCount,
            },
        });
    } catch (error) {
        console.error('GetNotifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
        });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const changed = await Notification.markAsRead(req.params.id, req.user.id);

        if (!changed) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        console.error('MarkAsRead error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification',
        });
    }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('MarkAllAsRead error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notifications',
        });
    }
};
