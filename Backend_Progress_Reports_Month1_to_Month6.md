# HENNESSY SOCIAL CLUB — STOKVEL MANAGEMENT SYSTEM
# BACKEND PROGRESS REPORTS (MONTH 1 – MONTH 6)

---

---

## MONTH 1 PROGRESS REPORT

### REPORT/PROJECT DESCRIPTION

**Project Name:** Hennessy Social Club — Stokvel Management System  
**Report Period:** Month 1  
**Module:** Backend — Project Initialization, Environment Setup & Database Design  
**Technologies Used:** Node.js, Express.js, MySQL, mysql2/promise, dotenv, cors, nodemon  

### INTRODUCTION

In the first month of backend development, I focused on laying the foundation for the Stokvel Management System. My primary objective was to establish the project structure, configure the development environment, and design the database schema that would support all system features. A stokvel is a community-based savings group, and I am building this system to digitally manage contributions, loans, memberships, and administrative operations. This month involved critical planning and architectural decisions that would influence my entire development lifecycle.

### DESCRIPTION OF PROGRESS REPORT

**Week 1**

I began by initializing the backend project using Node.js with ES Module support, setting `"type": "module"` in the package.json file. I structured the project following a modular architecture, separating it into database, middleware, routes, and utilities directories under the `src/` folder. The entry point is `server.js`, and I organized database-related files (connection, migration, and seeding) into their own dedicated folder. This modular structure ensures my codebase remains maintainable and scalable as the project grows.

I then installed the core dependencies I would need throughout the project. These include `express` as the web framework, `mysql2` as the database driver with promise support, `dotenv` for managing environment variables, and `cors` for Cross-Origin Resource Sharing. I also installed `nodemon` as a development dependency for automatic server restarting during development. I configured environment variables via a `.env` file for database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), `JWT_SECRET`, and `PORT` (5000), and created NPM scripts for the development workflow including `npm run dev`, `npm start`, `npm run migrate`, `npm run seed`, and `npm run reset-db`.

**Week 2**

I developed the database connection module (`connection.js`) to establish a MySQL connection pool using `mysql2/promise`. The connection pool provides efficient database access by reusing connections rather than creating new ones for each query, which is critical for handling concurrent API requests in a financial application.

I then began designing the full database schema, which would consist of 13 tables. I developed the migration script (`migrate.js`) that creates all tables using `CREATE TABLE IF NOT EXISTS` statements with proper relationships. The core tables I designed include `users` for system users with roles (admin/member) and statuses (active/inactive/pending/deleted), `stokvels` for savings groups with type, target amount, cycle, and interest rate, and `profiles` as the junction table linking users to stokvels with membership roles (member/admin/treasurer) and tracking saved and target amounts.

**Week 3**

I continued the database schema design by creating tables for the financial and operational aspects of the system. These include `contributions` for payment transactions with methods and confirmation status, `loans` for borrowing records with interest, repayment tracking, and due dates, and `cards` for saved payment card details storing only the last 4 digits, type, and expiry for security. I also designed the `notifications` table for the in-app notification system with read status and action links, `password_reset_tokens` for OTP-based password resets with expiry tracking, `user_settings` for per-user notification and security preferences, `site_settings` for global key-value configuration storage, `faqs` for help center frequently asked questions, `contact_messages` for contact form submissions, and `join_requests` for stokvel membership requests with an approval workflow.

My key design decisions included implementing a soft-delete pattern for users using `deleted_at`, `deleted_by`, and `delete_reason` columns to preserve data integrity rather than permanent deletion. I also applied unique constraints on `profiles(user_id, stokvel_id)` and `join_requests(user_id, stokvel_id)` to prevent duplicate memberships, established foreign key relationships between tables to maintain referential integrity, and added timestamps (`created_at`, `updated_at`) with `DEFAULT CURRENT_TIMESTAMP` for audit trails.

**Week 4**

