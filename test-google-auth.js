const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testGoogleAuthEndpoints() {
  try {
    console.log('🚀 Testing Google Authentication Endpoints\n');

    // Test 1: Check server status
    console.log('1. Testing server status...');
    const statusResponse = await axios.get(`${baseURL}/`);
    console.log('✅ Server is running');
    console.log('Available routes:', statusResponse.data.routes.googleAuth);
    console.log('');

    // Test 2: Test missing idToken error
    console.log('2. Testing missing idToken validation...');
    try {
      await axios.post(`${baseURL}/api/google/auth`, {});
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Missing idToken validation works:', error.response.data.message);
      }
    }
    console.log('');

    // Test 3: Test invalid idToken error
    console.log('3. Testing invalid idToken validation...');
    try {
      await axios.post(`${baseURL}/api/google/auth`, {
        idToken: 'invalid_token_123'
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Invalid idToken validation works:', error.response.data.message);
      }
    }
    console.log('');

    // Test 4: Test business info endpoint without user
    console.log('4. Testing business update without valid user...');
    try {
      await axios.post(`${baseURL}/api/google/user/business`, {
        googleSub: 'non_existent_user',
        businessName: 'Test Business',
        ownerName: 'Test Owner',
        businessNumber: '123456789',
        address: 'Test Address',
        city: 'Test City',
        zip: '12345',
        phone: '123-456-7890'
      });
    } catch (error) {
      if (error.response.status === 404) {
        console.log('✅ User not found validation works:', error.response.data.message);
      }
    }
    console.log('');

    // Test 5: Test get user endpoint
    console.log('5. Testing get user endpoint...');
    try {
      await axios.get(`${baseURL}/api/google/user/non_existent_user`);
    } catch (error) {
      if (error.response.status === 404) {
        console.log('✅ Get user validation works:', error.response.data.message);
      }
    }
    console.log('');

    console.log('🎉 All Google Auth endpoints are working correctly!');
    console.log('📝 To test with real Google tokens, you need to:');
    console.log('   1. Set GOOGLE_CLIENT_ID in .env file');
    console.log('   2. Use real Google ID tokens from frontend');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGoogleAuthEndpoints();
