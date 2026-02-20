# 🔐 Login Troubleshooting Guide

This guide addresses the most common login issues and how to fix them.

## Issue: "Login failed" with correct credentials

### Symptoms:
- ✗ Login page displays error "Login failed"
- ✗ Error message is generic, no specific details
- ✗ Correct email and password entered
- ✗ Backend appears to be running

### Root Causes & Solutions:

#### 1. **Missing or Empty JWT_SECRET** ⭐ Most Common

**Error in backend logs:**
```
Error: secretOrPrivateKey must have a value
```

**Fix:**
```bash
cd backend
cat .env | grep JWT_SECRET
```

Should output:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2026
```

If empty or missing:
```bash
# Edit backend/.env and add:
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2026
```

Then restart backend: `npm run dev`

---

#### 2. **Database Not Seeded (No Test Users)**

**Error in backend logs:**
```
User found: false
```

**Fix:**
```bash
cd backend
npm run seed
```

**Expected output:**
```
✅ Admin created: admin@socialclub.co.za
✅ Stokvels created: COLLECTIVE POT, SUMMER SAVERS, WINTER WARMTH
✅ 12 member users created
```

Then try login again with:
- **Email:** `admin@socialclub.co.za`
- **Password:** `Admin@2026`

---

#### 3. **Backend Not Running**

**How to check:**
```bash
# Test API connection
curl http://localhost:5000/api/health
```

If it times out or refuses connection:
```bash
# Start the backend
cd backend
npm run dev
```

Expected output:
```
🚀 SOCIAL CLUB API Server running on port 5000
📡 Environment: development
```

---

#### 4. **Database Connection Failed**

**Error in backend logs:**
```
MySQL Connection Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Fix:**
```bash
# 1. Start MySQL service
# Windows: Open Services app → Find MySQL → Start

# 2. Verify connection
mysql -h localhost -u root

# 3. Check .env credentials
cat backend/.env | grep DB_
```

Should show:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=social_club
```

---

#### 5. **Wrong Database Credentials**

**Error:**
```
Access denied for user 'root'@'localhost'
```

**Fix:**
```bash
# Check what password you set for MySQL
# Update backend/.env:
DB_USER=root
DB_PASSWORD=yourActualPassword
```

---

## Issue: "Your account is pending admin approval"

**Cause:** User was created but account status is 'pending', not 'active'

**Fix:** Use the admin account to approve user, or seed creates active users

**During development, use seeded active users:**
- `nkulumo.nkuna@email.com` / `Password123`
- `thabo.mbeki@email.com` / `Password123`
- `sarah.jones@email.com` / `Password123`

---

## Issue: "Your account has been deactivated"

**Cause:** User status is 'inactive'

**Fix:** Admin must reactivate user in admin panel, or use active seeded accounts

---

## Issue: "Invalid email or password"

**Cause:**
1. Email doesn't exist in database
2. Password is wrong
3. User was deleted

**Fix:**
```bash
# 1. Verify user exists in database
mysql -u root social_club
SELECT id, full_name, email, status FROM users;

# 2. If no users, run seed
npm run seed

# 3. Try a seeded user:
# Email: admin@socialclub.co.za
# Password: Admin@2026
```

---

## Full Debugging Checklist

```bash
# 1. Check .env file exists and has values
ls -la backend/.env
cat backend/.env

# 2. Check MySQL is running
mysql -h localhost -u root

# 3. Check database exists
mysql -u root -e "SHOW DATABASES;"

# 4. Verify backend can connect
cd backend
npm run seed

# 5. Check backend is running
# In separate terminal:
curl http://localhost:5000/api/health

# 6. Check frontend can reach backend
# Open browser console (F12)
# Try login and check Network tab
```

---

## Enable Debug Logging

To see exactly what's happening during login:

**Backend logs are automatically verbose in development mode.**

Check the terminal where you ran `npm run dev` in backend folder. You should see:
```
Login attempt for: admin@socialclub.co.za
User found: 1, status: active
Password verified for: admin@socialclub.co.za
Token generated for user: 1
POST /api/auth/login 200 315.461 ms - 388
```

---

## Reset Everything

If you're stuck, here's how to completely reset:

```bash
# 1. Stop both servers (Ctrl+C)

# 2. Delete and recreate database
mysql -u root
DROP DATABASE social_club;
CREATE DATABASE social_club;
EXIT;

# 3. Reinstall dependencies
cd backend
rm -rf node_modules
npm install
cd ..

# 4. Seed fresh data
cd backend
npm run seed

# 5. Restart both servers
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
npm run dev
```

---

## Test API Directly

Use curl or Postman to test login API without frontend:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@socialclub.co.za",
    "password": "Admin@2026"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "fullName": "System Admin",
      "email": "admin@socialclub.co.za",
      "role": "admin",
      "status": "active"
    },
    "profiles": []
  }
}
```

If token contains "undefined", JWT_SECRET is missing!

---

## Environment Variables Reference

**Must be present in `backend/.env`:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | Token signing key | `your-secret-key-2026` |
| `DB_HOST` | Database hostname | `localhost` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `` (empty if none) |
| `DB_NAME` | Database name | `social_club` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend location | `http://localhost:5173` |
| `ADMIN_EMAIL` | Admin username | `admin@socialclub.co.za` |
| `ADMIN_PASSWORD` | Admin password | `Admin@2026` |

---

## Getting Help

1. **Check this guide first** - Most issues are covered above
2. **Check backend logs** - Always reveals the actual problem
3. **Check `.env` file** - Usually it's a missing environment variable
4. **Database check** - Ensure MySQL is running with test data
5. **Clear cache** - Delete `node_modules` and reinstall

---

## Still Stuck?

Gather this information:

```bash
# 1. Backend error message
# (from terminal where npm run dev is running)

# 2. Frontend error message
# (from browser console F12)

# 3. Your .env file
cat backend/.env

# 4. Database status
mysql -u root -e "SELECT version();"

# 5. API test response
curl http://localhost:5000/api/health
```

Share these details with your team for faster help!
