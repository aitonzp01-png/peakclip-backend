FROM python:3.12-slim

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    wget \
    build-essential \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependencias Python
COPY peakclip-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar Playwright y Chromium
RUN pip install --no-cache-dir playwright && \
    playwright install chromium --with-deps

# Copiar todo el backend
COPY peakclip-backend/ .

RUN useradd --create-home --uid 10001 peakclip && \
    mkdir -p downloads outputs thumbnails music && \
    chown -R peakclip:peakclip /app

USER peakclip

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
