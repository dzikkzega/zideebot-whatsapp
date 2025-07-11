// test-keyword-change.js - Test untuk memverifikasi perubahan keyword
const fs = require('fs');

console.log('🔍 Testing keyword changes...');
console.log('=====================================');

// Test main index.js file
const indexContent = fs.readFileSync('./index.js', 'utf8');
if (indexContent.includes("messageBody.includes('bot')") && 
    indexContent.includes("Haii, aku adalah Zideebot. Ada yang bisa aku bantu?")) {
    console.log('✅ index.js - Keyword changed successfully');
} else {
    console.log('❌ index.js - Keyword change failed');
}

// Test gemini-ai.js file
const geminiContent = fs.readFileSync('./gemini-ai.js', 'utf8');
if (geminiContent.includes("'bot': 'Haii, aku adalah Zideebot. Ada yang bisa aku bantu?'")) {
    console.log('✅ gemini-ai.js - Keyword changed successfully');
} else {
    console.log('❌ gemini-ai.js - Keyword change failed');
}

// Test bot-with-offline-support.js file
const botOfflineContent = fs.readFileSync('./bot-with-offline-support.js', 'utf8');
if (botOfflineContent.includes("messageBody.includes('bot')") && 
    botOfflineContent.includes("Haii, aku adalah Zideebot")) {
    console.log('✅ bot-with-offline-support.js - Keyword changed successfully');
} else {
    console.log('❌ bot-with-offline-support.js - Keyword change failed');
}

console.log('');
console.log('📝 Summary of changes:');
console.log('- Keyword changed from "halo" to "bot"');
console.log('- Response message: "Haii, aku adalah Zideebot. Ada yang bisa aku bantu?"');
console.log('- Files updated: index.js, gemini-ai.js, bot-with-offline-support.js');
console.log('');
console.log('💡 To test the bot:');
console.log('1. Send message containing "bot" to trigger the new response');
console.log('2. Keywords "hai" and "hello" still work as before');
console.log('3. Bot will respond with the new Zideebot message');
