const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const { getOpenMeteoWeather, getWeatherForecast } = require('./open-meteo-api');
const { chatWithGemini, generateCreative, translateText } = require('./gemini-ai');
const { downloadYouTubeVideo, getVideoInfo, isValidYouTubeUrl, cleanupFile } = require('./youtube-working');

// Konfigurasi delay
const DELAY_CONFIG = {
    // Delay untuk auto-reply normal (1-3 detik)
    autoReply: { min: 1000, max: 3000 },
    
    // Delay untuk broadcast (2-5 detik)
    broadcast: { min: 2000, max: 5000 },
    
    // Delay untuk command yang complex (2-4 detik)
    command: { min: 2000, max: 4000 },
    
    // Delay untuk sapaan (1-2 detik, lebih cepat)
    greeting: { min: 1000, max: 2000 },
    
    // Delay untuk grup management (1-3 detik)
    groupManagement: { min: 1000, max: 3000 }
};

// Inisialisasi client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true, // Always headless in production
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        timeout: 60000
    }
});

// Event ketika QR code perlu di-scan
client.on('qr', (qr) => {
    console.log('🔍 Scan QR Code ini dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('💡 Scan QR code di atas dengan WhatsApp di HP Anda');
});

// Event ketika loading
client.on('loading_screen', (percent, message) => {
    console.log('⏳ Loading:', percent, message);
});

// Event ketika authenticated
client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated successfully!');
});

// Event ketika bot berhasil terhubung
client.on('ready', () => {
    console.log('✅ Bot WhatsApp siap digunakan!');
    console.log('📱 Connected as:', client.info.wid.user);
    console.log('🌐 Dashboard: http://localhost:3000');
    console.log('🎯 Status: ONLINE dan siap menerima pesan!');
    console.log('📝 Ketik "menu" di WhatsApp untuk melihat semua fitur');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Event ketika bot disconnect
client.on('disconnected', (reason) => {
    console.log('❌ Bot disconnected:', reason);
    console.log('🔄 Restarting in 5 seconds...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

// Event ketika ada authentication failure
client.on('auth_failure', (session) => {
    console.log('❌ Authentication failed:', session);
    console.log('🔄 Please scan QR code again');
});

// Event untuk handle error
client.on('error', (error) => {
    console.error('❌ WhatsApp Client Error:', error);
});

// Initialize dengan error handling
console.log('🚀 Initializing WhatsApp Bot...');
client.initialize().catch(error => {
    console.error('❌ Failed to initialize client:', error);
    process.exit(1);
});

// Start health check server untuk hosting
if (process.env.NODE_ENV === 'production') {
    require('./health-server');
}

// Event ketika ada pesan masuk
client.on('message', async (message) => {
    console.log(`📨 Pesan dari ${message.from}: ${message.body}`);
    
    // Auto-reply berdasarkan pesan
    await handleMessage(message);
});

// Event ketika ada pesan baru (termasuk pesan dari bot sendiri)
client.on('message_create', async (message) => {
    // Log semua pesan yang dibuat
    if (message.fromMe) {
        console.log(`📤 Pesan terkirim ke ${message.to}: ${message.body}`);
    }
});

// Event ketika ada user bergabung ke grup
client.on('group_join', async (notification) => {
    console.log('👥 GROUP JOIN EVENT DETECTED!');
    console.log(`📍 Group: ${notification.chatId}`);
    console.log(`👤 New participants:`, notification.recipientIds);
    
    try {
        // Get chat object
        const chat = await client.getChatById(notification.chatId);
        
        if (chat.isGroup) {
            console.log(`✅ Group confirmed: ${chat.name}`);
            
            // Array pesan welcome yang bervariasi
            const welcomeMessages = [
                "Selamat datang di grup! Semoga betah dan bisa berkontribusi positif 🎉",
                "Welcome to the group! Mari kita jaga keharmonisan dan saling membantu ✨",
                "Halo newcomer! Jangan lupa baca aturan grup dan berkenalan ya 👋",
                "Selamat bergabung! Grup ini tempat sharing dan belajar bersama 🚀",
                "Welcome aboard! Mari kita ciptakan lingkungan yang positif dan produktif 🌟"
            ];
            
            // Pilih pesan secara random
            const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            
            // Format tanggal dan waktu Indonesia
            const now = new Date();
            const dateOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'Asia/Jakarta'
            };
            const timeOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Jakarta'
            };
            
            const dateStr = now.toLocaleDateString('id-ID', dateOptions);
            const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
            
            // Delay natural sebelum kirim welcome
            await naturalDelay(2000, 4000);
            
            // Kirim pesan welcome
            await chat.sendMessage(`*NEW MEMBER WELCOME* ~ ZideeBot

🎉 **Selamat Datang di ${chat.name}!**

👤 **Member Baru:** ${notification.recipientIds.length} orang
📅 **Bergabung:** ${dateStr}
⏰ **Waktu:** ${timeStr} WIB

💬 **Pesan:**
${randomWelcome}

📋 **Tips Bergabung:**
• Baca aturan grup terlebih dahulu
• Perkenalkan diri dengan sopan
• Jaga etika dalam berkomunikasi
• Aktif berpartisipasi positif

🤖 **Bot Commands:**
Ketik "tolong" atau "menu" untuk melihat bantuan

Welcome aboard! 🚢✨`);
            
            console.log(`📤 Welcome message sent to group: ${chat.name}`);
            
        } else {
            console.log('⚠️ Join notification not from group');
        }
        
    } catch (error) {
        console.error('❌ Error handling group join:', error);
    }
});

// Event alternatif untuk mendeteksi perubahan participant (lebih universal)
client.on('group_update', async (notification) => {
    console.log('👥 GROUP UPDATE EVENT DETECTED!');
    console.log('📊 Notification type:', notification.type);
    console.log('📍 Group:', notification.chatId);
    console.log('👤 Participants:', notification.recipientIds);
    
    // Check if this is a participant add event
    if (notification.type === 'add') {
        try {
            const chat = await client.getChatById(notification.chatId);
            
            if (chat.isGroup) {
                console.log(`✅ New member detected in group: ${chat.name}`);
                
                // Array pesan welcome yang bervariasi
                const welcomeMessages = [
                    "Selamat datang di grup! Semoga betah dan bisa berkontribusi positif 🎉",
                    "Welcome to the group! Mari kita jaga keharmonisan dan saling membantu ✨",
                    "Halo newcomer! Jangan lupa baca aturan grup dan berkenalan ya 👋",
                    "Selamat bergabung! Grup ini tempat sharing dan belajar bersama 🚀",
                    "Welcome aboard! Mari kita ciptakan lingkungan yang positif dan produktif 🌟"
                ];
                
                // Pilih pesan secara random
                const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                
                // Format tanggal dan waktu Indonesia
                const now = new Date();
                const dateOptions = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'Asia/Jakarta'
                };
                const timeOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'Asia/Jakarta'
                };
                
                const dateStr = now.toLocaleDateString('id-ID', dateOptions);
                const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
                
                // Delay natural sebelum kirim welcome
                await naturalDelay(3000, 6000);
                
                // Kirim pesan welcome
                await chat.sendMessage(`*NEW MEMBER WELCOME* ~ ZideeBot

🎉 **Selamat Datang di ${chat.name}!**

👤 **Member Baru:** ${notification.recipientIds ? notification.recipientIds.length : 1} orang
📅 **Bergabung:** ${dateStr}
⏰ **Waktu:** ${timeStr} WIB

💬 **Pesan:**
${randomWelcome}

📋 **Tips Bergabung:**
• Baca aturan grup terlebih dahulu
• Perkenalkan diri dengan sopan
• Jaga etika dalam berkomunikasi
• Aktif berpartisipasi positif

🤖 **Bot Commands:**
Ketik "tolong" atau "menu" untuk melihat bantuan

Welcome aboard! 🚢✨`);
                
                console.log(`📤 Welcome message sent via group_update to: ${chat.name}`);
            }
        } catch (error) {
            console.error('❌ Error handling group update:', error);
        }
    }
});

// Event untuk mendeteksi notifikasi grup secara umum
client.on('group_admin_changed', async (notification) => {
    console.log('👑 GROUP ADMIN CHANGED:', notification);
});

// Event untuk debug semua notifikasi
client.on('change_state', (state) => {
    console.log('🔄 WhatsApp state changed:', state);
});

// Event tambahan untuk debugging
client.on('call', async (call) => {
    console.log('📞 Call event:', call);
});

// Event ketika ada perubahan battery
client.on('change_battery', (batteryInfo) => {
    console.log('🔋 Battery info:', batteryInfo);
});

// Fungsi untuk delay natural (simulasi typing)
async function naturalDelay(min = 1000, max = 3000) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Fungsi untuk delay berdasarkan tipe pesan
async function smartDelay(type = 'autoReply') {
    const config = DELAY_CONFIG[type] || DELAY_CONFIG.autoReply;
    return naturalDelay(config.min, config.max);
}

// ========== CALCULATOR BOT FUNCTIONS ==========
function calculateExpression(expression) {
    try {
        // Clean input
        let cleanExpression = expression.trim();
        
        // Replace common math symbols
        cleanExpression = cleanExpression.replace(/×/g, '*');
        cleanExpression = cleanExpression.replace(/÷/g, '/');
        cleanExpression = cleanExpression.replace(/\^/g, '**');
        
        // Handle square root
        cleanExpression = cleanExpression.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
        
        // Handle trigonometric functions (convert degrees to radians)
        cleanExpression = cleanExpression.replace(/sin\(([^)]+)\)/g, 'Math.sin($1 * Math.PI / 180)');
        cleanExpression = cleanExpression.replace(/cos\(([^)]+)\)/g, 'Math.cos($1 * Math.PI / 180)');
        cleanExpression = cleanExpression.replace(/tan\(([^)]+)\)/g, 'Math.tan($1 * Math.PI / 180)');
        
        // Handle logarithms
        cleanExpression = cleanExpression.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
        cleanExpression = cleanExpression.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
        
        // Handle pi and e
        cleanExpression = cleanExpression.replace(/pi/g, 'Math.PI');
        cleanExpression = cleanExpression.replace(/e/g, 'Math.E');
        
        // Validate expression (basic security check)
        if (!/^[0-9+\-*/().\s\*\*Math.sincostandlogsqrtPIE,]+$/.test(cleanExpression)) {
            return '❌ Error: Karakter tidak valid dalam rumus';
        }
        
        // Calculate result
        const result = eval(cleanExpression);
        
        if (isNaN(result)) {
            return '❌ Error: Hasil tidak valid';
        }
        
        if (!isFinite(result)) {
            return '❌ Error: Hasil tidak terbatas';
        }
        
        // Format result
        return Number(result.toFixed(10)).toString();
        
    } catch (error) {
        return '❌ Error: Rumus tidak valid atau tidak dapat dihitung';
    }
}

