from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import openai
import subprocess
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    url: str
    user_id: str

@app.get("/")
def root():
    return {"status": "PeakClip API running"}

@app.post("/process")
async def process_video(req: VideoRequest):
    job_id = str(uuid.uuid4())
    video_path = f"downloads/{job_id}.mp4"
    audio_path = f"downloads/{job_id}.mp3"
    
    os.makedirs("downloads", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    # 1. Descargar vídeo
    try:
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': video_path,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([req.url])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error descargando vídeo: {str(e)}")

    # 2. Extraer audio
    subprocess.run([
        'ffmpeg', '-i', video_path, '-q:a', '0', '-map', 'a', audio_path, '-y'
    ], capture_output=True)

    # 3. Transcribir con Whisper
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    with open(audio_path, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )

    # 4. Detectar momentos virales con GPT-4
    segments_text = "\n".join([
        f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}"
        for s in transcript.segments
    ])

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": f"""Analiza esta transcripción y devuelve los 3 mejores momentos virales para YouTube Shorts/TikTok.
            
Transcripción:
{segments_text}

Devuelve SOLO un JSON con este formato exacto:
{{
  "clips": [
    {{"start": 10.5, "end": 40.2, "title": "Título del clip", "reason": "Por qué es viral"}},
    {{"start": 120.0, "end": 150.5, "title": "Título del clip 2", "reason": "Por qué es viral"}},
    {{"start": 200.0, "end": 230.0, "title": "Título del clip 3", "reason": "Por qué es viral"}}
  ]
}}"""
        }]
    )

    import json
    clips_data = json.loads(response.choices[0].message.content)

    # 5. Cortar clips con FFmpeg en formato vertical 9:16
    output_clips = []
    for i, clip in enumerate(clips_data["clips"]):
        output_path = f"outputs/{job_id}_clip{i+1}.mp4"
        duration = clip["end"] - clip["start"]
        
        subprocess.run([
            'ffmpeg',
            '-ss', str(clip["start"]),
            '-i', video_path,
            '-t', str(duration),
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-y', output_path
        ], capture_output=True)

        output_clips.append({
            "clip": i + 1,
            "title": clip["title"],
            "reason": clip["reason"],
            "start": clip["start"],
            "end": clip["end"],
            "file": output_path
        })

    # Limpiar archivos temporales
    os.remove(video_path)
    os.remove(audio_path)

    return {
        "job_id": job_id,
        "clips": output_clips,
        "total": len(output_clips)
    }