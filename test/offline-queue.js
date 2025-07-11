// offline-queue.js - Sistem Queue untuk Bot WhatsApp
const fs = require('fs');
const path = require('path');

class OfflineQueue {
    constructor() {
        this.queueFile = path.join(__dirname, 'message-queue.json');
        this.loadQueue();
    }
    
    // Load queue dari file JSON
    loadQueue() {
        try {
            if (fs.existsSync(this.queueFile)) {
                const data = fs.readFileSync(this.queueFile, 'utf8');
                this.queue = JSON.parse(data);
            } else {
                this.queue = [];
            }
        } catch (error) {
            console.error('Error loading queue:', error);
            this.queue = [];
        }
    }
    
    // Save queue ke file JSON
    saveQueue() {
        try {
            fs.writeFileSync(this.queueFile, JSON.stringify(this.queue, null, 2));
        } catch (error) {
            console.error('Error saving queue:', error);
        }
    }
    
    // Tambah pesan ke queue
    addToQueue(phoneNumber, message, type = 'normal') {
        const queueItem = {
            id: Date.now().toString(),
            phoneNumber: phoneNumber,
            message: message,
            type: type,
            timestamp: new Date().toISOString(),
            status: 'pending',
            attempts: 0
        };
        
        this.queue.push(queueItem);
        this.saveQueue();
        
        console.log(`📋 Pesan ditambahkan ke queue: ${phoneNumber}`);
        return queueItem.id;
    }
    
    // Proses queue ketika online
    async processQueue(client) {
        if (this.queue.length === 0) {
            console.log('✅ Queue kosong, tidak ada pesan untuk dikirim.');
            return;
        }
        
        console.log(`📨 Memproses ${this.queue.length} pesan dalam queue...`);
        
        const pendingMessages = this.queue.filter(item => item.status === 'pending');
        
        for (const item of pendingMessages) {
            try {
                // Kirim pesan
                const chatId = item.phoneNumber.includes('@c.us') ? 
                    item.phoneNumber : `${item.phoneNumber}@c.us`;
                
                await client.sendMessage(chatId, item.message);
                
                // Update status
                item.status = 'sent';
                item.sentAt = new Date().toISOString();
                
                console.log(`✅ Pesan berhasil dikirim: ${item.phoneNumber}`);
                
                // Delay untuk menghindari spam
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Error mengirim pesan ke ${item.phoneNumber}:`, error);
                
                item.attempts++;
                if (item.attempts >= 3) {
                    item.status = 'failed';
                    item.errorMessage = error.message;
                } else {
                    item.status = 'retry';
                }
            }
        }
        
        // Hapus pesan yang sudah berhasil dikirim
        this.queue = this.queue.filter(item => item.status !== 'sent');
        this.saveQueue();
        
        console.log('✅ Queue processing selesai!');
    }
    
    // Lihat status queue
    getQueueStatus() {
        const pending = this.queue.filter(item => item.status === 'pending').length;
        const failed = this.queue.filter(item => item.status === 'failed').length;
        const retry = this.queue.filter(item => item.status === 'retry').length;
        
        return {
            total: this.queue.length,
            pending: pending,
            failed: failed,
            retry: retry
        };
    }
    
    // Clear queue
    clearQueue() {
        this.queue = [];
        this.saveQueue();
        console.log('🗑️ Queue telah dibersihkan.');
    }
}

module.exports = OfflineQueue;
