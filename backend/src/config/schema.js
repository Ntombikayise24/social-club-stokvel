const { getPool } = require('./db');

/**
 * Initialize all database tables
 */
const initializeDatabase = async () => {
    const pool = getPool();

    // Create database if not exists
    await pool.query(`CREATE DATABASE IF NOT EXISTS social_club`);
    await pool.query(`USE social_club`);

    // Users table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('member', 'admin') DEFAULT 'member',
            status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
            message TEXT DEFAULT '',
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // Stokvels table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS stokvels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type ENUM('traditional', 'flexible') DEFAULT 'traditional',
            description TEXT DEFAULT '',
            icon VARCHAR(10) DEFAULT '🌱',
            color VARCHAR(50) DEFAULT 'primary',
            target_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            max_members INT NOT NULL DEFAULT 1,
            interest_rate DECIMAL(5,2) DEFAULT 30.00,
            overdue_interest_rate DECIMAL(5,2) DEFAULT 60.00,
            loan_percentage_limit DECIMAL(5,2) DEFAULT 50.00,
            loan_repayment_days INT DEFAULT 30,
            cycle ENUM('weekly', 'monthly', 'quarterly') DEFAULT 'weekly',
            meeting_day VARCHAR(50) DEFAULT '',
            next_payout DATE NOT NULL,
            status ENUM('active', 'inactive', 'upcoming') DEFAULT 'active',
            created_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    // User preferred groups (junction table) - created after stokvels
    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_preferred_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stokvel_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
            UNIQUE KEY unique_preference (user_id, stokvel_id)
        )
    `);

    // Memberships table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS memberships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stokvel_id INT NOT NULL,
            role ENUM('member', 'admin') DEFAULT 'member',
            target_amount DECIMAL(12,2) NOT NULL,
            saved_amount DECIMAL(12,2) DEFAULT 0,
            status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
            UNIQUE KEY unique_membership (user_id, stokvel_id)
        )
    `);

    // Contributions table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS contributions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stokvel_id INT NOT NULL,
            membership_id INT NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            payment_method ENUM('card', 'bank', 'cash') DEFAULT 'card',
            reference VARCHAR(100) DEFAULT '',
            status ENUM('confirmed', 'pending') DEFAULT 'pending',
            confirmed_by INT,
            confirmed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
            FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
            FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    // Loans table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS loans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stokvel_id INT NOT NULL,
            membership_id INT NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            interest_rate DECIMAL(5,2) DEFAULT 30.00,
            interest DECIMAL(12,2) NOT NULL,
            total_repayable DECIMAL(12,2) NOT NULL,
            status ENUM('active', 'repaid', 'overdue') DEFAULT 'active',
            purpose TEXT DEFAULT '',
            due_date DATE NOT NULL,
            repaid_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
            FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
        )
    `);

    // Notifications table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message TEXT NOT NULL,
            type ENUM('contribution', 'loan', 'approval', 'system', 'reminder') DEFAULT 'system',
            \`read\` BOOLEAN DEFAULT FALSE,
            related_id INT,
            related_model ENUM('Contribution', 'Loan', 'Stokvel', 'User'),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Payment Transactions table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stokvel_id INT NOT NULL,
            membership_id INT NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            payment_method ENUM('card', 'bank', 'cash', 'mobile') DEFAULT 'card',
            reference VARCHAR(100) UNIQUE,
            paystack_reference VARCHAR(100) UNIQUE,
            status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
            FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
            INDEX idx_status (status),
            INDEX idx_user_id (user_id),
            INDEX idx_paystack_ref (paystack_reference)
        )
    `);

    console.log('Database tables initialized successfully');
};

module.exports = { initializeDatabase };
