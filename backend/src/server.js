require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { initializeDatabase } = require('./config/schema');

// Import routes
const authRoutes = require('./routes/auth');
const stokvelRoutes = require('./routes/stokvels');
const contributionRoutes = require('./routes/contributions');
const loanRoutes = require('./routes/loans');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to MySQL and initialize tables
const startServer = async () => {
    await connectDB();
    await initializeDatabase();

    // Middleware
    app.use(
        cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            message: 'SOCIAL CLUB API is running',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV,
        });
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/stokvels', stokvelRoutes);
    app.use('/api/contributions', contributionRoutes);
    app.use('/api/loans', loanRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/admin', adminRoutes);

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: `Route ${req.originalUrl} not found`,
        });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        console.error('Unhandled Error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`\n🚀 SOCIAL CLUB API Server running on port ${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
    });
};

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

module.exports = app;
