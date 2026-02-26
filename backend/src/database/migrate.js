import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME || 'stokvel_db';

async function migrate() {
  // Connect without specifying database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  console.log('🔄 Running database migration...\n');

  // Create database
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await connection.query(`USE \`${DB_NAME}\``);
  console.log(`✅ Database "${DB_NAME}" ready`);

  // ───────────────── USERS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(30),
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('member', 'admin') DEFAULT 'member',
      status ENUM('active', 'inactive', 'pending', 'deleted') DEFAULT 'pending',
      avatar_url VARCHAR(500),
      last_active DATETIME,
      deleted_at DATETIME,
      deleted_by INT,
      delete_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ users table created');

  // ───────────────── STOKVELS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS stokvels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      type ENUM('traditional', 'flexible') DEFAULT 'traditional',
      description TEXT,
      target_amount DECIMAL(15,2) DEFAULT 0,
      max_members INT DEFAULT 50,
      interest_rate DECIMAL(5,2) DEFAULT 30.00,
      cycle ENUM('weekly', 'monthly', 'quarterly') DEFAULT 'monthly',
      meeting_day VARCHAR(20),
      next_payout DATE,
      status ENUM('active', 'inactive', 'upcoming') DEFAULT 'active',
      icon VARCHAR(50) DEFAULT '💰',
      color VARCHAR(20) DEFAULT 'blue',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ stokvels table created');

  // ───────────────── PROFILES (membership) TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      stokvel_id INT NOT NULL,
      role ENUM('member', 'admin', 'treasurer') DEFAULT 'member',
      target_amount DECIMAL(15,2) DEFAULT 0,
      saved_amount DECIMAL(15,2) DEFAULT 0,
      status ENUM('active', 'pending', 'inactive') DEFAULT 'active',
      joined_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_stokvel (user_id, stokvel_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_stokvel (stokvel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ profiles table created');

  // ───────────────── CONTRIBUTIONS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS contributions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      profile_id INT NOT NULL,
      stokvel_id INT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_method ENUM('card', 'bank', 'cash') DEFAULT 'card',
      reference VARCHAR(100),
      status ENUM('confirmed', 'pending', 'deleted') DEFAULT 'pending',
      confirmed_by INT,
      confirmed_at DATETIME,
      deleted_at DATETIME,
      card_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
      FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_stokvel (stokvel_id),
      INDEX idx_status (status),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ contributions table created');

  // ───────────────── LOANS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      profile_id INT NOT NULL,
      stokvel_id INT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(5,2) DEFAULT 30.00,
      interest DECIMAL(15,2) NOT NULL,
      total_repayable DECIMAL(15,2) NOT NULL,
      status ENUM('active', 'repaid', 'overdue', 'pending') DEFAULT 'pending',
      purpose TEXT,
      borrowed_date DATE,
      due_date DATE,
      repaid_date DATE,
      card_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_profile (profile_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ loans table created');

  // ───────────────── CARDS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      card_type ENUM('visa', 'mastercard', 'amex') DEFAULT 'visa',
      last4 VARCHAR(4) NOT NULL,
      expiry_month INT NOT NULL,
      expiry_year INT NOT NULL,
      cardholder_name VARCHAR(255) NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ cards table created');

  // ───────────────── NOTIFICATIONS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('contribution', 'loan', 'approval', 'payment', 'reminder', 'success', 'error', 'warning', 'info') DEFAULT 'info',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      actionable BOOLEAN DEFAULT FALSE,
      action_link VARCHAR(500),
      action_text VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_read (is_read),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ notifications table created');

  // ───────────────── PASSWORD RESET TOKENS ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_token (token),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ password_reset_tokens table created');

  // ───────────────── USER SETTINGS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      email_notifications BOOLEAN DEFAULT TRUE,
      push_notifications BOOLEAN DEFAULT TRUE,
      sms_notifications BOOLEAN DEFAULT FALSE,
      contribution_reminders BOOLEAN DEFAULT TRUE,
      loan_alerts BOOLEAN DEFAULT TRUE,
      two_factor_auth BOOLEAN DEFAULT FALSE,
      login_alerts BOOLEAN DEFAULT TRUE,
      language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ user_settings table created');

  // ───────────────── SITE SETTINGS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ site_settings table created');

  // ───────────────── FAQ TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ faqs table created');

  // ───────────────── CONTACT MESSAGES TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ contact_messages table created');

  // ───────────────── JOIN REQUESTS TABLE ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS join_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      stokvel_id INT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_stokvel (user_id, stokvel_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ join_requests table created');

  console.log('\n✅ All migrations completed successfully!');

  // ── Clean up duplicate stokvels (from previous seed runs without unique constraint) ──
  try {
    const [dupes] = await connection.query(`
      SELECT name, MIN(id) AS keep_id, COUNT(*) AS cnt
      FROM stokvels
      GROUP BY name
      HAVING cnt > 1
    `);
    for (const d of dupes) {
      // Remove profiles referencing duplicate stokvel IDs
      await connection.query(
        'DELETE FROM profiles WHERE stokvel_id IN (SELECT id FROM stokvels WHERE name = ? AND id != ?)',
        [d.name, d.keep_id]
      );
      // Remove contributions referencing duplicates
      await connection.query(
        'DELETE FROM contributions WHERE stokvel_id IN (SELECT id FROM stokvels WHERE name = ? AND id != ?)',
        [d.name, d.keep_id]
      );
      // Remove join requests referencing duplicates
      await connection.query(
        'DELETE FROM join_requests WHERE stokvel_id IN (SELECT id FROM stokvels WHERE name = ? AND id != ?)',
        [d.name, d.keep_id]
      );
      // Remove the duplicate stokvels
      await connection.query('DELETE FROM stokvels WHERE name = ? AND id != ?', [d.name, d.keep_id]);
      console.log(`🧹 Removed ${d.cnt - 1} duplicate(s) of stokvel "${d.name}"`);
    }

    // Add unique index if it doesn't exist yet
    const [indexes] = await connection.query(
      `SHOW INDEX FROM stokvels WHERE Key_name = 'name'`
    );
    if (indexes.length === 0) {
      await connection.query('ALTER TABLE stokvels ADD UNIQUE INDEX uk_name (name)');
      console.log('✅ Added unique constraint on stokvels.name');
    }
  } catch (cleanupErr) {
    console.warn('⚠️ Duplicate cleanup skipped:', cleanupErr.message);
  }

  console.log('\n🌱 Starting database seeding...\n');
  await connection.end();
  
  // Run seed function
  try {
    await seed();
    process.exit(0);
  } catch (seedErr) {
    console.error('❌ Seeding failed:', seedErr.message);
    process.exit(1);
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
