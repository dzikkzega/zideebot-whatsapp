// open-meteo-api.js - Free Weather API Integration
const axios = require('axios');

// Database koordinat kota-kota populer
const CITY_COORDINATES = {
    // Indonesia
    'jakarta': { lat: -6.2088, lon: 106.8456, name: 'Jakarta' },
    'bandung': { lat: -6.9175, lon: 107.6191, name: 'Bandung' },
    'surabaya': { lat: -7.2575, lon: 112.7521, name: 'Surabaya' },
    'yogyakarta': { lat: -7.7956, lon: 110.3695, name: 'Yogyakarta' },
    'medan': { lat: 3.5952, lon: 98.6722, name: 'Medan' },
    'semarang': { lat: -6.9667, lon: 110.4167, name: 'Semarang' },
    'makassar': { lat: -5.1477, lon: 119.4327, name: 'Makassar' },
    'palembang': { lat: -2.9761, lon: 104.7754, name: 'Palembang' },
    'tangerang': { lat: -6.1783, lon: 106.6319, name: 'Tangerang' },
    'bekasi': { lat: -6.2383, lon: 106.9756, name: 'Bekasi' },
    'depok': { lat: -6.4025, lon: 106.7942, name: 'Depok' },
    'bogor': { lat: -6.5950, lon: 106.8167, name: 'Bogor' },
    'bali': { lat: -8.4095, lon: 115.1889, name: 'Bali (Denpasar)' },
    'denpasar': { lat: -8.4095, lon: 115.1889, name: 'Denpasar' },
    'batam': { lat: 1.0456, lon: 103.9915, name: 'Batam' },
    'balikpapan': { lat: -1.2379, lon: 116.8529, name: 'Balikpapan' },
    'pekanbaru': { lat: 0.5333, lon: 101.4500, name: 'Pekanbaru' },
    'banjarmasin': { lat: -3.3194, lon: 114.5906, name: 'Banjarmasin' },
    'samarinda': { lat: -0.4969, lon: 117.1436, name: 'Samarinda' },
    'pontianak': { lat: -0.0263, lon: 109.3425, name: 'Pontianak' },
    
    // International
    'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
    'kuala lumpur': { lat: 3.1390, lon: 101.6869, name: 'Kuala Lumpur' },
    'bangkok': { lat: 13.7563, lon: 100.5018, name: 'Bangkok' },
    'manila': { lat: 14.5995, lon: 120.9842, name: 'Manila' },
    'ho chi minh': { lat: 10.8231, lon: 106.6297, name: 'Ho Chi Minh City' },
    'hanoi': { lat: 21.0285, lon: 105.8542, name: 'Hanoi' },
    'phnom penh': { lat: 11.5449, lon: 104.8922, name: 'Phnom Penh' },
    'vientiane': { lat: 17.9757, lon: 102.6331, name: 'Vientiane' },
    'yangon': { lat: 16.8661, lon: 96.1951, name: 'Yangon' },
    'new delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },
    'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
    'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
    'seoul': { lat: 37.5665, lon: 126.9780, name: 'Seoul' },
    'beijing': { lat: 39.9042, lon: 116.4074, name: 'Beijing' },
    'shanghai': { lat: 31.2304, lon: 121.4737, name: 'Shanghai' },
    'hong kong': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong' },
    'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
    'melbourne': { lat: -37.8136, lon: 144.9631, name: 'Melbourne' },
    'perth': { lat: -31.9505, lon: 115.8605, name: 'Perth' },
    'auckland': { lat: -36.8485, lon: 174.7633, name: 'Auckland' },
    'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
    'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
    'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin' },
    'rome': { lat: 41.9028, lon: 12.4964, name: 'Rome' },
    'madrid': { lat: 40.4168, lon: -3.7038, name: 'Madrid' },
    'amsterdam': { lat: 52.3676, lon: 4.9041, name: 'Amsterdam' },
    'new york': { lat: 40.7128, lon: -74.0060, name: 'New York' },
    'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
    'chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago' },
    'miami': { lat: 25.7617, lon: -80.1918, name: 'Miami' },
    'toronto': { lat: 43.6532, lon: -79.3832, name: 'Toronto' },
    'vancouver': { lat: 49.2827, lon: -123.1207, name: 'Vancouver' },
    'mexico city': { lat: 19.4326, lon: -99.1332, name: 'Mexico City' },
    'sao paulo': { lat: -23.5558, lon: -46.6396, name: 'São Paulo' },
    'rio de janeiro': { lat: -22.9068, lon: -43.1729, name: 'Rio de Janeiro' },
    'buenos aires': { lat: -34.6118, lon: -58.3960, name: 'Buenos Aires' },
    'lima': { lat: -12.0464, lon: -77.0428, name: 'Lima' },
    'bogota': { lat: 4.7110, lon: -74.0721, name: 'Bogotá' },
    'cairo': { lat: 30.0444, lon: 31.2357, name: 'Cairo' },
    'johannesburg': { lat: -26.2041, lon: 28.0473, name: 'Johannesburg' },
    'lagos': { lat: 6.5244, lon: 3.3792, name: 'Lagos' },
    'nairobi': { lat: -1.2921, lon: 36.8219, name: 'Nairobi' },
    'casablanca': { lat: 33.5731, lon: -7.5898, name: 'Casablanca' },
    'dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai' },
    'riyadh': { lat: 24.7136, lon: 46.6753, name: 'Riyadh' },
    'doha': { lat: 25.2854, lon: 51.5310, name: 'Doha' },
    'kuwait city': { lat: 29.3759, lon: 47.9774, name: 'Kuwait City' },
    'tehran': { lat: 35.6892, lon: 51.3890, name: 'Tehran' },
    'istanbul': { lat: 41.0082, lon: 28.9784, name: 'Istanbul' },
    'moscow': { lat: 55.7558, lon: 37.6176, name: 'Moscow' },
    'st petersburg': { lat: 59.9311, lon: 30.3609, name: 'St. Petersburg' }
};

