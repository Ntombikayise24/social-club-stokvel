# SOCIAL CLUB Backend API Usage Guide

This guide shows you how to interact with the SOCIAL CLUB Backend API for testing, development, and integration purposes.

## Prerequisites

1. **Backend Server Running**: Make sure the backend is running on `http://localhost:5000`
2. **Database Seeded**: Run `npm run seed` to populate with test data
3. **API Testing Tool**: Use one of:
   - Postman
   - Insomnia
   - curl commands
   - Thunder Client (VS Code extension)

## Base URL

```
http://localhost:5000/api
```

## Authentication Flow

Most API endpoints require authentication. Here's how to get started:

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "password123"
  }'
```

**Response:**
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

### 2. Login (Using Test Credentials)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@socialclub.co.za",
    "password": "Admin@2026"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "fullName": "Admin User",
    "email": "admin@socialclub.co.za",
    "role": "admin",
    "status": "active"
  }
}
```

**Save the token** from the response - you'll need it for authenticated requests.

### 3. Use Token in Requests

For all authenticated endpoints, include the Authorization header:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Test Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@socialclub.co.za | Admin@2026 |
| Member | nkulumo.nkuna@email.com | Password123 |

## Common API Workflows

### Workflow 1: Admin Managing Users

#### 1. Get Admin Overview
```bash
curl -X GET http://localhost:5000/api/admin/overview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 2. View All Users
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 3. Approve a Pending User
```bash
curl -X PUT http://localhost:5000/api/admin/users/USER_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 4. Add User to Stokvel
```bash
curl -X POST http://localhost:5000/api/admin/users/USER_ID/membership \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stokvelId": "STOKVEL_ID",
    "targetAmount": 5000
  }'
```

### Workflow 2: Member Using the System

#### 1. Get User Profile
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN"
```

#### 2. View Available Stokvels
```bash
curl -X GET http://localhost:5000/api/stokvels \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN"
```

#### 3. Make a Contribution
```bash
curl -X POST http://localhost:5000/api/contributions \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membershipId": "MEMBERSHIP_ID",
    "amount": 500,
    "paymentMethod": "card"
  }'
```

#### 4. Request a Loan
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membershipId": "MEMBERSHIP_ID",
    "amount": 1000,
    "purpose": "Emergency expenses"
  }'
```

#### 5. View Notifications
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN"
```

## Postman Collection

### Import the Collection

You can import this Postman collection to test all endpoints:

```json
{
  "info": {
    "name": "SOCIAL CLUB API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fullName\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"phone\": \"+1234567890\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@socialclub.co.za\",\n  \"password\": \"Admin@2026\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### Postman Environment Variables

Set up these environment variables in Postman:

- `base_url`: `http://localhost:5000/api`
- `token`: (will be set after login)

### Setting Token Automatically

In the Login request, add this test script to automatically set the token:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

## Frontend Integration Examples

### JavaScript (Fetch API)

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    return data.user;
  }
  throw new Error(data.message);
};

// Authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data;
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  };

  return { user, token, login, logout, apiCall };
};
```

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common Error Codes

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Testing the API

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Quick Test Script

Create a `test-api.js` file:

```javascript
const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Health check
    const health = await fetch(`${API_BASE}/health`);
    console.log('Health:', await health.json());

    // Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@socialclub.co.za',
        password: 'Admin@2026'
      })
    });

    const loginData = await loginRes.json();
    console.log('Login:', loginData);

    if (loginData.success) {
      const token = loginData.token;

      // Get profile
      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const profileData = await profileRes.json();
      console.log('Profile:', profileData);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
```

Run with: `node test-api.js`

## Troubleshooting

### Common Issues

1. **"Not authorized - no token provided"**
   - Make sure you're including the Authorization header
   - Format: `Bearer YOUR_JWT_TOKEN`

2. **"Account is not active"**
   - User status must be 'active' (admin approval required)

3. **"Access denied - admin only"**
   - Only users with role 'admin' can access admin endpoints

4. **Validation Errors**
   - Check the request body format and required fields
   - Refer to the API documentation for field requirements

### Debug Mode

Set `NODE_ENV=development` in your `.env` file to see detailed error messages.

### Database Issues

- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- Run `npm run seed` to populate test data

## Development Tips

1. **Use environment variables** for configuration
2. **Test all endpoints** after making changes
3. **Check logs** in the console for debugging
4. **Use the seeded data** for consistent testing
5. **Validate requests** before sending to API

## Next Steps

- Integrate with your frontend application
- Set up automated testing
- Configure production deployment
- Add rate limiting and security measures
- Implement real-time notifications (WebSocket)

For more detailed API specifications, refer to the main `README.md` file.</content>
<parameter name="filePath">c:\Users\219569009\Desktop\STOCKVEL REPO\MAIN\my-folder-name\backend\API_USAGE_GUIDE.md