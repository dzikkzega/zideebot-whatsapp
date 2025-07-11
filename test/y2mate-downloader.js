// y2mate-downloader.js - YouTube Downloader menggunakan Y2mate API (Fixed Version)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Konfigurasi download
const DOWNLOAD_CONFIG = {
    downloadPath: './downloads',
    maxFileSize: 25 * 1024 * 1024, // 25MB untuk WhatsApp
    downloadTimeout: 30 * 1000, // 30 detik
    retryAttempts: 2,
    
    // Y2mate API endpoints - menggunakan domain yang berbeda untuk stabilitas
    apiBase: 'https://www.y2mate.com',
    analyzeEndpoint: '/mates/analyzeV2/ajax',
    convertEndpoint: '/mates/convertV2/index',
    
    // User agent untuk bypass
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

// Extract video ID dari URL
function extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

// Fungsi untuk mendapatkan info video dari y2mate (Fixed Version)
async function getVideoInfoY2mate(url) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error('Video ID tidak dapat diekstrak dari URL');
        }

        console.log('🔍 Getting video info from Y2mate API...');
        
        // Gunakan URLSearchParams untuk form data yang proper
        const formData = new URLSearchParams();
        formData.append('k_query', url);
        formData.append('k_page', 'home');
        formData.append('hl', 'en');
        formData.append('q_auto', '0');
        
        // Step 1: Analyze video dengan endpoint yang lebih stabil
        const analyzeResponse = await axios.post(`${DOWNLOAD_CONFIG.apiBase}/mates/analyzeV2/ajax`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': DOWNLOAD_CONFIG.userAgent,
                'Referer': DOWNLOAD_CONFIG.apiBase + '/',
                'Origin': DOWNLOAD_CONFIG.apiBase,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            timeout: DOWNLOAD_CONFIG.downloadTimeout
        });

        console.log('📊 Y2mate response status:', analyzeResponse.status);
        console.log('📊 Y2mate response data keys:', Object.keys(analyzeResponse.data));

        if (!analyzeResponse.data || analyzeResponse.data.status !== 'ok') {
            console.error('❌ Y2mate analyze failed:', analyzeResponse.data);
            throw new Error(`API Error: ${analyzeResponse.data?.mess || 'Unknown error'}`);
        }

        const result = analyzeResponse.data.result;
        
        if (!result) {
            throw new Error('No result data from Y2mate API');
        }

        // Extract info dari hasil analyze
        const videoInfo = {
            title: result.title || 'Unknown Title',
            duration: result.t || '0:00',
            author: result.a || 'Unknown Channel',
            videoId: videoId,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            formats: {
                mp4: [],
                mp3: []
            }
        };

        // Parse available formats dengan error handling
        try {
            if (result.links) {
                if (result.links.mp4) {
                    Object.entries(result.links.mp4).forEach(([quality, data]) => {
                        if (data && data.k) {
                            videoInfo.formats.mp4.push({
                                quality: quality,
                                size: data.size || 'Unknown',
                                key: data.k
                            });
                        }
                    });
                }

                if (result.links.mp3) {
                    Object.entries(result.links.mp3).forEach(([quality, data]) => {
                        if (data && data.k) {
                            videoInfo.formats.mp3.push({
                                quality: quality,
                                size: data.size || 'Unknown',
                                key: data.k
                            });
                        }
                    });
                }
            }
        } catch (formatError) {
            console.error('⚠️ Error parsing formats:', formatError);
        }

        console.log('✅ Video info retrieved:', videoInfo.title);
        console.log('📊 Available formats - MP4:', videoInfo.formats.mp4.length, 'MP3:', videoInfo.formats.mp3.length);
        
        return videoInfo;

    } catch (error) {
        console.error('❌ Error getting video info:', error.message);
        
        // Enhanced error messages
        if (error.code === 'ENOTFOUND') {
            throw new Error('Koneksi internet bermasalah atau Y2mate tidak dapat diakses');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - coba lagi dalam beberapa saat');
        } else if (error.response) {
            throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
        }
        
        throw new Error(`Gagal mendapatkan info video: ${error.message}`);
    }
}

