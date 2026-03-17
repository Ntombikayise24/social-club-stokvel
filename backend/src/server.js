import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env BEFORE any other imports that might need env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import pool from './database/connection.js';
import { runMadalaChecks } from './utils/madalaScheduler.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import stokvelRoutes from './routes/stokvels.js';
import contributionRoutes from './routes/contributions.js';
import loanRoutes from './routes/loans.js';
import cardRoutes from './routes/cards.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import helpRoutes from './routes/help.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import finesRoutes from './routes/fines.js';

// ── Validate required secrets ──
if (!process.env.JWT_SECRET) {
  console.error('\n❌ FATAL: JWT_SECRET environment variable is required but not set.\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://fund-mate.onrender.com'
    : process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate Limiting ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Request logging (dev) ──
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ──
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stokvels', stokvelRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fines', finesRoutes);

// ── Health check ──
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ── Serve frontend in production ──
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../dist');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ──
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`\n🚀 Stokvel API server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);

  // Run Madala Side checks on startup then every 24 hours
  runMadalaChecks().catch(err => console.error('Madala checks error:', err));
  setInterval(() => {
    runMadalaChecks().catch(err => console.error('Madala checks error:', err));
  }, 24 * 60 * 60 * 1000);
});

export default app;
