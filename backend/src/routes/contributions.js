const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/contributions - Add a contribution
router.post(
    '/',
    protect,
    [
        body('membershipId').notEmpty().withMessage('Membership ID is required'),
        body('amount')
            .isFloat({ min: 100 })
            .withMessage('Minimum contribution is R100'),
        body('paymentMethod')
            .optional()
            .isIn(['card', 'bank', 'cash'])
            .withMessage('Invalid payment method'),
    ],
    validate,
    contributionController.addContribution
);

// GET /api/contributions?membershipId=xxx&status=all&memberId=all
router.get('/', protect, contributionController.getContributions);

// PUT /api/contributions/:id/confirm - Admin confirms a pending contribution
router.put(
    '/:id/confirm',
    protect,
    adminOnly,
    contributionController.confirmContribution
);

module.exports = router;
