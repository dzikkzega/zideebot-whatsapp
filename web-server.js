// web-server.js - Web Dashboard untuk WhatsApp Bot
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Import bot modules
const { client, sendMessage, broadcastMessage } = require('./index');
const { testGeminiAPI, validateAPIKey } = require('./gemini-ai');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web/public')));

// Bot status tracking
let botStatus = {
    isConnected: false,
    isAuthenticated: false,
    qrCode: null,
    lastActivity: null,
    messageCount: 0,
    activeChats: 0,
    startTime: moment(),
    errors: []
};

let messageHistory = [];
let activeUsers = new Set();

// Dashboard routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/public/index.html'));
});

app.get('/api/status', (req, res) => {
    res.json({
        ...botStatus,
        uptime: moment.duration(moment().diff(botStatus.startTime)).humanize(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
    });
});

app.get('/api/messages', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(messageHistory.slice(-limit));
});

app.post('/api/send-message', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }
        
        await sendMessage(phoneNumber, message);
        
        // Log to history
        messageHistory.push({
            id: Date.now(),
            type: 'sent',
            from: 'Dashboard',
            to: phoneNumber,
            message: message,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        // Emit to all connected clients
        io.emit('message-sent', {
            phoneNumber,
            message,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/broadcast', async (req, res) => {
    try {
        const { phoneNumbers, message } = req.body;
        
        if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
            return res.status(400).json({ error: 'Phone numbers array and message are required' });
        }
        
        // Start broadcast in background
        broadcastMessage(phoneNumbers, message);
        
        // Log to history
        messageHistory.push({
            id: Date.now(),
            type: 'broadcast',
            from: 'Dashboard',
            to: `${phoneNumbers.length} recipients`,
            message: message,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        // Emit to all connected clients
        io.emit('broadcast-started', {
            recipients: phoneNumbers.length,
            message,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        res.json({ success: true, message: `Broadcast started to ${phoneNumbers.length} recipients` });
    } catch (error) {
        console.error('Error broadcasting:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test-gemini', async (req, res) => {
    try {
        const isWorking = await testGeminiAPI();
        res.json({ 
            success: isWorking, 
            message: isWorking ? 'Gemini AI is working correctly' : 'Gemini AI test failed' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bot-restart', (req, res) => {
    try {
        // Restart bot (simplified)
        botStatus.errors.push({
            message: 'Bot restart requested from dashboard',
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        io.emit('bot-restarting');
        
        res.json({ success: true, message: 'Bot restart initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    console.log('🌐 Client connected to dashboard');
    
    // Send current status
    socket.emit('status-update', botStatus);
    
    socket.on('disconnect', () => {
        console.log('🌐 Client disconnected from dashboard');
    });
    
    socket.on('request-qr', () => {
        if (botStatus.qrCode) {
            socket.emit('qr-code', botStatus.qrCode);
        }
    });
    
    // AI Chat handler
    socket.on('ai-chat', async (data) => {
        console.log('🤖 AI Chat request received:', data.message);
        
        try {
            // Import Gemini function
            const { getAIResponse } = require('./gemini-ai');
            
            // Get AI response
            const response = await getAIResponse(data.message);
            
            // Send response back to client
            socket.emit('ai-chat-response', {
                success: true,
                response: response,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            });
            
            console.log('🤖 AI response sent successfully');
            
        } catch (error) {
            console.error('🤖 AI Chat error:', error);
            
            socket.emit('ai-chat-response', {
                success: false,
                error: error.message,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            });
        }
    });
});

// Bot event listeners for real-time updates
if (client) {
    client.on('qr', (qr) => {
        console.log('📱 QR Code generated for dashboard');
        botStatus.qrCode = qr;
        io.emit('qr-code', qr);
    });
    
    client.on('ready', () => {
        botStatus.isConnected = true;
        botStatus.isAuthenticated = true;
        botStatus.qrCode = null;
        botStatus.lastActivity = moment().format('YYYY-MM-DD HH:mm:ss');
        
        console.log('✅ Bot connected - updating dashboard');
        io.emit('status-update', botStatus);
    });
    
    client.on('authenticated', () => {
        botStatus.isAuthenticated = true;
        io.emit('status-update', botStatus);
    });
    
    client.on('disconnected', (reason) => {
        botStatus.isConnected = false;
        botStatus.isAuthenticated = false;
        botStatus.errors.push({
            message: `Bot disconnected: ${reason}`,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        io.emit('status-update', botStatus);
    });
    
    client.on('message', (message) => {
        botStatus.messageCount++;
        botStatus.lastActivity = moment().format('YYYY-MM-DD HH:mm:ss');
        
        // Add to message history
        messageHistory.push({
            id: Date.now(),
            type: 'received',
            from: message.from,
            to: 'Bot',
            message: message.body,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        // Keep only last 200 messages
        if (messageHistory.length > 200) {
            messageHistory = messageHistory.slice(-200);
        }
        
        // Update active users
        activeUsers.add(message.from);
        botStatus.activeChats = activeUsers.size;
        
        // Emit real-time update
        io.emit('new-message', {
            from: message.from,
            message: message.body,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        io.emit('status-update', botStatus);
    });
}

// Start server
const PORT = process.env.WEB_PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Allow access from any device

server.listen(PORT, HOST, () => {
    console.log(`🌐 Web Dashboard running on:`);
    console.log(`   • Local: http://localhost:${PORT}`);
    console.log(`   • Network: http://[YOUR_IP]:${PORT}`);
    console.log(`📊 Dashboard features:`);
    console.log(`   • Real-time bot status`);
    console.log(`   • Message monitoring`);
    console.log(`   • Send messages & broadcast`);
    console.log(`   • QR code display`);
    console.log(`   • Bot control panel`);
    console.log(`📱 To access from mobile:`);
    console.log(`   1. Find your computer's IP address`);
    console.log(`   2. Open http://[YOUR_IP]:${PORT} in mobile browser`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception in web server:', error);
    botStatus.errors.push({
        message: `Web server error: ${error.message}`,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
    });
});

module.exports = { app, server, io, botStatus };
