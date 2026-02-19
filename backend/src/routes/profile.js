const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/profile - Get my profile
router.get('/', protect, profileController.getProfile);

// PUT /api/profile - Update personal info
router.put(
    '/',
    protect,
    [
        body('fullName').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email required'),
        body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
    ],
    validate,
    profileController.updateProfile
);

// PUT /api/profile/password - Change password
router.put(
    '/password',
    protect,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
    ],
    validate,
    profileController.changePassword
);

module.exports = router;
