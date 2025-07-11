// debug-bot.js - Bot dengan debugging mode
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🚀 Starting WhatsApp Bot in DEBUG mode...');

// Inisialisasi client WhatsApp dengan debugging
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session-debug'
    }),
    puppeteer: {
        headless: false, // Browser window akan muncul
        devtools: true,  // Developer tools terbuka
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        timeout: 120000 // 2 menit timeout
    }
});

// Event handlers
client.on('qr', (qr) => {
    console.log('🔍 QR Code generated! Scan with your phone:');
    qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('✅ Successfully authenticated!');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is ready!');
    console.log('📱 Connected as:', client.info.wid.user);
    
    // Test message
    console.log('🧪 Bot is now ready to receive messages');
    console.log('💡 Send a message to your WhatsApp to test');
});

client.on('message', async (message) => {
    console.log(`📨 Message from ${message.from}: ${message.body}`);
    
    // Simple echo test
    if (message.body.toLowerCase() === 'test') {
        await message.reply('✅ Bot is working! 🤖');
    }
});

client.on('disconnected', (reason) => {
    console.log('❌ Disconnected:', reason);
});

client.on('auth_failure', (session) => {
    console.log('❌ Auth failure:', session);
});

client.on('error', (error) => {
    console.error('❌ Client error:', error);
});

// Initialize
console.log('🔄 Initializing client...');
client.initialize().catch(error => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
});

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    try {
        await client.destroy();
    } catch (error) {
        console.log('Error during shutdown:', error);
    }
    process.exit(0);
});
