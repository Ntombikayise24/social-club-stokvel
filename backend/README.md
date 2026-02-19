# SOCIAL CLUB Backend API Documentation

## Overview

The SOCIAL CLUB Backend API is a comprehensive REST API built with Node.js, Express.js, and MongoDB for managing stokvel (savings club) operations. It provides endpoints for user authentication, stokvel management, contributions, loans, notifications, and administrative functions.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs
- **CORS**: Enabled for frontend integration
- **Logging**: Morgan (development mode)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection
│   ├── controllers/              # Route handlers
│   │   ├── authController.js
│   │   ├── stokvelController.js
│   │   ├── contributionController.js
│   │   ├── loanController.js
│   │   ├── notificationController.js
│   │   ├── profileController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validate.js          # Request validation middleware
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Stokvel.js
│   │   ├── Membership.js
│   │   ├── Contribution.js
│   │   ├── Loan.js
│   │   └── Notification.js
│   ├── routes/                  # API route definitions
│   │   ├── auth.js
│   │   ├── stokvels.js
│   │   ├── contributions.js
│   │   ├── loans.js
│   │   ├── notifications.js
│   │   ├── profile.js
│   │   └── admin.js
│   ├── utils/
│   │   └── helpers.js
│   ├── seed.js                  # Database seeding script
│   └── server.js                # Main application entry point
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Environment Variables

Create a `.env` file in the backend root directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-club
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

### Installation

```bash
cd backend
npm install
```

### Running the Application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start

# Seed database with sample data
npm run seed
```

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Reference

### Health Check

**GET** `/health`
- **Description**: Check API health status
- **Response**:
```json
{
  "success": true,
  "message": "SOCIAL CLUB API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "env": "development"
}
```

---

## Authentication Routes

### Register User

**POST** `/auth/register`

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "preferredGroups": ["group_id_1", "group_id_2"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please wait for admin approval.",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "status": "pending"
  }
}
```

### Login User

**POST** `/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "status": "active"
  }
}
```

### Get Current User

**GET** `/auth/me`
- **Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "member",
    "status": "active",
    "preferredGroups": []
  }
}
```

---

## Stokvel (Group) Routes

### Get All Stokvels

**GET** `/stokvels`
- **Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "stokvels": [
    {
      "id": "stokvel_id",
      "name": "Weekly Savers",
      "type": "traditional",
      "description": "Weekly savings group",
      "targetAmount": 5000,
      "maxMembers": 20,
      "currentMembers": 15,
      "status": "active",
      "nextPayout": "2024-02-01T00:00:00.000Z"
    }
  ]
}
```

### Get Stokvel Details

