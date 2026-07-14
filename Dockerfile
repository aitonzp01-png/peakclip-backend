FROM python:3.12-slim

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    wget \
    git \
    build-essential \
    nodejs \
    npm \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependencias Python
COPY peakclip-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar yt-dlp master y plugins
RUN pip install --no-cache-dir \
    "yt-dlp[default] @ https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz" \
    yt-dlp-youtube-oauth2 \
    yt-dlp-ejs \
    opencv-python-headless

# Instalar Playwright y Chromium
RUN pip install --no-cache-dir playwright && \
    playwright install chromium --with-deps

# Copiar todo el backend
COPY peakclip-backend/ .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
