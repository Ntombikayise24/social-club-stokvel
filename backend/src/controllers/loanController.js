const Loan = require('../models/Loan');
const Membership = require('../models/Membership');
const Notification = require('../models/Notification');
const { calculateLoanInterest, getLoanDueDate } = require('../utils/helpers');

/**
 * POST /api/loans
 * Request a new loan (instant approval - based on savings)
 */
exports.requestLoan = async (req, res) => {
    try {
        const { membershipId, amount, purpose } = req.body;

        // Find membership
        const membership = await Membership.findByIdWithStokvel(membershipId);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found',
            });
        }

        // Verify the user owns this membership
        if (membership.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized for this membership',
            });
        }

        const stokvel = membership.stokvel;

        // Calculate max borrowable (50% of savings)
        const maxBorrowable = Math.floor(
            membership.savedAmount * (stokvel.loanPercentageLimit / 100)
        );

        // Get total outstanding loans for this membership
        const outstandingLoans = await Loan.findOutstandingByMembership(membership.id);
        const totalBorrowed = outstandingLoans.reduce((sum, l) => sum + l.amount, 0);
        const remainingToBorrow = maxBorrowable - totalBorrowed;

        // Validate amount
        if (amount < 100) {
            return res.status(400).json({
                success: false,
                message: 'Minimum loan amount is R100',
            });
        }

        if (amount > remainingToBorrow) {
            return res.status(400).json({
                success: false,
                message: `You can only borrow up to R${remainingToBorrow}. Max: R${maxBorrowable}, Already borrowed: R${totalBorrowed}`,
            });
        }

        // Calculate interest
        const loanCalc = calculateLoanInterest(amount, stokvel.interestRate);
        const dueDate = getLoanDueDate(stokvel.loanRepaymentDays);

        // Create loan (instant approval)
        const loan = await Loan.create({
            userId: req.user.id,
            stokvelId: stokvel.id,
            membershipId: membership.id,
            amount: loanCalc.principal,
            interestRate: loanCalc.interestRate,
            interest: loanCalc.interest,
            totalRepayable: loanCalc.totalRepayable,
            purpose: purpose || '',
            dueDate,
            status: 'active',
        });

        // Notify user
        await Notification.create({
            userId: req.user.id,
            message: `Loan of R${amount} from ${stokvel.name} approved! Repay R${loanCalc.totalRepayable} by ${dueDate.toLocaleDateString('en-ZA')}`,
            type: 'loan',
            relatedId: loan.id,
            relatedModel: 'Loan',
        });

        res.status(201).json({
            success: true,
            message: `Loan of R${amount} from ${stokvel.name} successfully processed!`,
            data: {
                id: loan.id,
                amount: loan.amount,
                interest: loan.interest,
                interestRate: loan.interestRate,
                totalRepayable: loan.totalRepayable,
                dueDate: loan.dueDate,
                status: loan.status,
                stokvelName: stokvel.name,
            },
        });
    } catch (error) {
        console.error('RequestLoan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process loan request',
            error: error.message,
        });
    }
};

/**
 * GET /api/loans?membershipId=xxx
 * Get loan history for a membership
 */
