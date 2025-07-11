// dashboard.js - WhatsApp Bot Dashboard JavaScript
class BotDashboard {
    constructor() {
        this.socket = io();
        this.isConnected = false;
        this.botStatus = null;
        this.messageHistory = [];
        this.chatHistory = [];
        this.isTyping = false;
        
        this.init();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    init() {
        console.log('🚀 Initializing Bot Dashboard...');
        this.initTheme();
        this.loadStatus();
        this.loadMessages();
        this.setupNavigation();
        this.setupAIChatListeners();
        this.setupAIImageGenerator();
        this.setupAIMusicGenerator();
        this.showToast('Dashboard loaded successfully', 'success');
    }
    
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebarToggle && sidebar && sidebarOverlay) {
            // Toggle sidebar
            sidebarToggle.addEventListener('click', () => {
                const isOpen = sidebar.classList.contains('show');
                if (isOpen) {
                    this.closeSidebar();
                } else {
                    this.openSidebar();
                }
            });
            
            // Close sidebar when clicking overlay
            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
            
            // Close sidebar on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                    this.closeSidebar();
                }
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });
        
        // Forms
        this.setupForms();
        
        // Quick action buttons
        this.setupQuickActions();
        
        // Character counters
        this.setupCharacterCounters();
        
        // Theme toggle
        this.setupThemeToggle();
        
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadStatus();
            this.loadMessages();
            this.showToast('Data refreshed', 'info');
        });    }

    // AI Chat Functions
    setupAIChatListeners() {
        console.log('🤖 Setting up AI Chat listeners...');
        
        // Chat form submission
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        if (chatForm && chatInput) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
            
            // Send button click
            if (sendButton) {
                sendButton.addEventListener('click', () => {
                    this.sendChatMessage();
                });
            }
            
            // Enter key to send (without shift)
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                this.autoResizeTextarea(chatInput);
            });
        }
        
        // Quick command buttons
        const quickCommands = document.querySelectorAll('.quick-command');
        quickCommands.forEach(button => {
            button.addEventListener('click', () => {
                const command = button.dataset.command;
                this.sendQuickCommand(command);
            });
        });
        
        // Clear chat button
        const clearChatButton = document.getElementById('clearChatButton');
        if (clearChatButton) {
            clearChatButton.addEventListener('click', () => {
                this.clearChatHistory();
            });
        }
    }

    // AI Image Generator Methods
    setupAIImageGenerator() {
        console.log('🎨 Setting up AI Image Generator...');
        
        // Setup form submission
        const imageForm = document.getElementById('aiImageForm');
        if (imageForm) {
            imageForm.addEventListener('submit', (e) => this.handleImageGeneration(e));
        }

        // Setup quick prompt buttons
        const quickPrompts = document.querySelectorAll('.quick-prompt-btn');
        quickPrompts.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                const promptInput = document.getElementById('imagePrompt');
                if (promptInput) {
                    promptInput.value = prompt;
                }
            });
        });

        // Load saved images from localStorage
        this.loadImageHistory();
    }

    async handleImageGeneration(e) {
        e.preventDefault();
        
        const prompt = document.getElementById('imagePrompt').value.trim();
        const style = document.getElementById('imageStyle').value;
        const quality = document.getElementById('imageQuality').value;
        const negativePrompt = document.getElementById('negativePrompt').value.trim();
        
        if (!prompt) {
            this.showToast('Prompt tidak boleh kosong', 'error');
            return;
        }
        
        const generateBtn = document.getElementById('generateImageBtn');
        const generationStatus = document.getElementById('generationStatus');
        const originalText = generateBtn.textContent;
        
        try {
            // Show loading state
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Show generation status
            if (generationStatus) {
                generationStatus.classList.remove('d-none');
            }
            
            // Build full prompt
            let fullPrompt = prompt;
            if (style !== 'default') {
                fullPrompt += `, ${style} style`;
            }
            
            // Generate image using Pollinations.ai
            const imageUrl = await this.generateAIImage(fullPrompt, quality, negativePrompt);
            
            // Add to gallery
            this.addImageToGallery(imageUrl, prompt, style, quality);
            
            // Clear form
            document.getElementById('imagePrompt').value = '';
            document.getElementById('negativePrompt').value = '';
            
            this.showToast('Gambar berhasil dibuat!', 'success');
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.showToast('Gagal membuat gambar: ' + error.message, 'error');
        } finally {
            // Reset button
            generateBtn.disabled = false;
            generateBtn.textContent = originalText;
            
            // Hide generation status
            if (generationStatus) {
                generationStatus.classList.add('d-none');
            }
        }
    }

    async generateAIImage(prompt, quality = 'medium', negativePrompt = '') {
        const baseUrl = 'https://image.pollinations.ai/prompt/';
        const encodedPrompt = encodeURIComponent(prompt);
        
        // Build URL with parameters
        let imageUrl = `${baseUrl}${encodedPrompt}`;
        
        const params = new URLSearchParams();
        
        // Quality settings
        switch (quality) {
            case 'low':
                params.append('width', '512');
                params.append('height', '512');
                break;
            case 'high':
                params.append('width', '1024');
                params.append('height', '1024');
                break;
            default: // medium
                params.append('width', '768');
                params.append('height', '768');
        }
        
        // Add negative prompt if provided
        if (negativePrompt) {
            params.append('nologo', 'true');
            params.append('negative', negativePrompt);
        }
        
        // Add random seed for variety
        params.append('seed', Math.floor(Math.random() * 1000000));
        
        imageUrl += '?' + params.toString();
        
        // Test if image loads with timeout
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Set timeout for image loading (30 seconds)
            const timeout = setTimeout(() => {
                reject(new Error('Image generation timeout'));
            }, 30000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(imageUrl);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to generate image'));
            };
            
            img.src = imageUrl;
        });
    }

    addImageToGallery(imageUrl, prompt, style, quality) {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;
        
        // Remove "no images" placeholder if it exists
        const placeholder = gallery.querySelector('.text-center.text-muted');
        if (placeholder) {
            placeholder.remove();
        }
        
        const imageData = {
            url: imageUrl,
            prompt: prompt,
            style: style,
            quality: quality,
            timestamp: new Date().toISOString()
        };
        
        // Create image item
        const imageItem = document.createElement('div');
        imageItem.className = 'image-gallery-item';
        imageItem.innerHTML = `
            <img src="${imageUrl}" alt="${prompt}" loading="lazy">
            <div class="image-overlay">
                <div class="image-actions">
                    <button class="btn btn-sm btn-light" onclick="dashboard.viewImage('${imageUrl}', '${prompt}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-light" onclick="dashboard.downloadImage('${imageUrl}', '${prompt}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-light" onclick="dashboard.copyImageUrl('${imageUrl}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteImage(this, '${imageUrl}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="image-info">
                <div class="image-prompt">${prompt}</div>
                <div class="image-meta">${style} • ${quality}</div>
            </div>
        `;
        
        // Add to beginning of gallery
        gallery.insertBefore(imageItem, gallery.firstChild);
        
        // Save to localStorage
        this.saveImageToHistory(imageData);
    }

    viewImage(imageUrl, prompt) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const modalPrompt = document.getElementById('modalPrompt');
        
        if (modal && modalImage && modalPrompt) {
            modalImage.src = imageUrl;
            modalPrompt.textContent = prompt;
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    async downloadImage(imageUrl, prompt) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-image-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showToast('Gambar berhasil didownload', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Gagal download gambar', 'error');
        }
    }

    async copyImageUrl(imageUrl) {
        try {
            await navigator.clipboard.writeText(imageUrl);
            this.showToast('URL gambar disalin ke clipboard', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            this.showToast('Gagal menyalin URL', 'error');
        }
    }

    deleteImage(buttonElement, imageUrl) {
        if (confirm('Hapus gambar ini?')) {
            const imageItem = buttonElement.closest('.image-gallery-item');
            const gallery = document.getElementById('imageGallery');
            
            if (imageItem && gallery) {
                imageItem.remove();
                this.removeImageFromHistory(imageUrl);
                
                // Check if gallery is empty and show placeholder
                const remainingImages = gallery.querySelectorAll('.image-gallery-item');
                if (remainingImages.length === 0) {
                    gallery.innerHTML = `
                        <div class="col-12 text-center text-muted py-5">
                            <i class="fas fa-images fa-3x mb-3"></i>
                            <h5>No images generated yet</h5>
                            <p>Generate your first AI image using the form above</p>
                        </div>
                    `;
                }
                
                this.showToast('Gambar dihapus', 'info');
            }
        }
    }

    saveImageToHistory(imageData) {
        try {
            let history = JSON.parse(localStorage.getItem('aiImageHistory') || '[]');
            history.unshift(imageData);
            
            // Keep only last 50 images
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('aiImageHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    removeImageFromHistory(imageUrl) {
        try {
            let history = JSON.parse(localStorage.getItem('aiImageHistory') || '[]');
            history = history.filter(item => item.url !== imageUrl);
            localStorage.setItem('aiImageHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    loadImageHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('aiImageHistory') || '[]');
            const gallery = document.getElementById('imageGallery');
            
            if (!gallery) return;
            
            // If there are images in history, remove the placeholder first
            if (history.length > 0) {
                const placeholder = gallery.querySelector('.text-center.text-muted');
                if (placeholder) {
                    placeholder.remove();
                }
            }
            
            history.forEach(imageData => {
                this.addImageToGalleryFromHistory(imageData);
            });
        } catch (error) {
            console.error('Error loading image history:', error);
        }
    }

    addImageToGalleryFromHistory(imageData) {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-gallery-item';
        imageItem.innerHTML = `
            <img src="${imageData.url}" alt="${imageData.prompt}" loading="lazy">
            <div class="image-overlay">
                <div class="image-actions">
                    <button class="btn btn-sm btn-light" onclick="dashboard.viewImage('${imageData.url}', '${imageData.prompt}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-light" onclick="dashboard.downloadImage('${imageData.url}', '${imageData.prompt}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-light" onclick="dashboard.copyImageUrl('${imageData.url}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteImage(this, '${imageData.url}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="image-info">
                <div class="image-prompt">${imageData.prompt}</div>
                <div class="image-meta">${imageData.style} • ${imageData.quality}</div>
            </div>
        `;
        
        gallery.appendChild(imageItem);
    }

    // AI Music Generator Methods
    setupAIMusicGenerator() {
        console.log('🎵 Setting up AI Music Generator...');
        
        // Setup form submission
        const musicForm = document.getElementById('aiMusicForm');
        if (musicForm) {
            musicForm.addEventListener('submit', (e) => this.handleMusicGeneration(e));
        }

        // Setup quick prompt buttons
        const quickMusicPrompts = document.querySelectorAll('.quick-music-btn');
        quickMusicPrompts.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                const promptInput = document.getElementById('musicPrompt');
                if (promptInput) {
                    promptInput.value = prompt;
                }
            });
        });

        // Load saved music from localStorage
        this.loadMusicHistory();
    }

    async handleMusicGeneration(e) {
        e.preventDefault();
        
        const prompt = document.getElementById('musicPrompt').value.trim();
        const duration = document.getElementById('musicDuration').value;
        const model = document.getElementById('musicModel').value;
        
        if (!prompt) {
            this.showToast('Music description tidak boleh kosong', 'error');
            return;
        }
        
        const generateBtn = document.getElementById('generateMusicBtn');
        const musicGenerationStatus = document.getElementById('musicGenerationStatus');
        const originalText = generateBtn.textContent;
        
        try {
            // Show loading state
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Show generation status
            if (musicGenerationStatus) {
                musicGenerationStatus.classList.remove('d-none');
            }
            
            // Generate music using Hugging Face API
            const musicUrl = await this.generateAIMusic(prompt, duration, model);
            
            // Add to gallery
            this.addMusicToGallery(musicUrl, prompt, duration, model);
            
            // Clear form
            document.getElementById('musicPrompt').value = '';
            
            this.showToast('Musik berhasil dibuat!', 'success');
            
        } catch (error) {
            console.error('Error generating music:', error);
            this.showToast('Gagal membuat musik: ' + error.message, 'error');
        } finally {
            // Reset button
            generateBtn.disabled = false;
            generateBtn.textContent = originalText;
            
            // Hide generation status
            if (musicGenerationStatus) {
                musicGenerationStatus.classList.add('d-none');
            }
        }
    }

    async generateAIMusic(prompt, duration = 'medium', model = 'musicgen-medium') {
        // Using Hugging Face Inference API with MusicGen
        const modelMap = {
            'musicgen-small': 'facebook/musicgen-small',
            'musicgen-medium': 'facebook/musicgen-medium', 
            'musicgen-large': 'facebook/musicgen-large'
        };
        
        const durationMap = {
            'short': 10,
            'medium': 20,
            'long': 30
        };
        
        const apiUrl = `https://api-inference.huggingface.co/models/${modelMap[model]}`;
        
        const requestBody = {
            inputs: prompt,
            parameters: {
                duration: durationMap[duration],
                top_k: 250,
                top_p: 0.0,
                temperature: 1.0,
                classifier_free_guidance: 3.0
            }
        };
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                // If direct API doesn't work, use alternative approach
                throw new Error('Using demo URL instead');
            }
            
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
            
        } catch (error) {
            console.log('🎵 Using demo music generation...');
            
            // Fallback: Generate a demo URL (for development)
            // In production, you might want to use a different service
            const demoUrl = this.generateDemoMusic(prompt, duration);
            return demoUrl;
        }
    }
    
    generateDemoMusic(prompt, duration) {
        // For demo purposes, generate a placeholder audio
        // In real implementation, you'd use a working API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const length = duration === 'short' ? 10 : duration === 'medium' ? 20 : 30;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(2, sampleRate * length, sampleRate);
        
        // Generate simple tone based on prompt
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                // Simple sine wave generation (demo only)
                const frequency = prompt.toLowerCase().includes('bass') ? 80 : 
                                 prompt.toLowerCase().includes('high') ? 440 : 220;
                channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
            }
        }
        
        // Convert buffer to blob
        return new Promise((resolve) => {
            const offlineContext = new OfflineAudioContext(2, sampleRate * length, sampleRate);
            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineContext.destination);
            source.start();
            
            offlineContext.startRendering().then((renderedBuffer) => {
                const audioBlob = this.bufferToWave(renderedBuffer);
                const url = URL.createObjectURL(audioBlob);
                resolve(url);
            });
        });
    }
    
    bufferToWave(buffer) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Convert audio data
        const channelData = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    addMusicToGallery(musicUrl, prompt, duration, model) {
        const gallery = document.getElementById('musicGallery');
        if (!gallery) return;
        
        // Remove "no music" placeholder if it exists
        const placeholder = gallery.querySelector('.text-center.text-muted');
        if (placeholder) {
            placeholder.remove();
        }
        
        const musicData = {
            url: musicUrl,
            prompt: prompt,
            duration: duration,
            model: model,
            timestamp: new Date().toISOString()
        };
        
        const durationText = duration === 'short' ? '10s' : duration === 'medium' ? '20s' : '30s';
        const modelText = model.replace('musicgen-', '').toUpperCase();
        
        // Create music item
        const musicItem = document.createElement('div');
        musicItem.className = 'col-md-6 mb-3';
        musicItem.innerHTML = `
            <div class="music-gallery-item">
                <div class="music-player">
                    <audio controls preload="metadata">
                        <source src="${musicUrl}" type="audio/mpeg">
                        <source src="${musicUrl}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                    <div class="music-actions">
                        <button class="btn btn-sm btn-light" onclick="dashboard.downloadMusic('${musicUrl}', '${prompt}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-light" onclick="dashboard.shareMusic('${musicUrl}', '${prompt}')">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="dashboard.deleteMusic(this, '${musicUrl}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="music-info">
                    <div class="music-prompt">${prompt}</div>
                    <div class="music-meta">
                        <span>${modelText} Model</span>
                        <span class="music-duration">${durationText}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add to beginning of gallery
        gallery.insertBefore(musicItem, gallery.firstChild);
        
        // Save to localStorage
        this.saveMusicToHistory(musicData);
    }

    async downloadMusic(musicUrl, prompt) {
        try {
            const response = await fetch(musicUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-music-${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showToast('Musik berhasil didownload', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Gagal download musik', 'error');
        }
    }

    async shareMusic(musicUrl, prompt) {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'AI Generated Music',
                    text: `Check out this AI generated music: "${prompt}"`,
                    url: musicUrl
                });
                this.showToast('Musik berhasil dibagikan', 'success');
            } else {
                // Fallback: copy URL to clipboard
                await navigator.clipboard.writeText(musicUrl);
                this.showToast('URL musik disalin ke clipboard', 'success');
            }
        } catch (error) {
            console.error('Share error:', error);
            this.showToast('Gagal membagikan musik', 'error');
        }
    }

    deleteMusic(buttonElement, musicUrl) {
        if (confirm('Hapus musik ini?')) {
            const musicItem = buttonElement.closest('.col-md-6');
            const gallery = document.getElementById('musicGallery');
            
            if (musicItem && gallery) {
                musicItem.remove();
                this.removeMusicFromHistory(musicUrl);
                
                // Check if gallery is empty and show placeholder
                const remainingMusic = gallery.querySelectorAll('.music-gallery-item');
                if (remainingMusic.length === 0) {
                    gallery.innerHTML = `
                        <div class="col-12 text-center text-muted py-5">
                            <i class="fas fa-music fa-3x mb-3"></i>
                            <h5>No music generated yet</h5>
                            <p>Generate your first AI music using the form above</p>
                        </div>
                    `;
                }
                
                // Revoke object URL to free memory
                URL.revokeObjectURL(musicUrl);
                
                this.showToast('Musik dihapus', 'info');
            }
        }
    }

    saveMusicToHistory(musicData) {
        try {
            let history = JSON.parse(localStorage.getItem('aiMusicHistory') || '[]');
            history.unshift(musicData);
            
            // Keep only last 20 music files (they can be large)
            if (history.length > 20) {
                history = history.slice(0, 20);
            }
            
            localStorage.setItem('aiMusicHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving music to localStorage:', error);
        }
    }

    removeMusicFromHistory(musicUrl) {
        try {
            let history = JSON.parse(localStorage.getItem('aiMusicHistory') || '[]');
            history = history.filter(item => item.url !== musicUrl);
            localStorage.setItem('aiMusicHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error removing music from localStorage:', error);
        }
    }

    loadMusicHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('aiMusicHistory') || '[]');
            const gallery = document.getElementById('musicGallery');
            
            if (!gallery) return;
            
            // If there are music files in history, remove the placeholder first
            if (history.length > 0) {
                const placeholder = gallery.querySelector('.text-center.text-muted');
                if (placeholder) {
                    placeholder.remove();
                }
            }
            
            history.forEach(musicData => {
                this.addMusicToGalleryFromHistory(musicData);
            });
        } catch (error) {
            console.error('Error loading music history:', error);
        }
    }

    addMusicToGalleryFromHistory(musicData) {
        const gallery = document.getElementById('musicGallery');
        if (!gallery) return;
        
        const durationText = musicData.duration === 'short' ? '10s' : 
                           musicData.duration === 'medium' ? '20s' : '30s';
        const modelText = musicData.model.replace('musicgen-', '').toUpperCase();
        
        const musicItem = document.createElement('div');
        musicItem.className = 'col-md-6 mb-3';
        musicItem.innerHTML = `
            <div class="music-gallery-item">
                <div class="music-player">
                    <audio controls preload="metadata">
                        <source src="${musicData.url}" type="audio/mpeg">
                        <source src="${musicData.url}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                    <div class="music-actions">
                        <button class="btn btn-sm btn-light" onclick="dashboard.downloadMusic('${musicData.url}', '${musicData.prompt}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-light" onclick="dashboard.shareMusic('${musicData.url}', '${musicData.prompt}')">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="dashboard.deleteMusic(this, '${musicData.url}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="music-info">
                    <div class="music-prompt">${musicData.prompt}</div>
                    <div class="music-meta">
                        <span>${modelText} Model</span>
                        <span class="music-duration">${durationText}</span>
                    </div>
                </div>
            </div>
        `;
        
        gallery.appendChild(musicItem);
    }
    
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) {
            console.log('⚠️ Empty message, not sending');
            return;
        }
        
        console.log('💬 Sending chat message:', message);
        console.log('🔌 Socket connected:', this.socket.connected);
        
        // Add user message to chat
        this.addChatMessage('user', message);
        
        // Clear input
        chatInput.value = '';
        this.autoResizeTextarea(chatInput);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Check socket connection
        if (!this.socket.connected) {
            console.error('❌ Socket not connected!');
            this.hideTypingIndicator();
            this.addChatMessage('ai', 'Koneksi terputus. Silakan refresh halaman.', true);
            return;
        }
        
        // Send to server
        console.log('📤 Emitting ai-chat event...');
        this.socket.emit('ai-chat', { message: message });
    }
    
    sendQuickCommand(command) {
        const commands = {
            'weather': 'Bagaimana cuaca hari ini?',
            'joke': 'Ceritakan lelucon yang lucu',
            'story': 'Buatkan cerita pendek yang menarik',
            'help': 'Apa saja yang bisa kamu bantu?'
        };
        
        const message = commands[command] || command;
        const chatInput = document.getElementById('chatInput');
        
        if (chatInput) {
            chatInput.value = message;
            this.autoResizeTextarea(chatInput);
            chatInput.focus();
        }
    }
    
    addChatMessage(sender, message, isError = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        if (isError) {
            messageDiv.classList.add('error-message');
        }
        
        const timestamp = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // Store in history
        this.chatHistory.push({
            sender: sender,
            message: message,
            timestamp: new Date(),
            isError: isError
        });
        
        // Scroll to bottom
        this.scrollChatToBottom();
        
        // Animate in
        setTimeout(() => {
            messageDiv.classList.add('message-animate');
        }, 10);
    }
    
    formatMessage(message) {
        // Basic formatting for AI responses
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/```(.*?)```/gs, '<code class="code-block">$1</code>')
            .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
    }
    
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        // Remove existing typing indicator
        this.hideTypingIndicator();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        this.scrollChatToBottom();
        this.isTyping = true;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }
    
    scrollChatToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    }
    
    clearChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            this.chatHistory = [];
            this.showToast('Chat history cleared', 'info');
            
            // Add welcome message
            setTimeout(() => {
                this.addChatMessage('ai', 'Halo! Saya Zideebot AI. Ada yang bisa saya bantu? 🤖');
            }, 300);
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('🔌 Connected to server');
            this.isConnected = true;
            this.updateConnectionStatus('Connected', 'status-online');
        });
        
        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus('Disconnected', 'status-offline');
        });
        
        this.socket.on('status-update', (status) => {
            console.log('📊 Status update received:', status);
            this.botStatus = status;
            this.updateDashboard(status);
        });
        
        this.socket.on('new-message', (message) => {
            console.log('💬 New message received:', message);
            this.addMessageToHistory(message, 'received');
            this.showToast(`New message from ${message.from}`, 'info');
        });
        
        this.socket.on('message-sent', (data) => {
            console.log('📤 Message sent:', data);
            this.addMessageToHistory({
                from: 'Dashboard',
                message: data.message,
                timestamp: data.timestamp
            }, 'sent');
            this.showToast('Message sent successfully', 'success');
        });
        
        this.socket.on('broadcast-started', (data) => {
            console.log('📢 Broadcast started:', data);
            this.showToast(`Broadcast started to ${data.recipients} recipients`, 'info');
        });
        
        // AI Chat listeners
        this.socket.on('ai-chat-response', (data) => {
            console.log('🤖 AI response received:', data);
            this.hideTypingIndicator();
            
            if (data.success) {
                this.addChatMessage('ai', data.response);
            } else {
                this.addChatMessage('ai', 'Maaf, terjadi kesalahan. Silakan coba lagi.', true);
                console.error('AI Chat error:', data.error);
            }
        });
        
        this.socket.on('ai-chat-error', (error) => {
            console.error('🤖 AI Chat error:', error);
            this.hideTypingIndicator();
            this.addChatMessage('ai', 'Maaf, terjadi kesalahan dalam memproses permintaan Anda.', true);
        });

        this.socket.on('qr-code', (qr) => {
            console.log('🔍 QR code received');
            this.displayQRCode(qr);
            this.showToast('QR code generated! Scan with WhatsApp', 'warning');
        });
        
        this.socket.on('bot-restarting', () => {
            this.showToast('Bot is restarting...', 'warning');
        });
    }
    
    setupNavigation() {
        // Show overview section by default
        this.showSection('overview');
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Special actions for certain sections
        if (sectionName === 'messages') {
            this.loadMessages();
        } else if (sectionName === 'qr-code') {
            this.requestQRCode();
        } else if (sectionName === 'ai-chat') {
            this.initializeAIChat();
        } else if (sectionName === 'ai-music') {
            this.initializeAIMusic();
        }
    }
    
    setupForms() {
        // Send message form
        const sendMessageForm = document.getElementById('sendMessageForm');
        if (sendMessageForm) {
            sendMessageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendMessage();
            });
        }
        
        // Broadcast form
        const broadcastForm = document.getElementById('broadcastForm');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendBroadcast();
            });
        }
        
        // Settings form
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });        }
    }
    
    initializeAIChat() {
        console.log('🤖 Initializing AI Chat...');
        
        // Clear existing chat if any
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages && this.chatHistory.length === 0) {
            // Add welcome message only if chat is empty
            setTimeout(() => {
                this.addChatMessage('ai', 'Halo! Saya Zideebot AI. Ada yang bisa saya bantu? 🤖\n\nAnda bisa bertanya tentang:\n• Cuaca\n• Cerita atau lelucon\n• Informasi umum\n• Dan masih banyak lagi!');
            }, 300);
        }
        
        // Focus on input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            setTimeout(() => {
                chatInput.focus();
            }, 400);
        }
    }

    initializeAIMusic() {
        console.log('🎵 Initializing AI Music Generator...');
        
        // Focus on music prompt input
        const musicPrompt = document.getElementById('musicPrompt');
        if (musicPrompt) {
            setTimeout(() => {
                musicPrompt.focus();
            }, 400);
        }
        
        // Show welcome message if gallery is empty
        const gallery = document.getElementById('musicGallery');
        const hasMusic = gallery && gallery.querySelectorAll('.music-gallery-item').length > 0;
        
        if (!hasMusic) {
            setTimeout(() => {
                this.showToast('🎵 Selamat datang di AI Music Generator! Deskripsikan musik yang ingin Anda buat.', 'info');
            }, 500);
        }
    }

    setupQuickActions() {
        // Test Zidee AI button
        document.getElementById('testGeminiBtn')?.addEventListener('click', async () => {
            await this.testZideeAPI();
        });
        
        // Restart bot button
        document.getElementById('restartBotBtn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to restart the bot?')) {
                await this.restartBot();
            }
        });
        
        // Show QR button
        document.getElementById('showQrBtn')?.addEventListener('click', () => {
            this.showSection('qr-code');
        });
        
        // Export logs button
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => {
            this.exportLogs();
        });
        
        // Request QR button
        document.getElementById('requestQrBtn')?.addEventListener('click', () => {
            this.requestQRCode();
        });
        
        // Refresh messages button
        document.getElementById('refreshMessagesBtn')?.addEventListener('click', () => {
            this.loadMessages();
        });
    }
    
    setupCharacterCounters() {
        // Message character counter
        const messageText = document.getElementById('messageText');
        const charCount = document.getElementById('charCount');
        if (messageText && charCount) {
            messageText.addEventListener('input', () => {
                charCount.textContent = messageText.value.length;
            });
        }
        
        // Broadcast character counter
        const broadcastMessage = document.getElementById('broadcastMessage');
        const broadcastCharCount = document.getElementById('broadcastCharCount');
        if (broadcastMessage && broadcastCharCount) {
            broadcastMessage.addEventListener('input', () => {
                broadcastCharCount.textContent = broadcastMessage.value.length;
            });
        }
    }
    
    async loadStatus() {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            this.botStatus = status;
            this.updateDashboard(status);
        } catch (error) {
            console.error('Error loading status:', error);
            this.showToast('Error loading status', 'danger');
        }
    }
    
    async loadMessages() {
        try {
            const response = await fetch('/api/messages?limit=50');
            const messages = await response.json();
            this.messageHistory = messages;
            this.updateMessageHistory();
            this.updateRecentActivity(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showToast('Error loading messages', 'danger');
        }
    }
    
    updateDashboard(status) {
        // Update status cards
        document.getElementById('botStatusText').textContent = 
            status.isConnected ? 'Online' : 'Offline';
        document.getElementById('messageCount').textContent = status.messageCount || 0;
        document.getElementById('activeChats').textContent = status.activeChats || 0;
        document.getElementById('uptime').textContent = status.uptime || '0m';
        
        // Update system info
        document.getElementById('nodeVersion').textContent = status.nodeVersion || '-';
        document.getElementById('lastActivity').textContent = status.lastActivity || '-';
        document.getElementById('startTime').textContent = 
            status.startTime ? new Date(status.startTime).toLocaleString() : '-';
        
        // Update memory usage
        if (status.memoryUsage) {
            const memoryMB = Math.round(status.memoryUsage.heapUsed / 1024 / 1024);
            document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
        }
        
        // Update connection status
        if (status.isConnected) {
            this.updateConnectionStatus('Bot Online', 'status-online');
        } else {
            this.updateConnectionStatus('Bot Offline', 'status-offline');
        }
        
        // Update Zidee AI status
        document.getElementById('geminiStatus').textContent = 
            status.geminiEnabled ? 'Connected' : 'Disconnected';
    }
    
    updateConnectionStatus(text, className) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = text;
            statusElement.className = `badge ${className}`;
        }
    }
    
    updateMessageHistory() {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        if (this.messageHistory.length === 0) {
            container.innerHTML = '<div class="text-center text-muted">No messages yet</div>';
            return;
        }
        
        container.innerHTML = this.messageHistory.map(msg => `
            <div class="message-item ${msg.type}">
                <div class="message-info">
                    <div class="message-meta">
                        <strong>${msg.from}</strong> → ${msg.to} 
                        <span class="text-muted">${msg.timestamp}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(msg.message)}</div>
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
    
    updateRecentActivity(messages) {
        const table = document.getElementById('recentActivity');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recent activity</td></tr>';
            return;
        }
        
        tbody.innerHTML = messages.slice(-10).reverse().map(msg => `
            <tr>
                <td>${msg.timestamp}</td>
                <td><span class="badge bg-${this.getTypeColor(msg.type)}">${msg.type}</span></td>
                <td>${msg.from} → ${msg.to}</td>
                <td>${this.truncateText(msg.message, 50)}</td>
            </tr>
        `).join('');
    }
    
    addMessageToHistory(message, type) {
        const messageObj = {
            id: Date.now(),
            type: type,
            from: message.from,
            to: message.to || 'Bot',
            message: message.message,
            timestamp: message.timestamp || new Date().toLocaleString()
        };
        
        this.messageHistory.push(messageObj);
        
        // Keep only last 200 messages
        if (this.messageHistory.length > 200) {
            this.messageHistory = this.messageHistory.slice(-200);
        }
        
        this.updateMessageHistory();
    }
    
    async sendMessage() {
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const message = document.getElementById('messageText').value.trim();
        
        if (!phoneNumber || !message) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber, message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Message sent successfully', 'success');
                document.getElementById('sendMessageForm').reset();
                document.getElementById('charCount').textContent = '0';
            } else {
                this.showToast(`Error: ${result.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Error sending message', 'danger');
        }
    }
    
    async sendBroadcast() {
        const phoneNumbersText = document.getElementById('phoneNumbers').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();
        
        if (!phoneNumbersText || !message) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        const phoneNumbers = phoneNumbersText.split('\n')
            .map(num => num.trim())
            .filter(num => num.length > 0);
        
        if (phoneNumbers.length === 0) {
            this.showToast('Please enter at least one phone number', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumbers, message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Broadcast started to ${phoneNumbers.length} recipients`, 'success');
                document.getElementById('broadcastForm').reset();
                document.getElementById('broadcastCharCount').textContent = '0';
            } else {
                this.showToast(`Error: ${result.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error sending broadcast:', error);
            this.showToast('Error sending broadcast', 'danger');
        }
    }
    
    async testZideeAPI() {
        const button = document.getElementById('testGeminiBtn');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<span class="spinner"></span> Testing...';
        button.disabled = true;
        
        try {
            const response = await fetch('/api/test-gemini', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Zidee AI is working correctly', 'success');
            } else {
                this.showToast('Zidee AI test failed', 'danger');
            }
        } catch (error) {
            console.error('Error testing Zidee AI:', error);
            this.showToast('Error testing Zidee AI', 'danger');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
    
    async restartBot() {
        try {
            const response = await fetch('/api/bot-restart');
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Bot restart initiated', 'info');
            } else {
                this.showToast('Error restarting bot', 'danger');
            }
        } catch (error) {
            console.error('Error restarting bot:', error);
            this.showToast('Error restarting bot', 'danger');
        }
    }
    
    requestQRCode() {
        this.socket.emit('request-qr');
        this.showToast('QR code requested', 'info');
    }
    
    displayQRCode(qrText) {
        const container = document.getElementById('qrCodeContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, qrText, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) {
                console.error('QR Code generation error:', error);
                container.innerHTML = '<div class="alert alert-danger">Error generating QR code</div>';
            } else {
                container.appendChild(canvas);
                
                const instructions = document.createElement('div');
                instructions.className = 'mt-3 alert alert-info';
                instructions.innerHTML = `
                    <i class="fas fa-mobile-alt"></i>
                    <strong>Instructions:</strong><br>
                    1. Open WhatsApp on your phone<br>
                    2. Go to Settings → Linked Devices<br>
                    3. Tap "Link a Device"<br>
                    4. Scan this QR code
                `;
                container.appendChild(instructions);
            }
        });
    }
    
    saveSettings() {
        // This would typically save to backend
        this.showToast('Settings saved (demo)', 'success');
    }
    
    exportLogs() {
        const logs = {
            messages: this.messageHistory,
            status: this.botStatus,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bot-logs-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Logs exported successfully', 'success');
    }
    
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            container.removeChild(toast);
        });
    }
    
    // Sidebar Management Functions
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && sidebarOverlay) {
            sidebar.classList.add('show');
            sidebarOverlay.classList.add('show');
            
            // Prevent body scroll when sidebar is open on mobile
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }
    
    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
    
    getTypeColor(type) {
        const colors = {
            'sent': 'success',
            'received': 'info',
            'broadcast': 'warning',
            'error': 'danger'
        };
        return colors[type] || 'secondary';
    }
    
    // =============================================
    // AI Image Generator Functions
    // =============================================
    
    setupAIImageGenerator() {
        console.log('🎨 Setting up AI Image Generator...');
        
        // Image generation form
        const generateBtn = document.getElementById('generateImageBtn');
        const imagePrompt = document.getElementById('imagePrompt');
        const imageStyle = document.getElementById('imageStyle');
        const imageQuality = document.getElementById('imageQuality');
        const negativePrompt = document.getElementById('negativePrompt');
        const randomPromptBtn = document.getElementById('randomPromptBtn');
        const clearHistoryBtn = document.getElementById('clearImageHistoryBtn');
        const imageHelpBtn = document.getElementById('imageHelpBtn');
        
        // Character counter for prompt
        if (imagePrompt) {
            imagePrompt.addEventListener('input', () => {
                const charCount = imagePrompt.value.length;
                const counter = document.getElementById('promptCharCount');
                if (counter) {
                    counter.textContent = charCount;
                    counter.style.color = charCount > 500 ? '#dc3545' : '#6c757d';
                }
            });
        }
        
        // Generate image button
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateAIImage();
            });
        }
        
        // Random prompt button
        if (randomPromptBtn) {
            randomPromptBtn.addEventListener('click', () => {
                this.generateRandomPrompt();
            });
        }
        
        // Quick prompts
        const quickPrompts = document.querySelectorAll('.quick-prompt');
        quickPrompts.forEach(prompt => {
            prompt.addEventListener('click', () => {
                const promptText = prompt.getAttribute('data-prompt');
                if (imagePrompt) {
                    imagePrompt.value = promptText;
                    imagePrompt.dispatchEvent(new Event('input')); // Trigger character count
                    imagePrompt.focus();
                }
            });
        });
        
        // Clear history button
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearImageHistory();
            });
        }
        
        // Help button
        if (imageHelpBtn) {
            imageHelpBtn.addEventListener('click', () => {
                this.showImageHelp();
            });
        }
        
        // Load existing images from localStorage
        this.loadImageHistory();
    }
    
    async generateAIImage() {
        const imagePrompt = document.getElementById('imagePrompt');
        const imageStyle = document.getElementById('imageStyle');
        const imageQuality = document.getElementById('imageQuality');
        const negativePrompt = document.getElementById('negativePrompt');
        const generateBtn = document.getElementById('generateImageBtn');
        const generationStatus = document.getElementById('generationStatus');
        
        // Validate input
        if (!imagePrompt || !imagePrompt.value.trim()) {
            this.showToast('Please enter a description for your image', 'warning');
            return;
        }
        
        const prompt = imagePrompt.value.trim();
        
        if (prompt.length > 500) {
            this.showToast('Prompt is too long. Maximum 500 characters.', 'warning');
            return;
        }
        
        try {
            // Show loading state
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generationStatus.classList.remove('d-none');
            
            // Build final prompt
            let finalPrompt = prompt;
            
            // Add style if selected
            if (imageStyle.value) {
                finalPrompt += `, ${imageStyle.value}`;
            }
            
            // Add quality if selected
            if (imageQuality.value) {
                finalPrompt += `, ${imageQuality.value}`;
            }
            
            // Add negative prompt if provided
            let negativeText = '';
            if (negativePrompt.value.trim()) {
                negativeText = negativePrompt.value.trim();
                // Pollinations.ai doesn't directly support negative prompts in URL
                // But we can add common negative terms to the main prompt
                finalPrompt += `, not ${negativeText}`;
            }
            
            console.log('🎨 Generating image with prompt:', finalPrompt);
            
            // Generate image URL using Pollinations.ai
            const encodedPrompt = encodeURIComponent(finalPrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
            
            // Create image object
            const imageData = {
                id: Date.now(),
                prompt: prompt,
                finalPrompt: finalPrompt,
                style: imageStyle.value || 'No specific style',
                quality: imageQuality.value || 'Standard',
                negativePrompt: negativePrompt.value || 'None',
                url: imageUrl,
                timestamp: new Date().toISOString(),
                downloaded: false
            };
            
            // Add loading placeholder first
            this.addImageToGallery(imageData, true);
            
            // Test if image loads successfully
            const img = new Image();
            img.onload = () => {
                console.log('✅ Image generated successfully');
                
                // Remove loading placeholder and add real image
                this.addImageToGallery(imageData, false);
                
                // Save to history
                this.saveImageToHistory(imageData);
                
                // Show success message
                this.showToast('Image generated successfully!', 'success');
            };
            
            img.onerror = () => {
                console.error('❌ Failed to generate image');
                this.showToast('Failed to generate image. Please try again.', 'danger');
                this.removeLoadingImage(imageData.id);
            };
            
            // Start loading the image
            img.src = imageUrl;
            
        } catch (error) {
            console.error('❌ Error generating image:', error);
            this.showToast('Error generating image: ' + error.message, 'danger');
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Image';
            generationStatus.classList.add('d-none');
        }
    }
    
    addImageToGallery(imageData, isLoading = false) {
        const gallery = document.getElementById('imageGallery');
        
        // Clear "no images" message if it exists
        const noImagesMsg = gallery.querySelector('.text-center.text-muted');
        if (noImagesMsg) {
            noImagesMsg.remove();
        }
        
        // Create image element
        const imageElement = document.createElement('div');
        imageElement.className = 'col-md-6 col-lg-4';
        imageElement.id = `image-${imageData.id}`;
        
        if (isLoading) {
            imageElement.innerHTML = `
                <div class="image-gallery-item">
                    <div class="image-loading">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="mt-2">Generating image...</div>
                        </div>
                    </div>
                    <div class="image-info">
                        <div class="image-prompt">${imageData.prompt}</div>
                        <div class="image-meta">
                            <div class="image-timestamp">Generating...</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const formattedTime = new Date(imageData.timestamp).toLocaleString();
            
            imageElement.innerHTML = `
                <div class="image-gallery-item">
                    <img src="${imageData.url}" alt="Generated Image" class="generated-image" 
                         onclick="dashboard.openImageModal('${imageData.url}', '${imageData.prompt}')">
                    <div class="image-info">
                        <div class="image-prompt">${imageData.prompt}</div>
                        <div class="image-meta">
                            <div class="image-timestamp">${formattedTime}</div>
                            <div class="image-actions">
                                <button class="btn btn-sm btn-outline-primary" onclick="dashboard.downloadImage('${imageData.url}', '${imageData.id}')">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="dashboard.copyImageUrl('${imageData.url}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="dashboard.deleteImage('${imageData.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add to beginning of gallery
        gallery.insertBefore(imageElement, gallery.firstChild);
    }
    
    removeLoadingImage(imageId) {
        const imageElement = document.getElementById(`image-${imageId}`);
        if (imageElement) {
            imageElement.remove();
        }
        
        // Check if gallery is empty and show message
        this.checkEmptyGallery();
    }
    
    generateRandomPrompt() {
        const prompts = [
            "A majestic dragon flying over a mystical forest, fantasy art style",
            "Cyberpunk cityscape at night with neon lights, futuristic",
            "A peaceful zen garden with cherry blossoms, watercolor painting",
            "Space station orbiting a distant planet, sci-fi concept art",
            "Cozy cabin in snowy mountains, warm lighting, digital art",
            "Underwater coral reef with colorful fish, photorealistic",
            "Ancient temple ruins overgrown with vines, atmospheric",
            "Robot and human shaking hands, symbolic, minimalist",
            "Floating islands in the sky connected by bridges, fantasy",
            "Vintage steam locomotive in a meadow, nostalgic style"
        ];
        
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        const imagePrompt = document.getElementById('imagePrompt');
        
        if (imagePrompt) {
            imagePrompt.value = randomPrompt;
            imagePrompt.dispatchEvent(new Event('input')); // Trigger character count
            imagePrompt.focus();
        }
    }
    
    openImageModal(imageUrl, prompt) {
        // Create modal if it doesn't exist
        let modal = document.querySelector('.image-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="image-modal-content">
                    <button class="image-modal-close" onclick="dashboard.closeImageModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="" alt="Generated Image">
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close on click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeImageModal();
                }
            });
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    this.closeImageModal();
                }
            });
        }
        
        // Set image and show modal
        const img = modal.querySelector('img');
        img.src = imageUrl;
        img.alt = prompt;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    closeImageModal() {
        const modal = document.querySelector('.image-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    async downloadImage(imageUrl, imageId) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `ai-image-${imageId}.png`;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up object URL
            URL.revokeObjectURL(downloadLink.href);
            
            this.showToast('Image downloaded successfully!', 'success');
            
            // Update download status in history
            this.updateImageDownloadStatus(imageId);
            
        } catch (error) {
            console.error('❌ Error downloading image:', error);
            this.showToast('Failed to download image', 'danger');
        }
    }
    
    copyImageUrl(imageUrl) {
        navigator.clipboard.writeText(imageUrl).then(() => {
            this.showToast('Image URL copied to clipboard!', 'success');
        }).catch(err => {
            console.error('❌ Error copying URL:', err);
            this.showToast('Failed to copy URL', 'danger');
        });
    }
    
    deleteImage(imageId) {
        if (confirm('Are you sure you want to delete this image?')) {
            const imageElement = document.getElementById(`image-${imageId}`);
            if (imageElement) {
                imageElement.remove();
                this.removeImageFromHistory(imageId);
                this.showToast('Image deleted', 'info');
                this.checkEmptyGallery();
            }
        }
    }
    
    saveImageToHistory(imageData) {
        let history = JSON.parse(localStorage.getItem('ai-image-history') || '[]');
        history.unshift(imageData); // Add to beginning
        
        // Keep only last 50 images
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('ai-image-history', JSON.stringify(history));
    }
    
    loadImageHistory() {
        const history = JSON.parse(localStorage.getItem('ai-image-history') || '[]');
        const gallery = document.getElementById('imageGallery');
        
        if (history.length === 0) {
            return; // Keep default "no images" message
        }
        
        // Clear gallery
        gallery.innerHTML = '';
        
        // Add images from history
        history.forEach(imageData => {
            this.addImageToGallery(imageData, false);
        });
    }
    
    removeImageFromHistory(imageId) {
        let history = JSON.parse(localStorage.getItem('ai-image-history') || '[]');
        history = history.filter(img => img.id != imageId);
        localStorage.setItem('ai-image-history', JSON.stringify(history));
    }
    
    updateImageDownloadStatus(imageId) {
        let history = JSON.parse(localStorage.getItem('ai-image-history') || '[]');
        const imageIndex = history.findIndex(img => img.id == imageId);
        
        if (imageIndex !== -1) {
            history[imageIndex].downloaded = true;
            localStorage.setItem('ai-image-history', JSON.stringify(history));
        }
    }
    
    clearImageHistory() {
        if (confirm('Are you sure you want to clear all generated images?')) {
            localStorage.removeItem('ai-image-history');
            
            const gallery = document.getElementById('imageGallery');
            gallery.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-images fa-3x mb-3"></i>
                    <h5>No images generated yet</h5>
                    <p>Create your first AI-generated image using the form above!</p>
                </div>
            `;
            
            this.showToast('Image history cleared', 'info');
        }
    }
    
    checkEmptyGallery() {
        const gallery = document.getElementById('imageGallery');
        if (gallery.children.length === 0) {
            gallery.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-images fa-3x mb-3"></i>
                    <h5>No images generated yet</h5>
                    <p>Create your first AI-generated image using the form above!</p>
                </div>
            `;
        }
    }
    
    showImageHelp() {
        const helpContent = `
            <h5><i class="fas fa-lightbulb"></i> AI Image Generator Help</h5>
            <div class="mt-3">
                <h6>🎨 How to write good prompts:</h6>
                <ul>
                    <li><strong>Be specific:</strong> Instead of "dog", try "golden retriever sitting in a garden"</li>
                    <li><strong>Add style:</strong> "digital art", "oil painting", "photorealistic", etc.</li>
                    <li><strong>Mention lighting:</strong> "soft lighting", "dramatic shadows", "golden hour"</li>
                    <li><strong>Include composition:</strong> "close-up", "wide angle", "bird's eye view"</li>
                    <li><strong>Add quality terms:</strong> "highly detailed", "4k", "masterpiece"</li>
                </ul>
                
                <h6>🚫 Negative prompts:</h6>
                <p>Use negative prompts to avoid unwanted elements like "blurry", "low quality", "distorted"</p>
                
                <h6>⚡ About Pollinations.ai:</h6>
                <ul>
                    <li>100% free to use</li>
                    <li>No API key required</li>
                    <li>Images generated at 512x512 resolution</li>
                    <li>Fast generation (usually 10-30 seconds)</li>
                </ul>
                
                <h6>💡 Tips:</h6>
                <ul>
                    <li>Try different styles for variety</li>
                    <li>Use the quick prompts as inspiration</li>
                    <li>Experiment with different quality settings</li>
                    <li>Save images you like by downloading them</li>
                </ul>
            </div>
        `;
        
        // Create or update help modal
        this.showModal('AI Image Generator Help', helpContent);
    }
    
    showModal(title, content) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('helpModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'helpModal';
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="helpModalTitle"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="helpModalBody"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Update content
        document.getElementById('helpModalTitle').innerHTML = title;
        document.getElementById('helpModalBody').innerHTML = content;
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    // Theme Management Functions
    initTheme() {
        // Check if user has a saved theme preference
        const savedTheme = localStorage.getItem('dashboard-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
        
        // Update toggle state
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
        
        console.log(`🎨 Theme initialized: ${theme}`);
    }
    
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                this.setTheme(theme);
                this.showToast(`Switched to ${theme} mode`, 'info');
            });
        }
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dashboard-theme', theme);
        
        // Update status badge classes for better visibility
        this.updateStatusBadgeColors(theme);
        
        console.log(`🎨 Theme set to: ${theme}`);
    }
    
    updateStatusBadgeColors(theme) {
        const statusBadge = document.getElementById('connectionStatus');
        if (statusBadge) {
            // Update badge styling based on theme
            if (theme === 'dark') {
                statusBadge.style.color = '#e0e0e0';
            } else {
                statusBadge.style.color = '#ffffff';
            }
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BotDashboard();
});
