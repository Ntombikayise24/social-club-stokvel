const mysql = require('mysql2/promise');

let pool;

const connectDB = async () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'social_club',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // Test connection
        const connection = await pool.getConnection();
        console.log(`MySQL Connected: ${process.env.DB_HOST || 'localhost'}`);
        connection.release();
    } catch (error) {
        console.error(`MySQL Connection Error: ${error.message}`);
        process.exit(1);
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return pool;
};

module.exports = { connectDB, getPool };
