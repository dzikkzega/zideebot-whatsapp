// test-group-detection.js - Test untuk mendeteksi grup vs chat pribadi
console.log('🔍 Testing Group Detection Logic...');
console.log('====================================');

// Simulate different message scenarios
const testScenarios = [
    {
        name: 'Private Chat',
        messageFrom: '628123456789@c.us',
        expectedGroup: false,
        description: 'Normal private chat message'
    },
    {
        name: 'Group Chat',
        messageFrom: '628123456789-1234567890@g.us',
        expectedGroup: true,
        description: 'Message from WhatsApp group'
    },
    {
        name: 'Group Chat (variant)',
        messageFrom: '120363028123456789@g.us',
        expectedGroup: true,
        description: 'Another group format'
    },
    {
        name: 'Business Chat',
        messageFrom: '628123456789@s.whatsapp.net',
        expectedGroup: false,
        description: 'Business account chat'
    }
];

console.log('📋 Testing group detection logic:\n');

testScenarios.forEach((scenario, index) => {
    const isGroup = scenario.messageFrom.includes('@g.us');
    const result = isGroup === scenario.expectedGroup ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   From: ${scenario.messageFrom}`);
    console.log(`   Expected: ${scenario.expectedGroup ? 'Group' : 'Private'}`);
    console.log(`   Detected: ${isGroup ? 'Group' : 'Private'}`);
    console.log(`   Result: ${result}`);
    console.log(`   Description: ${scenario.description}\n`);
});

console.log('📝 Key Points for Group Commands:');
console.log('1. Group IDs always end with @g.us');
console.log('2. Private chats end with @c.us');
console.log('3. Business accounts end with @s.whatsapp.net');
console.log('4. Commands "open" and "close" ONLY work in groups');
console.log('');
console.log('🚨 Common Issues:');
console.log('❌ Sending "open" in private chat → Will be rejected');
console.log('❌ Bot not admin in group → Permission error');
console.log('✅ Send "open" in group + bot is admin → Should work');
console.log('');
console.log('🔧 Debugging Steps:');
console.log('1. Send "debug" command to check chat type');
console.log('2. Verify message.from contains @g.us');
console.log('3. Ensure bot has admin rights in group');
console.log('4. Check console logs for detailed error info');
console.log('');
console.log('💡 To test:');
console.log('1. Add bot to a WhatsApp group');
console.log('2. Make bot admin');
console.log('3. Send "debug" command in group');
console.log('4. Send "open" command in group (not private chat)');
console.log('5. Check console for detailed logs');
