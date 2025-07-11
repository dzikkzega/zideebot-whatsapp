// Test script untuk Gemini API
const { testGeminiAPI, chatWithGemini, generateCreative, translateText } = require('./gemini-ai');

async function runTests() {
    console.log('🚀 Starting Gemini API Tests...\n');
    
    // Test 1: Basic API connection
    console.log('1️⃣ Testing API Key Connection...');
    const apiTest = await testGeminiAPI();
    console.log('---\n');
    
    if (!apiTest) {
        console.log('❌ API key test failed. Please check your .env file.');
        return;
    }
    
    // Test 2: Chat function
    console.log('2️⃣ Testing Chat Function...');
    try {
        const chatResponse = await chatWithGemini('Apa kabar?');
        console.log('Response:', chatResponse);
    } catch (error) {
        console.log('Error:', error.message);
    }
    console.log('---\n');
    
    // Test 3: Creative function
    console.log('3️⃣ Testing Creative Function...');
    try {
        const creativeResponse = await generateCreative('coding', 'motivasi');
        console.log('Response:', creativeResponse);
    } catch (error) {
        console.log('Error:', error.message);
    }
    console.log('---\n');
    
    // Test 4: Translation function
    console.log('4️⃣ Testing Translation Function...');
    try {
        const translationResponse = await translateText('Halo dunia', 'english');
        console.log('Response:', translationResponse);
    } catch (error) {
        console.log('Error:', error.message);
    }
    console.log('---\n');
    
    console.log('✅ All tests completed!');
}

runTests();