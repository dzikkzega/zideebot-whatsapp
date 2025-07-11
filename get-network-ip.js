// get-network-ip.js - Script untuk mendapatkan IP address lokal
const os = require('os');

function getNetworkIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if ('IPv4' !== interface.family || interface.internal !== false) {
                continue;
            }
            ips.push({
                interface: name,
                ip: interface.address
            });
        }
    }
    
    return ips;
}

function displayNetworkInfo() {
    console.log('🌐 Network Information for Mobile Access');
    console.log('=====================================');
    
    const ips = getNetworkIPs();
    const port = process.env.WEB_PORT || 3000;
    
    if (ips.length === 0) {
        console.log('❌ No network interfaces found');
        return;
    }
    
    console.log('📱 URLs to access dashboard from your phone:');
    console.log('');
    
    ips.forEach((item, index) => {
        const url = `http://${item.ip}:${port}`;
        console.log(`${index + 1}. ${item.interface}: ${url}`);
    });
    
    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Make sure your phone and computer are on the same WiFi network');
    console.log('2. Copy one of the URLs above');
    console.log('3. Open the URL in your phone\'s browser');
    console.log('4. The dashboard should load on your mobile device');
    console.log('');
    console.log('⚠️  Note: If you can\'t access it, check your firewall settings');
}

if (require.main === module) {
    displayNetworkInfo();
}

module.exports = { getNetworkIPs, displayNetworkInfo };
