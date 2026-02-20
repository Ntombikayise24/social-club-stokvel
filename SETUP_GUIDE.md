# 🚀 STOCKVEL System - Setup Guide

Complete guide to get the STOCKVEL Social Club system running locally.

## Prerequisites

- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **MySQL** (v5.7+) - [Download](https://www.mysql.com/downloads/mysql/)
- **Git**
- A code editor (VS Code recommended)

---

## Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd social-club-stokvel

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## Step 2: Setup Environment Variables ⚠️ CRITICAL

### Backend Setup

```bash
# Copy the example file to create your actual .env
cd backend
cp .env.example .env
```

**Edit `backend/.env` with your values:**

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=             # Leave empty if no password set on MySQL
DB_NAME=social_club

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (IMPORTANT: Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2026
JWT_EXPIRES_IN=7d

# Admin Login Credentials
ADMIN_EMAIL=admin@socialclub.co.za
ADMIN_PASSWORD=Admin@2026

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Paystack Configuration (optional for development)
PAYSTACK_PUBLIC_KEY=pk_test_your_key
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
```

### ✅ Important Reminders:
- **Never commit the `.env` file** - it contains secrets
- The `.env.example` file is safe to commit and serves as a template
- Each developer should have their own `.env` file locally

---

## Step 3: Initialize the Database

```bash
cd backend

# Start MySQL service first (Windows):
# MySQL might auto-start, or use Services app

# Then run the seed script to populate test data
npm run seed
```

**What the seed script does:**
- Creates all required database tables
- Creates a test admin account
- Creates 3 test stokvels (groups)
- Creates 12 member accounts with sample data

---

## Step 4: Start the Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 SOCIAL CLUB API Server running on port 5000
📡 Environment: development
🔗 Health check: http://localhost:5000/api/health
```

**Keep this terminal open!**

---

## Step 5: Start the Frontend Server

**Open a NEW terminal in the root folder:**

```bash
npm run dev
```

**Expected output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## Step 6: Test the Login

1. Open browser: http://localhost:5173
2. You should see the login page
3. Use one of these test credentials:

### Admin Account:
- **Email:** `admin@socialclub.co.za`
- **Password:** `Admin@2026`

### Member Accounts:
- **Email:** `nkulumo.nkuna@email.com`
- **Password:** `Password123`

*All other seeded member accounts also use `Password123`*

---

## Troubleshooting

### "Login Failed" Error

**Problem:** Backend is running but login returns generic "Login failed" error

**Solution:**
1. Check `.env` file exists in `backend/` folder
2. Verify `JWT_SECRET` is set in `.env` (not empty)
3. Verify database is seeded: `npm run seed`
4. Check backend console logs for specific error

**Commands to verify:**
```bash
# Verify database is connected
cd backend && npm run seed

# Test API health
curl http://localhost:5000/api/health

# Check .env file exists
ls -la backend/.env
```

---

### "Cannot connect to database" Error

**Problem:** Backend can't reach MySQL

**Solution:**
1. **Start MySQL** - Open Services (Windows) or Terminal (Mac/Linux)
   ```bash
   # Windows - Services app: Search "Services" → Find MySQL → Start
   # Mac: brew services start mysql
   # Linux: sudo service mysql start
   ```

2. **Verify credentials in `.env`**:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=    # or your password
   ```

3. **Test MySQL connection manually**:
   ```bash
   mysql -h localhost -u root
   ```

---

### "Port 5000 already in use" Error

**Problem:** Another process is using port 5000

**Solution:**
```bash
# Windows - Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>

# Or use a different port in .env:
PORT=5001
```

---

### "Module not found" / "Cannot find module" Error

**Solution:**
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install

cd ..
rm -rf node_modules
npm install
```

---

### Frontend shows "API Error"

**Problem:** Frontend can't reach backend

**Solution:**
1. Verify backend is running on port 5000
2. Check `FRONTEND_URL` in backend `.env`:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```
3. Check browser console for CORS errors
4. Restart both servers

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install` in both root and backend)
- [ ] Create `backend/.env` from `.env.example`
- [ ] Fill in `JWT_SECRET` and database credentials
- [ ] Create MySQL database: `social_club`
- [ ] Run `npm run seed` in backend folder
- [ ] Start backend: `npm run dev` in backend folder
- [ ] Start frontend: `npm run dev` in root folder
- [ ] Open http://localhost:5173 in browser
- [ ] Login with test credentials

---

## Development Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start with hot reload (nodemon)
npm start        # Start server
npm run seed     # Seed database with test data
```

---

## File Structure

```
social-club-stokvel/
├── backend/
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/             # Database config
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Express middleware
│   │   └── utils/              # Helper functions
│   ├── .env                    # ⚠️ Local secrets (not in git)
│   ├── .env.example            # ✅ Template for developers
│   ├── package.json
│   └── seed.js                 # Database seed script
├── src/
│   ├── pages/                  # React pages
│   ├── components/             # React components
│   ├── services/               # API client
│   └── context/                # React context
├── .env.example                # Frontend env template (if needed)
└── package.json
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Login fails silently | Missing JWT_SECRET | Add JWT_SECRET to .env |
| "User not found" | Database not seeded | Run `npm run seed` |
| Can't connect to MySQL | MySQL not running | Start MySQL service |
| Port already in use | Another process on port 5000 | Kill process or change PORT |
| CORS errors | Frontend/backend URL mismatch | Check FRONTEND_URL in .env |
| Blank page on frontend | Backend not running | Start backend on port 5000 |

---

## Need Help?

1. **Check the logs**: Both frontend and backend print detailed error messages
2. **Check .env file**: Most issues are missing environment variables
3. **Verify MySQL**: Make sure MySQL is running (`mysql -u root`)
4. **Clear cache**: Delete `node_modules` and reinstall
5. **Restart servers**: Kill and restart both backend and frontend

---

## Next Steps

- **Admin Panel:** After login, admins can approve pending users
- **Create a Stokvel:** Members can create or join groups
- **Make Contributions:** Save money within your stokvel
- **Request Loans:** Borrow from your stokvel savings

---

## Security Notes

- 🔐 **Never commit `.env`** - it contains secret keys
- 🔐 **Change JWT_SECRET in production** - use strong random key
- 🔐 **Change ADMIN_PASSWORD before deployment** 
- 🔐 **Use HTTPS in production** - update FRONTEND_URL
- 🔐 **Secure MySQL** - don't use default root password in production

---

**Happy developing! 🎉**
