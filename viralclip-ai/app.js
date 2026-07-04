const BACKEND_URL = ''; // Same origin since frontend is served by Flask

class ViralClipAI {
    constructor() {
        this.video = null;
        this.subtitles = [];
        this.currentStyle = 'modern';
        this.isTranscribing = false;
        this.recognition = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.currentVideoId = null;
        
        this.initElements();
        this.bindEvents();
        this.setupRecognition();
    }

    initElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.videoInput = document.getElementById('video-input');
        this.youtubeUrl = document.getElementById('youtube-url');
        this.loadYoutubeBtn = document.getElementById('load-youtube');
        this.urlProgress = document.getElementById('url-progress');
        this.urlStatus = document.getElementById('url-status');
        this.previewVideo = document.getElementById('preview-video');
        this.canvas = document.getElementById('subtitle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.transcriptText = document.getElementById('transcript-text');
        this.timeline = document.getElementById('timeline');
        this.subtitleList = document.getElementById('subtitle-list');
        this.exportSpinner = document.getElementById('export-spinner');
        this.downloadArea = document.getElementById('download-area');
    }

    bindEvents() {
        this.dropZone.addEventListener('click', () => this.videoInput.click());
        this.videoInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                this.handleFile(file);
            }
        });

        this.loadYoutubeBtn.addEventListener('click', () => this.loadFromUrl());
        this.youtubeUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadFromUrl();
        });

        document.getElementById('start-transcription').addEventListener('click', () => this.startTranscription());
        document.getElementById('continue-to-editor').addEventListener('click', () => this.goToEditor());
        document.getElementById('export-video').addEventListener('click', () => this.exportVideo());

        this.timeline.addEventListener('input', () => {
            if (this.previewVideo) {
                this.previewVideo.currentTime = (this.timeline.value / 100) * this.previewVideo.duration;
            }
        });

        this.previewVideo.addEventListener('timeupdate', () => {
            this.drawSubtitles();
            if (this.previewVideo.duration) {
                this.timeline.value = (this.previewVideo.currentTime / this.previewVideo.duration) * 100;
            }
        });

        this.previewVideo.addEventListener('play', () => this.drawLoop());

        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentStyle = e.target.dataset.style;
                this.drawSubtitles();
            });
        });

        ['font-size', 'subtitle-y', 'max-lines', 'words-per-sub'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.drawSubtitles();
                if (id === 'words-per-sub') {
                    this.regenerateSubtitles();
                }
            });
        });

        this.transcriptText.addEventListener('input', () => {
            this.regenerateSubtitles();
        });
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            document.getElementById('transcription-status').textContent = 
                'Tu navegador no soporta transcripción. Usa Chrome o Edge.';
            document.getElementById('start-transcription').disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = document.getElementById('language-select').value;

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                    this.addSubtitleSegment(transcript.trim(), this.previewVideo.currentTime);
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.transcriptText.value += finalTranscript;
                document.getElementById('continue-to-editor').disabled = false;
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                this.stopTranscription();
                document.getElementById('transcription-status').textContent = 
                    'Error: ' + event.error + '. Intenta de nuevo.';
            }
        };

        this.recognition.onend = () => {
            if (this.isTranscribing) {
                this.recognition.start();
            }
        };

        document.getElementById('language-select').addEventListener('change', (e) => {
            this.recognition.lang = e.target.value;
        });
    }

    async loadFromUrl() {
        const url = this.youtubeUrl.value.trim();
        if (!url) {
            alert('Por favor pega una URL válida');
            return;
        }

        if (!this.isValidUrl(url)) {
            alert('URL no válida. Usa YouTube, TikTok o Instagram.');
            return;
        }

        this.loadYoutubeBtn.disabled = true;
        this.urlProgress.hidden = false;
        this.urlStatus.textContent = 'Conectando con el servidor...';

        try {
            const response = await fetch(`${BACKEND_URL}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error desconocido');
            }

            this.currentVideoId = data.video_id;
            this.urlStatus.textContent = `Descargando: ${data.title}...`;
            
            // Poll for video readiness
            await this.waitForVideo(data.video_id);
            
            // Load video from backend
            const videoUrl = `${BACKEND_URL}/video/${data.video_id}`;
            this.previewVideo.src = videoUrl;
            this.previewVideo.load();
            
            this.previewVideo.onloadedmetadata = () => {
                this.canvas.width = this.previewVideo.videoWidth || 1080;
                this.canvas.height = this.previewVideo.videoHeight || 1920;
                this.showSection('transcription-section');
                this.urlProgress.hidden = true;
                this.loadYoutubeBtn.disabled = false;
                document.getElementById('transcription-status').textContent = 
                    `Video cargado: ${data.title}. Ahora transcribe el audio.`;
            };

        } catch (error) {
            console.error('Error loading URL:', error);
            this.urlStatus.textContent = 'Error: ' + error.message;
            this.loadYoutubeBtn.disabled = false;
            
            if (error.message.includes('Failed to fetch')) {
                this.urlStatus.textContent = 'Error: ¿Iniciaste el servidor backend? Ejecuta: python server.py';
            }
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    async waitForVideo(videoId) {
        const maxAttempts = 60;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${BACKEND_URL}/progress/${videoId}`);
                const data = await response.json();
                
                if (data.ready) {
                    return true;
                }
                
                const progress = Math.min((i / maxAttempts) * 100, 95);
                document.querySelector('#url-progress .progress-fill').style.width = progress + '%';
                this.urlStatus.textContent = `Descargando video... ${Math.round(progress)}%`;
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new Error('Tiempo de espera agotado');
    }

    handleFile(file) {
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        this.previewVideo.src = url;
        this.previewVideo.load();
        
        this.previewVideo.onloadedmetadata = () => {
            this.canvas.width = this.previewVideo.videoWidth || 1080;
            this.canvas.height = this.previewVideo.videoHeight || 1920;
            this.showSection('transcription-section');
        };
    }

    startTranscription() {
        if (!this.recognition) {
            alert('Tu navegador no soporta transcripción de voz. Usa Chrome de escritorio.');
            return;
        }

        this.isTranscribing = true;
        this.transcriptText.value = '';
        this.subtitles = [];
        
        document.getElementById('start-transcription').disabled = true;
        document.getElementById('transcription-status').textContent = 
            'Reproduciendo video y transcribiendo...';
        
        const progressBar = document.getElementById('transcription-progress');
        progressBar.classList.add('active');

        this.previewVideo.currentTime = 0;
        this.previewVideo.play();
        this.recognition.start();

        this.previewVideo.onended = () => {
            this.stopTranscription();
            progressBar.classList.remove('active');
            document.getElementById('transcription-status').textContent = 
                'Transcripción completada. Revisa y edita el texto.';
        };

        setTimeout(() => {
            if (this.isTranscribing) {
                this.stopTranscription();
            }
        }, 600000);
    }

    stopTranscription() {
        this.isTranscribing = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        this.previewVideo.pause();
        document.getElementById('start-transcription').disabled = false;
        
        if (this.subtitles.length === 0 && this.transcriptText.value.trim()) {
            this.regenerateSubtitles();
        }
    }

    addSubtitleSegment(text, time) {
        const wordsPerSub = parseInt(document.getElementById('words-per-sub').value) || 4;
        const words = text.split(/\s+/).filter(w => w.length > 0);
        
        for (let i = 0; i < words.length; i += wordsPerSub) {
            const chunk = words.slice(i, i + wordsPerSub).join(' ');
            const startTime = time + (i / words.length) * 3;
            const endTime = startTime + 2.5;
            
            this.subtitles.push({
                text: chunk,
                start: startTime,
                end: endTime
            });
        }
    }

    regenerateSubtitles() {
        const text = this.transcriptText.value.trim();
        if (!text || !this.previewVideo.duration) return;

        const wordsPerSub = parseInt(document.getElementById('words-per-sub').value) || 4;
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const duration = this.previewVideo.duration;
        const wordDuration = duration / words.length;
        
        this.subtitles = [];
        
        for (let i = 0; i < words.length; i += wordsPerSub) {
            const chunk = words.slice(i, i + wordsPerSub).join(' ');
            const startTime = i * wordDuration;
            const endTime = Math.min((i + wordsPerSub) * wordDuration + 0.5, duration);
            
            this.subtitles.push({
                text: chunk,
                start: startTime,
                end: endTime
            });
        }

        this.renderSubtitleList();
    }

    renderSubtitleList() {
        this.subtitleList.innerHTML = '';
        this.subtitles.forEach((sub, index) => {
            const item = document.createElement('div');
            item.className = 'subtitle-item';
            item.innerHTML = `
                <span>${this.formatTime(sub.start)}</span>
                <input type="text" value="${sub.text}" data-index="${index}">
            `;
            item.querySelector('input').addEventListener('change', (e) => {
                this.subtitles[index].text = e.target.value;
                this.drawSubtitles();
            });
            this.subtitleList.appendChild(item);
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    goToEditor() {
        if (this.subtitles.length === 0) {
            this.regenerateSubtitles();
        }
        this.showSection('editor-section');
        this.renderSubtitleList();
        this.drawSubtitles();
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
    }

    getCurrentSubtitle() {
        const time = this.previewVideo.currentTime;
        return this.subtitles.find(s => time >= s.start && time <= s.end);
    }

    drawLoop() {
        if (!this.previewVideo.paused && !this.previewVideo.ended) {
            this.drawSubtitles();
            requestAnimationFrame(() => this.drawLoop());
        }
    }

    drawSubtitles() {
        if (!this.ctx || !this.canvas.width) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const subtitle = this.getCurrentSubtitle();
        if (!subtitle) return;

        const fontSize = parseInt(document.getElementById('font-size').value) || 42;
        const yPercent = parseInt(document.getElementById('subtitle-y').value) || 80;
        const maxLines = parseInt(document.getElementById('max-lines').value) || 2;
        
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        const x = width / 2;
        const y = (height * yPercent) / 100;

        const lines = this.wrapText(subtitle.text, width * 0.85, fontSize);
        const displayLines = lines.slice(0, maxLines);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch (this.currentStyle) {
            case 'modern':
                this.drawModernStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'bold':
                this.drawBoldStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'minimal':
                this.drawMinimalStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'gradient':
                this.drawGradientStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'outline':
                this.drawOutlineStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'tiktok':
                this.drawTikTokStyle(ctx, displayLines, x, y, fontSize);
                break;
        }

        ctx.restore();
    }

    wrapText(text, maxWidth, fontSize) {
        this.ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = this.ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    drawModernStyle(ctx, lines, x, y, fontSize) {
        const lineHeight = fontSize * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        let maxWidth = 0;
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
        });

        const totalHeight = lines.length * lineHeight;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(ctx, x - maxWidth/2 - 20, startY - totalHeight/2 - 10, maxWidth + 40, totalHeight + 20, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        lines.forEach((line, i) => {
            ctx.fillText(line, x, startY + i * lineHeight);
        });
    }

    drawBoldStyle(ctx, lines, x, y, fontSize) {
        const lineHeight = fontSize * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
        lines.forEach((line, i) => {
            const lineY = startY + i * lineHeight;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = fontSize * 0.12;
            ctx.strokeText(line, x, lineY);
            ctx.fillStyle = '#ffff00';
            ctx.fillText(line, x, lineY);
        });
    }

    drawMinimalStyle(ctx, lines, x, y, fontSize) {
        const lineHeight = fontSize * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        ctx.font = `500 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        lines.forEach((line, i) => {
            ctx.fillText(line, x, startY + i * lineHeight);
        });
        ctx.shadowBlur = 0;
    }

    drawGradientStyle(ctx, lines, x, y, fontSize) {
        const lineHeight = fontSize * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        lines.forEach((line, i) => {
            const lineY = startY + i * lineHeight;
            const gradient = ctx.createLinearGradient(x - 200, lineY - fontSize, x + 200, lineY + fontSize);
            gradient.addColorStop(0, '#ff006e');
            gradient.addColorStop(0.5, '#8338ec');
            gradient.addColorStop(1, '#3a86ff');
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = fontSize * 0.08;
            ctx.strokeText(line, x, lineY);
            ctx.fillStyle = gradient;
            ctx.fillText(line, x, lineY);
        });
    }

    drawOutlineStyle(ctx, lines, x, y, fontSize) {
        const lineHeight = fontSize * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        lines.forEach((line, i) => {
            const lineY = startY + i * lineHeight;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = fontSize * 0.15;
            ctx.strokeText(line, x, lineY);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, x, lineY);
        });
    }

    drawTikTokStyle(ctx, lines, x, y, fontSize) {
        const lineHeight = fontSize * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
        lines.forEach((line, i) => {
            const lineY = startY + i * lineHeight;
            ctx.fillStyle = '#00f2ea';
            ctx.fillText(line, x - 3, lineY - 3);
            ctx.fillStyle = '#ff0050';
            ctx.fillText(line, x + 3, lineY + 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, x, lineY);
        });
    }

    async exportVideo() {
        if (!this.previewVideo.src) return;

        this.showSection('export-section');
        document.getElementById('export-progress').classList.add('active');
        document.getElementById('export-text').textContent = 'Renderizando video con subtítulos...';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.previewVideo.videoWidth || 1080;
        canvas.height = this.previewVideo.videoHeight || 1920;

        const stream = canvas.captureStream(30);
        
        // Try to capture audio from video element
        let combinedStream;
        try {
            const audioStream = this.previewVideo.captureStream();
            combinedStream = new MediaStream();
            stream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
            audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
        } catch (e) {
            console.warn('Could not capture audio, using video only');
            combinedStream = stream;
        }

        const options = {
            mimeType: 'video/webm;codecs=vp9,opus'
        };

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }

        this.mediaRecorder = new MediaRecorder(combinedStream, options);
        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            document.getElementById('final-video').src = url;
            document.getElementById('download-link').href = url;
            document.getElementById('download-area').hidden = false;
            document.getElementById('export-text').textContent = '¡Exportación completada!';
            document.getElementById('export-spinner').style.display = 'none';
            document.getElementById('export-progress').classList.remove('active');
        };

        this.mediaRecorder.start(100);
        
        this.previewVideo.currentTime = 0;
        this.previewVideo.muted = true;
        await this.previewVideo.play();

        const renderFrame = () => {
            if (this.previewVideo.paused || this.previewVideo.ended) {
                if (this.mediaRecorder.state !== 'inactive') {
                    this.mediaRecorder.stop();
                }
                this.previewVideo.muted = false;
                return;
            }

            ctx.drawImage(this.previewVideo, 0, 0, canvas.width, canvas.height);
            this.drawSubtitlesOnCanvas(ctx, canvas.width, canvas.height);
            
            const progress = (this.previewVideo.currentTime / this.previewVideo.duration) * 100;
            document.querySelector('#export-progress .progress-fill').style.width = progress + '%';
            
            requestAnimationFrame(renderFrame);
        };

        renderFrame();

        this.previewVideo.onended = () => {
            setTimeout(() => {
                if (this.mediaRecorder.state !== 'inactive') {
                    this.mediaRecorder.stop();
                }
            }, 500);
        };
    }

    drawSubtitlesOnCanvas(ctx, width, height) {
        const subtitle = this.getCurrentSubtitle();
        if (!subtitle) return;

        const fontSize = parseInt(document.getElementById('font-size').value) || 42;
        const yPercent = parseInt(document.getElementById('subtitle-y').value) || 80;
        const maxLines = parseInt(document.getElementById('max-lines').value) || 2;
        
        const x = width / 2;
        const y = (height * yPercent) / 100;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = this.wrapTextCanvas(ctx, subtitle.text, width * 0.85, fontSize);
        const displayLines = lines.slice(0, maxLines);

        switch (this.currentStyle) {
            case 'modern':
                this.drawModernStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'bold':
                this.drawBoldStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'minimal':
                this.drawMinimalStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'gradient':
                this.drawGradientStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'outline':
                this.drawOutlineStyle(ctx, displayLines, x, y, fontSize);
                break;
            case 'tiktok':
                this.drawTikTokStyle(ctx, displayLines, x, y, fontSize);
                break;
        }

        ctx.restore();
    }

    wrapTextCanvas(ctx, text, maxWidth, fontSize) {
        ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ViralClipAI();
});

// Polyfill for roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        const ctx = this;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };
}
