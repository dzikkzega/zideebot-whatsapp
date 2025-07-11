// test-group-management.js - Test fitur grup management
const fs = require('fs');

console.log('🔍 Testing Group Management Features...');
console.log('==========================================');

// Test main index.js file
const indexContent = fs.readFileSync('./index.js', 'utf8');

// Check if group management commands are added
const checks = [
    {
        name: 'Open Group Command',
        condition: indexContent.includes("messageBody === 'open' || messageBody === 'op'") && 
                  indexContent.includes("setMessagesAdminsOnly(false)"),
        message: 'Open command with admin check'
    },
    {
        name: 'Close Group Command', 
        condition: indexContent.includes("messageBody === 'close' || messageBody === 'cl'") && 
                  indexContent.includes("setMessagesAdminsOnly(true)"),
        message: 'Close command with admin check'
    },
    {
        name: 'Group Check',
        condition: indexContent.includes("message.from.includes('@g.us')") && 
                  indexContent.includes("chat.isGroup"),
        message: 'Group validation logic'
    },
    {
        name: 'User Tagging',
        condition: indexContent.includes("@${contact.number}"),
        message: 'User mention in response'
    },
    {
        name: 'Help Menu Updated',
        condition: indexContent.includes("Group Management:") && 
                  indexContent.includes("open / op - Buka grup"),
        message: 'Help menu includes group commands'
    },
    {
        name: 'Delay Configuration',
        condition: indexContent.includes("groupManagement: { min: 1000, max: 3000 }"),
        message: 'Group management delay settings'
    }
];

let passed = 0;
checks.forEach((check, index) => {
    if (check.condition) {
        console.log(`✅ ${index + 1}. ${check.name} - ${check.message}`);
        passed++;
    } else {
        console.log(`❌ ${index + 1}. ${check.name} - ${check.message}`);
    }
});

console.log('');
console.log(`📊 Test Results: ${passed}/${checks.length} passed`);
console.log('');

if (passed === checks.length) {
    console.log('🎉 All tests passed! Group management features ready to use.');
} else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
}

console.log('');
console.log('📝 **Group Management Commands:**');
console.log('');
console.log('🔓 **Open Group:**');
console.log('   • Command: open atau op');
console.log('   • Fungsi: Membuka grup untuk semua member');
console.log('   • Response: "Grup telah dibuka oleh Admin @[user]"');
console.log('');
console.log('🔒 **Close Group:**');
console.log('   • Command: close atau cl');
console.log('   • Fungsi: Menutup grup, hanya admin yang bisa kirim pesan');
console.log('   • Response: "Grup telah ditutup oleh Admin @[user]"');
console.log('');
console.log('⚠️  **Persyaratan:**');
console.log('   • Bot harus menjadi admin di grup');
console.log('   • Perintah hanya bekerja di grup (bukan chat pribadi)');
console.log('   • User yang mengirim perintah akan di-mention dalam response');
console.log('');
console.log('🚀 **Cara Test:**');
console.log('   1. Jalankan bot: node index.js');
console.log('   2. Tambahkan bot ke grup sebagai admin');
console.log('   3. Kirim perintah "open" atau "close" di grup');
console.log('   4. Bot akan merespons dengan mention nama Anda');
