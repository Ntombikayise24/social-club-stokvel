# Fund Mate — Comprehensive Technical Documentation

> Auto-generated from codebase inspection on 2026-03-17

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Dependencies & Scripts](#2-dependencies--scripts)
3. [Database Schema](#3-database-schema)
4. [Backend Routes (API Endpoints)](#4-backend-routes-api-endpoints)
5. [Frontend Routes](#5-frontend-routes)
6. [Frontend API Client Functions](#6-frontend-api-client-functions)
7. [Authentication Flow](#7-authentication-flow)
8. [Payment Flow](#8-payment-flow)
9. [Loan System](#9-loan-system)
10. [Fines System](#10-fines-system)
11. [Madala Side](#11-madala-side)
12. [Admin Features](#12-admin-features)

---

## 1. Environment Variables

Source: [backend/.env](backend/.env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `stokvel_db` | MySQL database name |
| `JWT_SECRET` | *(required)* | JWT signing secret – server exits if missing |
| `JWT_EXPIRES_IN` | `7d` | Default JWT expiry (30d if "Remember Me") |
| `SMTP_HOST` | `smtp.gmail.com` | Email SMTP host |
| `SMTP_PORT` | `587` | Email SMTP port |
| `SMTP_USER` | — | Gmail address for outgoing mail |
| `SMTP_PASS` | — | Gmail app password |
| `FRONTEND_URL` | `http://localhost:5174` | CORS origin / callback URL |
| `PAYSTACK_SECRET_KEY` | — | Paystack test/live secret key |

---

## 2. Dependencies & Scripts

### Root (Frontend) — [package.json](package.json)

**Scripts:**
| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `vite build` |
| `lint` | `eslint .` |
| `preview` | `vite preview` |

**Production Dependencies:**
`@headlessui/react`, `@heroicons/react`, `@hookform/resolvers`, `@reduxjs/toolkit`, `@tanstack/react-query`, `@tanstack/react-table`, `axios`, `date-fns`, `lucide-react`, `react` 19, `react-dom` 19, `react-hook-form`, `react-hot-toast`, `react-phone-number-input`, `react-redux`, `react-router-dom` 7, `recharts`, `zod`

**Dev Dependencies:**
`@eslint/js`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/react-phone-number-input`, `@vitejs/plugin-react`, `autoprefixer`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `postcss`, `tailwindcss`, `typescript`, `typescript-eslint`, `vite`, `vite-plugin-pwa`

### Backend — [backend/package.json](backend/package.json)

**Scripts:**
| Script | Command |
|---|---|
| `dev` | `nodemon src/server.js` |
| `start` | `node src/server.js` |
| `migrate` | `node src/database/migrate.js` |
| `seed` | `node src/database/seed.js` |
| `setup` | Copy `.env.example` → `.env`, install, migrate |
| `reset-db` | `migrate` + `seed` |

**Production Dependencies:**
`axios`, `bcryptjs`, `compression`, `cors`, `dotenv`, `exceljs`, `express`, `express-rate-limit`, `express-validator`, `helmet`, `jsonwebtoken`, `multer`, `mysql2`, `nodemailer`, `pdfkit`, `uuid`

**Dev Dependencies:**
`nodemon`

---

## 3. Database Schema

Source: [backend/src/database/migrate.js](backend/src/database/migrate.js)

### 3.1 `users`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `full_name` | VARCHAR(255) NOT NULL | |
| `email` | VARCHAR(255) NOT NULL UNIQUE | Indexed |
| `phone` | VARCHAR(30) | |
| `password_hash` | VARCHAR(255) NOT NULL | bcrypt, 12 rounds |
| `role` | ENUM('member','admin','superadmin') | Default `member` |
| `status` | ENUM('active','inactive','pending','deleted') | Default `pending` |
| `avatar_url` | VARCHAR(500) | |
| `last_active` | DATETIME | Updated on each authenticated request |
| `deleted_at` | DATETIME | Soft-delete timestamp |
| `deleted_by` | INT | FK → users(id) |
| `delete_reason` | TEXT | |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

### 3.2 `stokvels`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR(255) NOT NULL UNIQUE | |
| `type` | ENUM('traditional','flexible') | Default `traditional` |
| `description` | TEXT | |
| `target_amount` | DECIMAL(15,2) | Default 0 |
| `max_members` | INT | Default 30 |
| `interest_rate` | DECIMAL(5,2) | Default 30.00 (%) |
| `cycle` | ENUM('weekly','monthly','quarterly') | Default `monthly` |
| `meeting_day` | VARCHAR(20) | |
| `next_payout` | DATE | |
| `status` | ENUM('active','inactive','upcoming') | Default `active` |
| `icon` | VARCHAR(50) | Default `💰` |
| `color` | VARCHAR(20) | Default `blue` |
| `created_by` | INT FK → users(id) | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 3.3 `profiles` (membership pivot)
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK → users(id) CASCADE | |
| `stokvel_id` | INT NOT NULL FK → stokvels(id) CASCADE | |
| `role` | ENUM('member','admin','treasurer') | Default `member` |
| `target_amount` | DECIMAL(15,2) | Synced from stokvel |
| `saved_amount` | DECIMAL(15,2) | Running total of confirmed contributions |
| `status` | ENUM('active','pending','inactive') | Default `active` |
| `joined_date` | DATE | |
| `created_at` / `updated_at` | TIMESTAMP | |
| | | UNIQUE(user_id, stokvel_id) |

### 3.4 `contributions`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `profile_id` | INT NOT NULL FK | |
| `stokvel_id` | INT NOT NULL FK | |
| `amount` | DECIMAL(15,2) NOT NULL | Min R100 |
| `payment_method` | ENUM('card','bank','cash','paystack','loan_repayment') | |
| `reference` | VARCHAR(100) | e.g. `CON-{ts}-{uuid}`, `STK-…`, `CASH-…` |
| `status` | ENUM('confirmed','pending','deleted','failed') | |
| `confirmed_by` | INT FK → users(id) | |
| `confirmed_at` | DATETIME | |
| `deleted_at` | DATETIME | |
| `card_id` | INT | |
| `contribution_type` | VARCHAR(50) | `your-target` or `madala-side` |
| `created_at` / `updated_at` | TIMESTAMP | |

### 3.5 `loans`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `profile_id` | INT NOT NULL FK | |
| `stokvel_id` | INT NOT NULL FK | |
| `amount` | DECIMAL(15,2) NOT NULL | Principal, min R100 |
| `interest_rate` | DECIMAL(5,2) | Default 30.00 |
| `interest` | DECIMAL(15,2) NOT NULL | `amount × rate/100` |
| `total_repayable` | DECIMAL(15,2) NOT NULL | `amount + interest` |
| `status` | ENUM('active','repaid','overdue','pending','rejected','blk','ftp','pending_repayment') | |
| `purpose` | TEXT | |
| `borrowed_date` | DATE | Set on approval |
| `due_date` | DATE | 28 days after approval |
| `repaid_date` | DATE | |
| `card_id` | INT | |
| `loan_target` | VARCHAR(50) | `your-target` only (madala blocked) |
| `repayment_type` | ENUM('full','blk','installment','ftp') | |
| `amount_paid` | DECIMAL(15,2) | Default 0 – tracks partial payments |
| `created_at` / `updated_at` | TIMESTAMP | |

### 3.6 `cards`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `card_type` | ENUM('visa','mastercard','amex') | Auto-detected |
| `last4` | VARCHAR(4) NOT NULL | |
| `expiry_month` | INT NOT NULL | |
| `expiry_year` | INT NOT NULL | |
| `cardholder_name` | VARCHAR(255) NOT NULL | Stored uppercase |
| `is_default` | BOOLEAN | First card auto-default |
| `created_at` / `updated_at` | TIMESTAMP | |

### 3.7 `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `type` | ENUM('contribution','loan','approval','payment','reminder','success','error','warning','info') | |
| `title` | VARCHAR(255) NOT NULL | |
| `message` | TEXT NOT NULL | |
| `is_read` | BOOLEAN | Default FALSE |
| `actionable` | BOOLEAN | |
| `action_link` | VARCHAR(500) | |
| `action_text` | VARCHAR(100) | |
| `created_at` | TIMESTAMP | |

### 3.8 `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `token` | VARCHAR(64) NOT NULL | 6-digit code (crypto.randomInt) |
| `expires_at` | DATETIME NOT NULL | 15 min window |
| `used` | BOOLEAN | Default FALSE |
| `created_at` | TIMESTAMP | |

### 3.9 `user_settings`
| Column | Type | Default |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL UNIQUE FK | |
| `email_notifications` | BOOLEAN | TRUE |
| `push_notifications` | BOOLEAN | TRUE |
| `sms_notifications` | BOOLEAN | FALSE |
| `contribution_reminders` | BOOLEAN | TRUE |
| `loan_alerts` | BOOLEAN | TRUE |
| `two_factor_auth` | BOOLEAN | FALSE |
| `login_alerts` | BOOLEAN | TRUE |
| `language` | VARCHAR(10) | `en` |

### 3.10 `site_settings`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `setting_key` | VARCHAR(100) NOT NULL UNIQUE | |
| `setting_value` | TEXT | |
| `updated_at` | TIMESTAMP | |

### 3.11 `faqs`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `category` | VARCHAR(100) NOT NULL |
| `question` | TEXT NOT NULL |
| `answer` | TEXT NOT NULL |
| `sort_order` | INT DEFAULT 0 |
| `created_at` | TIMESTAMP |

### 3.12 `contact_messages`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `name` | VARCHAR(255) NOT NULL |
| `email` | VARCHAR(255) NOT NULL |
| `message` | TEXT NOT NULL |
| `created_at` | TIMESTAMP |

### 3.13 `join_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `stokvel_id` | INT NOT NULL FK | |
| `status` | ENUM('pending','approved','rejected') | Default `pending` |
| `created_at` / `updated_at` | TIMESTAMP | |
| | | UNIQUE(user_id, stokvel_id) |

### 3.14 `fines`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT NOT NULL FK | |
| `stokvel_id` | INT NOT NULL FK | |
| `fine_type` | ENUM('no_banking','no_attendance','sending','late_coming','vulgar','misbehaving','madala_non_payment') | |
| `amount` | DECIMAL(15,2) NOT NULL | |
| `status` | ENUM('unpaid','paid','pending') | Default `unpaid` |
| `payment_method` | VARCHAR(20) | |
| `reason` | TEXT | |
| `issued_by` | INT FK → users(id) | |
| `paid_date` | DATETIME | |
| `created_at` / `updated_at` | TIMESTAMP | |

### 3.15 `admin_stokvel_assignments`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `admin_id` | INT NOT NULL FK | |
| `stokvel_id` | INT NOT NULL FK | |
| `assigned_by` | INT FK → users(id) | |
| `created_at` | TIMESTAMP | |
| | | UNIQUE(admin_id, stokvel_id) |

---

## 4. Backend Routes (API Endpoints)

Base URL: `http://localhost:5000/api`

### 4.1 Auth — `/api/auth` (rate-limited)

| Method | Path | Auth? | Description |
|---|---|---|---|
| POST | `/auth/register` | No (rate-limited: 5/hr) | Register new member. Status = `pending`. Creates join_request if stokvel selected. Notifies admins. |
| POST | `/auth/login` | No (rate-limited: 15/15min) | Login. Returns JWT + user object. Checks status (deleted/pending/inactive rejected). `rememberMe` → 30d token. |
| POST | `/auth/forgot-password` | No (rate-limited) | Generates 6-digit code, 15-min expiry. Sends email. Response doesn't reveal if email exists. |
| POST | `/auth/verify-code` | No | Verify reset code (email + 6-digit code). |
| POST | `/auth/reset-password` | No | Reset password using verified code + new password (8+ chars). |
| GET | `/auth/me` | **Yes** | Get current authenticated user + their active profiles. |

### 4.2 Users — `/api/users` (all authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/users/me` | Yes | Get profile, active profiles, pending join requests. |
| PUT | `/users/me` | Yes | Update name, email, phone. |
| PUT | `/users/me/password` | Yes | Change password (requires current password). |
| GET | `/users/me/profiles` | Yes | List all stokvel memberships with progress. |
| GET | `/users/me/dashboard` | Yes | Dashboard stats: total savings, active loans, monthly contributions, unread notifications. |
| DELETE | `/users/me` | Yes | Self-delete account. Requires password. Blocks if outstanding loans. Soft-deletes & anonymizes. |

### 4.3 Stokvels — `/api/stokvels`

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/stokvels` | Optional | List all non-inactive stokvels with member count. |
| GET | `/stokvels/:id` | Yes | Full stokvel detail: members, active loans, recent contributions, interest pot stats. |
| POST | `/stokvels/:id/join-request` | Yes | Request to join a stokvel. Checks max_members capacity. Admins cannot join. |

### 4.4 Contributions — `/api/contributions` (all authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/contributions` | Yes | List user's contributions. Filters: stokvelId, status, profileId. Paginated. |
| GET | `/contributions/download` | Yes | Download report as PDF/Excel/CSV. |
| GET | `/contributions/stats` | Yes | Stats: total, this month, average, monthly breakdown (6 months). |
| POST | `/contributions` | Yes | Submit contribution. Min R100. Checks remaining target. Validates card exists. Status = `pending`. |

### 4.5 Loans — `/api/loans` (all authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/loans` | Yes | List user's loans with overdue calculation, penalty amounts. Paginated. |
| GET | `/loans/download` | Yes | Download loan history as PDF/Excel/CSV. |
| GET | `/loans/stats` | Yes | Stats: active/repaid counts and amounts. |
| POST | `/loans/request` | Yes | Request loan. Min R100. Max 50% of total contributions. Madala-side blocked. Interest cap ≥ R2,000 blocks new loans. Due in 28 days. |
| POST | `/loans/:id/repay` | Yes | Repay loan. Supports 4 repayment types: `full`, `blk`, `installment`, `ftp`. See [Loan System](#9-loan-system). |

### 4.6 Cards — `/api/cards` (all authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/cards` | Yes | List user's saved cards. |
| POST | `/cards` | Yes | Add card. Luhn-validated. Auto-detects Visa/MC/Amex. Checks for duplicates. First card = default. |
| PUT | `/cards/:id/default` | Yes | Set card as default. |
| DELETE | `/cards/:id` | Yes | Remove card. Reassigns default if needed. |

### 4.7 Notifications — `/api/notifications` (all authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/notifications` | Yes | List notifications with unread count. Paginated. Filter: unreadOnly. |
| PUT | `/notifications/:id/read` | Yes | Mark one notification as read. |
| PUT | `/notifications/read-all` | Yes | Mark all as read. |
| DELETE | `/notifications/read` | Yes | Delete all read notifications. |

### 4.8 Settings — `/api/settings` (authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/settings` | Yes | Get user settings (email/push/SMS notifications, contribution reminders, loan alerts, 2FA, login alerts, language). |
| PUT | `/settings` | Yes | Update user settings. |

### 4.9 Help — `/api/help`

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/help/faq` | No | Get FAQs grouped by category. |
| POST | `/help/contact` | Optional | Submit contact form message. Notifies admins. |

### 4.10 Payments — `/api/payments`

| Method | Path | Auth? | Description |
|---|---|---|---|
| POST | `/payments/webhook` | **No** (Paystack signature verified via HMAC-SHA512) | Paystack webhook. On `charge.success`: confirms contribution, updates saved_amount (not for madala-side). |
| POST | `/payments/initialize` | Yes | Initialize Paystack payment. Creates pending contribution. Calls Paystack `/transaction/initialize`. Returns `authorizationUrl`. Supports `your-target` and `madala-side`. |
| POST | `/payments/cash` | Yes | Record cash contribution as `pending`. Admin confirms at Sunday meeting. |
| GET | `/payments/verify/:reference` | Yes | Verify Paystack payment by reference. Updates contribution status. Caps saved_amount at target. |

### 4.11 Fines — `/api/fines` (all authenticated)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/fines` | Yes | List user's fines with summary totals. Filter by status. |
| POST | `/fines/:id/pay` | Yes | Pay a fine. Card = instant. Cash = pending admin confirmation. |

### 4.12 Admin — `/api/admin` (admin/superadmin only)

| Method | Path | Auth | Description |
|---|---|---|---|
| **Stats** | | | |
| GET | `/admin/stats` | Admin | Full dashboard: member counts, contribution totals, loan breakdown, interest pot, Madala Side per member, monthly trends, member growth. |
| **User Management** | | | |
| GET | `/admin/users` | Admin | List users with search, stokvel filter, status filter. Paginated. Includes stokvel memberships. |
| POST | `/admin/users` | Admin | Create user with temp password. Assign to stokvels. Sends welcome email. Only superadmin can create admin role. |
| PUT | `/admin/users/:id` | Admin | Update user fields + stokvel memberships. Detects pending→active change to send approval email. |
| GET | `/admin/users/:id/join-requests` | Admin | Get join requests for a specific user. |
| POST | `/admin/users/:id/approve` | Admin | Approve user. Set active. Assign to stokvels. Approve join requests. Send email. |
| POST | `/admin/users/:id/reject` | Admin | Reject pending user. Sets status = deleted. Rejects all join requests. |
| DELETE | `/admin/users/:id` | Admin | Soft-delete user. Can't delete self or other admins. Deactivates profiles. Sends email. |
| POST | `/admin/users/:id/restore` | Admin | Restore soft-deleted user. Reactivates profiles if they exist. |
| DELETE | `/admin/users/:id/permanent` | **Superadmin** | Permanently delete user (CASCADE). |
| GET | `/admin/deleted-users` | Admin | List archived/deleted users with deletion info. |
| **Stokvel Management** | | | |
| GET | `/admin/stokvels` | Admin | List all stokvels with member counts, total pool, creator. |
| POST | `/admin/stokvels` | **Superadmin** | Create new stokvel. |
| PUT | `/admin/stokvels/:id` | **Superadmin** | Update stokvel settings. |
| DELETE | `/admin/stokvels/:id` | **Superadmin** | Delete stokvel (only if 0 active members). |
| **Contribution Management** | | | |
| GET | `/admin/contributions` | Admin | List all contributions with search/filter/pagination. |
| POST | `/admin/contributions/:id/confirm` | Admin | Confirm pending contribution. Updates saved_amount (not for madala-side). |
| POST | `/admin/contributions/:id/confirm-adjusted` | Admin | Confirm with adjusted amount (e.g. cash difference). |
| POST | `/admin/contributions/:id/reject` | Admin | Reject contribution. Sets status = `failed`. |
| **Loan Management** | | | |
| GET | `/admin/loans` | Admin | List all loans with filter/pagination. |
| POST | `/admin/loans/:id/approve` | Admin | Approve pending loan. Deducts principal from saved_amount. Sets due date = now + 28 days. Madala-side loans blocked. Sends email. |
| POST | `/admin/loans/:id/reject` | Admin | Reject loan with optional reason. |
| **Site Settings** | | | |
| GET | `/admin/settings` | Admin | Get all site settings. |
| PUT | `/admin/settings` | Admin | Upsert site settings (key-value). |
| **Reports** | | | |
| POST | `/admin/reports` | Admin | Generate report. Types: `contributions`, `loans`, `users`/`members`, `stokvels`, `payments`, `financial`, `deleted`. Formats: `json`, `pdf`, `excel`, `csv`. Date range filter. |
| **Join Requests** | | | |
| GET | `/admin/join-requests` | Admin | List pending join requests. |
| POST | `/admin/join-requests/:id/approve` | Admin | Approve join request. Creates profile. Sends email notification. |
| POST | `/admin/join-requests/:id/reject` | Admin | Reject join request. If user had this as their only pending request and status is pending, sets user status to deleted. |
| **Fines Management** | | | |
| GET | `/admin/fines` | Admin | List all fines with summary. Returns fine type definitions with amounts. |
| POST | `/admin/fines` | Admin | Issue fine to a user. |
| DELETE | `/admin/fines/:id` | Admin | Cancel/delete a fine. |
| POST | `/admin/fines/:id/confirm` | Admin | Confirm pending cash fine payment. |
| **Admin-Stokvel Assignments** | | | |
| GET | `/admin/admins` | **Superadmin** | List all admin users with their stokvel assignments. |
| GET | `/admin/admin-assignments` | **Superadmin** | List all admin-stokvel assignment records. |
| POST | `/admin/admin-assignments` | **Superadmin** | Assign admin to a stokvel. |
| DELETE | `/admin/admin-assignments/:id` | **Superadmin** | Remove admin-stokvel assignment. |

### 4.13 Health Check

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/api/health` | No | Returns `{ status: 'ok', database: 'connected', timestamp }` |

---

## 5. Frontend Routes

Source: [src/router/index.tsx](src/router/index.tsx)

| Path | Component | Auth Required? | Notes |
|---|---|---|---|
| `/` | `App` | No | Landing page |
| `/login` | `Login` | No | |
| `/register` | `Register` | No | |
| `/registration-success` | `RegistrationSuccess` | No | Shown after successful registration |
| `/dashboard` | `MainDashboard` | **Yes** (AuthGuard) | |
| `/profile` | `MemberProfile` | **Yes** | |
| `/contributions` | `ContributionHistory` | **Yes** | |
| `/loans` | `LoanHistory` | **Yes** | |
| `/loans/request` | `LoanRequest` | **Yes** | |
| `/admin` | `AdminDashboard` | **Yes** + `requireAdmin` | |
| `/group/:groupId` | `GroupDetails` | **Yes** | |
| `/notifications` | `Notifications` | **Yes** | |
| `/settings` | `Settings` | **Yes** | |
| `/help` | `HelpCenter` | **Yes** | |
| `/forgot-password` | `ForgotPassword` | No | |
| `/terms` | `Terms` | No | |
| `/privacy` | `Privacy` | No | |
| `/cards` | `Cards` | **Yes** | Manage payment cards |
| `/about` | `AboutUs` | No | |
| `/blog` | `Blog` | No | |
| `/faq` | `FAQ` | No | |
| `*` | `NotFound` | No | 404 catch-all |

---

## 6. Frontend API Client Functions

Source: [src/api/client.ts](src/api/client.ts), [src/api/index.ts](src/api/index.ts)

### API Client Setup
- Base URL: `VITE_API_URL` env var or `/api`
- JWT token stored in `sessionStorage.token`
- Auto-attaches `Authorization: Bearer {token}` header
- On 401: clears session, redirects to `/login`
- 403 is not auto-handled (page handles it)

### `authApi`
| Function | Method | Endpoint |
|---|---|---|
| `login(data)` | POST | `/auth/login` |
| `register(data)` | POST | `/auth/register` |
| `forgotPassword(email)` | POST | `/auth/forgot-password` |
| `verifyCode(data)` | POST | `/auth/verify-code` |
| `resetPassword(data)` | POST | `/auth/reset-password` |
| `getMe()` | GET | `/auth/me` |

### `userApi`
| Function | Method | Endpoint |
|---|---|---|
| `getMe()` | GET | `/users/me` |
| `updateProfile(data)` | PUT | `/users/me` |
| `changePassword(data)` | PUT | `/users/me/password` |
| `getProfiles()` | GET | `/users/me/profiles` |
| `getDashboard()` | GET | `/users/me/dashboard` |
| `deleteAccount(password)` | DELETE | `/users/me` |

### `stokvelApi`
| Function | Method | Endpoint |
|---|---|---|
| `list()` | GET | `/stokvels` |
| `getDetails(id)` | GET | `/stokvels/:id` |
| `joinRequest(id)` | POST | `/stokvels/:id/join-request` |

### `contributionApi`
| Function | Method | Endpoint |
|---|---|---|
| `list(params)` | GET | `/contributions` |
| `getStats(params)` | GET | `/contributions/stats` |
| `create(data)` | POST | `/contributions` |
| `download(params)` | GET | `/contributions/download` (blob) |

### `loanApi`
| Function | Method | Endpoint |
|---|---|---|
| `list(params)` | GET | `/loans` |
| `getStats()` | GET | `/loans/stats` |
| `request(data)` | POST | `/loans/request` |
| `repay(id, cardId, paymentMethod, repaymentType, installmentAmount)` | POST | `/loans/:id/repay` |
| `download(params)` | GET | `/loans/download` (blob) |

### `cardApi`
| Function | Method | Endpoint |
|---|---|---|
| `list()` | GET | `/cards` |
| `add(data)` | POST | `/cards` |
| `setDefault(id)` | PUT | `/cards/:id/default` |
| `remove(id)` | DELETE | `/cards/:id` |

### `notificationApi`
| Function | Method | Endpoint |
|---|---|---|
| `list(params)` | GET | `/notifications` |
| `markRead(id)` | PUT | `/notifications/:id/read` |
| `markAllRead()` | PUT | `/notifications/read-all` |
| `deleteRead()` | DELETE | `/notifications/read` |

### `settingsApi`
| Function | Method | Endpoint |
|---|---|---|
| `get()` | GET | `/settings` |
| `update(data)` | PUT | `/settings` |

### `helpApi`
| Function | Method | Endpoint |
|---|---|---|
| `getFaqs()` | GET | `/help/faq` |
| `submitContact(data)` | POST | `/help/contact` |

### `finesApi`
| Function | Method | Endpoint |
|---|---|---|
| `list(params)` | GET | `/fines` |
| `pay(id, data)` | POST | `/fines/:id/pay` |

### `paymentApi`
| Function | Method | Endpoint |
|---|---|---|
| `initialize(data)` | POST | `/payments/initialize` |
| `verify(reference)` | GET | `/payments/verify/:reference` |
| `cash(data)` | POST | `/payments/cash` |

### `adminApi`
| Function | Method | Endpoint |
|---|---|---|
| `getStats()` | GET | `/admin/stats` |
| `listUsers(params)` | GET | `/admin/users` |
| `createUser(data)` | POST | `/admin/users` |
| `updateUser(id, data)` | PUT | `/admin/users/:id` |
| `approveUser(id, stokvelIds)` | POST | `/admin/users/:id/approve` |
| `rejectUser(id)` | POST | `/admin/users/:id/reject` |
| `getUserJoinRequests(id)` | GET | `/admin/users/:id/join-requests` |
| `deleteUser(id, reason)` | DELETE | `/admin/users/:id` |
| `restoreUser(id)` | POST | `/admin/users/:id/restore` |
| `permanentDeleteUser(id)` | DELETE | `/admin/users/:id/permanent` |
| `listDeletedUsers()` | GET | `/admin/deleted-users` |
| `listStokvels()` | GET | `/admin/stokvels` |
| `createStokvel(data)` | POST | `/admin/stokvels` |
| `updateStokvel(id, data)` | PUT | `/admin/stokvels/:id` |
| `deleteStokvel(id)` | DELETE | `/admin/stokvels/:id` |
| `listContributions(params)` | GET | `/admin/contributions` |
| `confirmContribution(id)` | POST | `/admin/contributions/:id/confirm` |
| `confirmContributionAdjusted(id, adjustedAmount)` | POST | `/admin/contributions/:id/confirm-adjusted` |
| `rejectContribution(id, reason)` | POST | `/admin/contributions/:id/reject` |
| `listLoans(params)` | GET | `/admin/loans` |
| `approveLoan(id)` | POST | `/admin/loans/:id/approve` |
| `rejectLoan(id, reason)` | POST | `/admin/loans/:id/reject` |
| `getSiteSettings()` | GET | `/admin/settings` |
| `updateSiteSettings(data)` | PUT | `/admin/settings` |
| `generateReport(data)` | POST | `/admin/reports` |
| `listJoinRequests()` | GET | `/admin/join-requests` |
| `approveJoinRequest(id)` | POST | `/admin/join-requests/:id/approve` |
| `rejectJoinRequest(id)` | POST | `/admin/join-requests/:id/reject` |
| `listFines()` | GET | `/admin/fines` |
| `issueFine(data)` | POST | `/admin/fines` |
| `deleteFine(id)` | DELETE | `/admin/fines/:id` |
| `confirmFine(id)` | POST | `/admin/fines/:id/confirm` |
| `listAdmins()` | GET | `/admin/admins` |
| `listAdminAssignments()` | GET | `/admin/admin-assignments` |
| `assignAdminToStokvel(data)` | POST | `/admin/admin-assignments` |
| `removeAdminAssignment(id)` | DELETE | `/admin/admin-assignments/:id` |

---

## 7. Authentication Flow

### 7.1 Registration
1. User submits: `fullName`, `email`, `phone`, `password`, optional `selectedStokvel`
2. Backend validates (express-validator), checks for duplicate email
3. Password hashed with **bcrypt (12 rounds)**
4. User created with `status = 'pending'`, `role = 'member'`
5. Default `user_settings` row created
6. If stokvel selected → `join_requests` row created (status = pending)
7. All admin/superadmin users get a notification
8. User sees "Registration successful. Awaiting admin approval."

### 7.2 Login
1. User submits `email`, `password`, optional `rememberMe`
2. Backend validates email exists, checks status:
   - `deleted` → "Account deactivated"
   - `pending` → "Awaiting approval"  
   - `inactive` → "Account suspended"
3. **bcrypt.compare** verifies password
4. `last_active` timestamp updated
5. JWT signed with `{ id, email, role }`, expiry = `rememberMe ? 30d : 7d`
6. Returns `{ token, user: { id, name, email, phone, role, status, avatarUrl } }`
7. Frontend stores token + user in **sessionStorage**

### 7.3 Token Handling (Frontend)
- Stored in `sessionStorage.token`
- Axios interceptor attaches `Authorization: Bearer {token}` to every request
- On 401 response → clears session, redirects to `/login`
- `AuthGuard` component wraps protected routes, checks token existence
- `requireAdmin` prop on AuthGuard checks admin/superadmin role

### 7.4 Password Reset
1. User enters email → `POST /auth/forgot-password`
2. Backend generates 6-digit code via `crypto.randomInt(100000, 999999)`
3. Code stored in `password_reset_tokens` with 15-min expiry
4. Previous tokens for this user are invalidated (`used = TRUE`)
5. Code sent via email (SMTP)
6. User enters code → `POST /auth/verify-code` (validates but doesn't consume)
7. User enters new password → `POST /auth/reset-password` (consumes token, updates hash)

### 7.5 Logout
- Frontend-only: clears `token`, `user`, `activeProfileId` from sessionStorage, redirects to `/login`

### 7.6 Auth Middleware Functions
- **`authenticate(req, res, next)`** — Verifies JWT from `Authorization: Bearer` header. Sets `req.user = { id, email, role }`.
- **`requireAdmin(req, res, next)`** — Checks `req.user.role` is `admin` or `superadmin`.
- **`requireSuperAdmin(req, res, next)`** — Checks `req.user.role` is `superadmin`.
- **`optionalAuth(req, res, next)`** — Attaches user if token present, doesn't fail if absent.
- **`updateLastActive(req, res, next)`** — Updates `users.last_active` in background.

### 7.7 Rate Limiting
| Endpoint | Window | Max Requests |
|---|---|---|
| `/api/auth/login` | 15 minutes | 15 |
| `/api/auth/register` | 1 hour | 5 |
| `/api/auth/forgot-password` | 15 minutes | 15 |

---

## 8. Payment Flow

### 8.1 Paystack (Online Card Payments)

**Initialize** (`POST /payments/initialize`):
1. Validates amount (min R100), profile, contribution type
2. For `your-target`: checks remaining = target - saved, blocks if exceeded
3. For `madala-side`: checks against R2,200 annual target
4. Requires at least 1 saved card
5. Creates `contributions` row with `status = 'pending'`, `payment_method = 'paystack'`
6. Calls Paystack API `POST /transaction/initialize` with:
   - `email`, `amount` (in cents/kobo), `currency = 'ZAR'`, `reference`, `callback_url`
7. Returns `authorizationUrl` for user to complete payment on Paystack

**Webhook** (`POST /payments/webhook`):
1. Paystack sends server-side POST (no auth, but HMAC-SHA512 signature verified)
2. On `charge.success`: confirms contribution, updates `saved_amount` (only for `your-target`, not `madala-side`)
3. Creates success notification

**Verify** (`GET /payments/verify/:reference`):
1. Calls Paystack API `GET /transaction/verify/:reference`
2. On `success`: confirms contribution, updates saved_amount (capped at target)
3. On `failed`/`abandoned`: marks contribution as `failed`
4. On other statuses: returns `pending` for continued polling

### 8.2 Cash Payments

**Submit** (`POST /payments/cash`):
1. Same validation as Paystack initialize
2. Creates contribution with `status = 'pending'`, `payment_method = 'cash'`
3. User notified: "pending until admin confirms at Sunday meeting"
4. Admin confirms or rejects via:
   - `POST /admin/contributions/:id/confirm` — Confirms and updates saved_amount
   - `POST /admin/contributions/:id/confirm-adjusted` — Confirms with different amount
   - `POST /admin/contributions/:id/reject` — Sets status = `failed`

### 8.3 Contribution Types
- **`your-target`** (default): Goes toward member's stokvel savings target. Updates `profiles.saved_amount`.
- **`madala-side`**: Separate annual fund. Does NOT update `profiles.saved_amount`. Has R2,200 annual target with R200/month minimum.

---

## 9. Loan System

### 9.1 Loan Request Rules

- **Minimum**: R100
- **Maximum**: 50% of total contributions (current `saved_amount` + active loan principal already deducted)
- **Interest rate**: From stokvel settings (default 30%)
- **Interest**: `amount × (interestRate / 100)`
- **Total repayable**: `amount + interest`
- **Due date**: 28 days from approval date
- **Loan target**: Only `your-target` allowed. Madala-side loans are **blocked**.
- **Interest cap**: New loans blocked if total outstanding interest across all active/overdue loans ≥ R2,000
- **Multiple loans**: Allowed up to 50% total contributions limit
- **Requires**: At least 1 saved card

### 9.2 Loan Approval (Admin)

1. Admin approves → status changes `pending` → `active`
2. `borrowed_date` set to now, `due_date` set to now + 28 days
3. **Principal deducted from `profiles.saved_amount`** (so it's no longer available for further loans)
4. User notified + email sent

### 9.3 Overdue Penalty

When a loan passes its due date:
- **30% of remaining principal per month overdue** (each 28-day period counts as a month)
- `overdueMonths = ceil(msOverdue / (28 days in ms))`
- `penaltyAmount = remainingPrincipal × 0.3 × overdueMonths`
- New total repayable = remainingPrincipal + interest + penalty

### 9.4 Repayment Types

#### Full Repayment (`repaymentType = 'full'`)
- Pays entire remaining balance (principal + interest + any overdue penalty)
- **Card**: Immediately marks as `repaid`, records interest as contribution, returns principal to `saved_amount`
- **Cash**: Sets status to `pending_repayment`, admin confirms at meeting

#### BLK — Bank Loan Kind (`repaymentType = 'blk'`)
- Pay only the interest (30% of remaining principal) to **renew the loan for 28 more days**
- Interest payment recorded as a `loan_repayment` contribution
- Due date extended by 28 days
- Status changes to `blk`
- Can be repeated indefinitely (each time paying 30% interest)

#### Installment (`repaymentType = 'installment'`)
- Pay any partial amount toward the loan
- `installmentAmount` is added to `amount_paid`
- If `amount_paid ≥ principal + interest` → fully repaid, principal returned to saved_amount
- Otherwise: due date extended 28 days, status stays active
- Warning: if not fully repaid within 28 days, 30% additional interest charged

#### FTP — Failure To Pay (`repaymentType = 'ftp'`)
- Marks loan as "Failure To Pay" status
- 30% interest charged monthly on remaining principal until fully repaid
- Status changes to `ftp`

### 9.5 Interest Pot
All loan interest + penalty payments are recorded as `loan_repayment` contributions and contribute to the stokvel's "interest pot" visible in group details and admin dashboard.

---

## 10. Fines System

### 10.1 Fine Types & Amounts

| Fine Type | Label | Amount (R) |
|---|---|---|
| `no_banking` | No Banking | R30 |
| `no_attendance` | No Attendance | R20 |
| `sending` | Sending | R30 |
| `late_coming` | Late Coming | R20 |
| `vulgar` | Vulgar Language | R50 |
| `misbehaving` | Misbehaving | R20 |
| `madala_non_payment` | Madala Non-Payment | R50 |

### 10.2 Issuing Fines (Admin)
1. Admin selects user + fine type (+ optional reason)
2. System looks up user's active stokvel membership
3. Fine created with `status = 'unpaid'`, `issued_by = admin.id`
4. User receives warning notification with fine details

### 10.3 Paying Fines (Member)
- **Card**: Instantly marked as `paid`, `paid_date` set to now
- **Cash**: Status set to `pending`, admin confirms at next meeting via `POST /admin/fines/:id/confirm`

### 10.4 Admin Fine Management
- View all fines with summary (unpaid total, paid total, pending total)
- Confirm pending cash fine payments
- Delete/cancel fines

### 10.5 Automatic Madala Fines
R50 `madala_non_payment` fine is auto-issued on the 1st of each month for members who didn't pay R200 toward Madala Side in the previous month. See [Madala Side](#11-madala-side).

---

## 11. Madala Side

Source: [backend/src/utils/madalaScheduler.js](backend/src/utils/madalaScheduler.js)

### 11.1 Overview
Madala Side is a separate savings pot alongside the main stokvel target ("Your Target"). It runs January through November (December excluded).

### 11.2 Key Parameters
| Parameter | Value |
|---|---|
| Annual target | **R2,200** |
| Monthly minimum | **R200** |
| Non-payment fine | **R50** per month missed |
| Active months | January–November |

### 11.3 Contribution Rules
- Contributions with `contribution_type = 'madala-side'` are tracked separately
- **Do NOT update `profiles.saved_amount`** (only tracked via contribution records)
- Subject to the R2,200 annual cap (excess contributions blocked)
- Can be paid via Paystack or cash (same flow as regular contributions)

### 11.4 Automated Scheduler (runs daily server-side)

**5 Days Before Month End — Reminders:**
- Checks all active members for Madala payment status this month
- Members who haven't paid R200 receive:
  - Email reminder via `sendMadalaReminderEmail()`
  - In-app notification: "Your Madala Side payment of R{amount} for {month} is due in 5 days."

**1st of Each Month — Automatic Fines:**
- Checks all active members for previous month's Madala payment
- Members who paid < R200 get:
  - R50 `madala_non_payment` fine (with reference `madala-{YYYY}-{MM}` to prevent duplicates)
  - Warning notification
- December is skipped entirely

### 11.5 Admin Visibility
- Admin dashboard shows per-member Madala Side progress (paid vs R2,200 target)
- Progress percentage calculated for each member

---

## 12. Admin Features

### 12.1 Role Hierarchy
| Role | Access |
|---|---|
| `member` | Self-service: dashboard, contributions, loans, fines, profile, settings |
| `admin` | All member features + admin dashboard, user management, contribution/loan/fine management, reports, join requests |
| `superadmin` | All admin features + create/edit/delete stokvels, permanent user deletion, admin-stokvel assignments, create admin users |

### 12.2 Admin Dashboard Stats
- Total active members, pending approvals
- Total confirmed contributions, pending contribution count + amount
- Active loans count + amount, overdue loan count
- Total stokvels, deleted users count
- Interest pot: total earned, pending interest
- Per-member savings breakdown (saved vs target)
- Per-member Madala Side progress
- All active/overdue/pending loans list
- Monthly contribution trends (6 months)
- Member growth chart (6 months)

### 12.3 User Management
- **Search/Filter**: By name/email/phone, stokvel, status
- **Create User**: With temp password, assign to stokvels, sends welcome email
- **Edit User**: Update name, email, phone, status, role, stokvel memberships
- **Approve**: Activate pending users, assign to stokvels
- **Reject**: Set pending users to deleted
- **Soft Delete**: Archive user (deactivate profiles, send email)
- **Restore**: Un-delete soft-deleted users, reactivate profiles
- **Permanent Delete**: (Superadmin only) CASCADE delete from database

### 12.4 Contribution Management
- View all contributions across all members
- **Confirm**: Approve pending (especially cash) contributions
- **Confirm Adjusted**: Approve with different amount
- **Reject**: Decline with optional reason

### 12.5 Loan Management
- View all loans (filter by status)
- **Approve**: Activate loan, deduct from savings, set 28-day due date, send email
- **Reject**: Decline with reason

### 12.6 Report Generation
| Report Type | Description | Formats |
|---|---|---|
| `contributions` | All contributions in date range | JSON, PDF, Excel, CSV |
| `loans` | All loans in date range | JSON, PDF, Excel, CSV |
| `users`/`members` | All users in date range | JSON, PDF, Excel, CSV |
| `stokvels` | Stokvel details with member counts | JSON, PDF, Excel, CSV |
| `payments` | Payment records | JSON, PDF, Excel, CSV |
| `financial` | Summary: total contributions, loans, interest | JSON, PDF, Excel, CSV |
| `deleted` | Deleted user records | JSON, PDF, Excel, CSV |

### 12.7 Join Request Management
- View pending join requests
- Approve: creates membership profile, sends email
- Reject: declines request; if user's last pending request, marks user as deleted

### 12.8 Fine Management
- View all fines with summary totals
- Issue fines to members (7 types)
- Delete/cancel fines
- Confirm pending cash fine payments

### 12.9 Admin-Stokvel Assignments (Superadmin Only)
- View all admin users with their stokvel assignments
- Assign admins to specific stokvels
- Remove assignments

### 12.10 Email Notifications Sent
| Event | Email Function |
|---|---|
| Account approved | `sendApprovalEmail()` |
| Welcome (admin-created user) | `sendWelcomeEmail()` with temp password |
| Password reset code | `sendPasswordResetEmail()` |
| Join request approved | `sendJoinRequestApprovedEmail()` |
| Stokvel assignment | `sendStokvelAssignmentEmail()` |
| Stokvel unassignment | `sendStokvelUnassignmentEmail()` |
| Account deleted | `sendAccountDeletionEmail()` |
| Loan approved | `sendLoanApprovalEmail()` |
| Madala Side reminder | `sendMadalaReminderEmail()` |

---

## Security Features

- **Helmet.js** for HTTP security headers
- **CORS** restricted to configured `FRONTEND_URL`
- **Rate limiting** on auth endpoints
- **bcrypt (12 rounds)** for password hashing
- **JWT** with configurable expiry
- **Paystack webhook HMAC-SHA512 verification**
- **Luhn algorithm** card number validation
- **Input validation** via express-validator on all endpoints
- **SQL injection prevention** via parameterized queries (mysql2)
- **Compression** middleware enabled
- **Request body size limit**: 1MB
- **Soft delete** for users (preserving data integrity)

---

*End of documentation*
