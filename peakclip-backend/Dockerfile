FROM python:3.12-slim

# Install system dependencies: ffmpeg, build tools, Node.js 20, git, libass/fonts
RUN apt-get update && apt-get install -y \
    ffmpeg curl unzip gcc python3-dev libffi-dev git build-essential \
    libass9 fonts-dejavu-core fonts-freefont-ttf \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (JavaScript runtime required by yt-dlp for YouTube challenge solving)
RUN curl -fsSL https://deno.land/install.sh | sh \
    && ln -s /root/.deno/bin/deno /usr/local/bin/deno \
    && deno --version
ENV PATH="/root/.deno/bin:${PATH}"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create necessary directories
RUN mkdir -p downloads outputs thumbnails music

EXPOSE ${PORT:-8000}

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
