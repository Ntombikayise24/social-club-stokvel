const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Format currency for response
 */
const formatCurrency = (amount) => {
    return `R ${amount.toLocaleString('en-ZA')}`;
};

/**
 * Calculate loan interest
 */
const calculateLoanInterest = (amount, rate = 30) => {
    const interest = amount * (rate / 100);
    return {
        principal: amount,
        interestRate: rate,
        interest: Math.round(interest * 100) / 100,
        totalRepayable: Math.round((amount + interest) * 100) / 100,
    };
};

/**
 * Get due date (30 days from now)
 */
const getLoanDueDate = (days = 30) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

module.exports = {
    generateToken,
    formatCurrency,
    calculateLoanInterest,
    getLoanDueDate,
};
