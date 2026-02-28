import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stokvel_db',
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  // Skip seeding if data already exists (prevents duplicates on redeploy)
  const [existingContributions] = await connection.query('SELECT COUNT(*) as count FROM contributions');
  if (existingContributions[0].count > 0) {
    console.log('⏭️  Database already has data — skipping seed to prevent duplicates');
    await connection.end();
    return;
  }

  console.log('🌱 Seeding database...\n');

  // ── Admin user ──
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const [adminResult] = await connection.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'admin', 'active')
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    ['System Admin', 'admin@stokvel.co.za', '+27600000000', adminPassword]
  );
  const adminId = adminResult.insertId;
  console.log('✅ Admin user created (admin@stokvel.co.za / Admin@123)');

  // ── Stokvels ──
  const [s1] = await connection.query(
    `INSERT INTO stokvels (name, type, description, target_amount, max_members, interest_rate, cycle, meeting_day, next_payout, status, icon, color, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    ['Kasi Savings Club', 'traditional', 'A community savings group focused on building wealth together through monthly contributions.', 50000, 30, 30, 'monthly', 'Last Saturday', '2026-03-28', 'active', '💰', 'blue', adminId]
  );
  const stokvel1Id = s1.insertId;

  const [s2] = await connection.query(
    `INSERT INTO stokvels (name, type, description, target_amount, max_members, interest_rate, cycle, meeting_day, next_payout, status, icon, color, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    ['Collective Pot', 'traditional', 'Traditional Stokvel saving for festive season celebrations', 7000, 18, 30, 'weekly', 'Sunday', '2026-12-13', 'active', '🌱', 'green', adminId]
  );
  const stokvel2Id = s2.insertId;

  const [s3] = await connection.query(
    `INSERT INTO stokvels (name, type, description, target_amount, max_members, interest_rate, cycle, meeting_day, next_payout, status, icon, color, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    ['Ubuntu Circle', 'traditional', 'Traditional rotation-based stokvel where members take turns receiving the full pot.', 25000, 12, 30, 'weekly', 'Every Friday', '2026-03-06', 'active', '🤝', 'purple', adminId]
  );
  const stokvel3Id = s3.insertId;
  console.log('✅ 3 stokvels created');

  // ── User Settings ──
  await connection.query(
    `INSERT INTO user_settings (user_id) VALUES (?)
     ON DUPLICATE KEY UPDATE user_id=user_id`,
    [adminId]
  );
  console.log('✅ User settings initialized');

  // ── Site Settings ──
  const siteSettings = [
    ['site_name', 'Stokvel Management System'],
    ['currency', 'ZAR'],
    ['min_contribution', '100'],
    ['max_loan_percentage', '50'],
    ['loan_interest_rate', '30'],
    ['loan_term_days', '30'],
    ['late_fee_percentage', '5'],
    ['grace_period_days', '7'],
    ['voluntary_exit_refund', '50'],
  ];
  for (const [key, value] of siteSettings) {
    await connection.query(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
      [key, value]
    );
  }
  console.log('✅ Site settings initialized');

  // ── FAQs ──
  const faqs = [
    ['Getting Started', 'How do I join a stokvel?', 'Register an account and select a stokvel during registration. An admin will review and approve your application within 24-48 hours.', 1],
    ['Getting Started', 'What documents do I need to register?', 'You only need a valid email address and phone number to create an account. Additional verification may be required for large transactions.', 2],
    ['Contributions', 'What is the minimum contribution amount?', 'The minimum contribution is R100 per transaction. Your stokvel may have specific contribution requirements set by the group.', 3],
    ['Contributions', 'What happens if I miss a contribution?', 'There is a 7-day grace period. After that, a 5% late fee is applied. Consistent missed contributions may affect your membership status.', 4],
    ['Contributions', 'Which payment methods are accepted?', 'We accept Visa, Mastercard, and American Express debit/credit cards. Bank transfers and cash contributions (confirmed by admin) are also supported.', 5],
    ['Loans', 'How much can I borrow?', 'You can borrow up to 50% of your total savings in a stokvel. The amount depends on your contribution history and standing in the group.', 6],
    ['Loans', 'What is the interest rate on loans?', 'The standard interest rate is 30% flat on the borrowed amount. Overdue loans incur an additional 30% penalty (60% total).', 7],
    ['Loans', 'What is the repayment period?', 'All loans must be repaid within 30 days from the date of borrowing. Early repayment is encouraged and welcomed.', 8],
    ['Account & Security', 'How do I reset my password?', 'Click "Forgot Password" on the login page. Enter your registered email and you\'ll receive a 6-digit verification code to reset your password.', 9],
    ['Account & Security', 'Can I belong to multiple stokvels?', 'Yes! You can be a member of multiple stokvels simultaneously. Use the profile switcher on your dashboard to navigate between them.', 10],
    ['Leaving a Stokvel', 'What happens if I leave voluntarily?', 'If you leave voluntarily, you will receive a refund of 50% of your total contributions. Any outstanding loans must be repaid first.', 11],
    ['Leaving a Stokvel', 'What if I am removed by an admin?', 'If removed by an admin, all contributions are forfeited. This typically happens due to repeated policy violations.', 12],
  ];
  for (const f of faqs) {
    await connection.query(
      `INSERT INTO faqs (category, question, answer, sort_order) VALUES (?, ?, ?, ?)`,
      f
    );
  }
  console.log('✅ FAQs created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:  admin@stokvel.co.za / Admin@123');

  await connection.end();
}

export { seed };

// Run seed directly if this file is executed as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((err) => {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  });
}
