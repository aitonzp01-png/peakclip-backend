FROM python:3.12-slim

# Install system dependencies: ffmpeg, build tools, git, libass/fonts, canvas deps
RUN apt-get update && apt-get install -y \
    ffmpeg curl unzip gcc python3-dev libffi-dev git build-essential \
    libass-dev fonts-freefont-ttf \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create necessary directories
RUN mkdir -p downloads outputs thumbnails music

EXPOSE ${PORT:-8000}

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