// Fungsi untuk menangani pesan masuk
async function handleMessage(message) {
    const messageBody = message.body.toLowerCase();
    const sender = message.from;
    
    // Ambil kata pertama saja untuk command detection
    const firstWord = messageBody.trim().split(' ')[0];
    
    // Debug log untuk semua pesan
    console.log(`📨 Processing message: "${messageBody}" from ${sender}`);
    console.log(`🔤 First word only: "${firstWord}"`);
    console.log(`📍 Is Group: ${message.from.includes('@g.us')}`);
    console.log(`📋 Message type: ${message.type}`);
    console.log(`📋 Has media: ${message.hasMedia}`);
    console.log(`📋 Message body: "${message.body}"`);
    
    // Deteksi pesan sistem untuk member baru (metode alternatif)
    if (message.from.includes('@g.us') && message.type === 'notification') {
        console.log('🔔 NOTIFICATION MESSAGE DETECTED!');
        console.log('📋 Notification body:', message.body);
        
        // Cek apakah ini notifikasi member baru
        if (message.body.includes('added') || 
            message.body.includes('joined') || 
            message.body.includes('bergabung') || 
            message.body.includes('masuk') ||
            message.body.includes('ditambahkan')) {
            
            console.log('🎉 NEW MEMBER NOTIFICATION DETECTED!');
            
            try {
                const chat = await message.getChat();
                
                if (chat.isGroup) {
                    console.log(`✅ Sending welcome via notification detection: ${chat.name}`);
                    
                    // Array pesan welcome yang bervariasi
                    const welcomeMessages = [
                        "Selamat datang di grup! Semoga betah dan bisa berkontribusi positif 🎉",
                        "Welcome to the group! Mari kita jaga keharmonisan dan saling membantu ✨",
                        "Halo newcomer! Jangan lupa baca aturan grup dan berkenalan ya 👋",
                        "Selamat bergabung! Grup ini tempat sharing dan belajar bersama 🚀",
                        "Welcome aboard! Mari kita ciptakan lingkungan yang positif dan produktif 🌟"
                    ];
                    
                    // Pilih pesan secara random
                    const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                    
                    // Format tanggal dan waktu Indonesia
                    const now = new Date();
                    const dateOptions = { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        timeZone: 'Asia/Jakarta'
                    };
                    const timeOptions = {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'Asia/Jakarta'
                    };
                    
                    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
                    const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
                    
                    // Delay natural sebelum kirim welcome
                    await naturalDelay(3000, 5000);
                    
                    // Kirim pesan welcome
                    await message.reply(`*NEW MEMBER WELCOME* ~ ZideeBot

🎉 **Selamat Datang di ${chat.name}!**

👤 **Welcome to our community!**
📅 **Bergabung:** ${dateStr}
⏰ **Waktu:** ${timeStr} WIB

💬 **Pesan:**
${randomWelcome}

📋 **Tips Bergabung:**
• Baca aturan grup terlebih dahulu
• Perkenalkan diri dengan sopan
• Jaga etika dalam berkomunikasi
• Aktif berpartisipasi positif

🤖 **Bot Commands:**
Ketik "tolong" atau "menu" untuk melihat bantuan

Welcome aboard! 🚢✨`);
                    
                    console.log(`📤 Welcome message sent via notification detection to: ${chat.name}`);
                }
            } catch (error) {
                console.error('❌ Error sending welcome via notification:', error);
            }
            
            // Return early untuk tidak memproses pesan sistem lebih lanjut
            return;
        }
    }
    
    try {
        // Command: tolong (hanya kata pertama)
        if (firstWord === 'tolong' || firstWord === 'bantuan' || firstWord === 'menu') {
            await smartDelay('command');
            await message.reply(`
🤖 *Bot WhatsApp Help*

Kata kunci yang tersedia:
• tolong / bantuan / menu - Tampilkan menu bantuan
• waktu / jam - Tampilkan waktu sekarang
• info / tentang - Informasi tentang bot
• ping / test - Test koneksi bot
• echo [text] - Bot akan mengulangi teks Anda

🧮 **Calculator Bot:**
• kalkulator - Menu kalkulator
• hitung [rumus] - Hitung matematika
• calc [rumus] - Sama dengan hitung

🌤️ **Weather Bot:**
• cuaca [kota] - Info cuaca real-time
• prakiraan [kota] - Prakiraan 6 jam
• weather [city] - English version

🎥 **YouTube Downloader:**
• ytmp4 [link] - Download video YouTube
• ytmp3 [link] - Download audio YouTube
• ytinfo [link] - Info video YouTube
• yt [link] - Singkatan ytmp4

❓ **FAQ Bot:**
• faq - Daftar pertanyaan umum
• jam buka, alamat, harga, kontak, owner, dll

🤖 **AI Bot (Gemini):**
• ai [pertanyaan] - Chat dengan AI
• pantun [tema] - Buat pantun lucu
• motivasi [tema] - Kata-kata motivasi
• terjemah [text] - Terjemahan bahasa
• tips [topik] - Tips praktis

👥 **Group Management:**
• open / op - Buka grup (admin only)
• close / cl - Tutup grup (admin only)
• kick - Kick member (admin only)
• welcome - Test welcome message (testing only)

**Contoh penggunaan:**
• echo Halo dunia
• hitung 5 + 3 * 2
• cuaca Jakarta
• prakiraan Bandung
• ytmp4 https://youtu.be/dQw4w9WgXcQ
• ytmp3 https://youtu.be/dQw4w9WgXcQ
• ai siapa kamu?
• pantun programming
• motivasi belajar
• terjemah hello world
• faq
• group - Menu grup management
            `);
        }
        
        // Command: waktu/jam (hanya kata pertama)
        else if (firstWord === 'waktu' || firstWord === 'jam' || firstWord === 'time') {
            await smartDelay('command');
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            await message.reply(`🕐 Waktu sekarang: ${currentTime}`);
        }
        
        // Command: info/tentang (hanya kata pertama)
        else if (firstWord === 'info' || firstWord === 'tentang' || firstWord === 'about') {
            await smartDelay('command');
            await message.reply(`
🤖 *Informasi Bot*

• Nama: WhatsApp Bot
• Versi: 1.0.0
• Status: Online ✅
• Framework: whatsapp-web.js
            `);
        }
        
        // Command: ping/test (hanya kata pertama)
        else if (firstWord === 'ping' || firstWord === 'test' || firstWord === 'tes') {
            await smartDelay('autoReply');
            
            // Add group debug info
            if (message.from.includes('@g.us')) {
                const chat = await message.getChat();
                await message.reply(`🏓 Pong! Bot sedang online.
                
📍 Lokasi: Grup "${chat.name}"
🆔 Chat ID: ${message.from}
👤 Dari: ${(await message.getContact()).pushname || 'Unknown'}
🤖 Bot Status: Online ✅`);
            } else {
                await message.reply('🏓 Pong! Bot sedang online.');
            }
        }
        
        // Command: echo (tetap perlu messageBody untuk mengambil teks lengkap)
        else if (firstWord === 'echo') {
            await smartDelay('autoReply');
            const textToEcho = message.body.substring(5); // Ambil text setelah "echo "
            await message.reply(`🔄 Echo: ${textToEcho}`);
        }
        
        // ========== CALCULATOR BOT ==========
        // Command: hitung/calc (tetap perlu messageBody untuk mengambil rumus)
        else if (firstWord === 'hitung' || firstWord === 'calc') {
            await smartDelay('command');
            const expression = firstWord === 'hitung' ? 
                message.body.substring(7) : message.body.substring(5);
            
            const result = calculateExpression(expression);
            await message.reply(`🧮 **Kalkulator**\n\n${expression} = **${result}**`);
        }
        
        // Command: kalkulator menu (hanya kata pertama)
        else if (firstWord === 'kalkulator') {
            await smartDelay('command');
            await message.reply(`
🧮 **Kalkulator Bot**

Cara penggunaan:
• hitung 2 + 3
• calc 10 * 5
• hitung 100 / 4
• calc 2^3 (pangkat)
• hitung sqrt(16) (akar kuadrat)
• calc sin(90) (trigonometri)

Operasi yang didukung:
➕ Penjumlahan (+)
➖ Pengurangan (-)
✖️ Perkalian (*)
➗ Pembagian (/)
🔢 Pangkat (^)
√ Akar kuadrat (sqrt)
📐 Trigonometri (sin, cos, tan)
📊 Logaritma (log, ln)

Contoh: hitung 5 + 3 * 2
            `);
        }
        
        // ========== WEATHER BOT ==========
        // Command: cuaca (tetap perlu messageBody untuk mengambil nama kota)
        else if (firstWord === 'cuaca' || firstWord === 'weather') {
            if (messageBody.includes(' ')) {
                await smartDelay('command');
                const city = firstWord === 'cuaca' ? 
                    message.body.substring(6) : message.body.substring(8);
                
                const weatherInfo = await getOpenMeteoWeather(city);
                await message.reply(weatherInfo);
            } else {
                // Jika hanya kata "cuaca" atau "weather" tanpa nama kota
                await smartDelay('command');
                await message.reply(`
🌤️ **Weather Bot - Open-Meteo API**

**Cara penggunaan:**
• cuaca [kota] - Info cuaca real-time
• weather [city] - English version
• prakiraan [kota] - Prakiraan 6 jam

**Fitur Real-time:**
🌡️ Suhu saat ini & terasa seperti
💧 Kelembaban udara
💨 Kecepatan & arah angin
🌧️ Curah hujan
☁️ Kondisi cuaca detail
🌅 Waktu sunrise/sunset

**Kota Popular:**
🇮🇩 Jakarta, Bandung, Surabaya, Bali
🌍 Singapore, Tokyo, London, New York

**Contoh:**
• cuaca Jakarta
• weather Singapore
• prakiraan Bandung

💡 **100% Gratis & Real-time!**
Powered by Open-Meteo API

Contoh: cuaca Surabaya
                `);
            }
        }
        
        // Command: prakiraan cuaca (tetap perlu messageBody untuk mengambil nama kota)
        else if (firstWord === 'prakiraan') {
            await smartDelay('command');
            const city = message.body.substring(10);
            
            const forecastInfo = await getWeatherForecast(city);
            await message.reply(forecastInfo);
        }
        
        // ========== YOUTUBE DOWNLOADER ==========
        // Command: ytmp4 (tetap perlu messageBody untuk mengambil URL)
        else if (firstWord === 'ytmp4' || firstWord === 'yt') {
            await smartDelay('command');
            const url = firstWord === 'ytmp4' ? 
                message.body.substring(6) : message.body.substring(3);
            
            console.log(`🎥 YouTube MP4 download request: ${url}`);
            
            try {
                // Check if YouTube downloader module is available
                const { downloadYouTubeVideo, isValidYouTubeUrl } = require('./youtube-working');
                
                // Validasi URL
                if (!isValidYouTubeUrl(url.trim())) {
                    await message.reply(`❌ **URL YouTube Tidak Valid**

📝 **Format yang benar:**
• https://youtube.com/watch?v=VIDEO_ID
• https://youtu.be/VIDEO_ID
• https://m.youtube.com/watch?v=VIDEO_ID

🔗 **Contoh:**
ytmp4 https://youtu.be/dQw4w9WgXcQ

💡 Pastikan URL YouTube lengkap dan benar!`);
                    return;
                }

                // Send loading message
                await message.reply(`🎥 **YouTube MP4 Downloader (Y2mate)**

⏳ Memproses video...
📹 URL: ${url}

⚡ Menggunakan Y2mate API untuk download stabil...
⏱️ Mohon tunggu sebentar.

💡 **Info:**
• Video maksimal 10 menit
• Ukuran file maksimal 25MB
• Format: MP4 (WhatsApp compatible)`);

                // Download video MP4
                const result = await downloadYouTubeVideo(url, { format: 'mp4' });
                
                if (result.success) {
                    console.log(`✅ Download success: ${result.filename}`);
                    
                    await message.reply(`✅ **Download MP4 Selesai!**

📹 **${result.title}**
👤 Channel: ${result.author}
⏱️ Durasi: ${result.duration}
📊 Ukuran: ${result.fileSize} MB
🎬 Kualitas: ${result.quality}

📤 Mengirim video...`);

                    // Send video file
                    const media = require('whatsapp-web.js').MessageMedia.fromFilePath(result.filepath);
                    await message.reply(media, undefined, { 
                        caption: `🎥 **${result.title}**\n\n👤 ${result.author}\n⏱️ ${result.duration}\n🎬 ${result.quality}\n\n📥 Downloaded by ZideeBot` 
                    });
                    
                    console.log(`📤 Video sent successfully to ${message.from}`);
                    
                    // Cleanup file after sending
                    setTimeout(() => {
                        require('./youtube-working').cleanupFile(result.filepath);
                    }, 5000);
                } else {
                    await message.reply(`❌ **Download Gagal**

🔧 Terjadi kesalahan saat mendownload video.

💡 **Coba:**
• Pastikan URL YouTube valid
• Pilih video yang lebih pendek
• Cek koneksi internet
• Coba lagi dalam beberapa saat`);
                }
                
            } catch (moduleError) {
                console.error('❌ YouTube module error:', moduleError);
                
                if (moduleError.message.includes('Cannot find module')) {
                    await message.reply(`❌ **Module Tidak Tersedia**

🔧 **YouTube Downloader belum diinstall!**

📋 **Langkah setup:**
1. Stop bot
2. Jalankan: npm install ytdl-core@4.11.5
3. Restart bot
4. Coba lagi

💡 Atau jalankan: ./setup-youtube.bat

🤖 Hubungi admin jika masalah berlanjut.`);
                } else {
                    await message.reply(`❌ **Error Download**

${moduleError.message}

💡 **Solusi:**
• Cek URL YouTube
• Pilih video lebih pendek (<10 menit)
• Pastikan video tidak private/restricted
• Coba lagi dalam beberapa saat

🔧 Jika terus error, restart bot dan coba lagi.`);
                }
            }
        }
        
        // Command: ytmp3 (tetap perlu messageBody untuk mengambil URL)
        else if (firstWord === 'ytmp3') {
            await smartDelay('command');
            const url = message.body.substring(6);
            
            console.log(`🎵 YouTube MP3 download request: ${url}`);
            
            try {
                const { downloadYouTubeVideo, isValidYouTubeUrl } = require('./youtube-working');
                
                // Validasi URL
                if (!isValidYouTubeUrl(url.trim())) {
                    await message.reply(`❌ **URL YouTube Tidak Valid**

📝 **Format yang benar:**
• https://youtube.com/watch?v=VIDEO_ID
• https://youtu.be/VIDEO_ID
• https://m.youtube.com/watch?v=VIDEO_ID

🔗 **Contoh:**
ytmp3 https://youtu.be/dQw4w9WgXcQ

💡 Pastikan URL YouTube lengkap dan benar!`);
                    return;
                }

                // Send loading message
                await message.reply(`🎵 **YouTube MP3 Downloader (Y2mate)**

⏳ Memproses audio...
📹 URL: ${url}

⚡ Menggunakan Y2mate API untuk download audio berkualitas...
⏱️ Mohon tunggu sebentar.

💡 **Info:**
• Audio maksimal 10 menit
• Ukuran file maksimal 25MB
• Format: MP3 (High Quality)`);

                // Download audio MP3
                const result = await downloadYouTubeVideo(url, { format: 'mp3' });
                
                if (result.success) {
                    // Actual download successful
                    console.log(`✅ MP3 Download success: ${result.filename}`);
                    
                    await message.reply(`✅ **Download MP3 Selesai!**

🎵 **${result.title}**
👤 Channel: ${result.author}
⏱️ Durasi: ${result.duration}
📊 Ukuran: ${result.fileSize} MB
🎧 Kualitas: ${result.quality}

📤 Mengirim audio...`);

                    // Send audio file
                    const media = require('whatsapp-web.js').MessageMedia.fromFilePath(result.filepath);
                    await message.reply(media, undefined, { 
                        caption: `🎵 **${result.title}**\n\n👤 ${result.author}\n⏱️ ${result.duration}\n🎧 ${result.quality}\n\n📥 Downloaded by ZideeBot via Y2mate` 
                    });
                    
                    console.log(`📤 Audio sent successfully to ${message.from}`);
                    
                    // Cleanup file after sending
                    setTimeout(() => {
                        require('./youtube-working').cleanupFile(result.filepath);
                        }, 5000);
                } else {
                    await message.reply(`❌ **Download MP3 Gagal**

🔧 Terjadi kesalahan saat mendownload audio.

💡 **Coba:**
• Pastikan URL YouTube valid
• Pilih video yang lebih pendek
• Cek koneksi internet
• Coba lagi dalam beberapa saat`);
                }
                
            } catch (error) {
                console.error('❌ YouTube MP3 error:', error);
                await message.reply(`❌ **Error Download MP3**

${error.message}

💡 **Solusi:**
• Cek URL YouTube
• Pilih video lebih pendek (<10 menit)
• Pastikan video tidak private/restricted
• Coba lagi dalam beberapa saat

🔧 Jika terus error, restart bot dan coba lagi.`);
            }
        }
        
        // Command: ytinfo (tetap perlu messageBody untuk mengambil URL)
        else if (firstWord === 'ytinfo') {
            await smartDelay('command');
            const url = message.body.substring(7);
            
            try {
                const { getVideoInfo, isValidYouTubeUrl } = require('./youtube-working');
                
                if (!isValidYouTubeUrl(url.trim())) {
                    await message.reply(`❌ **URL YouTube Tidak Valid**

📝 **Format yang benar:**
• https://youtube.com/watch?v=VIDEO_ID
• https://youtu.be/VIDEO_ID

🔗 **Contoh:**
ytinfo https://youtu.be/dQw4w9WgXcQ`);
                    return;
                }

                await message.reply('🔍 Mengambil informasi video...');
                
                const videoInfo = await getVideoInfo(url);
                
                const durationMinutes = Math.floor(videoInfo.duration / 60);
                const durationSeconds = videoInfo.duration % 60;
                const views = parseInt(videoInfo.viewCount).toLocaleString();
                
                await message.reply(`📹 **Informasi Video YouTube**

🎬 **Judul:** ${videoInfo.title}
👤 **Channel:** ${videoInfo.author}
⏱️ **Durasi:** ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}
👀 **Views:** ${views}
📅 **Upload:** ${new Date(videoInfo.uploadDate).toLocaleDateString('id-ID')}

📝 **Deskripsi:**
${videoInfo.description}

💡 **Untuk download:** 
ytmp4 ${url}`);
                
            } catch (error) {
                console.error('❌ YouTube info error:', error);
                await message.reply(`❌ **Error Info Video**

${error.message}

💡 Pastikan URL YouTube valid dan video bisa diakses.`);
            }
        }
        
        // Command: youtube menu (hanya kata pertama)
        else if (firstWord === 'youtube') {
            await smartDelay('command');
            await message.reply(`
🎥 **YouTube Downloader Bot (Y2mate)**

**Cara penggunaan:**
• ytmp4 [URL] - Download video YouTube
• ytmp3 [URL] - Download audio YouTube
• yt [URL] - Singkatan ytmp4
• ytinfo [URL] - Info video saja

**Fitur:**
📱 Compatible dengan WhatsApp
⚡ Download cepat via Y2mate API
🎬 Video quality optimal untuk mobile
🎵 Audio quality tinggi MP3
🗂️ Auto cleanup setelah kirim

**Batasan:**
⏱️ Maksimal 10 menit durasi
📊 Maksimal 25MB ukuran file
🔒 Video public/tidak private

**Format URL yang didukung:**
• https://youtube.com/watch?v=VIDEO_ID
• https://youtu.be/VIDEO_ID
• https://m.youtube.com/watch?v=VIDEO_ID

**Contoh penggunaan:**
ytmp4 https://youtu.be/dQw4w9WgXcQ
ytmp3 https://youtu.be/dQw4w9WgXcQ
ytinfo https://youtu.be/dQw4w9WgXcQ

⚠️ **Penting:**
• Proses download 1-5 menit
• Gunakan dengan bijak
• Respect copyright

💡 **Tips:**
• Video pendek = download lebih cepat
• Hindari video HD untuk ukuran kecil
• Sabar menunggu proses selesai

🤖 Powered by ZideeBot
            `);
        }
        
        // ========== AI BOT (GEMINI) ==========
        // Command: ai (tetap perlu messageBody untuk mengambil pertanyaan)
        else if (firstWord === 'ai') {
            await smartDelay('command');
            const userQuestion = message.body.substring(3);
            
            const aiResponse = await chatWithGemini(userQuestion);
            await message.reply(aiResponse);
        }
        
        // Command: pantun (tetap perlu messageBody untuk mengambil tema)
        else if (firstWord === 'pantun') {
            await smartDelay('command');
            const topic = message.body.substring(7);
            
            const pantunResponse = await generateCreative(topic, 'pantun');
            await message.reply(`🎭 **Pantun tentang ${topic}:**\n\n${pantunResponse}`);
        }
        
        // Command: motivasi (tetap perlu messageBody untuk mengambil tema)
        else if (firstWord === 'motivasi') {
            await smartDelay('command');
            const topic = message.body.substring(9);
            
            const motivasiResponse = await generateCreative(topic, 'motivasi');
            await message.reply(`💪 **Motivasi untuk ${topic}:**\n\n${motivasiResponse}`);
        }
        
        // Command: terjemah (tetap perlu messageBody untuk mengambil text)
        else if (firstWord === 'terjemah') {
            await smartDelay('command');
            const textToTranslate = message.body.substring(9);
            
            const translateResponse = await translateText(textToTranslate, 'english');
            await message.reply(`🌐 **Terjemahan:**\n\n${translateResponse}`);
        }
        
        // Command: tips (tetap perlu messageBody untuk mengambil topik)
        else if (firstWord === 'tips') {
            await smartDelay('command');
            const topic = message.body.substring(5);
            
            const tipsResponse = await generateCreative(topic, 'tips');
            await message.reply(`💡 **Tips tentang ${topic}:**\n\n${tipsResponse}`);
        }
        
        // Command: AI menu (hanya kata pertama)
        else if (firstWord === 'gemini') {
            await smartDelay('command');
            await message.reply(`
🤖 **Zidee AI Assistant**

**Cara penggunaan:**
• ai [pertanyaan] - Chat dengan AI
• pantun [tema] - Buat pantun lucu
• motivasi [tema] - Kata motivasi
• terjemah [text] - Terjemahan
• tips [topik] - Tips praktis

**Fitur AI:**
💬 Percakapan natural dalam bahasa Indonesia
🎭 Kreativitas pantun dan puisi
💪 Motivasi dan inspirasi
🌐 Terjemahan multi-bahasa
💡 Tips dan saran praktis
🧠 Pengetahuan umum

**Contoh penggunaan:**
• ai Jelaskan tentang AI
• pantun programming
• motivasi belajar
• terjemah hello world
• tips belajar efektif

⚡ **Respon cepat & akurat!**

Contoh: ai Apa itu teknologi blockchain?
            `);
        }
        
        // ========== FAQ BOT ==========
        // FAQ responses (gunakan firstWord untuk yang spesifik, includes untuk yang fleksibel)
        
        // Single word commands - gunakan firstWord
        else if (firstWord === 'alamat' || firstWord === 'lokasi' || firstWord === 'address') {
            await smartDelay('autoReply');
            await message.reply('📍 **Alamat Kami:**\n\nJl. Contoh No. 123\nJakarta Selatan 12345\nIndonesia\n\n🚗 Dekat dengan stasiun MRT\n🅿️ Parkir tersedia');
        }
        
        else if (firstWord === 'harga' || firstWord === 'price' || firstWord === 'tarif') {
            await smartDelay('autoReply');
            await message.reply('💰 **Informasi Harga:**\n\nPaket Basic: Rp 100.000\nPaket Standard: Rp 250.000\nPaket Premium: Rp 500.000\n\n🎉 Promo bulan ini: Diskon 20%!\n📞 Hubungi CS untuk detail lengkap');
        }
        
        else if (firstWord === 'kontak' || firstWord === 'contact' || firstWord === 'hubungi') {
            await smartDelay('autoReply');
            await message.reply('📞 **Kontak Kami:**\n\nCustomer Service: 0800-1234-5678\nWhatsApp: 0812-3456-7890\nEmail: info@example.com\n\n💬 Atau chat langsung di sini!\n⏰ Respon dalam 1x24 jam');
        }
        
        else if (firstWord === 'pembayaran' || firstWord === 'payment' || firstWord === 'bayar') {
            await smartDelay('autoReply');
            await message.reply('💳 **Metode Pembayaran:**\n\n🏦 Transfer Bank:\n• BCA: 1234567890\n• Mandiri: 1234567890\n• BNI: 1234567890\n\n📱 E-Wallet:\n• OVO: 0812-3456-7890\n• GoPay: 0812-3456-7890\n• DANA: 0812-3456-7890\n\n💡 Konfirmasi pembayaran ke CS');
        }
        
        else if (firstWord === 'promo' || firstWord === 'diskon' || firstWord === 'discount') {
            await smartDelay('autoReply');
            await message.reply('🎉 **Promo Bulan Ini:**\n\n⚡ Flash Sale: 30% OFF\n🎊 Promo Member Baru: 20% OFF\n💎 Paket Premium: Gratis konsultasi\n🔥 Bundle Deal: Beli 2 Gratis 1\n\n📅 Berlaku sampai akhir bulan\n🏃‍♂️ Buruan, slot terbatas!');
        }
        
        else if (firstWord === 'order' || firstWord === 'pesan') {
            await smartDelay('autoReply');
            await message.reply('🛒 **Cara Order:**\n\n1️⃣ Pilih paket yang diinginkan\n2️⃣ Isi form pemesanan\n3️⃣ Lakukan pembayaran\n4️⃣ Kirim bukti transfer\n5️⃣ Pesanan diproses\n\n📝 Ketik "order" untuk mulai pemesanan');
        }
        
        // Multi-word phrases - tetap gunakan includes untuk fleksibilitas
        else if (messageBody.includes('jam buka') || messageBody.includes('open hours')) {
            await smartDelay('autoReply');
            await message.reply('� **Jam Buka Layanan:**\n\nSenin - Jumat: 08:00 - 17:00 WIB\nSabtu: 08:00 - 12:00 WIB\nMinggu: Libur\n\n� Untuk emergency: 24/7');
        }
        
        else if (messageBody.includes('cara order') || messageBody.includes('how to order')) {
            await smartDelay('autoReply');
            await message.reply('🛒 **Cara Order:**\n\n1️⃣ Pilih paket yang diinginkan\n2️⃣ Isi form pemesanan\n3️⃣ Lakukan pembayaran\n4️⃣ Kirim bukti transfer\n5️⃣ Pesanan diproses\n\n� Ketik "order" untuk mulai pemesanan');
        }
        
        else if (firstWord === 'owner') {
            await smartDelay('autoReply');
            await message.reply(`👤 **Kontak Owner**

📱 **WhatsApp Owner:**
wa.me/6282311727134

📞 **Nomor Langsung:**
+62 823-1172-7134

💬 **Untuk:**
• Pertanyaan khusus
• Kerjasama bisnis  
• Saran & masukan
• Keluhan layanan
• Partnership

⏰ **Jam Operasional Owner:**
Senin - Sabtu: 09:00 - 21:00 WIB
Minggu: 10:00 - 18:00 WIB

💡 Silakan hubungi langsung untuk urusan penting!`);
        }
        
        // Command: faq menu (hanya kata pertama)
        else if (firstWord === 'faq' || firstWord === 'pertanyaan') {
            await smartDelay('command');
            await message.reply(`
❓ **FAQ - Pertanyaan Umum**

Ketik salah satu kata kunci:
• jam buka - Info jam operasional
• alamat - Lokasi kantor
• harga - Daftar harga layanan
• kontak - Informasi kontak
• owner - Kontak owner langsung
• cara order - Panduan pemesanan
• pembayaran - Metode pembayaran
• promo - Promo terbaru

💡 Atau langsung tanya apa yang ingin Anda ketahui!
            `);
        }
        
        // Command: group menu (hanya kata pertama)
        else if (firstWord === 'group' || firstWord === 'grup') {
            await smartDelay('command');
            await message.reply(`
👥 **Group Management Commands**

**🔑 Admin Only Commands:**

**📂 Grup Settings:**
• \`open\` atau \`op\` - Buka grup (semua bisa chat)
• \`close\` atau \`cl\` - Tutup grup (admin only chat)

**👤 Member Management:**
• \`kick\` - Kick member dari grup
• \`welcome\` - Test welcome message (manual)

**🎉 Auto Welcome:**
• Bot otomatis welcome member baru
• Pesan welcome bervariasi dan random
• Terdeteksi saat ada yang join via link/invite

**📋 Cara menggunakan kick:**

**Method 1 - Reply pesan:**
1. Reply pesan dari user yang ingin di-kick
2. Tulis "kick"

**Method 2 - Mention nomor:**
• \`kick @628123456789\`
• \`kick 628123456789\`
• \`kick +628123456789\`
• \`kick 08123456789\`

**⚠️ Syarat & Ketentuan:**
• Hanya admin grup yang bisa menggunakan
• Bot harus dijadikan admin grup
• Tidak bisa kick admin lain
• Bot tidak akan kick dirinya sendiri

**🛡️ Permission Required:**
👑 Admin status untuk command sender
🤖 Bot admin status untuk execute

**💡 Tips:**
• Gunakan \`debug\` untuk cek status
• Pastikan bot punya izin yang cukup
• Kick hanya untuk member biasa

**🔧 Troubleshooting:**
• Jika gagal: cek permission bot
• Jika error: restart bot dengan \`debug\`

**Contoh penggunaan:**
\`kick @628123456789\`
            `);
        }
        
        // Command: debug group (for testing)
        else if (firstWord === 'debug' || firstWord === 'debuggroup') {
            console.log(`🔍 Debug command received from: ${message.from}`);
            
            if (message.from.includes('@g.us')) {
                const chat = await message.getChat();
                const contact = await message.getContact();
                
                // Get more detailed group information
                const participants = await chat.participants;
                const botNumber = client.info.wid.user;
                const isAdmin = participants.some(p => p.id.user === botNumber && p.isAdmin);
                
                console.log(`🔍 Group Debug Details:`);
                console.log(`- Group ID: ${message.from}`);
                console.log(`- Group Name: ${chat.name}`);
                console.log(`- Is Group: ${chat.isGroup}`);
                console.log(`- Bot Number: ${botNumber}`);
                console.log(`- Bot is Admin: ${isAdmin}`);
                console.log(`- Participants Count: ${participants.length}`);
                
                await message.reply(`🐛 **Detailed Debug Info**

📍 **Chat Info:**
• Type: ${chat.isGroup ? 'Group ✅' : 'Private ❌'}
• ID: ${message.from}
• Name: ${chat.name || 'N/A'}
• Admin Only Messages: ${chat.groupMetadata?.restrict || 'N/A'}

👤 **User Info:**
• Name: ${contact.pushname || contact.name || 'Unknown'}
• Number: ${contact.number || 'Unknown'}

🤖 **Bot Status:**
• Can reply: ✅
• In group: ${message.from.includes('@g.us') ? '✅' : '❌'}
• Group object: ${chat.isGroup ? '✅' : '❌'}
• Bot is Admin: ${isAdmin ? '✅' : '❌'}
• Participants: ${participants.length}

💡 **Next Steps:**
${!isAdmin ? '⚠️ Bot perlu dijadikan ADMIN dulu!' : '✅ Bot sudah admin, coba: open atau close'}

**Test Commands:**
• open - Buka grup
• close - Tutup grup
• op - Singkatan open
• cl - Singkatan close
• welcome - Test welcome message
• debugwelcome - Test welcome events`);
            } else {
                await message.reply(`🐛 **Debug Info - Private Chat**

📍 This is a private chat, not a group
🤖 Bot is working fine
💡 Group commands only work in groups

⚠️ **Important:**
Perintah open/close HANYA bekerja di grup!
Silakan coba di grup, bukan chat pribadi.

📝 **Cara Test di Grup:**
1. Tambahkan bot ke grup
2. Jadikan bot sebagai admin
3. Kirim 'debug' di grup
4. Lalu coba 'open' atau 'close'`);
            }
        }
        
        // Command: debug welcome events (hanya kata pertama)
        else if (firstWord === 'debugwelcome' || firstWord === 'testwelcome') {
            console.log(`🎉 DEBUG WELCOME COMMAND RECEIVED!`);
            
            if (!message.from.includes('@g.us')) {
                await message.reply(`⚠️ **Perintah Grup**

🚫 Debug welcome hanya bisa di grup!`);
                return;
            }
            
            try {
                const chat = await message.getChat();
                
                await message.reply(`🐛 **Welcome Event Debug Info**

🎉 **Testing Welcome System**

📋 **Detected Events:**
• group_join ✅ (listening)
• group_update ✅ (listening) 
• message notifications ✅ (listening)

🔍 **Event Detection Methods:**
1. **group_join event** - Primary method
2. **group_update event** - Secondary method  
3. **notification messages** - Fallback method

🧪 **Manual Test:**
• Ketik "welcome" untuk simulasi
• Add member baru ke grup untuk test real
• Bot akan log semua events ke console

⚡ **Status:** All welcome event listeners active!

💡 **Untuk test real:**
1. Add/invite member baru ke grup
2. Check console log bot
3. Welcome message akan muncul otomatis

🔄 **Bot sudah siap detect member baru!**`);
                
                console.log(`🐛 Welcome debug info sent to group: ${chat.name}`);
                
            } catch (error) {
                console.error('❌ Error in welcome debug:', error);
                await message.reply(`❌ Error: ${error.message}`);
            }
        }
        
        // ========== GROUP MANAGEMENT ==========
        // Command: open group (hanya kata pertama)
        else if (firstWord === 'open' || firstWord === 'op') {
            console.log(`🔍 OPEN COMMAND RECEIVED!`);
            console.log(`📍 Message from: ${message.from}`);
            console.log(`🏢 Contains @g.us: ${message.from.includes('@g.us')}`);
            console.log(`🔢 Message ID: ${message.id._serialized}`);
            console.log(`👤 From user: ${message.author || message.from}`);
            
            // First check: Is this from a group?
            if (!message.from.includes('@g.us')) {
                console.log('❌ REJECT: Command sent from private chat, not group');
                await message.reply(`⚠️ **Perintah Grup**

🚫 Perintah "open" hanya bisa digunakan di GRUP!

📱 Cara menggunakan:
1. Tambahkan bot ke grup
2. Jadikan bot sebagai admin
3. Kirim perintah "open" di grup (bukan chat pribadi)

💡 Saat ini Anda kirim dari chat pribadi.
🆔 Chat ID: ${message.from}`);
                return;
            }
            
            console.log('✅ GROUP CHECK PASSED - Getting chat object...');
            
            try {
                const chat = await message.getChat();
                const contact = await message.getContact();
                
                console.log(`👥 Group name: ${chat.name}`);
                console.log(`👤 User: ${contact.pushname || 'Unknown'}`);
                console.log(`🔒 Is Group object: ${chat.isGroup}`);
                console.log(`📊 Group metadata available: ${!!chat.groupMetadata}`);
                
                if (chat.isGroup) {
                    console.log('✅ GROUP OBJECT CONFIRMED');
                    
                    // Check if bot is admin
                    try {
                        const participants = await chat.participants;
                        const botNumber = client.info.wid.user;
                        const isAdmin = participants.some(p => p.id.user === botNumber && p.isAdmin);
                        
                        console.log(`🤖 Bot number: ${botNumber}`);
                        console.log(`👥 Participants count: ${participants.length}`);
                        console.log(`� Bot is admin: ${isAdmin}`);
                        
                        if (!isAdmin) {
                            console.log('❌ REJECT: Bot is not admin');
                            await message.reply(`❌ **Bot Belum Admin**

🔑 Bot perlu dijadikan admin untuk mengubah pengaturan grup

📝 **Cara menjadikan bot admin:**
1. Buka info grup
2. Tap "Edit"
3. Tap "Add participant"
4. Pilih bot dari daftar
5. Tap icon admin (👑) di samping nama bot
6. Coba lagi perintah "open"

🤖 Bot saat ini: Member biasa
👑 Diperlukan: Admin dengan izin edit grup`);
                            return;
                        }
                        
                        console.log('🔄 ATTEMPTING TO OPEN GROUP...');
                        await chat.setMessagesAdminsOnly(false);
                        console.log('✅ GROUP OPENED SUCCESSFULLY');
                        
                        await smartDelay('groupManagement');
                        
                        // Format tanggal dan waktu Indonesia
                        const now = new Date();
                        const dateOptions = { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Asia/Jakarta'
                        };
                        const timeOptions = {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Jakarta'
                        };
                        
                        const dateStr = now.toLocaleDateString('id-ID', dateOptions);
                        const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
                        
                        await message.reply(`*GROUP OPEN* ~ ZideeBot

Group *${chat.name}* Telah Di Buka Oleh @${contact.pushname || contact.name || 'Admin'}

📆 ${dateStr}
⏰ ${timeStr} WIB

بِسْــــــــــــــــــمِ اللهِ الرَّحْمَنِ الرَّحِيْمِ

Open guys, jangan lupa awali hari dengan senyuman semoga dilancarkan urusan ✨`);
                        
                        console.log(`📖 SUCCESS: Group "${chat.name}" opened by ${contact.pushname}`);
                        
                    } catch (permissionError) {
                        console.error('❌ PERMISSION ERROR:', permissionError);
                        await message.reply(`❌ **Gagal Membuka Grup**

🔑 Bot tidak memiliki izin yang cukup

� **Troubleshooting:**
1. Pastikan bot adalah admin
2. Berikan izin "Edit group info"
3. Restart bot jika perlu
4. Coba lagi

⚠️ Error: ${permissionError.message || 'Unknown error'}`);
                    }
                } else {
                    console.log('❌ REJECT: Not recognized as group object');
                    await message.reply(`⚠️ **Error Grup**

Tidak dikenali sebagai grup oleh WhatsApp API

🔧 **Coba:**
1. Restart bot
2. Pastikan di grup yang benar
3. Kirim 'debug' untuk info detail

🆔 ID: ${message.from}
🔍 Detected as: ${chat.isGroup ? 'Group' : 'Not Group'}`);
                }
            } catch (error) {
                console.error('❌ CRITICAL ERROR in open command:', error);
                await message.reply(`❌ **Error Sistem**

Terjadi kesalahan saat memproses perintah

🔧 **Info Error:**
${error.message || 'Unknown error'}

📞 Hubungi admin bot jika masalah berlanjut`);
            }
        }
        
        // Command: close group (hanya kata pertama)
        else if (firstWord === 'close' || firstWord === 'cl') {
            console.log(`🔍 CLOSE COMMAND RECEIVED!`);
            console.log(`📍 Message from: ${message.from}`);
            console.log(`🏢 Contains @g.us: ${message.from.includes('@g.us')}`);
            console.log(`🔢 Message ID: ${message.id._serialized}`);
            console.log(`👤 From user: ${message.author || message.from}`);
            
            // First check: Is this from a group?
            if (!message.from.includes('@g.us')) {
                console.log('❌ REJECT: Command sent from private chat, not group');
                await message.reply(`⚠️ **Perintah Grup**

🚫 Perintah "close" hanya bisa digunakan di GRUP!

📱 Cara menggunakan:
1. Tambahkan bot ke grup
2. Jadikan bot sebagai admin
3. Kirim perintah "close" di grup (bukan chat pribadi)

💡 Saat ini Anda kirim dari chat pribadi.
🆔 Chat ID: ${message.from}`);
                return;
            }
            
            console.log('✅ GROUP CHECK PASSED - Getting chat object...');
            
            try {
                const chat = await message.getChat();
                const contact = await message.getContact();
                
                console.log(`👥 Group name: ${chat.name}`);
                console.log(`👤 User: ${contact.pushname || 'Unknown'}`);
                console.log(`🔒 Is Group object: ${chat.isGroup}`);
                console.log(`📊 Group metadata available: ${!!chat.groupMetadata}`);
                
                if (chat.isGroup) {
                    console.log('✅ GROUP OBJECT CONFIRMED');
                    
                    // Check if bot is admin
                    try {
                        const participants = await chat.participants;
                        const botNumber = client.info.wid.user;
                        const isAdmin = participants.some(p => p.id.user === botNumber && p.isAdmin);
                        
                        console.log(`🤖 Bot number: ${botNumber}`);
                        console.log(`👥 Participants count: ${participants.length}`);
                        console.log(`� Bot is admin: ${isAdmin}`);
                        
                        if (!isAdmin) {
                            console.log('❌ REJECT: Bot is not admin');
                            await message.reply(`❌ **Bot Belum Admin**

🔑 Bot perlu dijadikan admin untuk mengubah pengaturan grup

📝 **Cara menjadikan bot admin:**
1. Buka info grup
2. Tap "Edit"
3. Tap "Add participant"
4. Pilih bot dari daftar
5. Tap icon admin (👑) di samping nama bot
6. Coba lagi perintah "close"

🤖 Bot saat ini: Member biasa
👑 Diperlukan: Admin dengan izin edit grup`);
                            return;
                        }
                        
                        console.log('🔄 ATTEMPTING TO CLOSE GROUP...');
                        await chat.setMessagesAdminsOnly(true);
                        console.log('✅ GROUP CLOSED SUCCESSFULLY');
                        
                        await smartDelay('groupManagement');
                        
                        // Format tanggal dan waktu Indonesia
                        const now = new Date();
                        const dateOptions = { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Asia/Jakarta'
                        };
                        const timeOptions = {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Jakarta'
                        };
                        
                        const dateStr = now.toLocaleDateString('id-ID', dateOptions);
                        const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
                        
                        await message.reply(`*GROUP CLOSE* ~ ZideeBot

Group *${chat.name}* Telah Di Tutup Oleh *@${contact.pushname || contact.name || 'Admin'}*

📆 ${dateStr}
⏰ ${timeStr} WIB
اَلْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ

Terimakasih atas orderan hari ini, semoga besok lebih laris untuk kita semua, aamiin... ✨`);
                        
                        console.log(`📕 SUCCESS: Group "${chat.name}" closed by ${contact.pushname}`);
                        
                    } catch (permissionError) {
                        console.error('❌ PERMISSION ERROR:', permissionError);
                        await message.reply(`❌ **Gagal Menutup Grup**

🔑 Bot tidak memiliki izin yang cukup

� **Troubleshooting:**
1. Pastikan bot adalah admin
2. Berikan izin "Edit group info"
3. Restart bot jika perlu
4. Coba lagi

⚠️ Error: ${permissionError.message || 'Unknown error'}`);
                    }
                } else {
                    console.log('❌ REJECT: Not recognized as group object');
                    await message.reply(`⚠️ **Error Grup**

Tidak dikenali sebagai grup oleh WhatsApp API

🔧 **Coba:**
1. Restart bot
2. Pastikan di grup yang benar
3. Kirim 'debug' untuk info detail

🆔 ID: ${message.from}
🔍 Detected as: ${chat.isGroup ? 'Group' : 'Not Group'}`);
                }
            } catch (error) {
                console.error('❌ CRITICAL ERROR in close command:', error);
                await message.reply(`❌ **Error Sistem**

Terjadi kesalahan saat memproses perintah

🔧 **Info Error:**
${error.message || 'Unknown error'}

📞 Hubungi admin bot jika masalah berlanjut`);
            }
        }
        
        // Command: kick user from group (hanya kata pertama)
        else if (firstWord === 'kick') {
            console.log(`🔍 KICK COMMAND RECEIVED!`);
            console.log(`📍 Message from: ${message.from}`);
            
            // First check: Is this from a group?
            if (!message.from.includes('@g.us')) {
                console.log('❌ REJECT: Command sent from private chat, not group');
                await message.reply(`⚠️ **Perintah Grup**

🚫 Perintah "kick" hanya bisa digunakan di GRUP!

📱 **Cara menggunakan:**
1. Tambahkan bot ke grup
2. Jadikan bot sebagai admin
3. Reply pesan target dengan "kick" ATAU
4. Kirim "kick @[contact]" di grup

💡 Saat ini Anda kirim dari chat pribadi.`);
                return;
            }
            
            try {
                const chat = await message.getChat();
                const contact = await message.getContact();
                
                if (chat.isGroup) {
                    // Check if user who sent command is admin
                    const participants = await chat.participants;
                    const botNumber = client.info.wid.user;
                    
                    // Get sender number with multiple fallback methods
                    let senderNumber = null;
                    if (message.author) {
                        senderNumber = message.author.replace('@c.us', ''); // Remove @c.us suffix
                    } else if (message.from.includes('@g.us')) {
                        // Extract from group message format
                        senderNumber = message.from.split('@')[0];
                    } else {
                        senderNumber = message.from.replace('@c.us', '');
                    }
                    
                    // Clean up any remaining formatting
                    senderNumber = senderNumber.replace(/[@c.us]/g, '');
                    
                    console.log(`👤 Raw message.from: ${message.from}`);
                    console.log(`👤 Raw message.author: ${message.author}`);
                    console.log(`👤 Extracted sender (cleaned): ${senderNumber}`);
                    
                    // More comprehensive admin check
                    const senderParticipant = participants.find(p => {
                        const participantNumber = p.id.user;
                        console.log(`🔍 Checking participant: ${participantNumber} vs sender: ${senderNumber}`);
                        return participantNumber === senderNumber;
                    });
                    
                    const botParticipant = participants.find(p => p.id.user === botNumber);
                    
                    const senderIsAdmin = senderParticipant ? senderParticipant.isAdmin : false;
                    const botIsAdmin = botParticipant ? botParticipant.isAdmin : false;
                    
                    console.log(`👤 Sender: ${senderNumber}`);
                    console.log(`👤 Sender participant found: ${!!senderParticipant}`);
                    console.log(`👤 Sender is admin: ${senderIsAdmin}`);
                    console.log(`🤖 Bot is admin: ${botIsAdmin}`);
                    console.log(`👥 Total participants: ${participants.length}`);
                    
                    // Debug mode untuk troubleshooting
                    if (messageBody === 'kick debug' || messageBody === 'kick test' || messageBody === 'kickdebug') {
                        let debugInfo = `🐛 **Kick Debug Info**

📱 **Message Info:**
• From: ${message.from}
• Author: ${message.author || 'None'}
• Contact: ${contact.pushname || contact.name || 'Unknown'}

👤 **Sender Detection:**
• Raw sender: ${senderNumber}
• Participant found: ${!!senderParticipant}
• Is admin: ${senderIsAdmin}

🤖 **Bot Info:**
• Bot number: ${botNumber}
• Bot participant found: ${!!botParticipant}
• Bot is admin: ${botIsAdmin}

👥 **Group Info:**
• Total participants: ${participants.length}
• Group name: ${chat.name}

🔍 **All Participants:**\n`;

                        participants.forEach((p, index) => {
                            const cleanNumber = p.id.user;
                            const adminStatus = p.isAdmin ? '👑' : '👤';
                            const isCurrentSender = cleanNumber === senderNumber ? ' ← YOU' : '';
                            debugInfo += `${index + 1}. ${cleanNumber} ${adminStatus}${isCurrentSender}\n`;
                        });

                        await message.reply(debugInfo);
                        return;
                    }
                    
                    if (!senderIsAdmin) {
                        await message.reply(`❌ **Akses Ditolak**

👑 Hanya admin grup yang bisa menggunakan perintah kick

🔑 **Permission Required:**
• Anda harus admin grup
• Bot harus admin grup

👤 Status Anda: ${senderIsAdmin ? 'Admin ✅' : 'Member ❌'}
🤖 Status Bot: ${botIsAdmin ? 'Admin ✅' : 'Member ❌'}

🔍 **Debug:** Kirim "kick debug" untuk info detail
📞 **Your ID:** ${senderNumber}`);
                        return;
                    }
                    
                    if (!botIsAdmin) {
                        await message.reply(`❌ **Bot Belum Admin**

🔑 Bot perlu dijadikan admin untuk kick member

📝 **Cara menjadikan bot admin:**
1. Buka info grup
2. Tap "Edit"
3. Pilih bot dari daftar member
4. Tap icon admin (👑) di samping nama bot
5. Coba lagi perintah kick

🤖 Bot saat ini: Member biasa
👑 Diperlukan: Admin dengan izin mengeluarkan member`);
                        return;
                    }
                    
                    let targetUser = null;
                    
                    // Check if this is a reply to a message
                    if (message.hasQuotedMsg) {
                        const quotedMsg = await message.getQuotedMessage();
                        if (quotedMsg.author) {
                            targetUser = quotedMsg.author.replace('@c.us', ''); // Clean format
                        } else if (quotedMsg.from) {
                            targetUser = quotedMsg.from.replace('@c.us', '');
                        }
                        // Additional cleanup
                        if (targetUser) {
                            targetUser = targetUser.replace(/[@c.us]/g, '');
                        }
                        console.log(`🎯 Target from reply - raw: ${quotedMsg.author || quotedMsg.from}`);
                        console.log(`🎯 Target from reply - cleaned: ${targetUser}`);
                    }
                    // Check if user specified with @mention or number
                    else if (messageBody.startsWith('kick ')) {
                        const targetText = messageBody.substring(5).trim();
                        
                        // Extract phone number from different formats
                        const phoneMatch = targetText.match(/(\+?62\d{8,13}|\d{10,13}|@\d+)/);
                        if (phoneMatch) {
                            targetUser = phoneMatch[1].replace(/[@+]/g, '');
                            // Normalize Indonesian numbers
                            if (targetUser.startsWith('0')) {
                                targetUser = '62' + targetUser.substring(1);
                            } else if (!targetUser.startsWith('62')) {
                                targetUser = '62' + targetUser;
                            }
                            console.log(`🎯 Target from mention: ${targetUser}`);
                        }
                    }
                    
                    console.log(`🎯 Final target user: ${targetUser}`);
                    
                    // Debug untuk kick command dengan target
                    if (messageBody.startsWith('kick ') && messageBody.includes('debug')) {
                        let kickDebugInfo = `🎯 **Kick Target Debug**

📱 **Command:** ${messageBody}
🎯 **Target extracted:** ${targetUser || 'null'}

🔍 **Available targets in group:**\n`;

                        participants.forEach((p, index) => {
                            const cleanNumber = p.id.user;
                            const adminStatus = p.isAdmin ? '👑 Admin' : '👤 Member';
                            const isBot = cleanNumber === botNumber ? ' (BOT)' : '';
                            kickDebugInfo += `${index + 1}. ${cleanNumber} - ${adminStatus}${isBot}\n`;
                        });

                        kickDebugInfo += `\n💡 **Untuk kick, gunakan:**\n`;
                        participants.forEach((p, index) => {
                            if (p.id.user !== botNumber && !p.isAdmin) {
                                kickDebugInfo += `kick ${p.id.user}\n`;
                            }
                        });

                        await message.reply(kickDebugInfo);
                        return;
                    }
                    
                    if (!targetUser) {
                        await message.reply(`❌ **Target Tidak Ditemukan**

🎯 **Cara menggunakan perintah kick:**

**Method 1 - Reply pesan:**
1. Reply pesan dari user yang ingin di-kick
2. Tulis "kick"

**Method 2 - Mention:**
• kick @628123456789
• kick 628123456789
• kick +628123456789
• kick 08123456789

💡 **Contoh:**
kick @628123456789

⚠️ **Catatan:** Target harus member grup`);
                        return;
                    }
                    
                    // Check if target exists in group
                    const targetParticipant = participants.find(p => p.id.user === targetUser);
                    
                    console.log(`🔍 Target search - looking for: ${targetUser}`);
                    console.log(`🔍 Available participants:`);
                    participants.forEach(p => {
                        console.log(`   - ${p.id.user} (admin: ${p.isAdmin})`);
                    });
                    console.log(`🔍 Target participant found: ${!!targetParticipant}`);
                    
                    if (!targetParticipant) {
                        await message.reply(`❌ **User Tidak Ditemukan**

👤 User dengan nomor ${targetUser} tidak ada di grup ini

🔍 **Kemungkinan:**
• Nomor salah
• User sudah keluar grup  
• User sudah di-kick sebelumnya
• Format nomor tidak sesuai

💡 **Debug:** Kirim "kick debug" untuk melihat daftar member

📋 **Member yang bisa di-kick:**${participants.filter(p => !p.isAdmin && p.id.user !== botNumber).map(p => `\n• ${p.id.user}`).join('')}`);
                        return;
                    }
                    
                    // Check if target is admin (prevent kicking admins)
                    const targetIsAdmin = targetParticipant.isAdmin;
                    if (targetIsAdmin) {
                        await message.reply(`❌ **Tidak Bisa Kick Admin**

👑 User tersebut adalah admin grup

🚫 **Tidak diizinkan:**
• Kick admin grup
• Kick owner grup

💡 Hanya bisa kick member biasa`);
                        return;
                    }
                    
                    // Prevent bot from kicking itself
                    if (targetUser === botNumber) {
                        await message.reply(`🤖 **Haha nice try!**

Aku tidak akan meng-kick diriku sendiri 😄

💡 Kalau mau aku keluar grup, hapus saja aku secara manual`);
                        return;
                    }
                    
                    try {
                        // Kick the user
                        await chat.removeParticipants([`${targetUser}@c.us`]);
                        
                        console.log(`👢 SUCCESS: User ${targetUser} kicked from group ${chat.name}`);
                        
                        // Format tanggal dan waktu Indonesia
                        const now = new Date();
                        const dateOptions = { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Asia/Jakarta'
                        };
                        const timeOptions = {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Jakarta'
                        };
                        
                        const dateStr = now.toLocaleDateString('id-ID', dateOptions);
                        const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
                        
                        await smartDelay('groupManagement');
                        
                        // Array kalimat motivasi untuk kick message
                        const kickMessages = [
                            "Disetiap keputusan ada konsekuensi",
                            "Peraturan dibuat untuk diikuti, bukan dilanggar",
                            "Tindakan memiliki akibat, pilihan menentukan nasib",
                            "Kedisiplinan adalah kunci keharmonisan grup",
                            "Respect rules, respect others, respect yourself"
                        ];
                        
                        // Pilih kalimat secara random
                        const randomMessage = kickMessages[Math.floor(Math.random() * kickMessages.length)];
                        
                        await message.reply(`*MEMBER KICKED* ~ ZideeBot

👤 **User:** +${targetUser}
👑 **Oleh:** @${contact.pushname || contact.name || 'Admin'}
📍 **Group:** ${chat.name}

📆 ${dateStr}
⏰ ${timeStr} WIB

⚖️ *"${randomMessage}"*

User telah dikeluarkan dari grup.`);
                        
                    } catch (kickError) {
                        console.error('❌ KICK ERROR:', kickError);
                        await message.reply(`❌ **Gagal Kick User**

🚫 Tidak bisa mengeluarkan user dari grup

🔧 **Kemungkinan penyebab:**
• Bot tidak memiliki izin kick
• User sudah keluar grup
• Error koneksi WhatsApp
• Target user protected

⚠️ Error: ${kickError.message || 'Unknown error'}`);
                    }
                    
                } else {
                    await message.reply(`⚠️ **Error Grup**

Tidak dikenali sebagai grup oleh WhatsApp API

🔧 **Coba:**
1. Restart bot
2. Pastikan di grup yang benar
3. Kirim 'debug' untuk info detail`);
                }
            } catch (error) {
                console.error('❌ CRITICAL ERROR in kick command:', error);
                await message.reply(`❌ **Error Sistem**

Terjadi kesalahan saat memproses perintah kick

🔧 **Info Error:**
${error.message || 'Unknown error'}

📞 Hubungi admin bot jika masalah berlanjut`);
            }
        }
        
        // Command: welcome (hanya kata pertama)
        else if (firstWord === 'welcome') {
            console.log(`🎉 MANUAL WELCOME COMMAND RECEIVED!`);
            console.log(`📍 Message from: ${message.from}`);
            
            // Check if this is from a group
            if (!message.from.includes('@g.us')) {
                await message.reply(`⚠️ **Perintah Grup**

🚫 Perintah "welcome" hanya bisa digunakan di GRUP!

💡 Ini adalah command untuk testing welcome message otomatis.`);
                return;
            }
            
            try {
                const chat = await message.getChat();
                const contact = await message.getContact();
                
                if (chat.isGroup) {
                    // Check if sender is admin (optional, untuk testing bisa dihapus)
                    const participants = await chat.participants;
                    
                    // Array pesan welcome yang bervariasi (sama seperti otomatis)
                    const welcomeMessages = [
                        "Selamat datang di grup! Semoga betah dan bisa berkontribusi positif 🎉",
                        "Welcome to the group! Mari kita jaga keharmonisan dan saling membantu ✨",
                        "Halo newcomer! Jangan lupa baca aturan grup dan berkenalan ya 👋",
                        "Selamat bergabung! Grup ini tempat sharing dan belajar bersama 🚀",
                        "Welcome aboard! Mari kita ciptakan lingkungan yang positif dan produktif 🌟"
                    ];
                    
                    // Pilih pesan secara random
                    const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                    
                    // Format tanggal dan waktu Indonesia
                    const now = new Date();
                    const dateOptions = { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        timeZone: 'Asia/Jakarta'
                    };
                    const timeOptions = {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'Asia/Jakarta'
                    };
                    
                    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
                    const timeStr = now.toLocaleTimeString('id-ID', timeOptions);
                    
                    await smartDelay('groupManagement');
                    
                    // Kirim pesan welcome (testing mode)
                    await message.reply(`*WELCOME MESSAGE TEST* ~ ZideeBot

🎉 **Selamat Datang di ${chat.name}!**

👤 **Testing Mode:** Manual welcome command
📅 **Tanggal:** ${dateStr}
⏰ **Waktu:** ${timeStr} WIB

💬 **Pesan Random:**
${randomWelcome}

📋 **Tips Bergabung:**
• Baca aturan grup terlebih dahulu
• Perkenalkan diri dengan sopan
• Jaga etika dalam berkomunikasi
• Aktif berpartisipasi positif

🤖 **Bot Commands:**
Ketik "tolong" atau "menu" untuk melihat bantuan

🧪 **Testing Info:**
Ini adalah preview welcome message yang akan dikirim otomatis ketika ada member baru bergabung.

Welcome aboard! 🚢✨`);
                    
                    console.log(`📤 Manual welcome message sent to group: ${chat.name}`);
                    
                } else {
                    await message.reply(`⚠️ **Error Grup**

Tidak dikenali sebagai grup oleh WhatsApp API`);
                }
            } catch (error) {
                console.error('❌ CRITICAL ERROR in welcome command:', error);
                await message.reply(`❌ **Error Sistem**

Terjadi kesalahan saat memproses welcome command

🔧 **Info Error:**
${error.message || 'Unknown error'}`);
            }
        }
        
        // Auto-reply untuk sapaan umum (gunakan firstWord untuk sapaan langsung)
        else if (firstWord === 'bot' || firstWord === 'hai' || firstWord === 'hello' || firstWord === 'hi' || firstWord === 'halo') {
            await smartDelay('greeting');
            await message.reply('Haii, aku adalah Zideebot. Ada yang bisa aku bantu?');
        }
        
        // Auto-reply untuk ucapan terima kasih (tetap gunakan includes untuk fleksibilitas)
        else if (messageBody.includes('terima kasih') || messageBody.includes('thanks') || messageBody.includes('thx')) {
            await smartDelay('greeting');
            await message.reply('🙏 Sama-sama! Senang bisa membantu Anda.');
        }
        
        // Default reply untuk pesan yang tidak dikenali
        else {
            // Uncomment baris di bawah jika ingin bot membalas semua pesan
            // await message.reply('🤔 Maaf, saya tidak mengerti pesan Anda. Ketik "tolong" untuk bantuan.');
        }
        
    } catch (error) {
        console.error('❌ Error handling message:', error);
        await message.reply('⚠️ Terjadi kesalahan saat memproses pesan Anda.');
    }
}

