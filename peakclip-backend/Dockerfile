FROM python:3.12-slim

# Install Node.js 20+ and system dependencies
RUN apt-get update && apt-get install -y curl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install remaining system dependencies: ffmpeg, build tools, git, libass/fonts, canvas deps
RUN apt-get update && apt-get install -y \
    ffmpeg unzip gcc python3-dev libffi-dev git build-essential \
    libass-dev fonts-freefont-ttf fonts-inter fonts-montserrat \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium browser for the browser-automation fallback downloader
RUN playwright install chromium || true

COPY . .

# Create necessary directories
RUN mkdir -p downloads outputs thumbnails music

# Install bgutil PO token provider server for YouTube PO token generation
# Server runs on port 4416 by default and is consumed by the pip-installed plugin
RUN git clone --single-branch --branch 1.3.1 --depth 1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil && \
    cd /opt/bgutil/server && \
    npm ci && \
    npx tsc

EXPOSE ${PORT:-8000}

# Start bgutil PO token server in background, wait for it, then start uvicorn
CMD (cd /opt/bgutil/server && node build/main.js &) && \
    sleep 5 && \
    uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
