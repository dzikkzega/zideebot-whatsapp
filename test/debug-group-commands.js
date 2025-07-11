// debug-group-commands.js - Debug script untuk grup commands
const fs = require('fs');

console.log('🔍 Debugging Group Management Commands...');
console.log('==========================================');

// Read the index.js file
const indexContent = fs.readFileSync('./index.js', 'utf8');

// Check for group management code
console.log('1. Checking for group management section...');
if (indexContent.includes('GROUP MANAGEMENT')) {
    console.log('✅ Group management section found');
} else {
    console.log('❌ Group management section not found');
}

console.log('\n2. Checking command conditions...');
if (indexContent.includes("messageBody === 'open' || messageBody === 'op'")) {
    console.log('✅ Open command condition found');
} else {
    console.log('❌ Open command condition not found');
}

if (indexContent.includes("messageBody === 'close' || messageBody === 'cl'")) {
    console.log('✅ Close command condition found');
} else {
    console.log('❌ Close command condition not found');
}

console.log('\n3. Checking group validation...');
if (indexContent.includes("message.from.includes('@g.us')")) {
    console.log('✅ Group validation found');
} else {
    console.log('❌ Group validation not found');
}

console.log('\n4. Checking mention implementation...');
if (indexContent.includes('mentions') && indexContent.includes('chat.sendMessage')) {
    console.log('✅ Mention implementation found');
} else {
    console.log('❌ Mention implementation not found');
}

console.log('\n📝 Possible Issues:');
console.log('1. Bot might not be admin in the group');
console.log('2. Group permissions might be restricted');
console.log('3. WhatsApp Web.js version compatibility');
console.log('4. Network or connection issues');

console.log('\n🔧 Debugging Steps:');
console.log('1. Check bot logs when sending commands');
console.log('2. Verify bot has admin rights in group');
console.log('3. Test with simple reply first');
console.log('4. Check if messages are reaching handleMessage function');

console.log('\n💡 Quick Test Commands:');
console.log('- Send "ping" to test basic bot response');
console.log('- Send "tolong" to test menu system');
console.log('- Send "open" in group to test group command');

console.log('\n🚀 If still not working, try this simplified version:');
console.log('Replace group commands with basic reply for testing');
console.log('Then gradually add back features one by one');
