#!/usr/bin/env node

/**
 * SOCIAL CLUB Backend API Test Script
 * Run this to verify your backend is working correctly
 */

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🚀 Testing SOCIAL CLUB Backend API...\n');

  try {
    // 1. Health Check
    console.log('1. Testing Health Check...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();

    if (health.success) {
      console.log('✅ Health check passed');
      console.log(`   Environment: ${health.env}`);
      console.log(`   Timestamp: ${health.timestamp}\n`);
    } else {
      throw new Error('Health check failed');
    }

    // 2. Login Test
    console.log('2. Testing Admin Login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@socialclub.co.za',
        password: 'Admin@2026'
      })
    });

    const loginData = await loginRes.json();

    if (loginData.success) {
      console.log('✅ Admin login successful');
      const token = loginData.token;
      console.log(`   Token received: ${token.substring(0, 20)}...`);

      // 3. Get Profile
      console.log('\n3. Testing Profile Endpoint...');
      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const profileData = await profileRes.json();

      if (profileData.success) {
        console.log('✅ Profile retrieved successfully');
        console.log(`   User: ${profileData.data.user.fullName}`);
        console.log(`   Role: ${profileData.data.user.role}`);
        console.log(`   Active Groups: ${profileData.data.stats.activeGroups}`);
      } else {
        console.log('❌ Profile retrieval failed');
      }

      // 4. Get Admin Overview
      console.log('\n4. Testing Admin Overview...');
      const overviewRes = await fetch(`${API_BASE}/admin/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const overviewData = await overviewRes.json();

      if (overviewData.success) {
        console.log('✅ Admin overview retrieved');
        console.log(`   Total Users: ${overviewData.overview.totalUsers}`);
        console.log(`   Total Stokvels: ${overviewData.overview.totalStokvels}`);
        console.log(`   Active Loans: ${overviewData.overview.activeLoans}`);
      } else {
        console.log('❌ Admin overview failed');
      }

      // 5. Get Stokvels
      console.log('\n5. Testing Stokvels Endpoint...');
      const stokvelsRes = await fetch(`${API_BASE}/stokvels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const stokvelsData = await stokvelsRes.json();

      if (stokvelsData.success) {
        console.log('✅ Stokvels retrieved successfully');
        console.log(`   Found ${stokvelsData.stokvels.length} stokvel(s)`);
        if (stokvelsData.stokvels.length > 0) {
          console.log(`   First stokvel: ${stokvelsData.stokvels[0].name}`);
        }
      } else {
        console.log('❌ Stokvels retrieval failed');
      }

    } else {
      console.log('❌ Admin login failed');
      console.log(`   Message: ${loginData.message}`);
    }

    console.log('\n🎉 API Testing Complete!');
    console.log('\n📚 Next steps:');
    console.log('   - Check API_USAGE_GUIDE.md for detailed usage examples');
    console.log('   - Use Postman or curl to test other endpoints');
    console.log('   - Integrate with your frontend application');

  } catch (error) {
    console.error('\n❌ API Test Failed!');
    console.error('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure the backend server is running (npm run dev)');
    console.log('   - Check that MongoDB is running');
    console.log('   - Verify your .env file has correct settings');
    console.log('   - Run "npm run seed" to populate test data');
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or use --experimental-fetch flag');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

testAPI();