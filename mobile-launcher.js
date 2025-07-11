// mobile-launcher.js - Launcher untuk akses mobile
const { spawn } = require('child_process');
const { displayNetworkInfo } = require('./get-network-ip');

console.log('🚀 Starting WhatsApp Bot with Mobile Dashboard Access');
console.log('====================================================');

// Display network information first
displayNetworkInfo();

console.log('');
console.log('🤖 Starting bot and web server...');
console.log('');

// Start the main launcher
const launcher = spawn('node', ['launcher.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

launcher.on('error', (error) => {
    console.error('❌ Error starting launcher:', error);
});

launcher.on('exit', (code) => {
    console.log(`📊 Launcher exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    launcher.kill();
    process.exit();
});
