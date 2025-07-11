// Contoh penggunaan bot WhatsApp untuk kasus advanced
const { client, sendMessage, broadcastMessage } = require('./index');

// Contoh 1: Scheduler untuk mengirim pesan berkala
function scheduleMessage() {
    const phoneNumber = '628123456789'; // Ganti dengan nomor tujuan
    const message = '🌅 Selamat pagi! Semangat untuk hari ini!';
    
    // Kirim pesan setiap pagi jam 07:00
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        if (hour === 7 && minute === 0) {
            sendMessage(phoneNumber, message);
        }
    }, 60000); // Check setiap menit
}

// Contoh 2: Auto-reply berdasarkan waktu
function getTimeBasedReply() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return '🌅 Selamat pagi! Ada yang bisa saya bantu?';
    } else if (hour >= 12 && hour < 17) {
        return '☀️ Selamat siang! Bagaimana kabarnya?';
    } else if (hour >= 17 && hour < 21) {
        return '🌆 Selamat sore! Semoga harimu menyenangkan.';
    } else {
        return '🌙 Selamat malam! Jangan begadang ya.';
    }
}

// Contoh 3: Database sederhana untuk menyimpan user
const userData = new Map();

function saveUserData(phoneNumber, data) {
    userData.set(phoneNumber, {
        ...userData.get(phoneNumber),
        ...data,
        lastSeen: new Date()
    });
}

function getUserData(phoneNumber) {
    return userData.get(phoneNumber) || {};
}

// Contoh 4: Bot untuk Customer Service
const customerServiceBot = {
    // FAQ responses
    faq: {
        'jam buka': 'Kami buka setiap hari pukul 08:00 - 22:00 WIB',
        'lokasi': 'Alamat: Jl. Contoh No. 123, Jakarta',
        'harga': 'Untuk informasi harga, silakan kunjungi website kami atau hubungi CS',
        'promo': 'Promo bulan ini: Diskon 20% untuk pembelian pertama!'
    },
    
    // Handle customer service queries
    handleQuery: async function(message) {
        const query = message.body.toLowerCase();
        
        for (const [keyword, response] of Object.entries(this.faq)) {
            if (query.includes(keyword)) {
                await message.reply(`📋 ${response}`);
                return true;
            }
        }
        
        // Jika tidak ada yang cocok, arahkan ke CS
        await message.reply(`
👋 Halo! Terima kasih telah menghubungi kami.

Saya adalah bot otomatis. Untuk pertanyaan yang lebih spesifik, silakan tunggu CS kami akan merespon dalam 1x24 jam.

Atau Anda bisa coba pertanyaan umum seperti:
• jam buka
• lokasi  
• harga
• promo
        `);
        
        return false;
    }
};

// Contoh 5: Group Management Bot
const groupBot = {
    // Commands untuk admin grup
    adminCommands: {
        '/kick': 'Kick user from group',
        '/mute': 'Mute group chat',
        '/unmute': 'Unmute group chat',
        '/rules': 'Show group rules'
    },
    
    // Handle admin commands
    handleAdminCommand: async function(message) {
        const isAdmin = await this.isUserAdmin(message.from, message.author);
        
        if (!isAdmin) {
            await message.reply('⚠️ Perintah ini hanya untuk admin grup.');
            return;
        }
        
        const command = message.body.toLowerCase();
        
        if (command === '/rules') {
            await message.reply(`
📋 *RULES GRUP*

1. Sopan dan santun dalam berkomunikasi
2. No spam, no sara, no politik
3. Gunakan bahasa yang baik dan benar
4. Jangan share konten yang tidak pantas
5. Hormati sesama member grup

Pelanggaran rules akan dikenakan sanksi kick dari grup.
            `);
        }
    },
    
    // Check if user is admin
    isUserAdmin: async function(chatId, userId) {
        try {
            const chat = await client.getChatById(chatId);
            const participant = chat.participants.find(p => p.id._serialized === userId);
            return participant && participant.isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }
};

// Contoh 6: Integration dengan API external
async function getWeatherInfo(city) {
    try {
        // Contoh menggunakan OpenWeatherMap API (perlu API key)
        const apiKey = 'YOUR_API_KEY'; // Ganti dengan API key Anda
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const data = await response.json();
        
        return `
🌤️ *Cuaca ${city}*

Suhu: ${data.main.temp}°C
Kondisi: ${data.weather[0].description}
Kelembaban: ${data.main.humidity}%
Angin: ${data.wind.speed} m/s
        `;
    } catch (error) {
        return '❌ Gagal mendapatkan info cuaca. Coba lagi nanti.';
    }
}

// Export semua fungsi untuk digunakan di file utama
module.exports = {
    scheduleMessage,
    getTimeBasedReply,
    saveUserData,
    getUserData,
    customerServiceBot,
    groupBot,
    getWeatherInfo
};
