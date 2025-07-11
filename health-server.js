const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// Import bot setelah delay untuk menghindari circular dependency
let client;
setTimeout(() => {
    try {
        const botModule = require('./index');
        client = botModule.client;
    } catch (error) {
        console.log('Bot module not ready yet');
    }
}, 5000);

// Health check endpoint
app.get('/health', (req, res) => {
    const isReady = client && client.info;
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bot_status: isReady ? 'connected' : 'initializing'
    });
});

// Basic info endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'ZideeBot WhatsApp Bot',
        version: '1.0.0',
        status: 'running',
        description: 'WhatsApp Bot with multiple features',
        endpoints: {
            health: '/health',
            info: '/'
        }
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        server: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start health check server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Health check server running on port ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Health server closed');
    });
});

module.exports = app;
