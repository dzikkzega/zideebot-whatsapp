// youtube-downloader.js - YouTube Video Downloader
let ytdl;
try {
    ytdl = require('@distube/ytdl-core');
    console.log('✅ @distube/ytdl-core loaded successfully');
} catch (error) {
    console.error('❌ Failed to load @distube/ytdl-core:', error.message);
    console.log('💡 Please run: npm install @distube/ytdl-core');
}

const fs = require('fs');
const path = require('path');

// Konfigurasi download
const DOWNLOAD_CONFIG = {
    // Folder tempat menyimpan video
    downloadPath: './downloads',
    
    // Maksimum ukuran file (25MB untuk WhatsApp)
    maxFileSize: 25 * 1024 * 1024, // 25MB
    
    // Quality options
    videoQuality: 'lowest', // 'highest', 'lowest', 'highestvideo', 'lowestvideo'
    
    // Format yang didukung WhatsApp
    supportedFormats: ['mp4', 'avi', '3gp'],
    
    // Timeout download (5 menit)
    downloadTimeout: 5 * 60 * 1000
};

// Pastikan folder download exists
if (!fs.existsSync(DOWNLOAD_CONFIG.downloadPath)) {
    fs.mkdirSync(DOWNLOAD_CONFIG.downloadPath, { recursive: true });
}

// Fungsi untuk validasi URL YouTube
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/;
    return youtubeRegex.test(url);
}

// Fungsi untuk mendapatkan info video
async function getVideoInfo(url) {
    try {
        // Check if ytdl is available
        if (!ytdl) {
            throw new Error('@distube/ytdl-core module tidak tersedia. Jalankan: npm install @distube/ytdl-core');
        }

        if (!isValidYouTubeUrl(url)) {
            throw new Error('URL YouTube tidak valid');
        }

        console.log('🔍 Getting video info for:', url);
        const info = await ytdl.getInfo(url);
        
        const videoDetails = {
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
            author: info.videoDetails.author.name,
            viewCount: info.videoDetails.viewCount,
            uploadDate: info.videoDetails.publishDate,
            description: info.videoDetails.description?.substring(0, 200) + '...',
            thumbnail: info.videoDetails.thumbnails[0]?.url
        };

        console.log('✅ Video info retrieved:', videoDetails.title);
        return videoDetails;
        
    } catch (error) {
        console.error('❌ Error getting video info:', error.message);
        throw new Error(`Gagal mendapatkan info video: ${error.message}`);
    }
}

