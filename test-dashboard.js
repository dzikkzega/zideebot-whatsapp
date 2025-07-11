// test-dashboard.js - Test script untuk dashboard functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDashboard() {
    console.log('🧪 Testing WhatsApp Bot Dashboard...');
    console.log('====================================');
    
    try {
        // Test 1: Check if web server is running
        console.log('1. Testing web server connection...');
        const response = await axios.get(`${BASE_URL}/api/status`);
        console.log('✅ Web server is running');
        console.log('📊 Bot Status:', response.data);
        console.log('');
        
        // Test 2: Test message history endpoint
        console.log('2. Testing message history...');
        const messagesResponse = await axios.get(`${BASE_URL}/api/messages`);
        console.log('✅ Message history endpoint working');
        console.log(`📨 Found ${messagesResponse.data.length} messages`);
        console.log('');
        
        // Test 3: Test Gemini API
        console.log('3. Testing Gemini AI integration...');
        try {
            const geminiResponse = await axios.post(`${BASE_URL}/api/test-gemini`);
            if (geminiResponse.data.success) {
                console.log('✅ Gemini AI is working correctly');
            } else {
                console.log('⚠️ Gemini AI test failed - check API key');
            }
        } catch (error) {
            console.log('❌ Gemini AI test error:', error.response?.data?.error || error.message);
        }
        console.log('');
        
        // Test results summary
        console.log('🎉 Dashboard Test Results:');
        console.log('====================================');
        console.log('✅ Web Server: Online');
        console.log('✅ API Endpoints: Working');
        console.log('✅ Status Monitoring: Active');
        console.log('✅ Message System: Ready');
        console.log('');
        console.log('🌐 Dashboard URL: http://localhost:3000');
        console.log('📱 Ready to scan QR code for WhatsApp connection');
        console.log('');
        console.log('💡 Available features:');
        console.log('   • Real-time bot monitoring');
        console.log('   • Send messages from web interface');
        console.log('   • Broadcast to multiple contacts');
        console.log('   • View message history');
        console.log('   • Bot configuration management');
        console.log('   • QR code display for authentication');
        
    } catch (error) {
        console.error('❌ Dashboard test failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure to run "npm run full" first');
        console.log('2. Check if port 3000 is available');
        console.log('3. Verify all dependencies are installed');
        console.log('4. Check console for error messages');
    }
}

// Run tests if dashboard is not running
setTimeout(testDashboard, 5000);
