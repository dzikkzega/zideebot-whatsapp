// open-dashboard.js - Script to open dashboard in browser
const { exec } = require('child_process');
const axios = require('axios');

const DASHBOARD_URL = 'http://localhost:3000';

async function waitForServer(url, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await axios.get(url, { timeout: 2000 });
            return true;
        } catch (error) {
            console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return false;
}

async function openDashboard() {
    console.log('🌐 Opening WhatsApp Bot Dashboard...');
    console.log('Checking if server is ready...');
    
    const serverReady = await waitForServer(DASHBOARD_URL);
    
    if (serverReady) {
        console.log('✅ Server is ready!');
        console.log('🚀 Opening dashboard in browser...');
        
        // Open browser based on platform
        const platform = process.platform;
        let command;
        
        if (platform === 'win32') {
            command = `start ${DASHBOARD_URL}`;
        } else if (platform === 'darwin') {
            command = `open ${DASHBOARD_URL}`;
        } else {
            command = `xdg-open ${DASHBOARD_URL}`;
        }
        
        exec(command, (error) => {
            if (error) {
                console.error('❌ Error opening browser:', error);
                console.log(`💡 Please manually open: ${DASHBOARD_URL}`);
            } else {
                console.log('✅ Dashboard opened in browser!');
                console.log('📱 Scan QR code to connect your WhatsApp');
            }
        });
    } else {
        console.log('❌ Server is not responding');
        console.log('💡 Make sure to run "npm run full" first');
        console.log(`🌐 Try opening manually: ${DASHBOARD_URL}`);
    }
}

if (require.main === module) {
    openDashboard();
}

module.exports = { openDashboard, waitForServer };
