FROM python:3.12-slim

# Install Node.js 20+ and system dependencies
RUN apt-get update && apt-get install -y curl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install remaining system dependencies: ffmpeg, build tools, git, libass/fonts, canvas deps
RUN apt-get update && apt-get install -y \
    ffmpeg unzip gcc python3-dev libffi-dev git build-essential \
    libass-dev fonts-freefont-ttf fonts-noto-core fonts-noto-extra \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Download common Google Fonts used in the editor (Inter, Montserrat, Roboto, Open Sans, Poppins)
RUN mkdir -p /usr/share/fonts/truetype/google-fonts && \
    for url in \
      "https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-Regular.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-SemiBold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-Bold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-ExtraBold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Regular.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-SemiBold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Bold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-ExtraBold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/roboto/static/Roboto-Regular.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/roboto/static/Roboto-Bold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/opensans/static/OpenSans-Regular.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/opensans/static/OpenSans-Bold.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/poppins/static/Poppins-Regular.ttf" \
      "https://github.com/google/fonts/raw/main/ofl/poppins/static/Poppins-Bold.ttf"; do \
      curl -sL --connect-timeout 10 "$url" -o "/usr/share/fonts/truetype/google-fonts/$(basename "$url")" || true; \
    done && \
    fc-cache -f && echo "Google Fonts download complete"

WORKDIR /app

# Copiar e instalar dependencias Python
COPY peakclip-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir --upgrade "yt-dlp[default] @ git+https://github.com/yt-dlp/yt-dlp.git@master" 2>&1 | tail -5

# Instalar Playwright y Chromium
RUN pip install --no-cache-dir playwright && \
    playwright install chromium --with-deps || true

# Copiar todo el backend
COPY peakclip-backend/ .

# Create necessary directories
RUN mkdir -p downloads outputs thumbnails music

# Install bgutil PO token provider server for YouTube PO token generation
# Server runs on port 4416 by default and is consumed by yt-dlp's extractor plugin
RUN git clone --single-branch --branch 1.3.1 --depth 1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil && \
    cd /opt/bgutil/server && \
    npm ci && \
    npx tsc

# Start bgutil PO token server in background, wait for it, then start uvicorn
CMD (cd /opt/bgutil/server && node build/main.js &) && \
    sleep 5 && \
    uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
