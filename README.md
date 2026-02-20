# 🤝 STOCKVEL - Social Club Stokvel Management System

A modern web application for managing community-based savings groups (Stokvels) with member management, contributions, loans, and payments.

## ✨ Features

- 👥 **User Management** - Register, approve, and manage members
- 💰 **Savings Groups** - Create and manage multiple stokvels
- 💸 **Contributions** - Track savings and contributions
- 🏦 **Loans** - Request and manage loans within groups
- 📊 **Dashboard** - Real-time statistics and group overview
- 🔐 **Secure Authentication** - JWT-based login with role-based access
- 💳 **Payment Integration** - Paystack integration for online payments
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

**New to this project?** Start here: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**Having login issues?** See: [LOGIN_TROUBLESHOOTING.md](./LOGIN_TROUBLESHOOTING.md)

### Prerequisites
- Node.js v16+ 
- MySQL 5.7+
- Git

### Installation (5 minutes)

```bash
# 1. Clone and install
git clone <repo-url>
cd social-club-stokvel
npm install
cd backend && npm install && cd ..

# 2. Setup environment
cd backend
cp .env.example .env
# Edit .env with your values

# 3. Seed test data
npm run seed

# 4. Start servers
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (new terminal)
npm run dev

# 5. Open browser
# http://localhost:5173
```

**Test login:**
- Email: `admin@socialclub.co.za`
- Password: `Admin@2026`

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[LOGIN_TROUBLESHOOTING.md](./LOGIN_TROUBLESHOOTING.md)** - Fix login issues
- **[backend/API_USAGE_GUIDE.md](./backend/API_USAGE_GUIDE.md)** - API documentation
- **[ARCHITECTURE.html](./ARCHITECTURE.html)** - System architecture
- **[BUSINESS_LOGIC_IMPLEMENTATION.md](./BUSINESS_LOGIC_IMPLEMENTATION.md)** - Business rules

## 🏗️ Project Structure

```
social-club-stokvel/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── config/         # Database config
│   ├── .env                # Environment secrets (local only)
│   ├── .env.example        # Template for developers
│   └── package.json
├── src/                     # React + TypeScript frontend
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── services/           # API client
│   └── context/            # React context
├── SETUP_GUIDE.md          # Setup instructions ⭐ START HERE
├── LOGIN_TROUBLESHOOTING.md  # Fix login issues
└── package.json
```

## 🔧 Development

### Frontend
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
cd backend
npm run dev      # Start with hot reload (localhost:5000)
npm start        # Start server
npm run seed     # Seed database with test data
```

## 🔐 Security Notes

- ⚠️ **Never commit `.env` file** - it contains secrets
- 🔑 **Change `JWT_SECRET`** in production (use a strong random key)
- 🔑 **Change `ADMIN_PASSWORD`** before deploying
- 🔒 **Use HTTPS** in production
- 📋 **Keep `.env.example` updated** as documentation

The `.env` file is in `.gitignore` to prevent accidental secret leaks. Use `.env.example` as a template.

## 🧪 Test Credentials

After running `npm run seed`, these accounts are available:

### Admin
```
Email: admin@socialclub.co.za
Password: Admin@2026
```

### Members (all use same password)
```
Email: nkulumo.nkuna@email.com
Email: thabo.mbeki@email.com
Email: sarah.jones@email.com
Password: Password123
```

## 📊 Database Setup

The system uses MySQL with auto-initialization:

```bash
# Create database (if not done by seed script)
mysql -u root -e "CREATE DATABASE social_club;"

# Seed test data
cd backend
npm run seed
```

All database tables are created automatically on first run.

## 🚨 Common Issues

### Login fails with "Login failed"
1. Check `JWT_SECRET` is set in `backend/.env`
2. Run `npm run seed` to populate test data
3. See [LOGIN_TROUBLESHOOTING.md](./LOGIN_TROUBLESHOOTING.md)

### Can't connect to database
1. Start MySQL server
2. Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
3. See [SETUP_GUIDE.md - Troubleshooting](./SETUP_GUIDE.md#troubleshooting)

### API errors / CORS issues
1. Verify backend is running on port 5000
2. Check `FRONTEND_URL` in `backend/.env`
3. Restart both servers

See [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting) for detailed troubleshooting.

## 🔗 API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| GET | `/auth/me` | Get current user |
| GET | `/stokvels` | List all stokvels |
| POST | `/contributions` | Create contribution |
| POST | `/loans` | Request loan |
| GET | `/notifications` | Get messages |

Full API docs: [API_USAGE_GUIDE.md](./backend/API_USAGE_GUIDE.md)

## 💳 Payment Integration

Paystack integration for online payments is available. Configure in `.env`:

```env
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

See [PAYSTACK_SETUP.md](./PAYSTACK_SETUP.md) for details.

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

[Add your license here]

## 📞 Support

**Getting started?** → [SETUP_GUIDE.md](./SETUP_GUIDE.md)
**Login issues?** → [LOGIN_TROUBLESHOOTING.md](./LOGIN_TROUBLESHOOTING.md)
**API questions?** → [API_USAGE_GUIDE.md](./backend/API_USAGE_GUIDE.md)

---

**Made with ❤️ for HENNESSY SOCIAL CLUB**
