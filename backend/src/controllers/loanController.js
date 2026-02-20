const Loan = require('../models/Loan');
const Membership = require('../models/Membership');
const Notification = require('../models/Notification');
const User = require('../models/User');
const {
    calculateLoanInterest,
    calculateOverdueInterest,
    getLoanDueDate,
    calculateDaysOverdue,
    isLoanOverdue,
    validateLoanRequest,
    calculateMaxBorrowable,
    roundMoney,
    generateReference,
    getDaysUntilDate,
} = require('../utils/helpers');

/**
 * POST /api/loans
 * Request a new loan with comprehensive business logic
 * BUSINESS LOGIC:
 * - Validate based on savings (50% max)
 * - Check for existing overdue loans (block if user has overdue)
 * - Calculate interest
 * - Set due date based on stokvel terms
 * - Instant approval
 * - Generate transaction reference
 */
exports.requestLoan = async (req, res) => {
    try {
        const { membershipId, amount, purpose } = req.body;

        // Validate input
        if (!membershipId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'membershipId and amount are required',
            });
        }

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
        const loanAmount = parseFloat(amount);

        // BUSINESS LOGIC: Check for overdue loans (block if user has any overdue)
        const userLoans = await Loan.findByMembership(membership.id);
        const overdueLoans = userLoans.filter((l) => l.status === 'overdue');
        
        if (overdueLoans.length > 0) {
            return res.status(400).json({
                success: false,
                message: `You have ${overdueLoans.length} overdue loan(s). Please repay before requesting new loans.`,
                data: {
                    overdueLoans: overdueLoans.map((l) => ({
                        id: l.id,
                        amount: l.amount,
                        daysOverdue: calculateDaysOverdue(l.dueDate),
                    })),
                },
            });
        }

        // BUSINESS LOGIC: Calculate max borrowable and validate
        const maxBorrowable = calculateMaxBorrowable(membership.savedAmount, stokvel.loanPercentageLimit);
        
        // Get outstanding loans
        const outstandingLoans = userLoans.filter((l) => l.status === 'active');
        const totalBorrowed = outstandingLoans.reduce((sum, l) => sum + l.amount, 0);
        const remainingToBorrow = roundMoney(maxBorrowable - totalBorrowed);

        // Validate loan request
        const validation = validateLoanRequest(loanAmount, remainingToBorrow, 100);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join('; '),
                data: {
                    maxBorrowable,
                    alreadyBorrowed: totalBorrowed,
                    remainingToBorrow,
                    savedAmount: membership.savedAmount,
                },
            });
        }

        // BUSINESS LOGIC: Calculate interest
        const loanCalc = calculateLoanInterest(loanAmount, stokvel.interestRate);
        const dueDate = getLoanDueDate(stokvel.loanRepaymentDays);
        const reference = generateReference('LOAN');

        // Create loan (instant approval)
        const loan = await Loan.create({
            userId: req.user.id,
            stokvelId: stokvel.id,
            membershipId: membership.id,
            amount: loanCalc.principal,
            interestRate: loanCalc.interestRate,
            interest: loanCalc.interest,
            totalRepayable: loanCalc.totalRepayable,
            purpose: purpose || 'General',
            dueDate,
            status: 'active',
            reference,
        });

        // Notify user with detailed information
        const daysUntilDue = getDaysUntilDate(dueDate);
        const user = await User.findById(req.user.id);
        
        await Notification.create({
            userId: req.user.id,
            message: `✅ Loan of R${loanAmount} approved from ${stokvel.name}! Total repayable: R${loanCalc.totalRepayable} by ${new Date(dueDate).toLocaleDateString('en-ZA')} (${daysUntilDue} days). Ref: ${reference}`,
            type: 'loan',
            relatedId: loan.id,
            relatedModel: 'Loan',
        });

        // Notify admins
        const admins = await User.find({ role: 'admin', status: 'active' });
        const adminNotifications = admins.map((admin) => ({
            userId: admin.id,
            message: `New loan of R${loanAmount} from ${user.full_name} on ${stokvel.name} (Due: ${new Date(dueDate).toLocaleDateString('en-ZA')})`,
            type: 'loan',
            relatedId: loan.id,
            relatedModel: 'Loan',
        }));
        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }

        res.status(201).json({
            success: true,
            message: `Loan of R${loanAmount} successfully approved!`,
            data: {
                id: loan.id,
                reference,
                amount: loanCalc.principal,
                interest: loanCalc.interest,
                interestRate: loanCalc.interestRate,
                totalRepayable: loanCalc.totalRepayable,
                dueDate,
                daysUntilDue,
                status: 'active',
                stokvelName: stokvel.name,
                newRemainingBorrowable: roundMoney(remainingToBorrow - loanAmount),
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
 * Repay a loan with comprehensive business logic
 * BUSINESS LOGIC:
 * - Check if loan is overdue
 * - Calculate penalty interest if overdue (60%)
 * - Update loan status to repaid
 * - Notify user and admins
 * - Track repayment date
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

        const now = new Date();

        // BUSINESS LOGIC: Check if loan is overdue and calculate penalties
        const isOverdue = isLoanOverdue(loan.dueDate);
        const daysOverdue = calculateDaysOverdue(loan.dueDate);
        let finalRepayable = loan.totalRepayable;
        let penaltyCharged = false;
        let overdueInterestAmount = 0;

        const updates = { 
            status: 'repaid', 
            repaidDate: now,
        };

        if (isOverdue) {
            // BUSINESS LOGIC: Apply overdue interest (60% instead of original 30%)
            const overdueCalc = calculateOverdueInterest(
                loan.amount,
                daysOverdue,
                loan.interestRate,
                loan.stokvel?.overdueInterestRate || 60
            );
            
            overdueInterestAmount = overdueCalc.overdueInterest;
            finalRepayable = overdueCalc.totalAmount;
            penaltyCharged = true;

            // Update with overdue interest
            updates.interest = overdueInterestAmount;
            updates.interestRate = loan.stokvel?.overdueInterestRate || 60;
            updates.totalRepayable = finalRepayable;
        }

        await Loan.updateById(loan.id, updates);
        const user = await User.findById(req.user.id);

        // Notify user with details
        const notificationMsg = penaltyCharged
            ? `⚠️ Overdue loan of R${loan.amount} repaid. Penalty interest of R${roundMoney(overdueInterestAmount)} applied (${daysOverdue} days late). Total repaid: R${finalRepayable}`
            : `✅ Loan of R${loan.amount} repaid successfully. Total repaid: R${finalRepayable}`;

        await Notification.create({
            userId: req.user.id,
            message: notificationMsg,
            type: 'loan',
            relatedId: loan.id,
            relatedModel: 'Loan',
        });

        // Notify admins
        if (penaltyCharged) {
            const admins = await User.find({ role: 'admin', status: 'active' });
            const adminNotifications = admins.map((admin) => ({
                userId: admin.id,
                message: `⚠️ Overdue loan repaid: ${user.full_name} repaid R${loan.amount} with penalty (${daysOverdue} days late). Penalty: R${roundMoney(overdueInterestAmount)}`,
                type: 'loan',
                relatedId: loan.id,
                relatedModel: 'Loan',
            }));
            if (adminNotifications.length > 0) {
                await Notification.insertMany(adminNotifications);
            }
        }

        res.json({
            success: true,
            message: penaltyCharged ? 'Loan repaid with overdue penalty applied' : 'Loan repaid successfully',
            data: {
                id: loan.id,
                amount: loan.amount,
                originalInterest: loan.interest,
                originalInterestRate: loan.interestRate,
                originalTotal: loan.totalRepayable,
                finalInterest: updates.interest || loan.interest,
                finalInterestRate: updates.interestRate || loan.interestRate,
                finalTotalRepaid: finalRepayable,
                penaltyApplied: penaltyCharged,
                daysOverdue,
                repaidDate: now,
                reference: loan.reference,
            },
        });
    } catch (error) {
        console.error('RepayLoan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to repay loan',
            error: error.message,
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
