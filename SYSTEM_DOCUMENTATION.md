# Fund Mate — Stokvel Management System

## Complete System Documentation

**Version:** 2.0 (System-Presentation-Version-2)  
**Last Updated:** March 17, 2026  
**Stack:** React 19 + TypeScript / Node.js + Express / MySQL / Paystack

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Getting Started](#3-getting-started)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Backend API Reference](#7-backend-api-reference)
8. [Frontend Routes & Pages](#8-frontend-routes--pages)
9. [Frontend API Client](#9-frontend-api-client)
10. [Payment System (Paystack)](#10-payment-system-paystack)
11. [Loan System](#11-loan-system)
12. [Fines System](#12-fines-system)
13. [Madala Side](#13-madala-side)
14. [Admin & Superadmin Features](#14-admin--superadmin-features)
15. [Security](#15-security)
16. [PWA (Progressive Web App)](#16-pwa-progressive-web-app)
17. [Dependencies](#17-dependencies)

---

## 1. System Overview

Fund Mate is a **stokvel (savings club) management platform** that enables members to:

- **Save money** together towards monthly/annual targets
- **Take loans** from the pool with 30% interest
- **Track contributions** via card (Paystack) or cash
- **Pay fines** for rule violations
- **Contribute to Madala Side** (an annual elder fund)

### User Roles

| Role | Description |
|------|-------------|
| **Member** | Regular user — save, borrow, pay fines |
| **Admin** | Manages one or more stokvels — approves members, confirms payments, issues fines |
| **Superadmin** | System-level control — manages admins, all stokvels, site settings |

### Business Rules

- **Contribution target**: Each stokvel has a target amount per member (e.g., R4,800)
- **Loan limit**: Members can borrow up to their saved amount
- **Interest**: 30% on all loans, due within 28 days
- **Madala Side**: Elders cannot take loans; members contribute R200/month toward R2,200 annual target (minimum R100 per contribution)
- **Maximum members**: 30 per stokvel
- **Payment period**: 28 days for all loan cycles

---

## 2. Architecture

```
┌─────────────────────────┐     ┌──────────────────────────┐
│   Frontend (React 19)   │────▶│   Backend (Express.js)   │
│   Vite + TypeScript     │     │   Port 5000              │
│   Port 5173             │     │                          │
│   Tailwind CSS          │     │   JWT Authentication     │
│   React Router v7       │     │   express-validator      │
│   Axios HTTP Client     │     │   helmet + rate-limit    │
│   PWA (Workbox)         │     │   compression            │
└─────────────────────────┘     └────────┬─────────────────┘
                                         │
                               ┌─────────▼─────────┐
                               │   MySQL Database   │
                               │   stokvel_db       │
                               │   15 tables        │
                               └─────────┬─────────┘
                                         │
                               ┌─────────▼─────────┐
                               │   Paystack API     │
                               │   Payment Gateway  │
                               │   ZAR currency     │
                               └───────────────────┘
```

### File Structure

```
social-club-stokvel/
├── backend/
│   ├── .env                    # Environment config
│   ├── package.json            # Backend dependencies
│   └── src/
│       ├── server.js           # Express server entry point
│       ├── database/
│       │   ├── connection.js   # MySQL connection pool
│       │   ├── migrate.js      # Table creation & schema updates
│       │   └── seed.js         # Initial data (superadmin, admin, stokvel, FAQs)
│       ├── middleware/
│       │   ├── auth.js         # JWT verify + role checking middleware
│       │   └── validate.js     # express-validator error handler
│       ├── routes/
│       │   ├── admin.js        # Admin dashboard, user/contribution/loan/fine management
│       │   ├── auth.js         # Login, register, password reset
│       │   ├── cards.js        # Card CRUD (demo/mock card storage)
│       │   ├── contributions.js# Contribution listing, stats, downloads
│       │   ├── fines.js        # Fine listing and payment
│       │   ├── help.js         # FAQ and contact form
│       │   ├── loans.js        # Loan request, listing, repayment (Full/BLK/Installment/FTP)
│       │   ├── notifications.js# Notification CRUD
│       │   ├── payments.js     # Paystack integration + cash contributions
│       │   ├── settings.js     # User preferences
│       │   ├── stokvels.js     # Stokvel listing, details, join requests
│       │   └── users.js        # Profile management, account deletion
│       └── utils/
│           ├── email.js        # Nodemailer SMTP transporter
│           └── reports.js      # PDF/Excel report generation
├── src/
│   ├── App.tsx                 # Landing page with PWA install
│   ├── main.tsx                # React entry point
│   ├── api/
│   │   ├── client.ts           # Axios instance (base URL, token interceptor, 401 handling)
│   │   └── index.ts            # All API functions (auth, users, stokvels, loans, etc.)
│   ├── components/
│   │   ├── AuthGuard.tsx       # Protected route wrapper (checks session token)
│   │   ├── ErrorState.tsx      # Error display component
│   │   └── admin/              # Admin dashboard components (Sidebar, UserTable, etc.)
│   ├── pages/
│   │   ├── auth/               # Login, Register, ForgotPassword, RegistrationSuccess
│   │   ├── dashboard/          # MainDashboard (member view)
│   │   ├── admin/              # AdminDashboard
│   │   ├── loans/              # LoanHistory, LoanRequest
│   │   ├── history/            # ContributionHistory
│   │   ├── payments/           # Cards management
│   │   ├── notifications/      # Notifications page
│   │   ├── profile/            # MemberProfile
│   │   ├── settings/           # Settings
│   │   ├── groups/             # GroupDetails (stokvel info)
│   │   ├── help/               # HelpCenter
│   │   ├── legal/              # Terms, Privacy
│   │   ├── about/              # AboutUs
│   │   ├── blog/               # Blog
│   │   └── faq/                # FAQ
│   ├── router/
│   │   └── index.tsx           # React Router config
│   └── utils/
│       ├── auth.ts             # Session storage helpers (getToken, getUser, etc.)
│       ├── download.ts         # File download utility
│       ├── format.ts           # Currency/date formatters
│       └── toast.ts            # Toast notification helpers
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite + PWA config
├── tailwind.config.js          # Tailwind CSS config
└── render.yaml                 # Render.com deployment config
```

---

## 3. Getting Started

### Prerequisites

- **Node.js** v18+
- **MySQL** (via XAMPP or standalone)
- **npm** (comes with Node.js)

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/Ntombikayise24/social-club-stokvel.git
cd social-club-stokvel

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install

# 4. Configure environment
# Edit backend/.env with your database credentials (see Section 4)

# 5. Start MySQL (via XAMPP or MySQL service)

# 6. Run database migration + seed
npm run migrate

# 7. Start backend server
npm run dev         # or: node src/server.js

# 8. Start frontend (new terminal)
cd ..               # back to root
npm run dev         # Vite dev server on http://localhost:5173
```

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | superadmin@stokvel.co.za | Super@123 |
| Admin | admin@stokvel.co.za | Admin@123 |

---

## 4. Environment Variables

All backend config is in `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `stokvel_db` | Database name |
| `JWT_SECRET` | *(dev key)* | Secret for signing JWT tokens — **must change in production** |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiry |
| `SMTP_HOST` | `smtp.gmail.com` | Email SMTP server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | *(email)* | SMTP sender email |
| `SMTP_PASS` | *(app password)* | SMTP password (Gmail App Password) |
| `FRONTEND_URL` | `http://localhost:5174` | Allowed CORS origin |
| `PAYSTACK_SECRET_KEY` | *(test key)* | Paystack API secret key |

---

## 5. Database Schema

### Tables Overview

| Table | Records | Purpose |
|-------|---------|---------|
| `users` | Members, admins, superadmin | All user accounts |
| `stokvels` | Savings groups | Stokvel configuration |
| `profiles` | Member-stokvel link | One per user per stokvel |
| `contributions` | Payments | All contribution records |
| `loans` | Borrowing | Loan lifecycle tracking |
| `cards` | Payment cards | User card details (demo) |
| `fines` | Penalties | Fine records |
| `notifications` | Alerts | In-app notifications |
| `password_reset_tokens` | Reset codes | Password recovery |
| `user_settings` | Preferences | Push/email notification prefs |
| `site_settings` | Global config | Site-wide settings |
| `faqs` | Help content | FAQ items |
| `contact_messages` | Support | Contact form submissions |
| `join_requests` | Membership | Stokvel join requests |
| `admin_stokvel_assignments` | Access | Admin-to-stokvel mapping |

### Table Details

#### `users`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
full_name       VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
phone           VARCHAR(20)
password_hash   VARCHAR(255) NOT NULL
role            ENUM('member', 'admin', 'superadmin') DEFAULT 'member'
status          ENUM('pending', 'active', 'suspended', 'deleted') DEFAULT 'pending'
avatar_url      VARCHAR(500)
last_active_at  DATETIME
deleted_at      DATETIME
deleted_by      INT (FK → users.id)
delete_reason   TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `stokvels`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(255) UNIQUE NOT NULL
description     TEXT
target_amount   DECIMAL(15,2) DEFAULT 4800.00
contribution_amount DECIMAL(15,2) DEFAULT 200.00
contribution_frequency ENUM('weekly','monthly','bi-weekly') DEFAULT 'monthly'
max_members     INT DEFAULT 30
status          ENUM('active', 'inactive') DEFAULT 'active'
icon            VARCHAR(10) DEFAULT '💰'
created_by      INT (FK → users.id)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `profiles`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NOT NULL (FK → users.id)
stokvel_id      INT NOT NULL (FK → stokvels.id)
role            ENUM('member', 'admin') DEFAULT 'member'
target_amount   DECIMAL(15,2) DEFAULT 4800.00
saved_amount    DECIMAL(15,2) DEFAULT 0.00
status          ENUM('active', 'inactive', 'pending') DEFAULT 'active'
joined_at       TIMESTAMP
UNIQUE KEY (user_id, stokvel_id)
```

#### `contributions`
```sql
id                INT AUTO_INCREMENT PRIMARY KEY
user_id           INT NOT NULL (FK → users.id)
profile_id        INT NOT NULL (FK → profiles.id)
stokvel_id        INT NOT NULL (FK → stokvels.id)
amount            DECIMAL(15,2) NOT NULL
payment_method    ENUM('paystack','cash','card','loan_repayment') DEFAULT 'paystack'
reference         VARCHAR(100) UNIQUE
status            ENUM('pending','confirmed','failed','rejected') DEFAULT 'pending'
contribution_type ENUM('your-target','madala-side') DEFAULT 'your-target'
confirmed_by      INT (FK → users.id)
confirmed_at      DATETIME
card_id           INT (FK → cards.id)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

#### `loans`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NOT NULL (FK → users.id)
profile_id      INT NOT NULL (FK → profiles.id)
stokvel_id      INT NOT NULL (FK → stokvels.id)
amount          DECIMAL(15,2) NOT NULL            -- principal
interest_rate   DECIMAL(5,2) DEFAULT 30.00
interest        DECIMAL(15,2) DEFAULT 0.00         -- interest amount
total_repayable DECIMAL(15,2) DEFAULT 0.00         -- total owed
amount_paid     DECIMAL(15,2) DEFAULT 0.00         -- for installments
status          ENUM('pending','active','repaid','overdue','rejected','blk','ftp') DEFAULT 'pending'
repayment_type  ENUM('full','blk','installment','ftp')
purpose         TEXT
approved_by     INT (FK → users.id)
approved_at     DATETIME
repaid_date     DATETIME
due_date        DATETIME
card_id         INT (FK → cards.id)
loan_target     VARCHAR(50) DEFAULT 'your-target'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `fines`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NOT NULL (FK → users.id)
stokvel_id      INT NOT NULL (FK → stokvels.id)
fine_type       ENUM('no_banking','no_attendance','sending','late_coming','vulgar','misbehaving','madala_non_payment') NOT NULL
amount          DECIMAL(15,2) NOT NULL
status          ENUM('unpaid', 'paid', 'pending') DEFAULT 'unpaid'
payment_method  VARCHAR(20)
reason          TEXT
issued_by       INT (FK → users.id)
paid_date       DATETIME
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `cards`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NOT NULL (FK → users.id)
card_number     VARCHAR(255) NOT NULL          -- last 4 digits stored
card_type       VARCHAR(50) DEFAULT 'visa'
cardholder_name VARCHAR(255)
expiry_month    INT
expiry_year     INT
is_default      BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP
```

#### `notifications`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NOT NULL (FK → users.id)
type            ENUM('contribution','loan','fine','info','success','warning','approval') DEFAULT 'info'
title           VARCHAR(255)
message         TEXT
is_read         BOOLEAN DEFAULT FALSE
actionable      BOOLEAN DEFAULT FALSE
action_link     VARCHAR(500)
action_text     VARCHAR(100)
created_at      TIMESTAMP
```

---

## 6. Authentication & Authorization

### Registration Flow

1. User submits `POST /api/auth/register` with name, email, phone, password, and optional stokvelId
2. Password is hashed with **bcryptjs** (10 rounds)
3. User is created with `status = 'pending'`
4. If a stokvelId is provided, a join request is created
5. User sees the Registration Success page
6. Admin must **approve** the user before they can log in

### Login Flow

1. User submits `POST /api/auth/login` with email, password, optional `rememberMe`
2. Backend verifies password hash with bcrypt
3. If user status is `pending` → error "Account pending approval"
4. If user status is `suspended`/`deleted` → error
5. JWT token issued (7d default, 30d if `rememberMe`)
6. Token + user object stored in **sessionStorage** (browser tab-scoped)
7. Axios interceptor adds `Authorization: Bearer <token>` to all requests

### Token Handling

- **Storage**: `sessionStorage` (isolates browser tabs and PWA)
- **Expiry**: 7 days default, 30 days with rememberMe
- **Middleware**: `authenticate` function in `auth.js` verifies token on every protected route
- **401 Response**: Frontend interceptor clears session and redirects to login
- **403 Response**: Shows error but does NOT log out

### Password Reset

1. `POST /api/auth/forgot-password` — sends 6-digit code via email (cryptographically secure `crypto.randomInt`)
2. `POST /api/auth/verify-code` — validates code (15-minute expiry)
3. `POST /api/auth/reset-password` — sets new password

### Role Middleware

```javascript
// Usage in routes:
router.get('/admin-data', authenticate, requireRole('admin', 'superadmin'), handler);
```

---

## 7. Backend API Reference

All endpoints prefixed with `/api`. Auth-protected routes require `Authorization: Bearer <token>` header.

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Rate Limited | Description |
|--------|----------|------|-------------|-------------|
| POST | `/login` | No | 15/15min | Login with email + password |
| POST | `/register` | No | 5/hour | Create new account |
| GET | `/me` | Yes | No | Get current user profile |
| POST | `/forgot-password` | No | 5/hour | Request password reset code |
| POST | `/verify-code` | No | No | Verify reset code |
| POST | `/reset-password` | No | No | Set new password with code |

### User Routes (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Yes | Get current user with profiles |
| PUT | `/me` | Yes | Update name, email, phone |
| PUT | `/me/password` | Yes | Change password |
| GET | `/me/profiles` | Yes | Get all stokvel profiles |
| GET | `/me/dashboard` | Yes | Dashboard data (profiles, contributions, loans, fines) |
| DELETE | `/me` | Yes | Self-delete account (requires password) |

### Stokvel Routes (`/api/stokvels`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all active stokvels |
| GET | `/:id` | Yes | Stokvel details (members, contributions, interest pot) |
| POST | `/:id/join-request` | Yes | Submit join request (checks max_members cap) |

### Contribution Routes (`/api/contributions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List contributions (filterable by stokvelId, status, profileId) |
| GET | `/stats` | Yes | Contribution stats (total, this month, pending) |
| POST | `/` | Yes | Create direct contribution |
| GET | `/download` | Yes | Download contribution report (PDF/Excel) |

### Loan Routes (`/api/loans`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List loans with overdue penalty calculation |
| GET | `/stats` | Yes | Loan summary stats |
| POST | `/request` | Yes | Request a new loan |
| POST | `/:id/repay` | Yes | Repay loan (full/blk/installment/ftp) |
| GET | `/download` | Yes | Download loan report |

### Payment Routes (`/api/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/webhook` | No | Paystack webhook (signature verified) |
| POST | `/initialize` | Yes | Start Paystack payment |
| POST | `/cash` | Yes | Record cash contribution (pending admin confirm) |
| GET | `/verify/:reference` | Yes | Verify Paystack payment |

### Card Routes (`/api/cards`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List user's cards |
| POST | `/` | Yes | Add a card |
| PUT | `/:id/default` | Yes | Set card as default |
| DELETE | `/:id` | Yes | Remove a card |

### Fine Routes (`/api/fines`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List user's fines |
| POST | `/:id/pay` | Yes | Pay a fine (card or cash) |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List notifications (paginated, filterable) |
| PUT | `/:id/read` | Yes | Mark notification as read |
| PUT | `/read-all` | Yes | Mark all as read |
| DELETE | `/read` | Yes | Delete all read notifications |

### Settings Routes (`/api/settings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user settings |
| PUT | `/` | Yes | Update user settings |

### Help Routes (`/api/help`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/faq` | No | List FAQs |
| POST | `/contact` | No | Submit contact form |

### Admin Routes (`/api/admin`) — Requires admin or superadmin role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard statistics |
| GET | `/users` | List all users (search, filter, paginate) |
| POST | `/users` | Create user with auto-generated password |
| PUT | `/users/:id` | Update user details |
| POST | `/users/:id/approve` | Approve pending user |
| POST | `/users/:id/reject` | Reject pending user |
| GET | `/users/:id/join-requests` | Get user's join requests |
| DELETE | `/users/:id` | Soft-delete user |
| POST | `/users/:id/restore` | Restore deleted user |
| DELETE | `/users/:id/permanent` | Permanent delete (superadmin only) |
| GET | `/deleted-users` | List deleted/archived users |
| GET | `/stokvels` | List all stokvels |
| POST | `/stokvels` | Create stokvel |
| PUT | `/stokvels/:id` | Update stokvel |
| DELETE | `/stokvels/:id` | Delete stokvel |
| GET | `/contributions` | List all contributions |
| POST | `/contributions/:id/confirm` | Confirm cash contribution |
| POST | `/contributions/:id/confirm-adjusted` | Confirm with adjusted amount |
| POST | `/contributions/:id/reject` | Reject contribution |
| GET | `/loans` | List all loans |
| POST | `/loans/:id/approve` | Approve loan request |
| POST | `/loans/:id/reject` | Reject loan request |
| GET | `/settings` | Get site settings |
| PUT | `/settings` | Update site settings |
| POST | `/reports` | Generate report (PDF/Excel/JSON) |
| GET | `/join-requests` | List pending join requests |
| POST | `/join-requests/:id/approve` | Approve join request |
| POST | `/join-requests/:id/reject` | Reject join request |
| GET | `/fines` | List all fines |
| POST | `/fines` | Issue a fine |
| DELETE | `/fines/:id` | Delete a fine |
| POST | `/fines/:id/confirm` | Confirm cash fine payment |
| GET | `/admins` | List admin users (superadmin) |
| GET | `/admin-assignments` | List admin-stokvel assignments |
| POST | `/admin-assignments` | Assign admin to stokvel |
| DELETE | `/admin-assignments/:id` | Remove admin assignment |

---

## 8. Frontend Routes & Pages

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | `App` | No | Landing page with features, PWA install |
| `/login` | `Login` | No | Login form |
| `/register` | `Register` | No | Registration form |
| `/registration-success` | `RegistrationSuccess` | No | Post-registration message |
| `/forgot-password` | `ForgotPassword` | No | Password recovery flow |
| `/dashboard` | `MainDashboard` | Yes | Member dashboard (profiles, contribute, Madala Side) |
| `/profile` | `MemberProfile` | Yes | View/edit profile |
| `/contributions` | `ContributionHistory` | Yes | Contribution list with download |
| `/loans` | `LoanHistory` | Yes | Loan list with repayment modal |
| `/loans/request` | `LoanRequest` | Yes | New loan request form |
| `/admin` | `AdminDashboard` | Admin | Admin panel (users, contributions, loans, fines) |
| `/group/:groupId` | `GroupDetails` | Yes | Stokvel detail view |
| `/notifications` | `Notifications` | Yes | Notification center |
| `/settings` | `Settings` | Yes | User preferences |
| `/cards` | `Cards` | Yes | Manage payment cards |
| `/help` | `HelpCenter` | Yes | FAQ + contact form |
| `/about` | `AboutUs` | No | About page |
| `/blog` | `Blog` | No | Blog page |
| `/faq` | `FAQ` | No | Public FAQ page |
| `/terms` | `Terms` | No | Terms of service |
| `/privacy` | `Privacy` | No | Privacy policy |
| `*` | `NotFound` | No | 404 page |

---

## 9. Frontend API Client

The API client (`src/api/client.ts`) is an Axios instance configured with:

- **Base URL**: `http://localhost:5000/api`
- **Request interceptor**: Automatically attaches JWT from `sessionStorage`
- **Response interceptor**: On **401** response, clears session and redirects to `/login`; on **403**, shows error without logout
- **Timeout**: Default Axios timeout

### API Modules (`src/api/index.ts`)

| Module | Functions |
|--------|-----------|
| `authApi` | `login`, `register`, `forgotPassword`, `verifyCode`, `resetPassword`, `getMe` |
| `userApi` | `getMe`, `updateProfile`, `changePassword`, `getProfiles`, `getDashboard`, `deleteAccount` |
| `stokvelApi` | `list`, `getDetails`, `joinRequest` |
| `contributionApi` | `list`, `getStats`, `create`, `download` |
| `loanApi` | `list`, `getStats`, `request`, `repay`, `download` |
| `cardApi` | `list`, `add`, `setDefault`, `remove` |
| `notificationApi` | `list`, `markRead`, `markAllRead`, `deleteRead` |
| `settingsApi` | `get`, `update` |
| `helpApi` | `getFaqs`, `submitContact` |
| `finesApi` | `list`, `pay` |
| `paymentApi` | `initialize`, `verify`, `cash` |
| `adminApi` | `getStats`, `listUsers`, `createUser`, `updateUser`, `approveUser`, `rejectUser`, `deleteUser`, `restoreUser`, `permanentDeleteUser`, `listDeletedUsers`, `listStokvels`, `createStokvel`, `updateStokvel`, `deleteStokvel`, `listContributions`, `confirmContribution`, `confirmContributionAdjusted`, `rejectContribution`, `listLoans`, `approveLoan`, `rejectLoan`, `getSiteSettings`, `updateSiteSettings`, `generateReport`, `listJoinRequests`, `approveJoinRequest`, `rejectJoinRequest`, `listFines`, `issueFine`, `deleteFine`, `confirmFine`, `listAdmins`, `listAdminAssignments`, `assignAdminToStokvel`, `removeAdminAssignment` |

---

## 10. Payment System (Paystack)

### Card Payment Flow

```
Member clicks "Contribute" → Frontend calls POST /api/payments/initialize
    ↓
Backend creates pending contribution record in DB
Backend calls Paystack API → gets authorization_url
Returns URL to frontend
    ↓
Frontend opens Paystack inline popup → member enters card details on Paystack
    ↓
Two confirmation paths (whichever fires first):

Path A: Webhook (server-to-server)
    Paystack sends POST /api/payments/webhook with signature
    Backend verifies HMAC-SHA512 signature
    Updates contribution to 'confirmed', increments saved_amount
    Creates notification

Path B: Verify (frontend-initiated)
    After popup closes, frontend calls GET /api/payments/verify/:reference
    Backend calls Paystack verify API
    If not already confirmed (status='pending'), updates contribution
    Race-safe: only processes if status is still 'pending'
```

### Cash Payment Flow

```
Member clicks "Cash" → Frontend calls POST /api/payments/cash
    ↓
Backend creates contribution with status='pending', payment_method='cash'
    ↓
At Sunday meeting, admin opens Admin Dashboard → Contributions tab
Admin clicks "Confirm" on the cash contribution
    ↓
POST /api/admin/contributions/:id/confirm
Backend updates status to 'confirmed', increments saved_amount (capped at target)
Notification sent to member
```

### Validation Rules

- Minimum contribution: **R100**
- Cannot exceed remaining target amount
- Madala Side capped at **R2,200** total
- Must have at least one card saved for card payments

---

## 11. Loan System

### Loan Request

```
POST /api/loans/request
{
  amount: number,      // R100 – R2,000 (and ≤ saved_amount)
  profileId: number,
  purpose?: string,
  cardId?: number,
  loanTarget?: string  // 'your-target' (default)
}
```

**Rules:**
- Minimum: **R100**, Maximum: **R2,000**
- Cannot exceed member's `saved_amount`
- Only one active loan per profile
- Madala Side profiles **cannot** take loans
- Interest: **30%** (calculated as `amount × 0.30`)
- Due date: **28 days** from approval
- `saved_amount` is deducted by the loan amount upon approval

### Repayment Types

#### 1. Full Repayment
Pay the entire `total_repayable` (principal + interest). Loan status → `repaid`. Principal returned to `saved_amount`.

#### 2. BLK (Block)
Pay **only the 30% interest** to renew the loan for 28 more days.

```
Example: Borrow R200 on Feb 1
  Interest = R200 × 0.30 = R60
  Due: Feb 29

Choose BLK, pay R60 on Feb 20:
  New due date = March 20 (28 days from payment)
  Remaining to pay = R200 (principal only, interest was paid)
  total_repayable is reset to R200
```

After BLK:
- Status → `blk`
- Interest is paid and recorded as a `loan_repayment` contribution
- `total_repayable` = remaining principal (no more interest until next period ends)
- Due date = current date + 28 days

#### 3. Installment
Pay a partial amount toward the loan. If not fully repaid within 28 days, additional 30% interest is charged.

```
amount_paid += installmentAmount
If amount_paid >= total_repayable → status = 'repaid'
```

#### 4. FTP (Failure To Pay)
Member cannot pay. Loan is marked as FTP. **30% interest charged every 28 days** on the outstanding balance until fully repaid.

### Overdue Penalty Calculation

When a loan passes its due date:
```
overdueMonths = ceil(days_overdue / 28)
penalty = remaining_principal × 0.30 × overdueMonths
currentTotal = remaining_principal + interest + penalty
```

---

## 12. Fines System

### Fine Types & Amounts

| Fine Type | Amount | Description |
|-----------|--------|-------------|
| `no_banking` | R30 | Not contributing to savings |
| `no_attendance` | R20 | Missing a meeting |
| `sending` | R30 | Sending someone else to meeting |
| `late_coming` | R20 | Arriving late to meeting |
| `vulgar` | R50 | Using vulgar language |
| `misbehaving` | R20 | General misbehavior |
| `madala_non_payment` | R50 | Not paying Madala Side |

### Fine Flow

1. **Admin issues fine**: `POST /api/admin/fines` with `userId` and `fineType`
2. Member sees fine in their dashboard and notifications
3. **Member pays**:
   - **Card**: Immediately marked as `paid`
   - **Cash**: Marked as `pending`, admin confirms at meeting via `POST /api/admin/fines/:id/confirm`
4. Admin can delete fines via `DELETE /api/admin/fines/:id`

### Automated Madala Fines

The `madalaScheduler` (backend utility) runs on a schedule to check which members haven't contributed their R200 monthly Madala Side payment. Those members automatically receive a `madala_non_payment` fine (R50).

---

## 13. Madala Side

### Overview

Madala Side is an **annual elder contribution fund**. Every member must contribute toward it throughout the year.

### Parameters

| Parameter | Value |
|-----------|-------|
| Annual Target | **R2,200** |
| Monthly Target | **R200/month** × 11 months (Jan – Nov) |
| Minimum Contribution | **R100** per transaction |
| Cap | Hard-capped — cannot contribute beyond R2,200 |

### How It Works

1. In the Dashboard, the Madala Side section shows:
   - **Circular progress ring** (percentage of R2,200)
   - **Monthly dots grid** (11 months, Jan–Nov, each representing R200)
   - **Paid count** (e.g., "3 / 11")

2. When contributing, members toggle between "Your Target" and "Madala Side"

3. Madala Side contributions are tracked separately:
   - `contribution_type = 'madala-side'` in the contributions table
   - They do **NOT** add to `saved_amount` (which tracks regular savings)
   - They count toward the R2,200 cap

4. **Members with Madala Side profiles cannot take loans**

5. **Automated fines**: The scheduler checks monthly; if a member hasn't contributed R200 for the month, they receive a R50 `madala_non_payment` fine

---

## 14. Admin & Superadmin Features

### Admin Dashboard Sections

| Section | Features |
|---------|----------|
| **Overview** | Stats: total users, total savings, active loans, pending actions |
| **Users** | Search, filter, approve/reject, create, edit, soft-delete, restore |
| **Contributions** | View all, confirm cash payments, adjust amounts, reject |
| **Loans** | View all, approve/reject loan requests |
| **Fines** | Issue fines, view all fines, confirm cash payments, delete |
| **Join Requests** | Approve or reject stokvel membership requests |
| **Reports** | Generate PDF/Excel reports (contributions, loans, members) |
| **Settings** | Site-wide configuration |

### Admin vs Superadmin Permissions

| Action | Admin | Superadmin |
|--------|-------|------------|
| Manage members | ✅ (assigned stokvels only) | ✅ (all) |
| Approve contributions | ✅ | ✅ |
| Approve loans | ✅ | ✅ |
| Issue fines | ✅ | ✅ |
| Create stokvels | ❌ | ✅ |
| Delete stokvels | ❌ | ✅ |
| Permanently delete users | ❌ | ✅ |
| Manage other admins | ❌ | ✅ |
| Assign admins to stokvels | ❌ | ✅ |
| Update site settings | ❌ | ✅ |

### Admin Login

Admins log in through a special modal accessible from the landing page (App.tsx) — the "Admin" link in the footer/header reveals a login dialog.

---

## 15. Security

### Implemented Measures

| Layer | Protection |
|-------|-----------|
| **HTTP Headers** | `helmet.js` — sets security headers (X-Content-Type-Options, X-Frame-Options, etc.) |
| **Rate Limiting** | Login: 15 attempts / 15 min. Register & Forgot Password: 5 / hour |
| **CORS** | Origin restricted to `FRONTEND_URL` (no wildcard in production) |
| **Compression** | `compression` middleware for response compression |
| **Body Size Limit** | 1MB max for JSON and URL-encoded bodies |
| **Password Hashing** | bcryptjs with 10 salt rounds |
| **JWT** | Server-validated on every protected request; startup check ensures `JWT_SECRET` is set |
| **SQL Injection** | Parameterized queries via `mysql2/promise` (no string concatenation) |
| **Input Validation** | `express-validator` on all mutation routes |
| **DB Transactions** | Used for payment confirmation, webhook, admin confirm to prevent partial updates |
| **Payment Verification** | Paystack webhook signature verified with HMAC-SHA512 |
| **Password Reset** | Cryptographically secure random codes (`crypto.randomInt`) |
| **Session Isolation** | `sessionStorage` prevents cross-tab/PWA token sharing |
| **Idempotent Payments** | Verify endpoint only processes contributions still in `pending` status |
| **Role Protection** | Superadmin/admin accounts cannot be deleted by non-superadmin users |

### Token Flow

```
Login → JWT issued → stored in sessionStorage
    ↓
Every API request → Axios adds Bearer header
    ↓
Backend auth.js middleware verifies token
    ↓
401 → Frontend clears session, redirects to /login
403 → Shows error, stays logged in
```

---

## 16. PWA (Progressive Web App)

Fund Mate is installable as a PWA via `vite-plugin-pwa` and Workbox.

### Install Experience

- **Hero button**: Dark app-store style "Download App" button on the landing page
- **Floating banner**: Bottom-right card with app icon, star rating, "Install" button, and dismiss (X)
- **Fallback**: If `beforeinstallprompt` isn't available, shows manual install instructions

### Configuration

In `vite.config.ts`:
```typescript
VitePWA({
  registerType: 'autoUpdate',
  devOptions: { enabled: true },
  manifest: {
    name: 'Fund Mate',
    short_name: 'FundMate',
    // ... icons, theme colors
  }
})
```

---

## 17. Dependencies

### Frontend (`package.json`)

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` v19 | UI framework |
| `react-router-dom` v7 | Client-side routing |
| `axios` | HTTP client |
| `tailwindcss` v3 | Utility-first CSS |
| `lucide-react` | Icons |
| `react-hot-toast` | Toast notifications |
| `recharts` | Charts and data visualization |
| `react-hook-form` + `zod` | Form handling + validation |
| `@tanstack/react-query` | Data fetching/caching |
| `@tanstack/react-table` | Data tables |
| `date-fns` | Date formatting |
| `react-phone-number-input` | Phone number input |
| `vite` v7 | Build tool |
| `vite-plugin-pwa` | PWA support |
| `typescript` v5.9 | Type safety |

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| `express` v4 | Web framework |
| `mysql2` | MySQL driver with promise support |
| `jsonwebtoken` | JWT token creation/verification |
| `bcryptjs` | Password hashing |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `compression` | Response compression |
| `cors` | Cross-origin requests |
| `express-validator` | Input validation |
| `axios` | HTTP client (Paystack API) |
| `nodemailer` | Email sending |
| `pdfkit` | PDF report generation |
| `exceljs` | Excel report generation |
| `multer` | File uploads |
| `uuid` | Unique ID generation |
| `dotenv` | Environment variable loading |

---

## Architecture Decisions

1. **sessionStorage over localStorage**: Deliberate choice to isolate browser and PWA sessions so users can be logged into different accounts simultaneously.

2. **28-day loan period**: Based on the stokvel's monthly meeting cycle (not calendar months).

3. **Madala Side separate tracking**: Contributions tracked via `contribution_type` column rather than a separate table, simplifying queries while keeping the cap enforced.

4. **Card data is demo/mock**: Cards are stored in the database but actual payments go through Paystack's hosted checkout (inline popup) — raw card data never touches the payment processor from the backend.

5. **Admin-scoped stokvel access**: Admins are assigned to specific stokvels via `admin_stokvel_assignments`, ensuring they only manage their assigned groups.

---

*Generated for Fund Mate v2.0 — System-Presentation-Version-2*
