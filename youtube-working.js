// youtube-working.js - Working YouTube downloader using alternative approach
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Konfigurasi
const CONFIG = {
    downloadPath: './downloads',
    maxFileSize: 25 * 1024 * 1024,
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Pastikan folder download exists
if (!fs.existsSync(CONFIG.downloadPath)) {
    fs.mkdirSync(CONFIG.downloadPath, { recursive: true });
}

function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/
    ];
    return patterns.some(pattern => pattern.test(url));
}

function extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

// Working Y2mate API call
async function getVideoInfoWorking(url) {
    try {
        if (!isValidYouTubeUrl(url)) {
            throw new Error('URL YouTube tidak valid');
        }

        const videoId = extractVideoId(url);
        console.log('🔍 Getting video info for:', videoId);

        // Try Y2mate with correct parameters
        const response = await axios.post('https://www.y2mate.com/mates/analyze/ajax', 
            `url=${encodeURIComponent(url)}&q_auto=0&ajax=1`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': CONFIG.userAgent,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.y2mate.com/',
                'Origin': 'https://www.y2mate.com',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: CONFIG.timeout
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response data status:', response.data?.status);

        if (response.data && response.data.status === 'ok' && response.data.result) {
            const result = response.data.result;
            
            const videoInfo = {
                title: result.title || `Video ${videoId}`,
                duration: result.t || 'Unknown',
                author: result.a || 'Unknown Channel',
                videoId: videoId,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                mp4Formats: [],
                mp3Formats: []
            };

            // Parse formats jika ada
            if (result.links) {
                if (result.links.mp4) {
                    Object.entries(result.links.mp4).forEach(([quality, data]) => {
                        if (data && data.k) {
                            videoInfo.mp4Formats.push({
                                quality,
                                size: data.size || 'Unknown',
                                key: data.k
                            });
                        }
                    });
                }

                if (result.links.mp3) {
                    Object.entries(result.links.mp3).forEach(([quality, data]) => {
                        if (data && data.k) {
                            videoInfo.mp3Formats.push({
                                quality,
                                size: data.size || 'Unknown',
                                key: data.k
                            });
                        }
                    });
                }
            }

            console.log('✅ Video info success:', videoInfo.title);
            console.log('📊 MP4 formats:', videoInfo.mp4Formats.length);
            console.log('📊 MP3 formats:', videoInfo.mp3Formats.length);

            return videoInfo;
        } else {
            throw new Error(`API Error: ${response.data?.mess || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('❌ API Error:', error.message);
        if (error.response) {
            console.error('❌ Response status:', error.response.status);
            console.error('❌ Response data:', error.response.data);
        }
        throw error;
    }
}

// Working download function
async function downloadVideo(url, format = 'mp4') {
    try {
        console.log(`🎯 Starting ${format.toUpperCase()} download...`);
        
        const videoInfo = await getVideoInfoWorking(url);
        
        // Pilih format
        let selectedFormat;
        if (format === 'mp4' && videoInfo.mp4Formats.length > 0) {
            selectedFormat = videoInfo.mp4Formats.find(f => f.quality === '360p') ||
                           videoInfo.mp4Formats.find(f => f.quality === '480p') ||
                           videoInfo.mp4Formats[0];
        } else if (format === 'mp3' && videoInfo.mp3Formats.length > 0) {
            selectedFormat = videoInfo.mp3Formats.find(f => f.quality === '128') ||
                           videoInfo.mp3Formats[0];
        }

        if (!selectedFormat) {
            throw new Error(`Format ${format.toUpperCase()} tidak tersedia`);
        }

        console.log(`📊 Selected format: ${selectedFormat.quality} (${selectedFormat.size})`);

        // Convert dengan Y2mate
        const convertResponse = await axios.post('https://www.y2mate.com/mates/convert', 
            `type=youtube&_id=${selectedFormat.key}&v_id=${videoInfo.videoId}&ajax=1&token=&ftype=${format}&fquality=${selectedFormat.quality}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': CONFIG.userAgent,
                'Accept': '*/*',
                'Referer': 'https://www.y2mate.com/',
                'Origin': 'https://www.y2mate.com',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: CONFIG.timeout * 2
        });

        console.log('🔄 Convert status:', convertResponse.data?.status);

        if (convertResponse.data && convertResponse.data.status === 'ok') {
            const downloadUrl = convertResponse.data.result;
            
            if (!downloadUrl) {
                throw new Error('Download URL tidak ditemukan');
            }

            console.log('📥 Download URL obtained, starting file download...');

            // Download file
            const cleanTitle = videoInfo.title.replace(/[^\w\s-]/g, '').substring(0, 30);
            const filename = `${cleanTitle}_${Date.now()}.${format}`;
            const filepath = path.join(CONFIG.downloadPath, filename);

            const fileResponse = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream',
                timeout: CONFIG.timeout * 4,
                headers: {
                    'User-Agent': CONFIG.userAgent,
                    'Referer': 'https://www.y2mate.com/'
                }
            });

            const writer = fs.createWriteStream(filepath);
            let downloadedBytes = 0;

            fileResponse.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
                
                if (downloadedBytes > CONFIG.maxFileSize) {
                    writer.destroy();
                    fs.unlink(filepath, () => {});
                    throw new Error(`File terlalu besar: ${downloadedMB} MB (max: 25 MB)`);
                }
                
                if (downloadedBytes % (1024 * 1024) === 0) {
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
                    reject(new Error(`File write error: ${error.message}`));
                });

                fileResponse.data.on('error', (error) => {
                    writer.destroy();
                    fs.unlink(filepath, () => {});
                    reject(new Error(`Download error: ${error.message}`));
                });

                // Timeout untuk download
                setTimeout(() => {
                    if (!writer.destroyed) {
                        writer.destroy();
                        fs.unlink(filepath, () => {});
                        reject(new Error('Download timeout'));
                    }
                }, CONFIG.timeout * 3);
            });

        } else {
            throw new Error(`Convert failed: ${convertResponse.data?.mess || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('❌ Download error:', error.message);
        throw error;
    }
}

// Main functions untuk export
async function downloadYouTubeVideo(url, options = {}) {
    const format = options.format || 'mp4';
    return await downloadVideo(url, format);
}

async function getVideoInfo(url) {
    const info = await getVideoInfoWorking(url);
    return {
        title: info.title,
        duration: info.duration,
        author: info.author,
        thumbnail: info.thumbnail,
        availableFormats: {
            mp4: info.mp4Formats.map(f => `${f.quality} (${f.size})`),
            mp3: info.mp3Formats.map(f => `${f.quality}kbps (${f.size})`)
        }
    };
}

function cleanupFile(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log('🗑️ File cleaned up:', filepath);
        }
    } catch (error) {
        console.error('⚠️ Cleanup error:', error);
    }
}

function cleanupOldFiles() {
    try {
        const files = fs.readdirSync(CONFIG.downloadPath);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        files.forEach(file => {
            const filepath = path.join(CONFIG.downloadPath, file);
            const stats = fs.statSync(filepath);
            
            if (stats.mtime.getTime() < oneHourAgo) {
                fs.unlinkSync(filepath);
                console.log('🗑️ Cleaned old file:', file);
            }
        });
    } catch (error) {
        console.error('⚠️ Cleanup error:', error);
    }
}

// Auto cleanup
setInterval(cleanupOldFiles, 30 * 60 * 1000);

module.exports = {
    downloadYouTubeVideo,
    getVideoInfo,
    isValidYouTubeUrl,
    cleanupFile,
    cleanupOldFiles,
    DOWNLOAD_CONFIG: CONFIG
};
