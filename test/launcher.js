// launcher.js - WhatsApp Bot + Web Dashboard Launcher
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WhatsApp Bot with Web Dashboard...');
console.log('================================================');

// Function to start a process
function startProcess(scriptName, name, color) {
    const child = spawn('node', [scriptName], {
        stdio: 'pipe',
        cwd: __dirname
    });
    
    console.log(`${color}✅ Starting ${name}...${'\x1b[0m'}`);
    
    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${color}[${name}]${'\x1b[0m'} ${line.trim()}`);
            }
        });
    });
    
    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${color}[${name} ERROR]${'\x1b[0m'} ${line.trim()}`);
            }
        });
    });
    
    child.on('close', (code) => {
        console.log(`${color}[${name}]${'\x1b[0m'} Process exited with code ${code}`);
        if (code !== 0) {
            console.log(`🔄 Restarting ${name} in 5 seconds...`);
            setTimeout(() => {
                startProcess(scriptName, name, color);
            }, 5000);
        }
    });
    
    child.on('error', (error) => {
        console.error(`${color}[${name} ERROR]${'\x1b[0m'} ${error.message}`);
    });
    
    return child;
}

// Color codes for console output
const colors = {
    bot: '\x1b[32m',    // Green
    web: '\x1b[34m',    // Blue
    reset: '\x1b[0m'
};

console.log('🤖 Initializing Bot Components...');
console.log('   • WhatsApp Bot Engine');
console.log('   • Web Dashboard Interface');
console.log('   • Real-time Socket Connection');
console.log('');

// Start WhatsApp Bot
const botProcess = startProcess('index.js', 'WhatsApp Bot', colors.bot);

// Wait a bit before starting web server
setTimeout(() => {
    // Start Web Dashboard
    const webProcess = startProcess('web-server.js', 'Web Dashboard', colors.web);
    
    setTimeout(() => {
        console.log('');
        console.log('🎉 All systems online!');
        console.log('================================================');
        console.log('🤖 WhatsApp Bot: Running');
        console.log('🌐 Web Dashboard: http://localhost:3000');
        console.log('📱 Scan QR code in the web dashboard to connect');
        console.log('');
        console.log('💡 Available features:');
        console.log('   • Real-time bot monitoring');
        console.log('   • Send messages from web interface');
        console.log('   • Broadcast messages to multiple contacts');
        console.log('   • View message history');
        console.log('   • Bot configuration management');
        console.log('   • QR code display for authentication');
        console.log('');
        console.log('🔧 Commands:');
        console.log('   • Ctrl+C to stop all services');
        console.log('   • Check web dashboard for bot status');
        console.log('================================================');
        
        // Auto-open dashboard in browser
        console.log('🌐 Opening dashboard in browser...');
        const { openDashboard } = require('./open-dashboard');
        setTimeout(openDashboard, 3000);
    }, 2000);
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    
    if (botProcess) {
        console.log('🤖 Stopping WhatsApp Bot...');
        botProcess.kill('SIGTERM');
    }
    
    if (webProcess) {
        console.log('🌐 Stopping Web Dashboard...');
        webProcess.kill('SIGTERM');
    }
    
    setTimeout(() => {
        console.log('✅ All services stopped. Goodbye!');
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Shutting down...');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception in launcher:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection in launcher:', reason);
    process.exit(1);
});