I developed the seed script (`seed.js`) to populate the database with initial data. This includes one admin account (`admin@stokvel.co.za` / `Admin@123`) with a bcrypt-hashed password, three stokvels with different configurations (Kasi Savings Club with a R50,000 target on a monthly cycle, Collective Pot with a R7,000 target on a weekly cycle, and Ubuntu Circle with a R25,000 target on a weekly cycle), nine site settings covering currency, minimum contribution of R100, maximum loan percentage of 50%, interest rate of 30%, loan term of 30 days, late fee of 5%, grace period of 7 days, and voluntary exit refund of 50%, as well as 12 FAQs across 5 categories.

I also configured the Express server (`server.js`) with CORS middleware for both development (`localhost:5173`) and production environments, JSON body parsing middleware, a health-check endpoint (`GET /api/health`) that tests database connectivity, global error handlers for 404 and 500 responses, and static file serving for the compiled frontend in production with SPA fallback. One of the challenges I faced was deciding between traditional SQL relationships and a NoSQL approach — I chose MySQL for its ACID compliance and the relational nature of financial data. Designing the soft-delete pattern to allow user restoration while maintaining data integrity was another challenge I overcame by using dedicated columns for deletion metadata. By the end of this month, I fully established the project foundation with a working development environment, a comprehensive 13-table database schema, and a configured Express server ready to accept route registrations.

---

---

## MONTH 2 PROGRESS REPORT

### REPORT/PROJECT DESCRIPTION

**Project Name:** Hennessy Social Club — Stokvel Management System  
**Report Period:** Month 2  
**Module:** Backend — Authentication System, Middleware & User Management  
**Technologies Used:** Node.js, Express.js, MySQL, jsonwebtoken (JWT), bcryptjs, express-validator  

### INTRODUCTION

In the second month, I focused on building the authentication system and user management API endpoints. Security is a critical concern for a financial application, so I prioritized implementing robust authentication with JWT tokens, password hashing, input validation, and role-based access control. I also developed the user management module to allow members to manage their profiles and account settings.

### DESCRIPTION OF PROGRESS REPORT

**Week 1**

I began by developing three authentication middleware functions in `auth.js`. The first, `authenticate`, extracts the Bearer token from the `Authorization` header, verifies it using `jsonwebtoken`, and attaches the decoded user containing `id`, `email`, and `role` to `req.user`, returning a 401 error if the token is missing or invalid. The second, `requireAdmin`, is a secondary middleware that checks if `req.user.role === 'admin'` and returns a 403 Forbidden error if the user is not an administrator, enabling role-based access control across admin-only endpoints. The third, `optionalAuth`, attempts to authenticate without failing — if a valid token is present, the user is attached, otherwise the request proceeds without authentication, which is useful for public endpoints that optionally personalize responses for logged-in users. I also created an `updateLastActive` middleware that updates the `users.last_active` timestamp on each authenticated request to track user activity.

I also developed the `validate.js` middleware that integrates with `express-validator` to provide structured field-level validation errors. The middleware runs the validator results and returns a 400 response with an array of `{ field, message }` objects if validation fails. This ensures all API inputs are sanitized and validated before reaching my route handlers.

**Week 2**

I built the complete authentication flow under `/api/auth` with six endpoints. The `POST /register` endpoint handles new user registration with bcrypt password hashing, setting the status to `pending` for admin approval, and creating a join request if the user selects a stokvel during registration while also sending a notification to all admin users. The `POST /login` endpoint authenticates users with email and password, returns a JWT token with a 7-day expiry (or 30-day with the `rememberMe` option), and checks for pending, inactive, and deleted account statuses with appropriate error messages. The `POST /forgot-password` endpoint generates a 6-digit OTP code with a 15-minute expiry window, stores it in `password_reset_tokens`, and sends the code to the user's email. The `POST /verify-code` endpoint validates the 6-digit reset code without consuming it, allowing the user to proceed to the password reset step. The `POST /reset-password` endpoint consumes the OTP code, hashes the new password with bcrypt, and updates the user record. Finally, the `GET /me` endpoint returns the authenticated user's profile along with active stokvel memberships and progress percentages.

