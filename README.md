# Social Club Stokvel Management System

A full-stack stokvel (savings club) management system built with React + TypeScript (frontend) and Express + MySQL (backend).

## Quick Start (After Cloning)

### Prerequisites
- **Node.js** 18+
- **MySQL** 8.0+ (must be running)

### One-Command Setup (Windows)
```bash
# Double-click setup.bat OR run:
setup.bat
```
This installs all dependencies and sets up the database. SMTP and Paystack keys are already configured.

### Manual Setup
```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies & migrate database
cd backend
npm install
npm run migrate        # Creates DB, tables & seeds demo data
npm run dev            # Starts API server on http://localhost:5000

# 3. Start frontend (in a second terminal, from project root)
npm run dev            # Starts frontend on http://localhost:5174
```

> If your MySQL root user has a password, edit `backend/.env` and set `DB_PASSWORD=your_password` before running `npm run migrate`.

### Login Credentials (after seeding)

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@stokvel.co.za | Admin@123   |
| Member  | thabo@example.com   | Member@123  |
| Member  | naledi@example.com  | Member@123  |

### Pre-configured Services
- **Paystack** (test mode) — payment processing is ready to use
- **Gmail SMTP** — approval emails are sent automatically

## Troubleshooting

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | MySQL is not running. Start MySQL service first. |
| `ER_ACCESS_DENIED_ERROR` | Wrong DB credentials. Edit `backend/.env` and fix `DB_PASSWORD`. |
| `ER_BAD_DB_ERROR` | Database doesn't exist. Run `cd backend && npm run migrate`. |
| `Login failed` (500) | Check backend terminal for the actual error message. |

---