// Fungsi untuk mendapatkan weather code description
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Cerah ☀️',
        1: 'Cerah Sebagian ⛅',
        2: 'Berawan Sebagian ⛅',
        3: 'Berawan ☁️',
        45: 'Berkabut 🌫️',
        48: 'Berkabut dengan Embun Beku 🌫️❄️',
        51: 'Gerimis Ringan 🌦️',
        53: 'Gerimis Sedang 🌦️',
        55: 'Gerimis Lebat 🌧️',
        56: 'Gerimis Beku Ringan 🌦️❄️',
        57: 'Gerimis Beku Lebat 🌧️❄️',
        61: 'Hujan Ringan 🌧️',
        63: 'Hujan Sedang 🌧️',
        65: 'Hujan Lebat 🌧️',
        66: 'Hujan Beku Ringan 🌧️❄️',
        67: 'Hujan Beku Lebat 🌧️❄️',
        71: 'Salju Ringan 🌨️',
        73: 'Salju Sedang 🌨️',
        75: 'Salju Lebat 🌨️',
        77: 'Butiran Salju 🌨️',
        80: 'Hujan Rintik Ringan 🌦️',
        81: 'Hujan Rintik Sedang 🌧️',
        82: 'Hujan Rintik Lebat 🌧️',
        85: 'Hujan Salju Ringan 🌨️',
        86: 'Hujan Salju Lebat 🌨️',
        95: 'Badai Petir ⛈️',
        96: 'Badai Petir dengan Hujan Es Ringan ⛈️🧊',
        99: 'Badai Petir dengan Hujan Es Lebat ⛈️🧊'
    };
    return descriptions[code] || 'Tidak Diketahui ❓';
}

// Fungsi untuk mendapatkan cuaca real-time dari Open-Meteo API
async function getOpenMeteoWeather(cityName) {
    try {
        // Normalisasi nama kota
        const normalizedCity = cityName.toLowerCase().trim();
        
        // Cari koordinat kota
        const cityData = CITY_COORDINATES[normalizedCity];
        if (!cityData) {
            return getSupportedCitiesList(cityName);
        }
        
        // Request ke Open-Meteo API
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: cityData.lat,
                longitude: cityData.lon,
                current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m',
                hourly: 'temperature_2m,weather_code',
                daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code',
                timezone: 'auto',
                forecast_days: 1
            }
        });
        
        const data = response.data;
        const current = data.current;
        const daily = data.daily;
        
        // Format waktu
        const now = new Date();
        const sunrise = new Date(daily.sunrise[0]);
        const sunset = new Date(daily.sunset[0]);
        
        // Wind direction
        const windDirection = getWindDirection(current.wind_direction_10m);
        
        return `🌤️ **Cuaca ${cityData.name}** *(Real-time)*

🌡️ **Suhu Saat Ini:** ${Math.round(current.temperature_2m)}°C
🔥 **Terasa Seperti:** ${Math.round(current.apparent_temperature)}°C
🌡️ **Min/Max:** ${Math.round(daily.temperature_2m_min[0])}°C / ${Math.round(daily.temperature_2m_max[0])}°C
💧 **Kelembaban:** ${current.relative_humidity_2m}%
💨 **Angin:** ${current.wind_speed_10m} km/h ${windDirection}
🌧️ **Curah Hujan:** ${current.precipitation} mm
☁️ **Kondisi:** ${getWeatherDescription(current.weather_code)}

🌅 **Sunrise:** ${sunrise.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
🌇 **Sunset:** ${sunset.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}

⏰ **Update:** ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
📍 **Koordinat:** ${cityData.lat}°, ${cityData.lon}°

🌐 **Powered by Open-Meteo** (Free & Real-time)`;
        
    } catch (error) {
        console.error('Error fetching Open-Meteo weather:', error);
        return `❌ **Error mengambil data cuaca**

🔄 **Kemungkinan penyebab:**
• Koneksi internet bermasalah
• Server Open-Meteo sedang maintenance
• Koordinat kota tidak valid

💡 **Solusi:**
• Coba lagi dalam beberapa menit
• Pastikan koneksi internet stabil
• Coba kota lain yang tersedia

🌍 **Ketik "cuaca" untuk melihat daftar kota yang tersedia**`;
    }
}