**GET** `/stokvels/:id`
- **Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "stokvel": {
    "id": "stokvel_id",
    "name": "Weekly Savers",
    "type": "traditional",
    "targetAmount": 5000,
    "maxMembers": 20,
    "currentMembers": 15,
    "members": [
      {
        "user": {
          "id": "user_id",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "savedAmount": 2500,
        "progress": 50
      }
    ],
    "loans": [],
    "status": "active"
  }
}
```

### Create Stokvel (Admin Only)

**POST** `/stokvels`
- **Auth Required**: Yes (Admin)

**Request Body**:
```json
{
  "name": "Monthly Investors",
  "type": "flexible",
  "description": "Monthly investment group",
  "targetAmount": 10000,
  "maxMembers": 10,
  "nextPayout": "2024-03-01T00:00:00.000Z"
}
```

### Update Stokvel (Admin Only)

**PUT** `/stokvels/:id`
- **Auth Required**: Yes (Admin)

### Delete Stokvel (Admin Only)

**DELETE** `/stokvels/:id`
- **Auth Required**: Yes (Admin)

---

## Contribution Routes

### Add Contribution

**POST** `/contributions`
- **Auth Required**: Yes

**Request Body**:
```json
{
  "membershipId": "membership_id",
  "amount": 500,
  "paymentMethod": "card"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contribution added successfully",
  "contribution": {
    "id": "contribution_id",
    "amount": 500,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Contributions

**GET** `/contributions?membershipId=xxx&status=all&memberId=all`
- **Auth Required**: Yes

**Query Parameters**:
- `membershipId`: Filter by membership
- `status`: Filter by status (confirmed, pending)
- `memberId`: Filter by member

### Confirm Contribution (Admin Only)

**PUT** `/contributions/:id/confirm`
- **Auth Required**: Yes (Admin)

---

## Loan Routes

### Request Loan

**POST** `/loans`
- **Auth Required**: Yes

**Request Body**:
```json
{
  "membershipId": "membership_id",
  "amount": 1000,
  "purpose": "Emergency expenses"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Loan request submitted successfully",
  "loan": {
    "id": "loan_id",
    "amount": 1000,
    "interest": 300,
    "totalRepayable": 1300,
    "status": "active",
    "dueDate": "2024-01-31T00:00:00.000Z"
  }
}
```

### Get Loans

**GET** `/loans?membershipId=xxx&status=all`
- **Auth Required**: Yes

### Get Loan Summary

**GET** `/loans/summary?membershipId=xxx`
- **Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "summary": {
    "totalBorrowed": 5000,
    "totalRepaid": 2000,
    "outstanding": 3000,
    "activeLoans": 2
  }
}
```

### Repay Loan

**PUT** `/loans/:id/repay`
- **Auth Required**: Yes

---

## Notification Routes

### Get Notifications

**GET** `/notifications`
- **Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "message": "Your contribution has been confirmed",
      "type": "contribution",
      "read": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Mark All as Read

**PUT** `/notifications/read-all`
- **Auth Required**: Yes

### Mark as Read

**PUT** `/notifications/:id/read`
- **Auth Required**: Yes

---

## Profile Routes

### Get Profile

**GET** `/profile`
- **Auth Required**: Yes

### Update Profile

**PUT** `/profile`
- **Auth Required**: Yes

**Request Body**:
```json
{
  "fullName": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+1234567890"
}
```

### Change Password

**PUT** `/profile/password`
- **Auth Required**: Yes

**Request Body**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## Admin Routes

### Get Overview

**GET** `/admin/overview`
- **Auth Required**: Yes (Admin)

**Response**:
```json
{
  "success": true,
  "overview": {
    "totalUsers": 150,
    "activeUsers": 120,
    "totalStokvels": 10,
    "totalContributions": 50000,
    "pendingContributions": 25,
    "activeLoans": 15
  }
}
```

### Get All Users

**GET** `/admin/users`
- **Auth Required**: Yes (Admin)

### Approve User

**PUT** `/admin/users/:id/approve`
- **Auth Required**: Yes (Admin)

### Update User Status

**PUT** `/admin/users/:id/status`
- **Auth Required**: Yes (Admin)

**Request Body**:
```json
{
  "status": "active"
}
```

### Delete User

**DELETE** `/admin/users/:id`
- **Auth Required**: Yes (Admin)

### Add User to Stokvel

**POST** `/admin/users/:id/membership`
- **Auth Required**: Yes (Admin)

**Request Body**:
```json
{
  "stokvelId": "stokvel_id",
  "targetAmount": 5000
}
```

### Get All Contributions

**GET** `/admin/contributions`
- **Auth Required**: Yes (Admin)

---

## Data Models

### User Model

```javascript
{
  fullName: String (required),
  email: String (required, unique),
  phone: String (required),
  password: String (required, min 6 chars),
  role: String (enum: ['member', 'admin'], default: 'member'),
  status: String (enum: ['active', 'inactive', 'pending'], default: 'pending'),
  message: String,
  preferredGroups: [ObjectId],
  lastActive: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Stokvel Model

```javascript
{
  name: String (required),
  type: String (enum: ['traditional', 'flexible'], default: 'traditional'),
  description: String,
  icon: String (default: '🌱'),
  color: String (default: 'primary'),
  targetAmount: Number (required, min 0),
  maxMembers: Number (required, min 1),
  interestRate: Number (default: 30),
  overdueInterestRate: Number (default: 60),
  loanPercentageLimit: Number (default: 50),
  loanRepaymentDays: Number (default: 30),
  cycle: String (enum: ['weekly', 'monthly', 'quarterly'], default: 'weekly'),
  meetingDay: String,
  nextPayout: Date (required),
  status: String (enum: ['active', 'inactive', 'upcoming'], default: 'active'),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Membership Model

```javascript
{
  user: ObjectId (ref: 'User', required),
  stokvel: ObjectId (ref: 'Stokvel', required),
  role: String (enum: ['member', 'admin'], default: 'member'),
  targetAmount: Number (required),
  savedAmount: Number (default: 0),
  status: String (enum: ['active', 'inactive', 'pending'], default: 'active'),
  createdAt: Date,
  updatedAt: Date
}
```

### Contribution Model

```javascript
{
  user: ObjectId (ref: 'User', required),
  stokvel: ObjectId (ref: 'Stokvel', required),
  membership: ObjectId (ref: 'Membership', required),
  amount: Number (required, min 100),
  paymentMethod: String (enum: ['card', 'bank', 'cash'], default: 'card'),
  reference: String,
  status: String (enum: ['confirmed', 'pending'], default: 'pending'),
  confirmedBy: ObjectId (ref: 'User'),
  confirmedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Loan Model

```javascript
{
  user: ObjectId (ref: 'User', required),
  stokvel: ObjectId (ref: 'Stokvel', required),
  membership: ObjectId (ref: 'Membership', required),
  amount: Number (required, min 100),
  interestRate: Number (default: 30),
  interest: Number (required),
  totalRepayable: Number (required),
  status: String (enum: ['active', 'repaid', 'overdue'], default: 'active'),
  purpose: String,
  dueDate: Date (required),
  repaidDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model

```javascript
{
  user: ObjectId (ref: 'User', required),
  message: String (required),
  type: String (enum: ['contribution', 'loan', 'approval', 'system', 'reminder'], default: 'system'),
  read: Boolean (default: false),
  relatedId: ObjectId,
  relatedModel: String (enum: ['Contribution', 'Loan', 'Stokvel', 'User']),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

---

## Validation Rules

### User Registration
- Full name: Required, non-empty
- Email: Valid email format, unique
- Phone: Required, non-empty
- Password: Minimum 6 characters

### Stokvel Creation
- Name: Required, non-empty
- Target amount: Numeric, positive
- Max members: Integer, minimum 1
- Next payout: Valid ISO date

### Contributions
- Membership ID: Required
- Amount: Minimum R100
- Payment method: Optional (card, bank, cash)

### Loans
- Membership ID: Required
- Amount: Minimum R100
- Purpose: Optional string

---

## Security Features

- **JWT Authentication**: Bearer token required for protected routes
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express Validator for all inputs
- **CORS**: Configured for frontend origin
- **Rate Limiting**: Not implemented (consider adding)
- **HTTPS**: Recommended for production

---

## Development Notes

### Database Seeding

Run `npm run seed` to populate the database with sample data.

### Environment Variables

- `NODE_ENV`: Set to 'production' for production deployment
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Strong secret key for JWT signing
- `JWT_EXPIRE`: Token expiration time (default: 30 days)
- `FRONTEND_URL`: Frontend application URL for CORS

### Logging

- Development: Morgan middleware logs all requests
- Production: Consider implementing structured logging

---

## Test Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@socialclub.co.za | Admin@2026 |
| Member | nkulumo.nkuna@email.com | Password123 |

All seeded members use password: `Password123`

## Business Rules

- **Loans:** Members can borrow up to 50% of their confirmed savings
- **Interest:** 30% on loans, repayable within 30 days
- **Overdue penalty:** Additional 30% (total 60%) if not repaid on time
- **Contributions:** Start as pending, admin confirms to credit the member's account
- **Registration:** Users register with stokvel preferences; admin approves and assigns groups

---

## Deployment

1. Set environment variables
2. Install dependencies: `npm install`
3. Build for production (if needed)
4. Start server: `npm start`
5. Set up reverse proxy (nginx recommended)
6. Configure SSL certificate
7. Set up process manager (PM2 recommended)

---

## Contributing

1. Follow the existing code structure
2. Add proper validation for new endpoints
3. Include error handling
4. Update this documentation for API changes
5. Test thoroughly before committing

---

## License

This project is licensed under the MIT License.