I hash passwords using `bcryptjs` with a salt round of 10, and I sign JWT tokens with a secret key from environment variables, including user `id`, `email`, and `role`. I designed the registration flow to follow a pending-approval model where new users cannot log in until an admin approves their account.

**Week 3**

I built self-service user management under `/api/users` with six endpoints. The `GET /me` endpoint returns the full user profile with active stokvel memberships and pending join requests. The `PUT /me` endpoint updates the user's name, email, and phone number with email uniqueness validation. The `PUT /me/password` endpoint changes the password and requires current password verification before accepting a new password. The `GET /me/profiles` endpoint lists all stokvel memberships with savings progress calculation. The `GET /me/dashboard` endpoint aggregates dashboard statistics including total savings, active loans, monthly contributions, unread notifications, and profile count. The `DELETE /me` endpoint handles self-account deletion, requiring password confirmation, blocking users with outstanding loans, soft-deleting and anonymizing the account, deactivating all profiles, and cleaning up related records such as notifications, settings, cards, and tokens.

**Week 4**

I built user preferences management under `/api/settings` with two endpoints. The `GET /` endpoint retrieves user notification and security preferences and creates default settings if none exist. The `PUT /` endpoint updates 8 configurable settings: email notifications, push notifications, SMS notifications, contribution reminders, loan alerts, two-factor authentication, login alerts, and language preference.

Implementing the self-deletion flow required me to carefully consider cascading effects — deactivating profiles, cleaning up notifications, and preventing deletion when loans are outstanding. I also needed to ensure the JWT token includes sufficient information for middleware to authorize requests without additional database queries on every request. By the end of this month, I delivered a complete authentication system with registration, login, password reset, and session management. Users can manage their profiles, change passwords, view dashboard statistics, and manage notification preferences. My role-based middleware enables secure separation of admin and member functionality.

---

---

## MONTH 3 PROGRESS REPORT

### REPORT/PROJECT DESCRIPTION

**Project Name:** Hennessy Social Club — Stokvel Management System  
**Report Period:** Month 3  
**Module:** Backend — Stokvel Management, Member Profiles & Join Request Workflow  
**Technologies Used:** Node.js, Express.js, MySQL, jsonwebtoken, express-validator  

### INTRODUCTION

In the third month, I focused on building the core stokvel (savings group) management functionality. This included creating endpoints for viewing and joining stokvels, managing the join request approval workflow, and establishing the member profile system that tracks each user's participation in different savings groups. This module is the heart of my application as it connects users to their savings groups and manages their progress toward financial goals.

### DESCRIPTION OF PROGRESS REPORT

**Week 1**

I began by developing the stokvel management API under `/api/stokvels` with three endpoints. The `GET /` endpoint lists all active stokvels with current member counts, using optional authentication so that public users can view available groups while authenticated users see personalized data. It joins the `profiles` table to calculate the active member count for each stokvel. The `GET /:id` endpoint returns comprehensive stokvel details including the member list with individual savings progress, total pool amount, active loan count and value, recent contribution history, and interest pot statistics, providing a full financial overview of the group. The `POST /:id/join-request` endpoint submits a membership request to join a stokvel with validation logic that blocks admin users from joining, checks for maximum member capacity, prevents duplicate requests, and handles re-request scenarios after previous rejection. On successful submission, all admin-role members of the stokvel receive a notification.

**Week 2**

I implemented the membership application workflow that governs how users join stokvels. When a user submits a request, it creates a `join_requests` record with status `pending`. The admin then reviews pending requests via the admin dashboard. When the admin approves a request, it creates a `profiles` record linking the user to the stokvel, updates the join request status to `approved`, and sends an in-app notification and email to the user. When the admin rejects a request, it updates the status to `rejected` and notifies the user. If the user has no remaining pending requests and was in `pending` account status, the system auto-deletes the user account. This workflow ensures controlled access to savings groups while maintaining a smooth user experience.