// Fungsi untuk download video YouTube
async function downloadYouTubeVideo(url, options = {}) {
    try {
        // Check if ytdl is available
        if (!ytdl) {
            throw new Error('❌ @distube/ytdl-core module tidak tersedia!\n\n🔧 Solusi:\n1. Jalankan: npm install @distube/ytdl-core\n2. Restart bot\n3. Coba lagi');
        }

        console.log('🎥 Starting YouTube download:', url);
        
        // Validasi URL
        if (!isValidYouTubeUrl(url)) {
            throw new Error('❌ URL YouTube tidak valid!\n\nContoh URL yang benar:\n• https://youtube.com/watch?v=VIDEO_ID\n• https://youtu.be/VIDEO_ID');
        }

        // Get video info
        const info = await ytdl.getInfo(url);
        const videoTitle = info.videoDetails.title.replace(/[^\w\s-]/g, '').substring(0, 50);
        const duration = parseInt(info.videoDetails.lengthSeconds);
        
        console.log(`📹 Video: ${videoTitle}`);
        console.log(`⏱️ Duration: ${Math.floor(duration/60)}:${duration%60} minutes`);
        
        // Check video duration (max 10 menit untuk WhatsApp)
        if (duration > 600) { // 10 menit
            throw new Error(`❌ Video terlalu panjang!\n\n📏 Durasi: ${Math.floor(duration/60)}:${duration%60}\n⚠️ Maksimum: 10 menit\n\n💡 Coba video yang lebih pendek.`);
        }

        // Get available formats
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        
        if (formats.length === 0) {
            throw new Error('❌ Tidak ada format video yang tersedia');
        }

        // Pilih format terbaik untuk WhatsApp (quality rendah agar ukuran kecil)
        const format = ytdl.chooseFormat(formats, { 
            quality: options.quality || DOWNLOAD_CONFIG.videoQuality,
            filter: 'videoandaudio'
        });

        console.log(`📊 Selected format: ${format.qualityLabel} (${format.container})`);

        // Generate filename
        const filename = `${videoTitle}_${Date.now()}.${format.container}`;
        const filepath = path.join(DOWNLOAD_CONFIG.downloadPath, filename);

        console.log('⬇️ Starting download...');
        
        // Download dengan progress tracking
        return new Promise((resolve, reject) => {
            const downloadStream = ytdl(url, { format: format });
            const writeStream = fs.createWriteStream(filepath);
            
            let downloadedBytes = 0;
            let totalBytes = parseInt(format.contentLength || 0);
            
            // Timeout untuk download
            const timeout = setTimeout(() => {
                downloadStream.destroy();
                writeStream.destroy();
                fs.unlink(filepath, () => {});
                reject(new Error('❌ Download timeout (lebih dari 5 menit)'));
            }, DOWNLOAD_CONFIG.downloadTimeout);

            downloadStream.on('progress', (chunkLength, downloaded, total) => {
                downloadedBytes = downloaded;
                totalBytes = total;
                
                const percent = ((downloaded / total) * 100).toFixed(1);
                const downloadedMB = (downloaded / 1024 / 1024).toFixed(1);
                const totalMB = (total / 1024 / 1024).toFixed(1);
                
                console.log(`📥 Progress: ${percent}% (${downloadedMB}/${totalMB} MB)`);
                
                // Check file size limit
                if (downloaded > DOWNLOAD_CONFIG.maxFileSize) {
                    downloadStream.destroy();
                    writeStream.destroy();
                    fs.unlink(filepath, () => {});
                    clearTimeout(timeout);
                    reject(new Error(`❌ File terlalu besar!\n\n📊 Ukuran: ${downloadedMB} MB\n⚠️ Maksimum: 25 MB\n\n💡 Coba video dengan quality lebih rendah.`));
                }
            });

            downloadStream.on('error', (error) => {
                console.error('❌ Download error:', error);
                writeStream.destroy();
                fs.unlink(filepath, () => {});
                clearTimeout(timeout);
                reject(new Error(`❌ Gagal download: ${error.message}`));
            });

            writeStream.on('error', (error) => {
                console.error('❌ Write error:', error);
                downloadStream.destroy();
                fs.unlink(filepath, () => {});
                clearTimeout(timeout);
                reject(new Error(`❌ Gagal menyimpan file: ${error.message}`));
            });

            writeStream.on('finish', () => {
                clearTimeout(timeout);
                
                // Check final file size
                const stats = fs.statSync(filepath);
                const fileSizeMB = (stats.size / 1024 / 1024).toFixed(1);
                
                console.log(`✅ Download completed!`);
                console.log(`📁 File: ${filename}`);
                console.log(`📊 Size: ${fileSizeMB} MB`);
                
                if (stats.size > DOWNLOAD_CONFIG.maxFileSize) {
                    fs.unlink(filepath, () => {});
                    reject(new Error(`❌ File terlalu besar: ${fileSizeMB} MB\n⚠️ Maksimum: 25 MB`));
                    return;
                }

                resolve({
                    success: true,
                    filepath: filepath,
                    filename: filename,
                    fileSize: fileSizeMB,
                    duration: Math.floor(duration/60) + ':' + (duration%60).toString().padStart(2, '0'),
                    title: info.videoDetails.title,
                    author: info.videoDetails.author.name
                });
            });

            downloadStream.pipe(writeStream);
        });

    } catch (error) {
        console.error('❌ YouTube download error:', error);
        throw error;
    }
}

// Fungsi untuk cleanup file setelah dikirim
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

// Fungsi untuk cleanup file lama (lebih dari 1 jam)
function cleanupOldFiles() {
    try {
        const files = fs.readdirSync(DOWNLOAD_CONFIG.downloadPath);
        const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 jam
        
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

// Cleanup otomatis setiap 30 menit
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Export functions
module.exports = {
    downloadYouTubeVideo,
    getVideoInfo,
    isValidYouTubeUrl,
    cleanupFile,
    cleanupOldFiles,
    DOWNLOAD_CONFIG
};
