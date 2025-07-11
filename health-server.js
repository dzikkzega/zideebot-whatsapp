const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Import bot
const { client } = require('./index');

// Health check endpoint
app.get('/health', (req, res) => {
    const isReady = client && client.info;
    res.status(isReady ? 200 : 503).json({
        status: isReady ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bot_status: isReady ? 'connected' : 'disconnected'
    });
});

// Basic info endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'ZideeBot WhatsApp Bot',
        version: '1.0.0',
        status: 'running',
        description: 'WhatsApp Bot with multiple features'
    });
});

// Start health check server
app.listen(port, () => {
    console.log(`🌐 Health check server running on port ${port}`);
});

module.exports = app;