I also heavily leveraged the relational database design I established in Month 1. I use the `profiles` table as the junction/bridge table between `users` and `stokvels`, enabling many-to-many relationships with additional metadata such as role, saved amount, and target amount. The `join_requests` table maintains the approval workflow state with unique constraints preventing duplicate applications. I designed the `notifications` table with a flexible schema using type-based templates and optional action fields.

**Week 3**

I built the in-app notification system under `/api/notifications` with four endpoints. The `GET /` endpoint lists the user's notifications with pagination support and an optional `unreadOnly` filter, returning the total unread count alongside the notification list. The `PUT /:id/read` endpoint marks a single notification as read and validates ownership to prevent users from modifying others' notifications. The `PUT /read-all` endpoint marks all of the authenticated user's notifications as read in a single operation. The `DELETE /read` endpoint deletes all read notifications to clean up the notification feed. My notification system supports 9 notification types and includes actionable notifications with `action_link` and `action_text` fields that allow users to navigate to relevant pages directly from the notification.

**Week 4**

I developed public-facing support endpoints under `/api/help` with two endpoints. The `GET /faq` endpoint returns all FAQs grouped by category (Getting Started, Contributions, Loans, Account & Security, Leaving a Stokvel), sorted by `sort_order` for consistent display. The `POST /contact` endpoint accepts contact form submissions containing name, email, and message, stores the message in the `contact_messages` table, and sends notifications to all admin users alerting them of the new inquiry. It uses optional authentication to link messages to registered users when applicable.

I had to handle the edge case where a rejected user submits a new join request to the same stokvel — I solved this by checking for existing rejected requests and updating their status rather than creating duplicates. I also needed to design the notification system to be both flexible in supporting various notification types and efficient with paginated queries and unread counts. By the end of this month, my stokvel management module, join request workflow, notification system, and help center are fully operational. Users can browse available stokvels, request membership, receive notifications about their application status, and access help resources. I have now laid the foundation for financial transactions through the profiles system.

---

---

## MONTH 4 PROGRESS REPORT

### REPORT/PROJECT DESCRIPTION

**Project Name:** Hennessy Social Club — Stokvel Management System  
**Report Period:** Month 4  
**Module:** Backend — Contributions, Payment Processing (Paystack) & Card Management  
**Technologies Used:** Node.js, Express.js, MySQL, Paystack API, axios, pdfkit, exceljs, uuid  

### INTRODUCTION

In the fourth month, I concentrated on the financial transaction components of the system — specifically, contribution processing, payment gateway integration, and card management. These features are critical for the stokvel model, as the entire system revolves around members making regular financial contributions to their savings groups. I integrated the Paystack payment gateway to enable secure online payments, alongside manual payment recording for cash and bank transfer methods.

### DESCRIPTION OF PROGRESS REPORT

**Week 1**

I began by developing the contribution management API under `/api/contributions` with four endpoints. The `GET /` endpoint lists the authenticated user's contributions with pagination and filtering by stokvel, status (confirmed/pending/deleted/failed), and profile, returning comprehensive data including the stokvel name for display. The `GET /download` endpoint generates downloadable contribution history reports in three formats: PDF using PDFKit, Excel using ExcelJS, and CSV, with each format including branded headers, formatted dates in South African locale, and monetary values. The `GET /stats` endpoint returns contribution statistics including total contributions, current month's contributions, average contribution amount, and a 6-month breakdown showing monthly trends using SQL aggregation with `DATE_FORMAT` for monthly grouping. The `POST /` endpoint records a new contribution, implementing business rules such as a minimum amount of R100 (configurable via site settings), validation that the contribution does not exceed the remaining target amount, verification that the payment card exists, and generation of a unique reference number using the `uuid` package. Contributions are created with `pending` status for admin confirmation, and my target-amount capping prevents over-contribution by calculating the remaining amount as `target_amount - saved_amount`.

