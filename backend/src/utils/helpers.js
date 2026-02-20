const jwt = require('jsonwebtoken');

/**
 * ═══════════════════════════════════════════════════════════
 * AUTHENTICATION & TOKEN MANAGEMENT
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * ═══════════════════════════════════════════════════════════
 * CURRENCY & FORMATTING UTILITIES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Format currency for response
 */
const formatCurrency = (amount) => {
    return `R ${amount.toLocaleString('en-ZA')}`;
};

/**
 * Round money to 2 decimal places (cents)
 */
const roundMoney = (amount) => {
    return Math.round(amount * 100) / 100;
};

/**
 * ═══════════════════════════════════════════════════════════
 * LOAN CALCULATIONS & BUSINESS LOGIC
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate loan interest (standard rate)
 */
const calculateLoanInterest = (amount, rate = 30) => {
    const interest = roundMoney(amount * (rate / 100));
    return {
        principal: roundMoney(amount),
        interestRate: rate,
        interest: interest,
        totalRepayable: roundMoney(amount + interest),
    };
};

/**
 * Calculate overdue loan interest (penalty interest, usually higher)
 */
const calculateOverdueInterest = (principal, overdueDays, baseRate = 30, overdueRate = 60) => {
    // Simple interest calculation: (P * R * T) / 100
    // where P = principal, R = annual rate, T = time in years
    const dailyRate = overdueRate / 365;
    const overdueInterest = roundMoney((principal * dailyRate * overdueDays) / 100);
    const totalAmount = roundMoney(principal + overdueInterest);
    
    return {
        principal: roundMoney(principal),
        baseRate,
        overdueRate,
        overdueDays,
        overdueInterest,
        totalAmount,
    };
};

/**
 * Get loan due date
 */
const getLoanDueDate = (days = 30) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

/**
 * Check if loan is overdue
 */
const isLoanOverdue = (dueDate) => {
    return new Date() > new Date(dueDate);
};

/**
 * Calculate days overdue
 */
const calculateDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = today - due;
    return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate max borrowable amount (% of savings)
 */
const calculateMaxBorrowable = (savedAmount, loanPercentageLimit = 50) => {
    return roundMoney(savedAmount * (loanPercentageLimit / 100));
};

/**
 * Validate loan request
 */
