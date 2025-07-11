// bot-with-offline-support.js - Bot dengan Offline Queue Support
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const OfflineQueue = require('./offline-queue');

// Inisialisasi offline queue
const offlineQueue = new OfflineQueue();

// Status koneksi
let isOnline = false;
let connectionRetryCount = 0;
const MAX_RETRY = 5;

// Inisialisasi client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

// Event ketika QR code perlu di-scan
client.on('qr', (qr) => {
    console.log('🔍 Scan QR Code ini dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Event ketika bot berhasil terhubung
client.on('ready', async () => {
    console.log('✅ Bot WhatsApp siap digunakan!');
    console.log('📱 Connected as:', client.info.wid.user);
    
    isOnline = true;
    connectionRetryCount = 0;
    
    // Proses queue yang tertunda
    await offlineQueue.processQueue(client);
    
    // Show queue status
    const queueStatus = offlineQueue.getQueueStatus();
    if (queueStatus.total > 0) {
        console.log(`📊 Queue Status: ${queueStatus.pending} pending, ${queueStatus.failed} failed, ${queueStatus.retry} retry`);
    }
});

// Event ketika terputus
client.on('disconnected', (reason) => {
    console.log('❌ Bot terputus:', reason);
    isOnline = false;
    
    // Coba reconnect
    if (connectionRetryCount < MAX_RETRY) {
        connectionRetryCount++;
        console.log(`🔄 Mencoba reconnect (${connectionRetryCount}/${MAX_RETRY})...`);
        
        setTimeout(() => {
            client.initialize();
        }, 5000); // Retry setelah 5 detik
    } else {
        console.log('⚠️ Maksimal retry tercapai. Bot akan menggunakan offline mode.');
        console.log('💡 Pesan akan disimpan dalam queue dan dikirim ketika online kembali.');
    }
});

// Event ketika ada pesan masuk
client.on('message', async (message) => {
    console.log(`📨 Pesan dari ${message.from}: ${message.body}`);
    
    if (isOnline) {
        // Jika online, proses langsung
        await handleMessage(message);
    } else {
        // Jika offline, simpan respons ke queue
        const response = await generateOfflineResponse(message);
        if (response) {
            offlineQueue.addToQueue(message.from, response, 'auto-reply');
            console.log('📋 Respons disimpan ke queue (akan dikirim ketika online)');
        }
    }
});

// Fungsi untuk generate respons offline
async function generateOfflineResponse(message) {
    const messageBody = message.body.toLowerCase();
    
    if (messageBody === 'tolong' || messageBody === 'bantuan' || messageBody === 'menu') {
        return `🤖 *Bot WhatsApp Help*

Kata kunci yang tersedia:
• tolong / bantuan / menu - Tampilkan menu bantuan
• waktu / jam - Tampilkan waktu sekarang
• info / tentang - Informasi tentang bot
• ping / test - Test koneksi bot
• echo [text] - Bot akan mengulangi teks Anda

⚠️ Bot sedang offline, pesan ini dikirim otomatis ketika online kembali.`;
    }
    
    if (messageBody.includes('bot') || messageBody.includes('hai') || messageBody.includes('hello')) {
        return 'Haii, aku adalah Zideebot. Bot sedang offline saat ini. Pesan Anda akan dibalas ketika bot online kembali.';
    }
    
    if (messageBody.includes('terima kasih') || messageBody.includes('thanks')) {
        return '🙏 Sama-sama! (Pesan otomatis - bot sedang offline)';
    }
    
    // Default offline response
    return '🤖 Terima kasih atas pesan Anda. Bot sedang offline, pesan ini akan dikirim otomatis ketika online kembali.';
}

// Fungsi untuk menangani pesan (ketika online)
async function handleMessage(message) {
    const messageBody = message.body.toLowerCase();
    
    try {
        // Smart delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Command: tolong
        if (messageBody === 'tolong' || messageBody === 'bantuan' || messageBody === 'menu') {
            await message.reply(`
🤖 *Bot WhatsApp Help*

Kata kunci yang tersedia:
• tolong / bantuan / menu - Tampilkan menu bantuan
• waktu / jam - Tampilkan waktu sekarang
• info / tentang - Informasi tentang bot
• ping / test - Test koneksi bot
• echo [text] - Bot akan mengulangi teks Anda
• status - Cek status bot dan queue

✅ Bot sedang online!
            `);
        }
        
        // Command: status
        else if (messageBody === 'status') {
            const queueStatus = offlineQueue.getQueueStatus();
            await message.reply(`
📊 *Status Bot*

🟢 Status: Online
📋 Queue: ${queueStatus.total} pesan
⏳ Pending: ${queueStatus.pending}
❌ Failed: ${queueStatus.failed}
🔄 Retry: ${queueStatus.retry}

Waktu: ${moment().format('YYYY-MM-DD HH:mm:ss')}
            `);
        }
        
        // Command lainnya...
        else if (messageBody === 'waktu' || messageBody === 'jam') {
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            await message.reply(`🕐 Waktu sekarang: ${currentTime}`);
        }
        
        else if (messageBody.includes('bot') || messageBody.includes('hai')) {
            await message.reply('Haii, aku adalah Zideebot. Ada yang bisa aku bantu?');
        }
        
        else if (messageBody.includes('terima kasih')) {
            await message.reply('🙏 Sama-sama! Senang bisa membantu.');
        }
        
    } catch (error) {
        console.error('❌ Error handling message:', error);
        
        // Jika error, tambahkan respons ke queue
        offlineQueue.addToQueue(message.from, '⚠️ Terjadi kesalahan saat memproses pesan. Pesan ini dikirim otomatis.', 'error-response');
    }
}

// Fungsi untuk kirim pesan (dengan queue support)
async function sendMessage(phoneNumber, message) {
    if (isOnline) {
        try {
            const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
            await client.sendMessage(chatId, message);
            console.log(`📤 Pesan berhasil dikirim ke ${phoneNumber}`);
        } catch (error) {
            console.error('❌ Error sending message:', error);
            // Tambahkan ke queue jika gagal
            offlineQueue.addToQueue(phoneNumber, message, 'manual');
        }
    } else {
        // Jika offline, langsung masukkan ke queue
        offlineQueue.addToQueue(phoneNumber, message, 'manual');
        console.log('📋 Pesan ditambahkan ke queue (bot sedang offline)');
    }
}

// Mulai bot
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot...');
    
    const queueStatus = offlineQueue.getQueueStatus();
    if (queueStatus.total > 0) {
        console.log(`⚠️ Ada ${queueStatus.total} pesan dalam queue yang belum dikirim.`);
        console.log('💡 Pesan akan dikirim ketika bot dijalankan kembali.');
    }
    
    await client.destroy();
    process.exit(0);
});

// Export functions
module.exports = {
    client,
    sendMessage,
    offlineQueue,
    isOnline
};
