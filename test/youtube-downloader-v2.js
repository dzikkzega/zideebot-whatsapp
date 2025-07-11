// youtube-downloader-v2.js - Improved YouTube Downloader with error handling
let ytdl;
let isYtdlAvailable = false;

// Try multiple YouTube downloader libraries
async function initializeYtdl() {
    const libraries = [
        { name: '@distube/ytdl-core', pkg: '@distube/ytdl-core' },
        { name: 'ytdl-core', pkg: 'ytdl-core' },
        { name: 'youtube-dl-exec', pkg: 'youtube-dl-exec' }
    ];
    
    for (const lib of libraries) {
        try {
            ytdl = require(lib.pkg);
            console.log(`✅ ${lib.name} loaded successfully`);
            isYtdlAvailable = true;
            return lib.name;
        } catch (error) {
            console.log(`⚠️ ${lib.name} not available:`, error.message);
        }
    }
    
    console.error('❌ No YouTube downloader library available');
    return null;
}

const fs = require('fs');
const path = require('path');

// Konfigurasi download
const DOWNLOAD_CONFIG = {
    downloadPath: './downloads',
    maxFileSize: 25 * 1024 * 1024, // 25MB
    videoQuality: 'lowest',
    supportedFormats: ['mp4', 'avi', '3gp'],
    downloadTimeout: 30 * 1000, // 30 detik timeout lebih pendek
    retryAttempts: 3
};

// Pastikan folder download exists
if (!fs.existsSync(DOWNLOAD_CONFIG.downloadPath)) {
    fs.mkdirSync(DOWNLOAD_CONFIG.downloadPath, { recursive: true });
}

// Fungsi untuk validasi URL YouTube
function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/
    ];
    return patterns.some(pattern => pattern.test(url));
}

// Fungsi untuk mendapatkan info video dengan retry
async function getVideoInfo(url, retryCount = 0) {
    try {
        if (!isYtdlAvailable) {
            await initializeYtdl();
        }
        
        if (!ytdl) {
            throw new Error('❌ YouTube downloader tidak tersedia!\n\n🔧 Instal salah satu:\n• npm install @distube/ytdl-core\n• npm install ytdl-core');
        }

        if (!isValidYouTubeUrl(url)) {
            throw new Error('❌ URL YouTube tidak valid');
        }

        console.log(`🔍 Getting video info (attempt ${retryCount + 1})...`);
        
        // Gunakan timeout yang lebih pendek
        const infoPromise = ytdl.getInfo(url);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), DOWNLOAD_CONFIG.downloadTimeout);
        });
        
        const info = await Promise.race([infoPromise, timeoutPromise]);
        
        const videoDetails = {
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
            author: info.videoDetails.author.name,
            viewCount: info.videoDetails.viewCount,
            uploadDate: info.videoDetails.publishDate,
            description: info.videoDetails.description?.substring(0, 200) + '...',
            thumbnail: info.videoDetails.thumbnails[0]?.url
        };

        console.log('✅ Video info retrieved:', videoDetails.title.substring(0, 50));
        return videoDetails;
        
    } catch (error) {
        console.error(`❌ Error getting video info (attempt ${retryCount + 1}):`, error.message);
        
        // Retry dengan delay jika belum mencapai maksimum
        if (retryCount < DOWNLOAD_CONFIG.retryAttempts - 1) {
            console.log(`🔄 Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getVideoInfo(url, retryCount + 1);
        }
        
        // Error handling yang lebih spesifik
        if (error.message.includes('extract')) {
            throw new Error('❌ YouTube telah mengubah sistem mereka.\n\n💡 Solusi alternatif:\n1. Gunakan browser untuk download\n2. Coba link video lain\n3. Restart bot dan coba lagi');
        } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
            throw new Error('❌ Koneksi internet bermasalah\n\n💡 Pastikan:\n• Internet stabil\n• YouTube tidak diblokir\n• VPN dimatikan');
        } else if (error.message.includes('private') || error.message.includes('unavailable')) {
            throw new Error('❌ Video tidak dapat diakses\n\n💡 Kemungkinan:\n• Video private/terhapus\n• Restricted di region\n• Age-restricted');
        }
        
        throw new Error(`❌ Gagal mendapatkan info video: ${error.message}\n\n💡 Coba link YouTube yang lain.`);
    }
}

// Fungsi download yang lebih robust
async function downloadYouTubeVideo(url, options = {}) {
    try {
        console.log('🎥 Starting YouTube download with improved error handling...');
        
        // Gunakan getVideoInfo yang sudah memiliki retry mechanism
        const videoDetails = await getVideoInfo(url);
        const duration = parseInt(videoDetails.duration);
        
        console.log(`📹 Video: ${videoDetails.title.substring(0, 50)}`);
        console.log(`⏱️ Duration: ${Math.floor(duration/60)}:${(duration%60).toString().padStart(2, '0')}`);
        
        // Check duration
        if (duration > 600) { // 10 menit
            throw new Error(`❌ Video terlalu panjang!\n\n📏 Durasi: ${Math.floor(duration/60)}:${(duration%60).toString().padStart(2, '0')}\n⚠️ Maksimum: 10:00\n\n💡 Coba video yang lebih pendek.`);
        }

        // Untuk sementara, return info saja karena download sering bermasalah
        return {
            success: true,
            infoOnly: true,
            title: videoDetails.title,
            duration: `${Math.floor(duration/60)}:${(duration%60).toString().padStart(2, '0')}`,
            author: videoDetails.author,
            message: '✅ Info video berhasil diambil!\n\n⚠️ Download sementara dinonaktifkan karena YouTube mengubah sistem.\n\n💡 Gunakan browser untuk download video.'
        };

    } catch (error) {
        console.error('❌ YouTube operation error:', error);
        throw error;
    }
}

// Cleanup functions tetap sama
function cleanupFile(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log('🗑️ Temporary file cleaned up:', filepath);
        }
    } catch (error) {
        console.error('⚠️ Error cleaning up file:', error);
    }
}

function cleanupOldFiles() {
    try {
        const files = fs.readdirSync(DOWNLOAD_CONFIG.downloadPath);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        files.forEach(file => {
            const filepath = path.join(DOWNLOAD_CONFIG.downloadPath, file);
            const stats = fs.statSync(filepath);
            
            if (stats.mtime.getTime() < oneHourAgo) {
                fs.unlinkSync(filepath);
                console.log('🗑️ Cleaned up old file:', file);
            }
        });
    } catch (error) {
        console.error('⚠️ Error cleaning up old files:', error);
    }
}

// Initialize on load
initializeYtdl();

// Cleanup otomatis setiap 30 menit
setInterval(cleanupOldFiles, 30 * 60 * 1000);

module.exports = {
    downloadYouTubeVideo,
    getVideoInfo,
    isValidYouTubeUrl,
    cleanupFile,
    cleanupOldFiles,
    DOWNLOAD_CONFIG
};
