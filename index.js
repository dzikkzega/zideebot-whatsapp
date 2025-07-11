const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const { getOpenMeteoWeather, getWeatherForecast } = require('./open-meteo-api');
const { chatWithGemini, generateCreative, translateText } = require('./gemini-ai');

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
    
    // Debug log untuk semua pesan
    console.log(`📨 Processing message: "${messageBody}" from ${sender}`);
    console.log(`📍 Is Group: ${message.from.includes('@g.us')}`);
    
    try {
        // Command: tolong
        if (messageBody === 'tolong' || messageBody === 'bantuan' || messageBody === 'menu') {
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

**Contoh penggunaan:**
• echo Halo dunia
• hitung 5 + 3 * 2
• cuaca Jakarta
• prakiraan Bandung
• ai siapa kamu?
• pantun programming
• motivasi belajar
• terjemah hello world
• faq
            `);
        }
        
        // Command: waktu/jam
        else if (messageBody === 'waktu' || messageBody === 'jam' || messageBody === 'time') {
            await smartDelay('command');
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            await message.reply(`🕐 Waktu sekarang: ${currentTime}`);
        }
        
        // Command: info/tentang
        else if (messageBody === 'info' || messageBody === 'tentang' || messageBody === 'about') {
            await smartDelay('command');
            await message.reply(`
🤖 *Informasi Bot*

• Nama: WhatsApp Bot
• Versi: 1.0.0
• Status: Online ✅
• Framework: whatsapp-web.js
            `);
        }
        
        // Command: ping/test
        else if (messageBody === 'ping' || messageBody === 'test' || messageBody === 'tes') {
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
        
        // Command: echo
        else if (messageBody.startsWith('echo ')) {
            await smartDelay('autoReply');
            const textToEcho = message.body.substring(5); // Ambil text setelah "echo "
            await message.reply(`🔄 Echo: ${textToEcho}`);
        }
        
        // ========== CALCULATOR BOT ==========
        // Command: hitung/calc
        else if (messageBody.startsWith('hitung ') || messageBody.startsWith('calc ')) {
            await smartDelay('command');
            const expression = messageBody.startsWith('hitung ') ? 
                message.body.substring(7) : message.body.substring(5);
            
            const result = calculateExpression(expression);
            await message.reply(`🧮 **Kalkulator**\n\n${expression} = **${result}**`);
        }
        
        // Command: kalkulator menu
        else if (messageBody === 'kalkulator' || messageBody === 'calc') {
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
        // Command: cuaca
        else if (messageBody.startsWith('cuaca ') || messageBody.startsWith('weather ')) {
            await smartDelay('command');
            const city = messageBody.startsWith('cuaca ') ? 
                message.body.substring(6) : message.body.substring(8);
            
            const weatherInfo = await getOpenMeteoWeather(city);
            await message.reply(weatherInfo);
        }
        
        // Command: prakiraan cuaca
        else if (messageBody.startsWith('prakiraan ')) {
            await smartDelay('command');
            const city = message.body.substring(10);
            
            const forecastInfo = await getWeatherForecast(city);
            await message.reply(forecastInfo);
        }
        
        // Command: cuaca menu
        else if (messageBody === 'cuaca' || messageBody === 'weather') {
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
        
        // ========== AI BOT (GEMINI) ==========
        // Command: ai (general chat)
        else if (messageBody.startsWith('ai ')) {
            await smartDelay('command');
            const userQuestion = message.body.substring(3);
            
            const aiResponse = await chatWithGemini(userQuestion);
            await message.reply(aiResponse);
        }
        
        // Command: pantun
        else if (messageBody.startsWith('pantun ')) {
            await smartDelay('command');
            const topic = message.body.substring(7);
            
            const pantunResponse = await generateCreative(topic, 'pantun');
            await message.reply(`🎭 **Pantun tentang ${topic}:**\n\n${pantunResponse}`);
        }
        
        // Command: motivasi
        else if (messageBody.startsWith('motivasi ')) {
            await smartDelay('command');
            const topic = message.body.substring(9);
            
            const motivasiResponse = await generateCreative(topic, 'motivasi');
            await message.reply(`💪 **Motivasi untuk ${topic}:**\n\n${motivasiResponse}`);
        }
        
        // Command: terjemah
        else if (messageBody.startsWith('terjemah ')) {
            await smartDelay('command');
            const textToTranslate = message.body.substring(9);
            
            const translateResponse = await translateText(textToTranslate, 'english');
            await message.reply(`🌐 **Terjemahan:**\n\n${translateResponse}`);
        }
        
        // Command: tips
        else if (messageBody.startsWith('tips ')) {
            await smartDelay('command');
            const topic = message.body.substring(5);
            
            const tipsResponse = await generateCreative(topic, 'tips');
            await message.reply(`💡 **Tips tentang ${topic}:**\n\n${tipsResponse}`);
        }
        
        // Command: AI menu
        else if (messageBody === 'ai' || messageBody === 'gemini') {
            await smartDelay('command');
            await message.reply(`
🤖 **AI Bot - Powered by Gemini**

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
Powered by Google Gemini AI

Contoh: ai Apa itu teknologi blockchain?
            `);
        }
        
        // ========== FAQ BOT ==========
        // FAQ responses
        else if (messageBody.includes('jam buka') || messageBody.includes('open hours')) {
            await smartDelay('autoReply');
            await message.reply('🕐 **Jam Buka Layanan:**\n\nSenin - Jumat: 08:00 - 17:00 WIB\nSabtu: 08:00 - 12:00 WIB\nMinggu: Libur\n\n📞 Untuk emergency: 24/7');
        }
        
        else if (messageBody.includes('alamat') || messageBody.includes('lokasi') || messageBody.includes('address')) {
            await smartDelay('autoReply');
            await message.reply('📍 **Alamat Kami:**\n\nJl. Contoh No. 123\nJakarta Selatan 12345\nIndonesia\n\n🚗 Dekat dengan stasiun MRT\n🅿️ Parkir tersedia');
        }
        
        else if (messageBody.includes('harga') || messageBody.includes('price') || messageBody.includes('tarif')) {
            await smartDelay('autoReply');
            await message.reply('💰 **Informasi Harga:**\n\nPaket Basic: Rp 100.000\nPaket Standard: Rp 250.000\nPaket Premium: Rp 500.000\n\n🎉 Promo bulan ini: Diskon 20%!\n📞 Hubungi CS untuk detail lengkap');
        }
        
        else if (messageBody.includes('kontak') || messageBody.includes('contact') || messageBody.includes('hubungi')) {
            await smartDelay('autoReply');
            await message.reply('📞 **Kontak Kami:**\n\nCustomer Service: 0800-1234-5678\nWhatsApp: 0812-3456-7890\nEmail: info@example.com\n\n💬 Atau chat langsung di sini!\n⏰ Respon dalam 1x24 jam');
        }
        
        else if (messageBody.includes('cara order') || messageBody.includes('how to order') || messageBody.includes('pesan')) {
            await smartDelay('autoReply');
            await message.reply('🛒 **Cara Order:**\n\n1️⃣ Pilih paket yang diinginkan\n2️⃣ Isi form pemesanan\n3️⃣ Lakukan pembayaran\n4️⃣ Kirim bukti transfer\n5️⃣ Pesanan diproses\n\n📝 Ketik "order" untuk mulai pemesanan');
        }
        
        else if (messageBody.includes('pembayaran') || messageBody.includes('payment') || messageBody.includes('bayar')) {
            await smartDelay('autoReply');
            await message.reply('💳 **Metode Pembayaran:**\n\n🏦 Transfer Bank:\n• BCA: 1234567890\n• Mandiri: 1234567890\n• BNI: 1234567890\n\n📱 E-Wallet:\n• OVO: 0812-3456-7890\n• GoPay: 0812-3456-7890\n• DANA: 0812-3456-7890\n\n💡 Konfirmasi pembayaran ke CS');
        }
        
        else if (messageBody.includes('promo') || messageBody.includes('diskon') || messageBody.includes('discount')) {
            await smartDelay('autoReply');
            await message.reply('🎉 **Promo Bulan Ini:**\n\n⚡ Flash Sale: 30% OFF\n🎊 Promo Member Baru: 20% OFF\n💎 Paket Premium: Gratis konsultasi\n🔥 Bundle Deal: Beli 2 Gratis 1\n\n📅 Berlaku sampai akhir bulan\n🏃‍♂️ Buruan, slot terbatas!');
        }
        
        else if (messageBody.includes('owner') || messageBody === 'owner') {
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
        
        // Command: faq menu
        else if (messageBody === 'faq' || messageBody === 'pertanyaan') {
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
        
        // Command: debug group (for testing)
        else if (messageBody === 'debug' || messageBody === 'debuggroup') {
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
• cl - Singkatan close`);
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
        
        // ========== GROUP MANAGEMENT ==========
        // Command: open group (with enhanced debugging)
        else if (messageBody === 'open' || messageBody === 'op') {
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
        
        // Command: close group (with enhanced debugging)
        else if (messageBody === 'close' || messageBody === 'cl') {
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

Group *${chat.name}* Telah Di Tutup Oleh @${contact.pushname || contact.name || 'Admin'}

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
        
        // Auto-reply untuk sapaan umum
        else if (messageBody.includes('bot') || messageBody.includes('hai') || messageBody.includes('hello')) {
            await smartDelay('greeting');
            await message.reply('Haii, aku adalah Zideebot. Ada yang bisa aku bantu?');
        }
        
        // Auto-reply untuk ucapan terima kasih
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
