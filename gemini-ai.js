// gemini-ai.js - Google Gemini AI Integration
require('dotenv').config();
const axios = require('axios');

// Konfigurasi Gemini AI dengan Environment Variables
const GEMINI_CONFIG = {
    API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    BASE_URL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS) || 1000,
    TEMPERATURE: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7
};

// Fungsi untuk validasi API key
function validateAPIKey() {
    if (!GEMINI_CONFIG.API_KEY || GEMINI_CONFIG.API_KEY === 'YOUR_GEMINI_API_KEY') {
        console.warn('⚠️ Gemini API key tidak ditemukan di environment variables');
        return false;
    }
    
    if (GEMINI_CONFIG.API_KEY.length < 30) {
        console.warn('⚠️ Gemini API key tampaknya tidak valid (terlalu pendek)');
        return false;
    }
    
    console.log('✅ Gemini API key berhasil dimuat dari environment');
    return true;
}

// Fungsi untuk chat dengan Gemini AI
async function chatWithGemini(userMessage, context = '') {
    try {
        if (!validateAPIKey()) {
            return getOfflineAIResponse(userMessage);
        }
        
        // Prepare prompt dengan context bot WhatsApp
        const systemPrompt = `Kamu adalah bot WhatsApp yang ramah dan membantu. 
Jawab dengan singkat (maksimal 500 karakter), gunakan emoji yang tepat, dan dalam bahasa Indonesia.
User bertanya: "${userMessage}"
${context ? `Konteks: ${context}` : ''}

Berikan jawaban yang informatif tapi tidak terlalu panjang untuk WhatsApp.`;

        const response = await axios.post(
            `${GEMINI_CONFIG.BASE_URL}?key=${GEMINI_CONFIG.API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: GEMINI_CONFIG.TEMPERATURE,
                    maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        return `🤖 **Gemini AI**

${aiResponse}

💡 *Powered by Google Gemini 2.0*`;
        
    } catch (error) {
        console.error('Error with Gemini AI:', error);
        
        if (error.response && error.response.status === 403) {
            return `❌ **API Key Error**
            
🔑 API key Gemini tidak valid atau belum diatur.

📝 **Cara setup:**
1. Buka https://aistudio.google.com
2. Dapatkan API key gratis
3. Update GEMINI_API_KEY di file .env
4. Restart bot

💡 **Sementara ini gunakan mode offline.**`;
        }
        
        if (error.response && error.response.status === 429) {
            return `⏱️ **Rate Limit Exceeded**
            
🚦 Terlalu banyak request ke Gemini API.

⏰ **Tunggu sebentar dan coba lagi.**
💡 **Atau gunakan mode offline sementara.**`;
        }
        
        return `❌ **Error AI Response**
        
Kemungkinan penyebab:
• Koneksi internet bermasalah
• API rate limit exceeded
• Server Gemini sedang maintenance

🔄 Coba lagi dalam beberapa menit.`;
    }
}

// Fungsi untuk generate kreatif dengan Gemini
async function generateCreative(prompt, type = 'general') {
    try {
        if (!validateAPIKey()) {
            return getOfflineCreativeResponse(prompt, type);
        }
        
        let systemPrompt = '';
        
        switch (type) {
            case 'pantun':
                systemPrompt = `Buatkan pantun lucu tentang: "${prompt}". Format pantun Indonesia 4 baris dengan rima a-b-a-b.`;
                break;
            case 'puisi':
                systemPrompt = `Tulis puisi pendek dan indah tentang: "${prompt}". Maksimal 8 baris.`;
                break;
            case 'joke':
                systemPrompt = `Buat lelucon atau joke lucu tentang: "${prompt}". Singkat dan family-friendly.`;
                break;
            case 'motivasi':
                systemPrompt = `Berikan kata-kata motivasi inspiratif tentang: "${prompt}". Singkat tapi powerful.`;
                break;
            case 'tips':
                systemPrompt = `Berikan 3-5 tips praktis tentang: "${prompt}". Format poin-poin yang mudah dibaca.`;
                break;
            default:
                systemPrompt = `Berikan respons kreatif dan menarik tentang: "${prompt}". Singkat dan engaging.`;
        }
        
        const response = await axios.post(
            `${GEMINI_CONFIG.BASE_URL}?key=${GEMINI_CONFIG.API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.9, // Higher creativity
                    maxOutputTokens: 800
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        return `✨ **Gemini Creative**

${aiResponse}

🎨 *Generated by Google Gemini AI*`;
        
    } catch (error) {
        console.error('Error with Gemini Creative:', error);
        return getOfflineCreativeResponse(prompt, type);
    }
}

// Fungsi untuk terjemahan dengan Gemini
async function translateText(text, targetLang = 'english') {
    try {
        if (!validateAPIKey()) {
            return getOfflineTranslation(text, targetLang);
        }
        
        const systemPrompt = `Terjemahkan teks berikut ke bahasa ${targetLang}: "${text}"
        
Berikan terjemahan yang akurat dan natural. Jika ada idiom atau ungkapan, berikan terjemahan yang setara.`;

        const response = await axios.post(
            `${GEMINI_CONFIG.BASE_URL}?key=${GEMINI_CONFIG.API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const translation = response.data.candidates[0].content.parts[0].text;
        
        return `🌐 **Terjemahan**

**Original:** ${text}
**${targetLang}:** ${translation}

💡 *Translated by Gemini AI*`;
        
    } catch (error) {
        console.error('Error with Gemini Translation:', error);
        return getOfflineTranslation(text, targetLang);
    }
}

// ========== OFFLINE RESPONSES ==========
function getOfflineAIResponse(message) {
    const responses = {
        'bot': 'Haii, aku adalah Zideebot. Ada yang bisa aku bantu?',
        'siapa': '🤖 Saya adalah bot WhatsApp dengan AI Gemini. Saya bisa chat, buat pantun, terjemahan, dan banyak lagi!',
        'apa kabar': '😊 Kabar baik! Saya siap membantu Anda hari ini. Ada yang mau ditanyakan?',
        'terima kasih': '🙏 Sama-sama! Senang bisa membantu. Ada lagi yang bisa saya bantu?',
        'bye': '👋 Sampai jumpa! Jangan ragu untuk chat lagi ya.',
        'help': '🆘 Saya bisa bantu dengan: chat umum, buat pantun, terjemahan, tips, motivasi, dan banyak lagi!'
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return `🤖 **AI Bot** *(Offline Mode)*

${response}

💡 *Untuk fitur AI lengkap, setup Gemini API key di .env*`;
        }
    }
    
    return `🤖 **AI Bot** *(Offline Mode)*

Maaf, saya dalam mode offline. Untuk percakapan AI yang lebih canggih, silakan setup Gemini API key di file .env.

📝 **Yang bisa saya bantu offline:**
• Chat sederhana
• Pantun offline
• Tips umum

💡 **Setup Gemini API untuk fitur lengkap!**`;
}

function getOfflineCreativeResponse(prompt, type) {
    const responses = {
        pantun: `Pantun tentang ${prompt} (offline):

Di pasar beli pisang raja
Jangan lupa beli pepaya
${prompt} memang bisa bikin kacau
Tapi hidup tetap harus fun selalu! 🎉

💡 *Setup Gemini API di .env untuk pantun yang lebih kreatif!*`,
        
        motivasi: `💪 **Motivasi tentang ${prompt}:**

"Setiap langkah kecil menuju ${prompt} adalah kemajuan besar. Jangan pernah menyerah, karena kesuksesan dimulai dari keberanian untuk mencoba!"

✨ *Setup Gemini AI di .env untuk motivasi yang lebih personal!*`,
        
        tips: `💡 **Tips tentang ${prompt}:**

1. Mulai dari hal kecil
2. Konsisten adalah kunci
3. Jangan takut untuk belajar
4. Minta bantuan jika perlu
5. Rayakan setiap progress

🚀 *Setup Gemini API di .env untuk tips yang lebih detail!*`
    };
    
    return responses[type] || `✨ Ide kreatif tentang ${prompt} memerlukan Gemini AI. Setup API key di .env untuk fitur lengkap!`;
}

function getOfflineTranslation(text, targetLang) {
    const commonTranslations = {
        'halo': { english: 'Hello', japanese: 'Konnichiwa', korean: 'Annyeong' },
        'terima kasih': { english: 'Thank you', japanese: 'Arigato', korean: 'Gamsahamnida' },
        'selamat pagi': { english: 'Good morning', japanese: 'Ohayo', korean: 'Joeun achim' }
    };
    
    const lowerText = text.toLowerCase();
    
    if (commonTranslations[lowerText] && commonTranslations[lowerText][targetLang]) {
        return `🌐 **Terjemahan** *(Offline)*

**Original:** ${text}
**${targetLang}:** ${commonTranslations[lowerText][targetLang]}

💡 *Setup Gemini API di .env untuk terjemahan yang lebih lengkap!*`;
    }
    
    return `🌐 **Terjemahan**

Maaf, terjemahan offline terbatas. Setup Gemini API key di file .env untuk terjemahan yang lebih akurat dan lengkap!

📝 **Yang tersedia offline:**
• halo, terima kasih, selamat pagi
• Bahasa: English, Japanese, Korean`;
}

// Setup API key function
function setupGeminiAPI(apiKey) {
    process.env.GEMINI_API_KEY = apiKey;
    GEMINI_CONFIG.API_KEY = apiKey;
    console.log('✅ Gemini API key berhasil di-setup!');
}

// Test API key function
async function testGeminiAPI() {
    console.log('🧪 Testing Gemini API...');
    
    if (!validateAPIKey()) {
        console.log('❌ API key tidak valid atau tidak ditemukan');
        return false;
    }
    
    try {
        const testResponse = await chatWithGemini('Test API key - jawab dengan "OK" saja');
        console.log('✅ API Key Working!');
        console.log('Test Response:', testResponse);
        return true;
    } catch (error) {
        console.log('❌ API Key Error:', error.message);
        return false;
    }
}

// Export functions
module.exports = {
    chatWithGemini,
    generateCreative,
    translateText,
    setupGeminiAPI,
    testGeminiAPI,
    validateAPIKey,
    GEMINI_CONFIG
};
