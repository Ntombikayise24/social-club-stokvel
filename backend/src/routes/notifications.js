const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// GET /api/notifications
router.get('/', protect, notificationController.getNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', protect, notificationController.markAllAsRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
