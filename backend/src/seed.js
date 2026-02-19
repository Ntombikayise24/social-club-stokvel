/**
 * Seed script for SOCIAL CLUB database.
 * Populates MySQL with initial data matching the frontend mock data.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, getPool } = require('./config/db');
const { initializeDatabase } = require('./config/schema');

const User = require('./models/User');
const Stokvel = require('./models/Stokvel');
const Membership = require('./models/Membership');
const Contribution = require('./models/Contribution');
const Loan = require('./models/Loan');
const Notification = require('./models/Notification');

const seedDB = async () => {
    try {
        await connectDB();
        await initializeDatabase();
        const pool = getPool();
        console.log('Connected to MySQL for seeding...');

        // Clear existing data (order matters for foreign keys)
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE notifications');
        await pool.query('TRUNCATE TABLE loans');
        await pool.query('TRUNCATE TABLE contributions');
        await pool.query('TRUNCATE TABLE memberships');
        await pool.query('TRUNCATE TABLE user_preferred_groups');
        await pool.query('TRUNCATE TABLE stokvels');
        await pool.query('TRUNCATE TABLE users');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Cleared existing data.');

        // ─────────────────────────────────────────────
        // 1. CREATE ADMIN USER
        // ─────────────────────────────────────────────
        const admin = await User.create({
            fullName: 'System Admin',
            email: process.env.ADMIN_EMAIL || 'admin@socialclub.co.za',
            phone: '080 000 0000',
            password: process.env.ADMIN_PASSWORD || 'Admin@2026',
            role: 'admin',
            status: 'active',
        });
        console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL || 'admin@socialclub.co.za'}`);

        // ─────────────────────────────────────────────
        // 2. CREATE STOKVELS
        // ─────────────────────────────────────────────
        const collectivePot = await Stokvel.create({
            name: 'COLLECTIVE POT',
            type: 'traditional',
            description: 'Traditional Stokvel saving for festive season celebrations',
            icon: '🌱',
            color: 'primary',
            targetAmount: 7000,
            maxMembers: 18,
            interestRate: 30,
            overdueInterestRate: 60,
            loanPercentageLimit: 50,
            loanRepaymentDays: 30,
            cycle: 'weekly',
            meetingDay: 'Sunday',
            nextPayout: new Date('2026-12-06'),
            status: 'active',
            createdBy: admin.id,
        });

        const summerSavers = await Stokvel.create({
            name: 'SUMMER SAVERS',
            type: 'flexible',
            description: 'Save for summer holidays and beach trips',
            icon: '💰',
            color: 'secondary',
            targetAmount: 5000,
            maxMembers: 15,
            interestRate: 30,
            overdueInterestRate: 60,
            loanPercentageLimit: 50,
            loanRepaymentDays: 30,
            cycle: 'monthly',
            meetingDay: 'Friday',
            nextPayout: new Date('2026-12-31'),
            status: 'active',
            createdBy: admin.id,
        });

        const winterWarmth = await Stokvel.create({
            name: 'WINTER WARMTH',
            type: 'traditional',
            description: 'Upcoming Stokvel - Save for winter essentials',
            icon: '❄️',
            color: 'blue',
            targetAmount: 3000,
            maxMembers: 12,
            interestRate: 30,
            overdueInterestRate: 60,
            loanPercentageLimit: 50,
            loanRepaymentDays: 30,
            cycle: 'weekly',
            meetingDay: 'Monday',
            nextPayout: new Date('2027-06-01'),
            status: 'upcoming',
            createdBy: admin.id,
        });

        console.log('✅ Stokvels created: COLLECTIVE POT, SUMMER SAVERS, WINTER WARMTH');

        // ─────────────────────────────────────────────
        // 3. CREATE MEMBER USERS
        // ─────────────────────────────────────────────
        const hashedPw = await bcrypt.hash('Password123', 12);

        // Use createRaw to avoid double-hashing
        const nkulumo = await User.createRaw({
            fullName: 'Nkulumo Nkuna', email: 'nkulumo.nkuna@email.com',
            phone: '082 123 4567', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const thabo = await User.createRaw({
            fullName: 'Thabo Mbeki', email: 'thabo.mbeki@email.com',
            phone: '083 456 7890', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const sarah = await User.createRaw({
            fullName: 'Sarah Jones', email: 'sarah.jones@email.com',
            phone: '084 567 8901', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const john = await User.createRaw({
            fullName: 'John Doe', email: 'john.doe@email.com',
            phone: '085 678 9012', hashedPassword: hashedPw, role: 'member', status: 'inactive',
        });
        const mary = await User.createRaw({
            fullName: 'Mary Johnson', email: 'mary.johnson@email.com',
            phone: '086 789 0123', hashedPassword: hashedPw, role: 'member', status: 'pending',
        });
        // Set preferred groups for pending users
        await User.setPreferredGroups(mary.id, [summerSavers.id]);

        const peter = await User.createRaw({
            fullName: 'Peter Williams', email: 'peter.williams@email.com',
            phone: '087 890 1234', hashedPassword: hashedPw, role: 'member', status: 'pending',
        });
        await User.setPreferredGroups(peter.id, [summerSavers.id]);

        const linda = await User.createRaw({
            fullName: 'Linda Zulu', email: 'linda.zulu@email.com',
            phone: '088 901 2345', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const james = await User.createRaw({
            fullName: 'James Brown', email: 'james.brown@email.com',
            phone: '089 012 3456', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const patricia = await User.createRaw({
            fullName: 'Patricia Smith', email: 'patricia.smith@email.com',
            phone: '080 123 4567', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const bob = await User.createRaw({
            fullName: 'Bob Johnson', email: 'bob.johnson@email.com',
            phone: '081 234 5678', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const alice = await User.createRaw({
            fullName: 'Alice Wonder', email: 'alice.wonder@email.com',
            phone: '082 345 6789', hashedPassword: hashedPw, role: 'member', status: 'active',
        });
        const charlie = await User.createRaw({
            fullName: 'Charlie Brown', email: 'charlie.brown@email.com',
            phone: '083 456 7891', hashedPassword: hashedPw, role: 'member', status: 'active',
        });

        console.log('✅ 12 member users created');

        // ─────────────────────────────────────────────
        // 4. CREATE MEMBERSHIPS
        // ─────────────────────────────────────────────

        // COLLECTIVE POT memberships
        const m_nkulumo_cp = await Membership.create({
            userId: nkulumo.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 1070, status: 'active',
        });
        const m_thabo_cp = await Membership.create({
            userId: thabo.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 2000, status: 'active',
        });
        const m_sarah_cp = await Membership.create({
            userId: sarah.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 850, status: 'active',
        });
        const m_john_cp = await Membership.create({
            userId: john.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 2000, status: 'active',
        });
        await Membership.create({
            userId: linda.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 800, status: 'active',
        });
        await Membership.create({
            userId: james.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 450, status: 'active',
        });
        await Membership.create({
            userId: patricia.id, stokvelId: collectivePot.id, role: 'member',
            targetAmount: 7000, savedAmount: 600, status: 'active',
        });

        // SUMMER SAVERS memberships
        const m_nkulumo_ss = await Membership.create({
            userId: nkulumo.id, stokvelId: summerSavers.id, role: 'member',
            targetAmount: 5000, savedAmount: 850, status: 'active',
        });
        await Membership.create({
            userId: bob.id, stokvelId: summerSavers.id, role: 'member',
            targetAmount: 5000, savedAmount: 600, status: 'active',
        });
        await Membership.create({
            userId: alice.id, stokvelId: summerSavers.id, role: 'member',
            targetAmount: 5000, savedAmount: 450, status: 'active',
        });
        const m_charlie_ss = await Membership.create({
            userId: charlie.id, stokvelId: summerSavers.id, role: 'member',
            targetAmount: 5000, savedAmount: 2000, status: 'active',
        });

        console.log('✅ Memberships created');

        // ─────────────────────────────────────────────
        // 5. CREATE CONTRIBUTIONS
        // ─────────────────────────────────────────────
        const contributionsData = [
            // COLLECTIVE POT
            { userId: nkulumo.id, stokvelId: collectivePot.id, membershipId: m_nkulumo_cp.id,
              amount: 200, paymentMethod: 'card', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-02-04'), reference: 'TRX-001' },
            { userId: nkulumo.id, stokvelId: collectivePot.id, membershipId: m_nkulumo_cp.id,
              amount: 870, paymentMethod: 'bank', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-01-22'), reference: 'TRX-007' },
            { userId: thabo.id, stokvelId: collectivePot.id, membershipId: m_thabo_cp.id,
              amount: 350, paymentMethod: 'bank', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-01-22'), reference: 'TRX-002' },
            { userId: thabo.id, stokvelId: collectivePot.id, membershipId: m_thabo_cp.id,
              amount: 1650, paymentMethod: 'card', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-01-15'), reference: 'TRX-008' },
            { userId: sarah.id, stokvelId: collectivePot.id, membershipId: m_sarah_cp.id,
              amount: 250, paymentMethod: 'cash', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-01-22'), reference: 'TRX-003' },
            { userId: sarah.id, stokvelId: collectivePot.id, membershipId: m_sarah_cp.id,
              amount: 600, paymentMethod: 'card', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-01-10'), reference: 'TRX-009' },
            { userId: john.id, stokvelId: collectivePot.id, membershipId: m_john_cp.id,
              amount: 2000, paymentMethod: 'card', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2025-01-12'), reference: 'TRX-004' },
            // SUMMER SAVERS
            { userId: nkulumo.id, stokvelId: summerSavers.id, membershipId: m_nkulumo_ss.id,
              amount: 500, paymentMethod: 'card', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-02-10'), reference: 'TRX-005' },
            { userId: nkulumo.id, stokvelId: summerSavers.id, membershipId: m_nkulumo_ss.id,
              amount: 350, paymentMethod: 'bank', status: 'confirmed',
              confirmedBy: admin.id, confirmedAt: new Date('2026-02-05'), reference: 'TRX-010' },
            // Pending contribution
            { userId: mary.id, stokvelId: summerSavers.id, membershipId: m_nkulumo_ss.id,
              amount: 1200, paymentMethod: 'cash', status: 'pending', reference: 'TRX-006' },
        ];

        for (const c of contributionsData) {
            await Contribution.create(c);
        }
        console.log(`✅ ${contributionsData.length} contributions created`);

        // ─────────────────────────────────────────────
        // 6. CREATE LOANS
        // ─────────────────────────────────────────────
        const loansData = [
            // Nkulumo - COLLECTIVE POT loans
            { userId: nkulumo.id, stokvelId: collectivePot.id, membershipId: m_nkulumo_cp.id,
              amount: 230, interestRate: 30, interest: 69, totalRepayable: 299,
              status: 'overdue', purpose: 'Emergency expenses', dueDate: new Date('2026-02-14') },
            { userId: nkulumo.id, stokvelId: collectivePot.id, membershipId: m_nkulumo_cp.id,
              amount: 175, interestRate: 60, interest: 105, totalRepayable: 280,
              status: 'repaid', purpose: 'School fees',
              dueDate: new Date('2026-02-23'), repaidDate: new Date('2026-02-20') },
            { userId: nkulumo.id, stokvelId: collectivePot.id, membershipId: m_nkulumo_cp.id,
              amount: 500, interestRate: 30, interest: 150, totalRepayable: 650,
              status: 'active', purpose: 'Business supplies', dueDate: new Date('2026-03-12') },
            // Nkulumo - SUMMER SAVERS loans
            { userId: nkulumo.id, stokvelId: summerSavers.id, membershipId: m_nkulumo_ss.id,
              amount: 800, interestRate: 30, interest: 240, totalRepayable: 1040,
              status: 'active', purpose: 'Car repair', dueDate: new Date('2026-03-07') },
            // Sarah - COLLECTIVE POT
            { userId: sarah.id, stokvelId: collectivePot.id, membershipId: m_sarah_cp.id,
              amount: 230, interestRate: 30, interest: 69, totalRepayable: 299,
              status: 'active', purpose: 'Medical bills', dueDate: new Date('2026-03-23') },
            // Charlie - SUMMER SAVERS
            { userId: charlie.id, stokvelId: summerSavers.id, membershipId: m_charlie_ss.id,
              amount: 1200, interestRate: 30, interest: 360, totalRepayable: 1560,
              status: 'active', purpose: 'Rent assistance', dueDate: new Date('2026-03-03') },
        ];

        for (const l of loansData) {
            await Loan.create(l);
        }
        console.log(`✅ ${loansData.length} loans created`);

        // ─────────────────────────────────────────────
        // 7. CREATE SAMPLE NOTIFICATIONS
        // ─────────────────────────────────────────────
        const notificationsData = [
            { userId: nkulumo.id, message: 'Contribution of R200 confirmed for COLLECTIVE POT',
              type: 'contribution', read: false },
            { userId: nkulumo.id, message: 'Loan repayment due in 3 days',
              type: 'reminder', read: false },
            { userId: nkulumo.id, message: 'Welcome to SUMMER SAVERS!',
              type: 'system', read: true },
            { userId: admin.id, message: 'New registration request from Mary Johnson',
              type: 'approval', read: false },
            { userId: admin.id, message: 'New registration request from Peter Williams',
              type: 'approval', read: false },
        ];

        await Notification.insertMany(notificationsData);
        console.log(`✅ ${notificationsData.length} notifications created`);

        // ─────────────────────────────────────────────
        console.log('\n═══════════════════════════════════════');
        console.log('   SEED COMPLETED SUCCESSFULLY! 🎉');
        console.log('═══════════════════════════════════════');
        console.log('\n📋 Test Credentials:');
        console.log('   Admin:  admin@socialclub.co.za / Admin@2026');
        console.log('   Member: nkulumo.nkuna@email.com / Password123');
        console.log('   (All members use password: Password123)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seedDB();
