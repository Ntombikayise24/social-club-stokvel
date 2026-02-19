const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/loans - Request a loan
router.post(
    '/',
    protect,
    [
        body('membershipId').notEmpty().withMessage('Membership ID is required'),
        body('amount')
            .isFloat({ min: 100 })
            .withMessage('Minimum loan is R100'),
        body('purpose').optional().isString(),
    ],
    validate,
    loanController.requestLoan
);

// GET /api/loans?membershipId=xxx&status=all
router.get('/', protect, loanController.getLoans);

// GET /api/loans/summary?membershipId=xxx
router.get('/summary', protect, loanController.getLoanSummary);

// PUT /api/loans/:id/repay
router.put('/:id/repay', protect, loanController.repayLoan);

module.exports = router;