// Fungsi untuk mendapatkan arah angin
function getWindDirection(degrees) {
    const directions = [
        'Utara ⬆️', 'Timur Laut ↗️', 'Timur ➡️', 'Tenggara ↘️',
        'Selatan ⬇️', 'Barat Daya ↙️', 'Barat ⬅️', 'Barat Laut ↖️'
    ];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Fungsi untuk menampilkan daftar kota yang didukung
function getSupportedCitiesList(requestedCity) {
    const indonesianCities = [
        'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan',
        'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Bekasi',
        'Depok', 'Bogor', 'Bali', 'Denpasar', 'Batam', 'Balikpapan',
        'Pekanbaru', 'Banjarmasin', 'Samarinda', 'Pontianak'
    ];
    
    const internationalCities = [
        'Singapore', 'Kuala Lumpur', 'Bangkok', 'Manila', 'Tokyo',
        'Seoul', 'Beijing', 'Shanghai', 'Hong Kong', 'Sydney',
        'London', 'Paris', 'New York', 'Los Angeles', 'Dubai'
    ];
    
    return `❌ **Kota "${requestedCity}" tidak ditemukan**

🇮🇩 **Kota Indonesia yang tersedia:**
${indonesianCities.map(city => `• ${city}`).join('\n')}

🌍 **Kota Internasional populer:**
${internationalCities.map(city => `• ${city}`).join('\n')}

💡 **Tips pencarian:**
• Gunakan nama kota yang lengkap
• Tidak perlu tanda baca atau aksen
• Contoh: "kuala lumpur", "new york", "ho chi minh"

🌤️ **Total ${Object.keys(CITY_COORDINATES).length} kota tersedia dengan data real-time!**

📝 **Contoh penggunaan:**
• cuaca Jakarta
• weather Singapore
• cuaca New York`;
}

// Fungsi untuk mendapatkan prakiraan cuaca 24 jam
async function getWeatherForecast(cityName) {
    try {
        const normalizedCity = cityName.toLowerCase().trim();
        const cityData = CITY_COORDINATES[normalizedCity];
        
        if (!cityData) {
            return getSupportedCitiesList(cityName);
        }
        
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: cityData.lat,
                longitude: cityData.lon,
                hourly: 'temperature_2m,weather_code',
                timezone: 'auto',
                forecast_days: 1
            }
        });
        
        const data = response.data;
        const hourly = data.hourly;
        
        // Ambil data 6 jam ke depan
        const forecastText = hourly.time.slice(0, 6).map((time, index) => {
            const hour = new Date(time).getHours();
            const temp = Math.round(hourly.temperature_2m[index]);
            const weather = getWeatherDescription(hourly.weather_code[index]);
            return `${hour}:00 - ${temp}°C ${weather}`;
        }).join('\n');
        
        return `🌤️ **Prakiraan Cuaca ${cityData.name}** *(6 jam ke depan)*

${forecastText}

⏰ **Update:** ${new Date().toLocaleString('id-ID')}
🌐 **Powered by Open-Meteo**`;
        
    } catch (error) {
        return '❌ Error mengambil prakiraan cuaca. Silakan coba lagi.';
    }
}

// Export functions
module.exports = {
    getOpenMeteoWeather,
    getWeatherForecast,
    getSupportedCitiesList,
    CITY_COORDINATES
};
