// Test Gemini API Direct - tanpa WhatsApp Web
require('dotenv').config();
const axios = require('axios');

const GEMINI_CONFIG = {
    API_KEY: process.env.GEMINI_API_KEY,
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
};

async function testGeminiDirect() {
    console.log('🧪 Testing Gemini API Direct...');
    console.log('API Key:', GEMINI_CONFIG.API_KEY ? GEMINI_CONFIG.API_KEY.substring(0, 10) + '...' : 'NOT_FOUND');
    
    if (!GEMINI_CONFIG.API_KEY) {
        console.log('❌ API Key tidak ditemukan di .env file');
        return false;
    }
    
    try {
        const response = await axios.post(
            `${GEMINI_CONFIG.BASE_URL}?key=${GEMINI_CONFIG.API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: 'Jawab dengan "API key working!" dalam bahasa Indonesia'
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 100
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Success! Response:');
        console.log(response.data.candidates[0].content.parts[0].text);
        return true;
        
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.statusText);
        console.log('Error Details:', error.response?.data?.error?.message || error.message);
        return false;
    }
}

async function testChatFunction() {
    console.log('\n🧪 Testing Chat Function...');
    
    const { chatWithGemini } = require('./gemini-ai');
    
    try {
        const response = await chatWithGemini('Halo, apa kabar?');
        console.log('✅ Chat Response:');
        console.log(response);
        return true;
    } catch (error) {
        console.log('❌ Chat Error:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Gemini API Tests...\n');
    
    // Test 1: Direct API call
    const directTest = await testGeminiDirect();
    
    if (directTest) {
        // Test 2: Chat function
        await testChatFunction();
    }
    
    console.log('\n✅ All tests completed!');
}

runAllTests();