// Fungsi untuk download dari y2mate (Fixed Version)
async function downloadFromY2mate(videoInfo, format = 'mp4', quality = 'auto') {
    try {
        console.log(`📥 Starting download: ${format.toUpperCase()} - ${quality}`);
        
        // Pilih format yang tersedia
        let selectedFormat;
        if (format === 'mp4' && videoInfo.formats.mp4.length > 0) {
            // Untuk MP4, pilih quality terendah untuk ukuran kecil
            selectedFormat = videoInfo.formats.mp4.find(f => f.quality === '360p') || 
                           videoInfo.formats.mp4.find(f => f.quality === '480p') ||
                           videoInfo.formats.mp4.find(f => f.quality === '720p') ||
                           videoInfo.formats.mp4[0];
        } else if (format === 'mp3' && videoInfo.formats.mp3.length > 0) {
            // Untuk MP3, pilih 128kbps
            selectedFormat = videoInfo.formats.mp3.find(f => f.quality === '128') ||
                           videoInfo.formats.mp3.find(f => f.quality === '192') ||
                           videoInfo.formats.mp3[0];
        }

        if (!selectedFormat || !selectedFormat.key) {
            throw new Error(`Format ${format.toUpperCase()} tidak tersedia atau tidak memiliki key`);
        }

        console.log(`📊 Selected: ${selectedFormat.quality} (${selectedFormat.size})`);

        // Step 2: Convert video dengan parameter yang benar
        const convertFormData = new URLSearchParams();
        convertFormData.append('vid', videoInfo.videoId);
        convertFormData.append('k', selectedFormat.key);
        
        const convertResponse = await axios.post(`${DOWNLOAD_CONFIG.apiBase}/mates/convertV2/index`, convertFormData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': DOWNLOAD_CONFIG.userAgent,
                'Referer': DOWNLOAD_CONFIG.apiBase + '/',
                'Origin': DOWNLOAD_CONFIG.apiBase,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            },
            timeout: DOWNLOAD_CONFIG.downloadTimeout * 2 // Double timeout for conversion
        });

        console.log('🔄 Convert response status:', convertResponse.status);
        console.log('🔄 Convert response data:', convertResponse.data);

        if (!convertResponse.data || convertResponse.data.status !== 'ok') {
            console.error('❌ Y2mate convert failed:', convertResponse.data);
            throw new Error(`Convert Error: ${convertResponse.data?.mess || 'Conversion failed'}`);
        }

        const downloadUrl = convertResponse.data.result;
        if (!downloadUrl) {
            throw new Error('URL download tidak ditemukan dalam response');
        }

        console.log('📥 Download URL obtained, starting file download...');

        // Step 3: Download file
        const cleanTitle = videoInfo.title.replace(/[^\w\s-]/g, '').substring(0, 30);
        const filename = `${cleanTitle}_${Date.now()}.${format}`;
        const filepath = path.join(DOWNLOAD_CONFIG.downloadPath, filename);

        const fileResponse = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            timeout: DOWNLOAD_CONFIG.downloadTimeout * 5, // Longer timeout for file download
            headers: {
                'User-Agent': DOWNLOAD_CONFIG.userAgent,
                'Referer': DOWNLOAD_CONFIG.apiBase + '/'
            }
        });

        const writer = fs.createWriteStream(filepath);
        let downloadedBytes = 0;

        fileResponse.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
            
            // Check file size limit
            if (downloadedBytes > DOWNLOAD_CONFIG.maxFileSize) {
                writer.destroy();
                fs.unlink(filepath, () => {});
                throw new Error(`❌ File terlalu besar: ${downloadedMB} MB (max: 25 MB)`);
            }
            
            // Progress indicator
            if (downloadedBytes % (1024 * 1024) === 0) { // Every MB
                console.log(`📥 Downloaded: ${downloadedMB} MB`);
            }
        });

        fileResponse.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(filepath);
                const fileSizeMB = (stats.size / 1024 / 1024).toFixed(1);
                
                console.log(`✅ Download completed: ${filename}`);
                console.log(`📊 Final size: ${fileSizeMB} MB`);
                
                resolve({
                    success: true,
                    filepath: filepath,
                    filename: filename,
                    fileSize: fileSizeMB,
                    title: videoInfo.title,
                    author: videoInfo.author,
                    duration: videoInfo.duration,
                    format: format.toUpperCase(),
                    quality: selectedFormat.quality
                });
            });

            writer.on('error', (error) => {
                fs.unlink(filepath, () => {});
                reject(new Error(`Gagal menyimpan file: ${error.message}`));
            });

            fileResponse.data.on('error', (error) => {
                writer.destroy();
                fs.unlink(filepath, () => {});
                reject(new Error(`Gagal download file: ${error.message}`));
            });

            // Add timeout for file download
            setTimeout(() => {
                if (!writer.destroyed) {
                    writer.destroy();
                    fs.unlink(filepath, () => {});
                    reject(new Error('Download timeout - file terlalu lama diunduh'));
                }
            }, DOWNLOAD_CONFIG.downloadTimeout * 4);
        });

    } catch (error) {
        console.error('❌ Download error:', error.message);
        throw error;
    }
}

// Main download function
async function downloadYouTubeVideo(url, options = {}) {
    try {
        if (!isValidYouTubeUrl(url)) {
            throw new Error('URL YouTube tidak valid');
        }

        const format = options.format || 'mp4'; // mp4 atau mp3
        const videoInfo = await getVideoInfoY2mate(url);
        
        // Check duration (convert mm:ss to seconds)
        const [minutes, seconds] = videoInfo.duration.split(':').map(Number);
        const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
        
        if (totalSeconds > 600) { // 10 menit
            throw new Error(`❌ Video terlalu panjang!\n\n📏 Durasi: ${videoInfo.duration}\n⚠️ Maksimum: 10:00\n\n💡 Coba video yang lebih pendek.`);
        }

        return await downloadFromY2mate(videoInfo, format, options.quality);

    } catch (error) {
        console.error('❌ YouTube download error:', error);
        throw error;
    }
}

// Get video info only
async function getVideoInfo(url) {
    try {
        if (!isValidYouTubeUrl(url)) {
            throw new Error('URL YouTube tidak valid');
        }

        const videoInfo = await getVideoInfoY2mate(url);
        
        return {
            title: videoInfo.title,
            duration: videoInfo.duration,
            author: videoInfo.author,
            thumbnail: videoInfo.thumbnail,
            availableFormats: {
                mp4: videoInfo.formats.mp4.map(f => `${f.quality} (${f.size})`),
                mp3: videoInfo.formats.mp3.map(f => `${f.quality}kbps (${f.size})`)
            }
        };

    } catch (error) {
        console.error('❌ Error getting video info:', error);
        throw error;
    }
}

// Cleanup functions
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
