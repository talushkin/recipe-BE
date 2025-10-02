/**
 * Google Authentication Test Suite
 * Run with: node test-google-auth-real.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Configuration - Replace these with real values for testing
const config = {
  // Get a real Google ID token from:
  // 1. Google OAuth Playground: https://developers.google.com/oauthplayground/
  // 2. Your frontend Google Sign-In implementation
  REAL_GOOGLE_ID_TOKEN: 'REPLACE_WITH_REAL_TOKEN',
  
  // This will be filled automatically after successful sign-in
  USER_GOOGLE_SUB: null
};

async function testGoogleAuth() {
  console.log('🚀 Google Authentication Real Token Test\n');

  try {
    // Test 1: Real Google Sign-In
    console.log('1. Testing Real Google Sign-In...');
    if (config.REAL_GOOGLE_ID_TOKEN === 'REPLACE_WITH_REAL_TOKEN') {
      console.log('⚠️  Please replace REAL_GOOGLE_ID_TOKEN with a real Google ID token');
      console.log('   You can get one from: https://developers.google.com/oauthplayground/');
      console.log('   Select "Google+ API v1" and authorize to get an ID token\n');
      return;
    }

    const authResponse = await axios.post(`${BASE_URL}/api/google/auth`, {
      idToken: config.REAL_GOOGLE_ID_TOKEN
    });

    console.log('✅ Google Sign-In successful!');
    console.log(`Status: ${authResponse.data.status}`);
    console.log(`User: ${authResponse.data.user.name} (${authResponse.data.user.email})`);
    console.log(`Google Sub: ${authResponse.data.user.googleSub}`);
    
    // Store the googleSub for next tests
    config.USER_GOOGLE_SUB = authResponse.data.user.googleSub;
    console.log('');

    // Test 2: Update Business Information
    console.log('2. Testing Business Information Update...');
    const businessResponse = await axios.post(`${BASE_URL}/api/google/user/business`, {
      googleSub: config.USER_GOOGLE_SUB,
      businessName: 'My Test Restaurant',
      ownerName: 'Test Chef Owner',
      businessNumber: '987654321',
      address: '123 Test Street',
      city: 'Tel Aviv',
      zip: '12345',
      phone: '03-1234567'
    });

    console.log('✅ Business information updated successfully!');
    console.log(`Business: ${businessResponse.data.user.business.businessName}`);
    console.log(`Owner: ${businessResponse.data.user.business.ownerName}`);
    console.log(`Business Completed: ${businessResponse.data.user.businessCompleted}`);
    console.log('');

    // Test 3: Get User Information
    console.log('3. Testing Get User Information...');
    const userResponse = await axios.get(`${BASE_URL}/api/google/user/${config.USER_GOOGLE_SUB}`);

    console.log('✅ User information retrieved successfully!');
    console.log('User Details:');
    console.log(`  Name: ${userResponse.data.user.name}`);
    console.log(`  Email: ${userResponse.data.user.email}`);
    console.log(`  Business Completed: ${userResponse.data.user.businessCompleted}`);
    console.log(`  Created: ${new Date(userResponse.data.user.createdAt).toLocaleString()}`);
    console.log(`  Last Login: ${new Date(userResponse.data.user.lastLogin).toLocaleString()}`);
    
    if (userResponse.data.user.business.businessName) {
      console.log('  Business Info:');
      console.log(`    Name: ${userResponse.data.user.business.businessName}`);
      console.log(`    Owner: ${userResponse.data.user.business.ownerName}`);
      console.log(`    Phone: ${userResponse.data.user.business.phone}`);
      console.log(`    Address: ${userResponse.data.user.business.address}, ${userResponse.data.user.business.city}`);
    }
    console.log('');

    // Test 4: Sign in again (should return existing user)
    console.log('4. Testing Sign-In Again (should return existing user)...');
    const authResponse2 = await axios.post(`${BASE_URL}/api/google/auth`, {
      idToken: config.REAL_GOOGLE_ID_TOKEN
    });

    console.log('✅ Second sign-in successful!');
    console.log(`Status: ${authResponse2.data.status} (should be 'existing')`);
    console.log(`Last Login Updated: ${new Date(authResponse2.data.user.lastLogin).toLocaleString()}`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ Google Authentication system is working correctly with real tokens!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tips for getting a valid Google ID token:');
      console.log('1. Go to https://developers.google.com/oauthplayground/');
      console.log('2. Select "Google+ API v1" from the list');
      console.log('3. Click "Authorize APIs"');
      console.log('4. Complete the OAuth flow');
      console.log('5. Click "Exchange authorization code for tokens"');
      console.log('6. Copy the "id_token" value');
      console.log('7. Replace REAL_GOOGLE_ID_TOKEN in this file');
    }
  }
}

// Instructions
console.log('📋 How to use this test:');
console.log('1. Start your server: npm start');
console.log('2. Get a real Google ID token from https://developers.google.com/oauthplayground/');
console.log('3. Replace REAL_GOOGLE_ID_TOKEN in this file');
console.log('4. Run: node test-google-auth-real.js');
console.log('');

// Only run tests if token is provided
if (process.argv.includes('--run') || config.REAL_GOOGLE_ID_TOKEN !== 'REPLACE_WITH_REAL_TOKEN') {
  testGoogleAuth();
} else {
  console.log('⚠️  Add --run flag or update REAL_GOOGLE_ID_TOKEN to run tests');
}