// Fungsi untuk mengirim pesan ke nomor tertentu
async function sendMessage(phoneNumber, message) {
    try {
        const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`📤 Pesan berhasil dikirim ke ${phoneNumber}`);
    } catch (error) {
        console.error('❌ Error sending message:', error);
    }
}

// Fungsi untuk broadcast pesan ke multiple nomor
async function broadcastMessage(phoneNumbers, message) {
    console.log(`📢 Memulai broadcast ke ${phoneNumbers.length} nomor...`);
    
    for (const phoneNumber of phoneNumbers) {
        try {
            await sendMessage(phoneNumber, message);
            // Delay random 2-5 detik untuk menghindari spam detection
            const delay = Math.random() * 3000 + 2000; // 2-5 detik
            console.log(`⏳ Menunggu ${Math.round(delay/1000)} detik sebelum pesan berikutnya...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            console.error(`❌ Error broadcasting to ${phoneNumber}:`, error);
        }
    }
    
    console.log('✅ Broadcast selesai!');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot...');
    try {
        await client.destroy();
    } catch (error) {
        console.log('Error during shutdown:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Shutting down bot...');
    try {
        await client.destroy();
    } catch (error) {
        console.log('Error during shutdown:', error);
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Export functions untuk penggunaan di file lain
module.exports = {
    client,
    sendMessage,
    broadcastMessage
};