**Week 2**

I integrated the Paystack payment gateway for secure online payments under `/api/payments` with three endpoints. The `POST /initialize` endpoint initializes a Paystack payment transaction by creating a pending contribution record, then calling the Paystack `transaction/initialize` API with the amount converted to kobo, the user's email, and the contribution reference, returning the `authorization_url` for the frontend to redirect the user to Paystack's hosted payment page. The `GET /verify/:reference` endpoint verifies a payment after the user returns from Paystack by calling the Paystack `transaction/verify` API — if successful, it confirms the contribution, updates the profile's `saved_amount` capped at `target_amount`, and sends a success notification; if failed, it marks the contribution as `deleted`. The `POST /webhook` endpoint receives Paystack webhook events server-to-server, validates the request using HMAC SHA-512 signature verification with the Paystack secret key, and on `charge.success` events confirms the contribution, updates `saved_amount`, and notifies the user. This provides a reliable fallback for confirming payments even if the user doesn't return to the verification page. I implemented security measures including webhook signature verification using `crypto.createHmac('sha512')` to prevent spoofed requests, API calls using the secret key from environment variables, and amount conversion between Rand and Kobo since Paystack uses the smallest currency unit.

**Week 3**

I built saved card management under `/api/cards` with four endpoints. The `GET /` endpoint lists the authenticated user's saved payment cards. The `POST /` endpoint adds a new card with comprehensive validation including the Luhn algorithm for card number validity, automatic card type detection where Visa starts with 4, Mastercard starts with 51-55, and Amex starts with 34/37, expiry date validation to ensure the card is not expired, and a uniqueness check to prevent duplicate last-4 digits. Only the last 4 digits are stored, and the first card added automatically becomes the default. The `PUT /:id/default` endpoint sets a specific card as the default payment method using a transaction to unset the previous default and set the new one. The `DELETE /:id` endpoint deletes a saved card, and if the deleted card was the default, the system automatically promotes the next available card to default. I validate card numbers by doubling every second digit from right, subtracting 9 if greater than 9, and checking if the sum is divisible by 10. I store only the last 4 digits and expiry — full card numbers are never persisted for security.

**Week 4**

I developed reusable report generation utilities in `reports.js`. The `generatePDF` function creates branded A4 landscape PDFs using PDFKit with table headers, alternating row colors for readability, automatic pagination with page numbers, and date range display in the header. The `generateExcel` function creates styled `.xlsx` workbooks using ExcelJS with branded headers, auto-fitted column widths, and alternating row fill colours. The `generateCSV` function generates standard CSV files with properly escaped values. The `formatRowData` function formats dates using the South African locale (`en-ZA`) and monetary amounts with the `R` prefix. I also defined `REPORT_COLUMNS` with predefined column definitions for 7 report types: contributions, loans, users, stokvels, payments, financial, and deleted users.

Implementing Paystack webhook verification required me to carefully handle HMAC signature validation and edge cases where webhooks arrive before the user returns to the verification page. My Luhn algorithm implementation required handling card numbers with spaces and dashes, and mapping card number prefixes to the correct card network. By the end of this month, I completed the financial core of the application. Users can make contributions manually or via Paystack, manage payment cards with proper validation, view contribution statistics, and download transaction history in multiple formats. My Paystack integration provides secure online payment processing with webhook-based confirmation.

---

---

## MONTH 5 PROGRESS REPORT

### REPORT/PROJECT DESCRIPTION

**Project Name:** Hennessy Social Club — Stokvel Management System  
**Report Period:** Month 5  
**Module:** Backend — Loan Management, Email Notifications & Transactional Email System  
**Technologies Used:** Node.js, Express.js, MySQL, nodemailer, pdfkit, exceljs  

