// dashboard.js - WhatsApp Bot Dashboard JavaScript
class BotDashboard {
    constructor() {
        this.socket = io();
        this.isConnected = false;
        this.botStatus = null;
        this.messageHistory = [];
        
        this.init();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    init() {
        console.log('🚀 Initializing Bot Dashboard...');
        this.initTheme();
        this.loadStatus();
        this.loadMessages();
        this.setupNavigation();
        this.showToast('Dashboard loaded successfully', 'success');
    }
    
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebarToggle && sidebar && sidebarOverlay) {
            // Toggle sidebar
            sidebarToggle.addEventListener('click', () => {
                const isOpen = sidebar.classList.contains('show');
                if (isOpen) {
                    this.closeSidebar();
                } else {
                    this.openSidebar();
                }
            });
            
            // Close sidebar when clicking overlay
            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
            
            // Close sidebar on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                    this.closeSidebar();
                }
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });
        
        // Forms
        this.setupForms();
        
        // Quick action buttons
        this.setupQuickActions();
        
        // Character counters
        this.setupCharacterCounters();
        
        // Theme toggle
        this.setupThemeToggle();
        
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadStatus();
            this.loadMessages();
            this.showToast('Data refreshed', 'info');
        });
    }
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('🔌 Connected to server');
            this.isConnected = true;
            this.updateConnectionStatus('Connected', 'status-online');
        });
        
        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus('Disconnected', 'status-offline');
        });
        
        this.socket.on('status-update', (status) => {
            console.log('📊 Status update received:', status);
            this.botStatus = status;
            this.updateDashboard(status);
        });
        
        this.socket.on('new-message', (message) => {
            console.log('💬 New message received:', message);
            this.addMessageToHistory(message, 'received');
            this.showToast(`New message from ${message.from}`, 'info');
        });
        
        this.socket.on('message-sent', (data) => {
            console.log('📤 Message sent:', data);
            this.addMessageToHistory({
                from: 'Dashboard',
                message: data.message,
                timestamp: data.timestamp
            }, 'sent');
            this.showToast('Message sent successfully', 'success');
        });
        
        this.socket.on('broadcast-started', (data) => {
            console.log('📢 Broadcast started:', data);
            this.showToast(`Broadcast started to ${data.recipients} recipients`, 'info');
        });
        
        this.socket.on('qr-code', (qr) => {
            console.log('🔍 QR code received');
            this.displayQRCode(qr);
            this.showToast('QR code generated! Scan with WhatsApp', 'warning');
        });
        
        this.socket.on('bot-restarting', () => {
            this.showToast('Bot is restarting...', 'warning');
        });
    }
    
    setupNavigation() {
        // Show overview section by default
        this.showSection('overview');
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Special actions for certain sections
        if (sectionName === 'messages') {
            this.loadMessages();
        } else if (sectionName === 'qr-code') {
            this.requestQRCode();
        }
    }
    
    setupForms() {
        // Send message form
        const sendMessageForm = document.getElementById('sendMessageForm');
        if (sendMessageForm) {
            sendMessageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendMessage();
            });
        }
        
        // Broadcast form
        const broadcastForm = document.getElementById('broadcastForm');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendBroadcast();
            });
        }
        
        // Settings form
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }
    
    setupQuickActions() {
        // Test Gemini button
        document.getElementById('testGeminiBtn')?.addEventListener('click', async () => {
            await this.testGeminiAPI();
        });
        
        // Restart bot button
        document.getElementById('restartBotBtn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to restart the bot?')) {
                await this.restartBot();
            }
        });
        
        // Show QR button
        document.getElementById('showQrBtn')?.addEventListener('click', () => {
            this.showSection('qr-code');
        });
        
        // Export logs button
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => {
            this.exportLogs();
        });
        
        // Request QR button
        document.getElementById('requestQrBtn')?.addEventListener('click', () => {
            this.requestQRCode();
        });
        
        // Refresh messages button
        document.getElementById('refreshMessagesBtn')?.addEventListener('click', () => {
            this.loadMessages();
        });
    }
    
    setupCharacterCounters() {
        // Message character counter
        const messageText = document.getElementById('messageText');
        const charCount = document.getElementById('charCount');
        if (messageText && charCount) {
            messageText.addEventListener('input', () => {
                charCount.textContent = messageText.value.length;
            });
        }
        
        // Broadcast character counter
        const broadcastMessage = document.getElementById('broadcastMessage');
        const broadcastCharCount = document.getElementById('broadcastCharCount');
        if (broadcastMessage && broadcastCharCount) {
            broadcastMessage.addEventListener('input', () => {
                broadcastCharCount.textContent = broadcastMessage.value.length;
            });
        }
    }
    
    async loadStatus() {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            this.botStatus = status;
            this.updateDashboard(status);
        } catch (error) {
            console.error('Error loading status:', error);
            this.showToast('Error loading status', 'danger');
        }
    }
    
    async loadMessages() {
        try {
            const response = await fetch('/api/messages?limit=50');
            const messages = await response.json();
            this.messageHistory = messages;
            this.updateMessageHistory();
            this.updateRecentActivity(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showToast('Error loading messages', 'danger');
        }
    }
    
    updateDashboard(status) {
        // Update status cards
        document.getElementById('botStatusText').textContent = 
            status.isConnected ? 'Online' : 'Offline';
        document.getElementById('messageCount').textContent = status.messageCount || 0;
        document.getElementById('activeChats').textContent = status.activeChats || 0;
        document.getElementById('uptime').textContent = status.uptime || '0m';
        
        // Update system info
        document.getElementById('nodeVersion').textContent = status.nodeVersion || '-';
        document.getElementById('lastActivity').textContent = status.lastActivity || '-';
        document.getElementById('startTime').textContent = 
            status.startTime ? new Date(status.startTime).toLocaleString() : '-';
        
        // Update memory usage
        if (status.memoryUsage) {
            const memoryMB = Math.round(status.memoryUsage.heapUsed / 1024 / 1024);
            document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
        }
        
        // Update connection status
        if (status.isConnected) {
            this.updateConnectionStatus('Bot Online', 'status-online');
        } else {
            this.updateConnectionStatus('Bot Offline', 'status-offline');
        }
        
        // Update Gemini status
        document.getElementById('geminiStatus').textContent = 
            status.geminiEnabled ? 'Connected' : 'Disconnected';
    }
    
    updateConnectionStatus(text, className) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = text;
            statusElement.className = `badge ${className}`;
        }
    }
    
    updateMessageHistory() {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        if (this.messageHistory.length === 0) {
            container.innerHTML = '<div class="text-center text-muted">No messages yet</div>';
            return;
        }
        
        container.innerHTML = this.messageHistory.map(msg => `
            <div class="message-item ${msg.type}">
                <div class="message-info">
                    <div class="message-meta">
                        <strong>${msg.from}</strong> → ${msg.to} 
                        <span class="text-muted">${msg.timestamp}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(msg.message)}</div>
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
    
    updateRecentActivity(messages) {
        const table = document.getElementById('recentActivity');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recent activity</td></tr>';
            return;
        }
        
        tbody.innerHTML = messages.slice(-10).reverse().map(msg => `
            <tr>
                <td>${msg.timestamp}</td>
                <td><span class="badge bg-${this.getTypeColor(msg.type)}">${msg.type}</span></td>
                <td>${msg.from} → ${msg.to}</td>
                <td>${this.truncateText(msg.message, 50)}</td>
            </tr>
        `).join('');
    }
    
    addMessageToHistory(message, type) {
        const messageObj = {
            id: Date.now(),
            type: type,
            from: message.from,
            to: message.to || 'Bot',
            message: message.message,
            timestamp: message.timestamp || new Date().toLocaleString()
        };
        
        this.messageHistory.push(messageObj);
        
        // Keep only last 200 messages
        if (this.messageHistory.length > 200) {
            this.messageHistory = this.messageHistory.slice(-200);
        }
        
        this.updateMessageHistory();
    }
    
    async sendMessage() {
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const message = document.getElementById('messageText').value.trim();
        
        if (!phoneNumber || !message) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber, message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Message sent successfully', 'success');
                document.getElementById('sendMessageForm').reset();
                document.getElementById('charCount').textContent = '0';
            } else {
                this.showToast(`Error: ${result.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Error sending message', 'danger');
        }
    }
    
    async sendBroadcast() {
        const phoneNumbersText = document.getElementById('phoneNumbers').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();
        
        if (!phoneNumbersText || !message) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        const phoneNumbers = phoneNumbersText.split('\n')
            .map(num => num.trim())
            .filter(num => num.length > 0);
        
        if (phoneNumbers.length === 0) {
            this.showToast('Please enter at least one phone number', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumbers, message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Broadcast started to ${phoneNumbers.length} recipients`, 'success');
                document.getElementById('broadcastForm').reset();
                document.getElementById('broadcastCharCount').textContent = '0';
            } else {
                this.showToast(`Error: ${result.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error sending broadcast:', error);
            this.showToast('Error sending broadcast', 'danger');
        }
    }
    
    async testGeminiAPI() {
        const button = document.getElementById('testGeminiBtn');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<span class="spinner"></span> Testing...';
        button.disabled = true;
        
        try {
            const response = await fetch('/api/test-gemini', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Gemini AI is working correctly', 'success');
            } else {
                this.showToast('Gemini AI test failed', 'danger');
            }
        } catch (error) {
            console.error('Error testing Gemini:', error);
            this.showToast('Error testing Gemini API', 'danger');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
    
    async restartBot() {
        try {
            const response = await fetch('/api/bot-restart');
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Bot restart initiated', 'info');
            } else {
                this.showToast('Error restarting bot', 'danger');
            }
        } catch (error) {
            console.error('Error restarting bot:', error);
            this.showToast('Error restarting bot', 'danger');
        }
    }
    
    requestQRCode() {
        this.socket.emit('request-qr');
        this.showToast('QR code requested', 'info');
    }
    
    displayQRCode(qrText) {
        const container = document.getElementById('qrCodeContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, qrText, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) {
                console.error('QR Code generation error:', error);
                container.innerHTML = '<div class="alert alert-danger">Error generating QR code</div>';
            } else {
                container.appendChild(canvas);
                
                const instructions = document.createElement('div');
                instructions.className = 'mt-3 alert alert-info';
                instructions.innerHTML = `
                    <i class="fas fa-mobile-alt"></i>
                    <strong>Instructions:</strong><br>
                    1. Open WhatsApp on your phone<br>
                    2. Go to Settings → Linked Devices<br>
                    3. Tap "Link a Device"<br>
                    4. Scan this QR code
                `;
                container.appendChild(instructions);
            }
        });
    }
    
    saveSettings() {
        // This would typically save to backend
        this.showToast('Settings saved (demo)', 'success');
    }
    
    exportLogs() {
        const logs = {
            messages: this.messageHistory,
            status: this.botStatus,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bot-logs-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Logs exported successfully', 'success');
    }
    
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            container.removeChild(toast);
        });
    }
    
    // Sidebar Management Functions
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && sidebarOverlay) {
            sidebar.classList.add('show');
            sidebarOverlay.classList.add('show');
            
            // Prevent body scroll when sidebar is open on mobile
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }
    
    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
    
    getTypeColor(type) {
        const colors = {
            'sent': 'success',
            'received': 'info',
            'broadcast': 'warning',
            'error': 'danger'
        };
        return colors[type] || 'secondary';
    }
    
    // Theme Management Functions
    initTheme() {
        // Check if user has a saved theme preference
        const savedTheme = localStorage.getItem('dashboard-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
        
        // Update toggle state
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
        
        console.log(`🎨 Theme initialized: ${theme}`);
    }
    
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                this.setTheme(theme);
                this.showToast(`Switched to ${theme} mode`, 'info');
            });
        }
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dashboard-theme', theme);
        
        // Update status badge classes for better visibility
        this.updateStatusBadgeColors(theme);
        
        console.log(`🎨 Theme set to: ${theme}`);
    }
    
    updateStatusBadgeColors(theme) {
        const statusBadge = document.getElementById('connectionStatus');
        if (statusBadge) {
            // Update badge styling based on theme
            if (theme === 'dark') {
                statusBadge.style.color = '#e0e0e0';
            } else {
                statusBadge.style.color = '#ffffff';
            }
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BotDashboard();
});