const validateLoanRequest = (amount, maxBorrowable, minLoanAmount = 100) => {
    const errors = [];
    
    if (amount < minLoanAmount) {
        errors.push(`Minimum loan amount is R${minLoanAmount}`);
    }
    
    if (amount > maxBorrowable) {
        errors.push(`Loan amount exceeds maximum borrowable (R${maxBorrowable})`);
    }
    
    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push('Loan amount must be a positive number');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * ═══════════════════════════════════════════════════════════
 * CONTRIBUTION CALCULATIONS & BUSINESS LOGIC
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Validate contribution amount
 */
const validateContributionAmount = (amount, remainingTarget, minContribution = 50) => {
    const errors = [];
    
    if (amount < minContribution) {
        errors.push(`Minimum contribution is R${minContribution}`);
    }
    
    if (amount > remainingTarget) {
        errors.push(`Amount exceeds remaining target (R${remainingTarget})`);
    }
    
    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push('Contribution amount must be a positive number');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Calculate progress percentage
 */
const calculateProgress = (savedAmount, targetAmount) => {
    if (targetAmount <= 0) return 0;
    return Math.min(100, Math.round((savedAmount / targetAmount) * 100));
};

/**
 * Check if contribution would complete target
 */
const wouldCompleteTarget = (currentSaved, contribution, target) => {
    return (currentSaved + contribution) >= target;
};

/**
 * ═══════════════════════════════════════════════════════════
 * STOKVEL & MEMBERSHIP LOGIC
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate group contribution target
 */
const calculateGroupTarget = (individualTarget, maxMembers) => {
    return roundMoney(individualTarget * maxMembers);
};

/**
 * Check if stokvel is at capacity
 */
const isStokvelAtCapacity = (currentMembers, maxMembers) => {
    return currentMembers >= maxMembers;
};

/**
 * Calculate stokvel progress
 */
const calculateStokvelProgress = (totalSaved, groupTarget) => {
    if (groupTarget <= 0) return 0;
    return Math.min(100, Math.round((totalSaved / groupTarget) * 100));
};

/**
 * ═══════════════════════════════════════════════════════════
 * PAYOUT & DISTRIBUTION LOGIC
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate payout per member
 */
const calculatePayoutPerMember = (totalFund, memberCount) => {
    if (memberCount === 0) return 0;
    return roundMoney(totalFund / memberCount);
};

/**
 * Calculate pro-rata distribution based on contributions
 */
const calculateProRataShare = (memberContribution, totalContributions, fundAmount) => {
    if (totalContributions === 0) return 0;
    const percentage = memberContribution / totalContributions;
    return roundMoney(fundAmount * percentage);
};

/**
 * ═══════════════════════════════════════════════════════════
 * USER & ACCOUNT STATUS LOGIC
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Determine valid status transitions
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        'pending': ['active', 'inactive'],
        'active': ['inactive'],
        'inactive': ['active'],
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Can user perform admin actions (approval of contributions, etc.)
 */
const canUserApproveContributions = (userRole, userStatus) => {
    return userRole === 'admin' && userStatus === 'active';
};

/**
 * Check if user is in good standing
 */
const isInGoodStanding = (userStatus, hasOverdueLoans = false) => {
    return userStatus === 'active' && !hasOverdueLoans;
};

/**
 * ═══════════════════════════════════════════════════════════
 * VALIDATION & CONSTRAINTS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Validate payment method
 */
const isValidPaymentMethod = (method) => {
    const validMethods = ['card', 'bank', 'cash', 'mobile'];
    return validMethods.includes(method?.toLowerCase());
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone format (South African)
 */
const isValidPhoneZA = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10 && cleanPhone.startsWith('0');
};

/**
 * ═══════════════════════════════════════════════════════════
 * DATE & TIME UTILITIES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get days until date
 */
const getDaysUntilDate = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = due - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Format date to ZA locale
 */
const formatDateZA = (date) => {
    return new Date(date).toLocaleDateString('en-ZA');
};

/**
 * Check if date is in the past
 */
const isPast = (date) => {
    return new Date(date) < new Date();
};

/**
 * Get next payment due date
 */
const getNextDueDate = (baseDate = new Date(), daysInterval = 7) => {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + daysInterval);
    return next;
};

/**
 * ═══════════════════════════════════════════════════════════
 * REFERENCE & TRANSACTION ID GENERATION
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Generate transaction reference
 */
const generateTransactionReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TRX-${timestamp}-${random}`;
};

/**
 * Generate reference number
 */
const generateReference = (prefix = 'REF') => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

module.exports = {
    // Authentication
    generateToken,
    
    // Formatting
    formatCurrency,
    roundMoney,
    formatDateZA,
    
    // Loan utilities
    calculateLoanInterest,
    calculateOverdueInterest,
    getLoanDueDate,
    isLoanOverdue,
    calculateDaysOverdue,
    calculateMaxBorrowable,
    validateLoanRequest,
    
    // Contribution utilities
    validateContributionAmount,
    calculateProgress,
    wouldCompleteTarget,
    
    // Stokvel & Membership
    calculateGroupTarget,
    isStokvelAtCapacity,
    calculateStokvelProgress,
    
    // Payout utilities
    calculatePayoutPerMember,
    calculateProRataShare,
    
    // User & Status
    isValidStatusTransition,
    canUserApproveContributions,
    isInGoodStanding,
    
    // Validation
    isValidPaymentMethod,
    isValidEmail,
    isValidPhoneZA,
    
    // Date utilities
    getDaysUntilDate,
    isPast,
    getNextDueDate,
    
    // Reference generation
    generateTransactionReference,
    generateReference,
};