### INTRODUCTION

In the fifth month, I focused on implementing the loan management system and the transactional email notification service. The loan feature is a fundamental aspect of stokvels — members can borrow from their savings group's pool at an agreed-upon interest rate, and the interest earned benefits the entire group. Additionally, I built a professional email notification system to keep users informed about account activities such as approvals, assignments, and security events.

### DESCRIPTION OF PROGRESS REPORT

**Week 1**

I began by developing the loan management API under `/api/loans` with five endpoints. The `GET /` endpoint lists the authenticated user's loans with pagination, including calculated fields such as `days_remaining` (days until the due date), stokvel name, and formatted interest/repayment amounts. The `GET /download` endpoint downloads loan history as PDF, Excel, or CSV with formatted columns including amount, interest, total repayable, status, and dates. The `GET /stats` endpoint returns loan statistics including active loan count and amount, repaid loan count and amount, and total amount borrowed across all time.

**Week 2**

I implemented the `POST /request` endpoint for requesting new loans with comprehensive business rule validation. My loan request endpoint enforces multiple rules to protect both the borrower and the savings group: the maximum loan amount cannot exceed 50% of the user's total confirmed contributions to the stokvel (configurable via site settings), users cannot have more than one active loan from the same savings group simultaneously, the interest rate is 30% derived from the stokvel's configured `interest_rate` field (so for a R1,000 loan the user repays R1,300), the repayment period is 30 days with the due date calculated as `borrowed_date + 30 days`, users must have at least one saved payment card before requesting a loan, and on approval the loan principal is deducted from the user's `saved_amount` in their profile.

I also implemented the `POST /:id/repay` endpoint for repaying active loans. When a user repays a loan, the system marks it as repaid, records the interest as a `loan_repayment` contribution to the group's interest pot, and returns the principal to the user's `saved_amount`. This is a key financial feature — the interest distribution mechanism works as follows: the user borrows R1,000 and their `saved_amount` decreases by R1,000, the loan records the principal of R1,000, interest of R300 at 30%, and total repayable of R1,300. When the user repays, the principal returns to their `saved_amount` and the interest of R300 is recorded as a `loan_repayment` type contribution that adds to the group's total pool. This means the entire group benefits from loan interest, incentivizing responsible lending.

**Week 3**

I built a comprehensive email notification service in `email.js` using `nodemailer` with SMTP/Gmail transport, consisting of six branded HTML email templates. The `sendApprovalEmail` function is triggered when an admin approves a pending user, sending a welcome message with account activation confirmation and a login link. The `sendJoinRequestApprovedEmail` function is triggered when an admin approves a stokvel join request, containing the stokvel name, membership confirmation, and a group details link. The `sendStokvelAssignmentEmail` function is triggered when an admin assigns a user to stokvels, listing the assigned stokvels with a dashboard link. The `sendStokvelUnassignmentEmail` function is triggered when an admin removes a user from stokvels, listing the removed stokvels with a contact support link. The `sendAccountDeletionEmail` function is triggered when an admin archives or deletes a user account, providing a deletion notice with the reason if provided and support contact information. The `sendPasswordResetEmail` function is triggered when a user requests a password reset, providing the 6-digit OTP code, 15-minute expiry notice, and security warnings.

**Week 4**

I finalized the email system configuration and ensured all templates are production-ready. All my email templates feature branded HTML design with consistent styling matching the Hennessy Social Club branding, professional layout with headers and footers. I ensured non-blocking execution by wrapping all email sends in try/catch blocks so that failures are logged to the console but do not interrupt the API response, ensuring that email server downtime does not break core functionality. Each template populates user-specific data such as name, email, stokvel names, and OTP codes into the HTML template dynamically. I use `nodemailer.createTransport` with Gmail SMTP settings, credentials are stored in environment variables (`EMAIL_USER`, `EMAIL_PASS`), and I configured the sender name as "Hennessy Social Club".