exports.getLoans = async (req, res) => {
    try {
        const { membershipId, status } = req.query;

        if (!membershipId) {
            return res.status(400).json({
                success: false,
                message: 'membershipId query param is required',
            });
        }

        const loans = await Loan.findByMembership(membershipId, { status });

        // Check and update overdue statuses
        const now = new Date();
        const processedLoans = loans.map((loan) => {
            const daysRemaining = Math.ceil((new Date(loan.dueDate) - now) / (1000 * 60 * 60 * 24));
            const isOverdue = loan.status === 'active' && daysRemaining < 0;

            return {
                id: loan.id,
                stokvelName: loan.stokvelName,
                amount: loan.amount,
                interest: loan.interest,
                interestRate: loan.interestRate,
                totalRepayable: loan.totalRepayable,
                status: isOverdue ? 'overdue' : loan.status,
                purpose: loan.purpose,
                borrowedDate: loan.createdAt,
                dueDate: loan.dueDate,
                repaidDate: loan.repaidDate,
                daysRemaining: loan.status === 'repaid' ? null : daysRemaining,
            };
        });

        // Stats
        const stats = {
            totalInterestPaid: processedLoans
                .filter((l) => l.status === 'repaid')
                .reduce((sum, l) => sum + l.interest, 0),
            activeLoans: processedLoans.filter((l) => l.status === 'active').length,
            totalBorrowed: processedLoans.reduce((sum, l) => sum + l.amount, 0),
            totalRepaid: processedLoans
                .filter((l) => l.status === 'repaid')
                .reduce((sum, l) => sum + l.totalRepayable, 0),
            overdueLoans: processedLoans.filter((l) => l.status === 'overdue').length,
            activeLoanTotal: processedLoans
                .filter((l) => l.status === 'active')
                .reduce((sum, l) => sum + l.totalRepayable, 0),
        };

        res.json({
            success: true,
            data: {
                loans: processedLoans,
                stats,
            },
        });
    } catch (error) {
        console.error('GetLoans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loans',
        });
    }
};

/**
 * PUT /api/loans/:id/repay
 * Repay a loan
 */
exports.repayLoan = async (req, res) => {
    try {
        const loan = await Loan.findByIdWithStokvel(req.params.id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }

        // Verify ownership
        if (loan.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to repay this loan',
            });
        }

        if (loan.status === 'repaid') {
            return res.status(400).json({
                success: false,
                message: 'Loan already repaid',
            });
        }

        // Check if overdue - apply penalty interest
        const now = new Date();
        const daysRemaining = Math.ceil((new Date(loan.dueDate) - now) / (1000 * 60 * 60 * 24));
        let finalRepayable = loan.totalRepayable;

        const updates = { status: 'repaid', repaidDate: now };

        if (daysRemaining < 0) {
            // Overdue: recalculate with 60% interest
            const overdueInterest = loan.amount * 0.6;
            finalRepayable = loan.amount + overdueInterest;
            updates.interest = overdueInterest;
            updates.interestRate = 60;
            updates.totalRepayable = finalRepayable;
        }

        await Loan.updateById(loan.id, updates);

        // Notify user
        await Notification.create({
            userId: req.user.id,
            message: `Loan of R${loan.amount} to ${loan.stokvel.name} repaid successfully (R${finalRepayable} total)`,
            type: 'loan',
            relatedId: loan.id,
            relatedModel: 'Loan',
        });

        res.json({
            success: true,
            message: 'Loan repaid successfully',
            data: {
                id: loan.id,
                amount: loan.amount,
                interest: updates.interest || loan.interest,
                totalRepaid: finalRepayable,
                repaidDate: now,
                wasOverdue: daysRemaining < 0,
            },
        });
    } catch (error) {
        console.error('RepayLoan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to repay loan',
        });
    }
};

/**
 * GET /api/loans/summary
 * Get loan borrowing summary for a membership
 */
exports.getLoanSummary = async (req, res) => {
    try {
        const { membershipId } = req.query;

        if (!membershipId) {
            return res.status(400).json({
                success: false,
                message: 'membershipId query param is required',
            });
        }

        const membership = await Membership.findByIdWithStokvel(membershipId);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found',
            });
        }

        const stokvel = membership.stokvel;
        const maxLoanAmount = Math.floor(
            membership.savedAmount * (stokvel.loanPercentageLimit / 100)
        );

        const outstandingLoans = await Loan.findOutstandingByMembership(membership.id);
        const totalBorrowed = outstandingLoans.reduce((sum, l) => sum + l.amount, 0);
        const remainingToBorrow = Math.max(0, maxLoanAmount - totalBorrowed);

        res.json({
            success: true,
            data: {
                savedAmount: membership.savedAmount,
                maxLoanAmount,
                totalBorrowed,
                remainingToBorrow,
                interestRate: stokvel.interestRate,
                repaymentDays: stokvel.loanRepaymentDays,
                overdueInterestRate: stokvel.overdueInterestRate,
                stokvelName: stokvel.name,
                stokvelIcon: stokvel.icon,
            },
        });
    } catch (error) {
        console.error('GetLoanSummary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loan summary',
        });
    }
};
