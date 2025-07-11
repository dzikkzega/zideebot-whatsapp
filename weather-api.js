// weather-api.js - Real Weather API Integration
const axios = require('axios');

// Konfigurasi API
const WEATHER_CONFIG = {
    // Daftar ke openweathermap.org untuk mendapatkan API key gratis
    API_KEY: 'YOUR_API_KEY_HERE', // Ganti dengan API key Anda
    BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    UNITS: 'metric', // Celsius
    LANG: 'id' // Bahasa Indonesia
};

// Fungsi untuk mendapatkan cuaca real-time
async function getRealWeatherInfo(city) {
    try {
        if (WEATHER_CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
            return getSimulatedWeather(city);
        }
        
        const response = await axios.get(WEATHER_CONFIG.BASE_URL, {
            params: {
                q: city,
                appid: WEATHER_CONFIG.API_KEY,
                units: WEATHER_CONFIG.UNITS,
                lang: WEATHER_CONFIG.LANG
            }
        });
        
        const data = response.data;
        
        return `🌤️ **Cuaca ${data.name}, ${data.sys.country}**

🌡️ **Suhu:** ${Math.round(data.main.temp)}°C
🔥 **Terasa seperti:** ${Math.round(data.main.feels_like)}°C
💧 **Kelembaban:** ${data.main.humidity}%
💨 **Angin:** ${data.wind.speed} m/s
👁️ **Visibilitas:** ${data.visibility / 1000} km
☁️ **Kondisi:** ${data.weather[0].description}

🌅 **Sunrise:** ${new Date(data.sys.sunrise * 1000).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}
🌇 **Sunset:** ${new Date(data.sys.sunset * 1000).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}

⏰ **Update:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

Powered by OpenWeatherMap 🌍`;
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return `❌ **Kota "${city}" tidak ditemukan**
            
💡 **Tips pencarian:**
• Gunakan nama kota dalam bahasa Inggris
• Tambahkan nama negara (contoh: "Jakarta, ID")
• Coba variasi penulisan kota

🌍 **Contoh yang benar:**
• Jakarta
• Bandung
• New York, US
• London, UK
• Tokyo, JP`;
        }
        
        return `❌ **Error mengambil data cuaca**
        
Kemungkinan penyebab:
• Koneksi internet bermasalah
• API key tidak valid
• Server cuaca sedang down

🔄 Silakan coba lagi nanti`;
    }
}

// Fungsi simulasi cuaca (backup ketika API key belum diatur)
function getSimulatedWeather(city) {
    const weatherData = {
        'jakarta': {
            city: 'Jakarta',
            temp: 32,
            humidity: 75,
            wind: 12,
            condition: 'Berawan',
            sunrise: '06:00',
            sunset: '18:30'
        },
        'bandung': {
            city: 'Bandung',
            temp: 25,
            humidity: 80,
            wind: 8,
            condition: 'Cerah',
            sunrise: '06:10',
            sunset: '18:25'
        },
        'surabaya': {
            city: 'Surabaya',
            temp: 30,
            humidity: 70,
            wind: 15,
            condition: 'Hujan Ringan',
            sunrise: '05:45',
            sunset: '18:35'
        },
        'yogyakarta': {
            city: 'Yogyakarta',
            temp: 28,
            humidity: 65,
            wind: 10,
            condition: 'Cerah Berawan',
            sunrise: '06:05',
            sunset: '18:30'
        },
        'bali': {
            city: 'Bali',
            temp: 29,
            humidity: 78,
            wind: 14,
            condition: 'Cerah',
            sunrise: '06:20',
            sunset: '18:45'
        },
        'medan': {
            city: 'Medan',
            temp: 31,
            humidity: 82,
            wind: 11,
            condition: 'Hujan Sedang',
            sunrise: '06:30',
            sunset: '18:50'
        }
    };
    
    const normalizedCity = city.toLowerCase().trim();
    const weather = weatherData[normalizedCity];
    
    if (!weather) {
        return `❌ **Data cuaca untuk "${city}" tidak tersedia**
        
🌍 **Kota yang tersedia (simulasi):**
• Jakarta
• Bandung  
• Surabaya
• Yogyakarta
• Bali
• Medan

💡 **Untuk data real-time semua kota:**
1. Daftar di openweathermap.org
2. Dapatkan API key gratis
3. Ganti API_KEY di file weather-api.js
4. Restart bot

🌤️ **Fitur API Real:**
• 200,000+ kota di seluruh dunia
• Data cuaca real-time
• Prakiraan 5 hari
• Peta cuaca interaktif`;
    }
    
    return `🌤️ **Cuaca ${weather.city}** *(Simulasi)*

🌡️ **Suhu:** ${weather.temp}°C
💧 **Kelembaban:** ${weather.humidity}%
💨 **Angin:** ${weather.wind} km/jam
☁️ **Kondisi:** ${weather.condition}

🌅 **Sunrise:** ${weather.sunrise}
🌇 **Sunset:** ${weather.sunset}

⏰ **Update:** ${new Date().toLocaleString('id-ID')}

💡 *Data simulasi - untuk data real-time dari 200,000+ kota, setup API key OpenWeatherMap*`;
}

// Fungsi untuk setup API key
function setupWeatherAPI(apiKey) {
    WEATHER_CONFIG.API_KEY = apiKey;
    console.log('✅ Weather API key berhasil di-setup!');
}

// Export functions
module.exports = {
    getRealWeatherInfo,
    getSimulatedWeather,
    setupWeatherAPI
};