I needed to ensure atomicity in loan operations since borrowing and repayment involve multiple table updates across loans, profiles, and contributions that must succeed or fail together. I used sequential database operations with error handling to address this. Email delivery reliability was another concern as Gmail SMTP has rate limits and may reject connections, but my non-blocking try/catch pattern ensures the user experience is not affected by email failures. By the end of this month, my loan management system is fully functional with business rule enforcement, interest calculation, and repayment tracking. My email notification system sends professional branded emails for 6 critical user events, and I designed both systems to be resilient so that email failures do not break the application flow.

---

---

## MONTH 6 PROGRESS REPORT

### REPORT/PROJECT DESCRIPTION

**Project Name:** Hennessy Social Club — Stokvel Management System  
**Report Period:** Month 6  
**Module:** Backend — Admin Dashboard API, Report Generation, System Integration & Deployment  
**Technologies Used:** Node.js, Express.js, MySQL, PDFKit, ExcelJS, Render (Cloud Deployment), GitHub  

### INTRODUCTION

In the sixth and final month, I focused on building the comprehensive admin dashboard API — the largest and most complex module of my system — along with report generation capabilities, system-wide integration testing, bug fixing, and preparation for production deployment. The admin module provides full control over the system, including user management, stokvel administration, contribution oversight, and data reporting. This month I brought together all my previously developed modules into a cohesive, production-ready system.

### DESCRIPTION OF PROGRESS REPORT

**Week 1**

I began by developing the most extensive route module of the system — `admin.js` at 1,295 lines — under `/api/admin`, protected by both my `authenticate` and `requireAdmin` middleware. I started with the dashboard statistics endpoint `GET /stats`, which returns a comprehensive dashboard overview including total active members, pending user approvals, total confirmed contributions in ZAR, pending contributions, active and overdue loan counts, total stokvels, deleted users count, total saved amount, a 6-month monthly contribution trend using SQL `DATE_FORMAT` grouping, and a member growth trend.

I then built the user management endpoints, which form the largest portion of the admin API with 10 endpoints. The `GET /users` endpoint lists all users with pagination, search by name/email/phone, and filtering by status and stokvel, including each user's stokvel memberships via a LEFT JOIN aggregation. The `POST /users` endpoint creates a new user by generating a temporary password, assigning the user to selected stokvels by creating profile records, and sending a welcome notification. The `PUT /users/:id` endpoint updates user details including name, email, phone, status, role, and stokvel assignments, detecting pending-to-active transitions to trigger approval emails and handling stokvel assignment changes with add/remove emails. The `GET /users/:id/join-requests` endpoint retrieves join requests for a specific user with stokvel details.

**Week 2**

I continued building the user management endpoints within the admin module. The `POST /users/:id/approve` endpoint approves a pending user by activating the account, processing stokvel assignments from join requests, creating profile records, and sending an approval email. The `POST /users/:id/reject` endpoint rejects a pending user by rejecting all their join requests and soft-deleting the account. The `DELETE /users/:id` endpoint soft-deletes a user with protection against self-deletion and admin-to-admin deletion, records the deletion reason, deactivates all stokvel profiles, and sends a deletion notification email. The `POST /users/:id/restore` endpoint restores a deleted user by reactivating the account and restoring previously active stokvel memberships. The `DELETE /users/:id/permanent` endpoint permanently deletes a user with cascading foreign key removal from all related tables. The `GET /deleted-users` endpoint lists all archived/deleted users with deletion details including who deleted them, when, and the reason, along with their historical join requests and stokvel memberships.

I also built the stokvel administration endpoints with four more routes. The `GET /stokvels` endpoint lists all stokvels with member count, total pool amount, and creator name. The `POST /stokvels` endpoint creates a new stokvel with all configuration options including name, type, target amount, cycle, meeting day, interest rate, max members, icon, and color. The `PUT /stokvels/:id` endpoint updates stokvel properties. The `DELETE /stokvels/:id` endpoint deletes a stokvel but is blocked if active members still exist to prevent data loss.

