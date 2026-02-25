# Social Club Stokvel Management System

A full-stack stokvel (savings club) management system built with React + TypeScript (frontend) and Express + MySQL (backend).

## Quick Start (After Cloning)

### Prerequisites
- **Node.js** 18+
- **MySQL** 8.0+ (must be running)

### 1. Backend Setup
```bash
cd backend
npm run setup          # Creates .env, installs deps, runs DB migration
npm run seed           # Creates admin account & demo data
npm run dev            # Starts API server on http://localhost:5000
```

> If your MySQL root user has a password, edit `backend/.env` and set `DB_PASSWORD=your_password` before running `npm run setup`.

### 2. Frontend Setup
```bash
# In the project root (not backend/)
npm install
npm run dev            # Starts frontend on http://localhost:5173
```

### 3. Login Credentials (after seeding)

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@stokvel.co.za | Admin@123   |
| Member  | thabo@example.com   | Member@123  |
| Member  | naledi@example.com  | Member@123  |

## Troubleshooting

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | MySQL is not running. Start MySQL service first. |
| `ER_ACCESS_DENIED_ERROR` | Wrong DB credentials. Edit `backend/.env` and fix `DB_PASSWORD`. |
| `ER_BAD_DB_ERROR` | Database doesn't exist. Run `cd backend && npm run migrate`. |
| `Login failed` (500) | Check backend terminal for the actual error message. |

---

