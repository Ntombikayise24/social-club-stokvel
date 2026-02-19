const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const stokvelController = require('../controllers/stokvelController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/stokvels/public - List all stokvels (public, for registration page)
router.get('/public', stokvelController.getAllStokvels);

// GET /api/stokvels - List all stokvels (authenticated)
router.get('/', protect, stokvelController.getAllStokvels);

// GET /api/stokvels/:id - Get stokvel details (members, loans)
router.get('/:id', protect, stokvelController.getStokvelDetails);

// POST /api/stokvels - Create stokvel (admin)
router.post(
    '/',
    protect,
    adminOnly,
    [
        body('name').trim().notEmpty().withMessage('Stokvel name is required'),
        body('targetAmount')
            .isNumeric()
            .withMessage('Target amount must be a number'),
        body('maxMembers')
            .isInt({ min: 1 })
            .withMessage('Max members must be at least 1'),
        body('nextPayout')
            .isISO8601()
            .withMessage('Valid next payout date is required'),
    ],
    validate,
    stokvelController.createStokvel
);

// PUT /api/stokvels/:id - Update stokvel (admin)
router.put('/:id', protect, adminOnly, stokvelController.updateStokvel);

// DELETE /api/stokvels/:id - Delete stokvel (admin)
router.delete('/:id', protect, adminOnly, stokvelController.deleteStokvel);

module.exports = router;
