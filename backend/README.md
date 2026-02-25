# Stokvel Backend API

Express.js + MySQL backend for the Stokvel Management System.

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+ (running locally or remote)

## Setup

```bash
cd backend

# 1. Quick setup (creates .env, installs deps, runs migration)
npm run setup

# 2. (Optional) Edit .env if your MySQL root password is not empty
#    Open backend/.env and set DB_PASSWORD=your_mysql_root_password

# 3. Seed demo data (admin account, sample stokvels, etc.)
npm run seed

# 4. Start the dev server
npm run dev
```

> **IMPORTANT for cloning to a new PC:**
> 1. Make sure MySQL is installed and running
> 2. Run `npm run setup` — this creates `.env` from `.env.example` and runs migrations
> 3. If your MySQL root user has a password, edit `backend/.env` and set `DB_PASSWORD`
> 4. Run `npm run seed` to create the admin account and demo data

The API will start on **http://localhost:5000**.

## Default Login Credentials (auto-seeded)

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@stokvel.co.za    | Admin@123  |
| Member  | thabo@example.com      | Member@123 |
| Member  | naledi@example.com     | Member@123 |
| Pending | sipho@example.com      | Member@123 |

> **Note:** The admin account and sample data are automatically created when you run `npm run migrate`.

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login (returns JWT)
- `POST /api/auth/forgot-password` — Request reset code
- `POST /api/auth/verify-code` — Verify reset code
- `POST /api/auth/reset-password` — Reset password
- `GET /api/auth/me` — Get current user (auth required)

### Users
- `GET /api/users/me` — Profile + memberships
- `PUT /api/users/me` — Update profile
- `PUT /api/users/me/password` — Change password
- `GET /api/users/me/profiles` — List stokvel memberships
- `GET /api/users/me/dashboard` — Dashboard stats

### Stokvels
- `GET /api/stokvels` — List all stokvels
- `GET /api/stokvels/:id` — Stokvel details (members, loans, contributions)
- `POST /api/stokvels/:id/join-request` — Request to join

### Contributions
- `GET /api/contributions` — List user's contributions
- `GET /api/contributions/stats` — Contribution statistics
- `POST /api/contributions` — Make a contribution

### Loans
- `GET /api/loans` — List user's loans
- `GET /api/loans/stats` — Loan statistics
- `POST /api/loans/request` — Request a loan
- `POST /api/loans/:id/repay` — Repay a loan

### Cards
- `GET /api/cards` — List user's cards
- `POST /api/cards` — Add a card
- `PUT /api/cards/:id/default` — Set default card
- `DELETE /api/cards/:id` — Remove a card

### Notifications
- `GET /api/notifications` — List notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/read-all` — Mark all as read
- `DELETE /api/notifications/read` — Delete all read

### Settings
- `GET /api/settings` — Get user settings
- `PUT /api/settings` — Update user settings

### Help
- `GET /api/help/faq` — Get FAQs
- `POST /api/help/contact` — Submit contact form

### Admin (requires admin role)
- `GET /api/admin/stats` — Dashboard overview
- `GET /api/admin/users` — List/search users
- `POST /api/admin/users` — Create user
- `PUT /api/admin/users/:id` — Edit user
- `POST /api/admin/users/:id/approve` — Approve pending user
- `DELETE /api/admin/users/:id` — Soft delete (archive)
- `POST /api/admin/users/:id/restore` — Restore archived user
- `DELETE /api/admin/users/:id/permanent` — Permanent delete
- `GET /api/admin/deleted-users` — List archived users
- `GET /api/admin/stokvels` — List stokvels (admin view)
- `POST /api/admin/stokvels` — Create stokvel
- `PUT /api/admin/stokvels/:id` — Update stokvel
- `DELETE /api/admin/stokvels/:id` — Delete stokvel
- `GET /api/admin/contributions` — All contributions
- `POST /api/admin/contributions/:id/confirm` — Confirm contribution
- `GET /api/admin/settings` — Site settings
- `PUT /api/admin/settings` — Update site settings
- `POST /api/admin/reports` — Generate report
- `GET /api/admin/join-requests` — List pending join requests
- `POST /api/admin/join-requests/:id/approve` — Approve join request
- `POST /api/admin/join-requests/:id/reject` — Reject join request

### Health
- `GET /api/health` — Server & database status

## Database Schema

12 tables: `users`, `stokvels`, `profiles`, `contributions`, `loans`, `cards`, `notifications`, `password_reset_tokens`, `user_settings`, `site_settings`, `faqs`, `contact_messages`, `join_requests`