**Week 3**

I developed the contribution oversight and join request management endpoints, along with the comprehensive reporting system. The `GET /contributions` endpoint lists all contributions system-wide with pagination, search, and stokvel/status filtering. The `POST /contributions/:id/confirm` endpoint confirms a pending contribution by updating the member's `saved_amount` capped at the target amount and sending a confirmation notification. The `GET /join-requests` endpoint lists all pending join requests with user and stokvel details. The `POST /join-requests/:id/approve` endpoint approves a request by creating a profile record, notifying the user, and sending an approval email. The `POST /join-requests/:id/reject` endpoint rejects a request, notifies the user, and auto-deletes the user account if they have no remaining pending requests.

I implemented a comprehensive reporting system via `POST /reports` supporting 7 report types: `contributions` with all contributions including user names, stokvel, amount, method, status, and date; `loans` with all loans including user names, stokvel, amount, interest, total repayable, status, and dates; `users`/`members` with all user records including role, status, registration date, and last active; `stokvels` with all stokvels including type, target, member count, cycle, and interest rate; `payments` with confirmed payments including reference numbers and payment methods; `financial` with financial summary including amounts and transaction details; and `deleted` with archived users including deletion reason, date, and who deleted them. My reports support date range filtering with `startDate` and `endDate` parameters where I adjusted the end date to 23:59:59 to include full-day records, four output formats (JSON for dashboard display, PDF as branded A4 landscape, Excel as styled .xlsx, and CSV as standard format), and input validation where I validate report type and format against known values. I also built site settings management with `GET /settings` to return all site settings as key-value pairs and `PUT /settings` to upsert settings using `INSERT ... ON DUPLICATE KEY UPDATE` for atomic updates.

**Week 4**

I spent the final week on system integration, bug fixes, and deployment preparation. I added admin deletion protection with validation to prevent admins from deleting themselves or other admin accounts, preventing the system from becoming inaccessible. I updated the API client to handle 403 Forbidden responses by clearing stale authentication tokens and redirecting to the login page, preventing "Admin access required" popups. I wrapped all `await sendEmail()` calls in try/catch blocks throughout the admin routes, ensuring email delivery failures do not return 500 errors to the client. I fixed an issue where reports showed 0 records when filtering by date — the `BETWEEN` clause with a date-only end value was treating it as midnight, excluding same-day records, which I resolved by appending `23:59:59` to the end date. I also implemented `Promise.allSettled` in the frontend's dashboard data loading to prevent a single failed API call from breaking the entire dashboard.

I prepared the application for cloud deployment on Render by creating a `render.yaml` deployment configuration file, configuring the Express server to serve the compiled React frontend from the `dist/` directory in production mode with SPA fallback routing, setting up environment variable management for production including database credentials, JWT secret, Paystack keys, and email credentials, and ensuring my health check endpoint (`GET /api/health`) tests database connectivity for deployment monitoring. The admin module's complexity of 1,295 lines required me to implement careful error handling across all 20 endpoints, especially for operations involving multiple table updates and email notifications. Production deployment required me to handle differences between development and production environments, particularly CORS configuration and static file serving. By the end of this month, my admin dashboard API is fully operational with comprehensive user management, stokvel administration, contribution oversight, report generation, and join request handling. I have resolved all identified bugs, and the system is deployed and ready for production use. My completed backend delivers 60 API endpoints across 11 route modules, 13 database tables with proper relationships and constraints, role-based access control with JWT authentication, Paystack payment integration with webhook verification, 6 branded email templates with non-blocking delivery, multi-format report generation in PDF, Excel, and CSV, and full admin CRUD operations for users, stokvels, contributions, and join requests. My Stokvel Management System backend is complete.
