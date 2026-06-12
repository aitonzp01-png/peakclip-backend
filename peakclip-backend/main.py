from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from supabase import create_client
import yt_dlp
import openai
import subprocess
import os
import uuid
import json
import stripe

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("downloads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
os.makedirs("thumbnails", exist_ok=True)

app.mount("/files", StaticFiles(directory="outputs"), name="files")
app.mount("/thumbnails", StaticFiles(directory="thumbnails"), name="thumbnails")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


class VideoRequest(BaseModel):
    url: str
    user_id: str


class ExportRequest(BaseModel):
    clip_id: str
    user_id: str
    video_url: str
    trim_start: float = 0
    trim_end: float = 100
    subtitle_text: str = ""
    subtitle_style: str = "bold-yellow"
    subtitle_position: str = "bottom"
    watermark_text: str = ""
    watermark_position: str = "top-right"
    music_track: str = "none"
    music_volume: int = 30
    filter_style: str = "none"


@app.get("/")
def root():
    return {"status": "PeakClip API running"}


def generate_thumbnail(video_path, output_path, timestamp=5):
    subprocess.run([
        'ffmpeg', '-ss', str(timestamp), '-i', video_path,
        '-vframes', '1', '-vf', 'scale=540:960',
        output_path, '-y'
    ], capture_output=True)


def dedent_credits(user_id):
    result = supabase.table("users").select("credits").eq("id", user_id).execute()
    if result.data and result.data[0]["credits"] > 0:
        new_credits = result.data[0]["credits"] - 1
        supabase.table("users").update({"credits": new_credits}).eq("id", user_id).execute()
        return new_credits
    return 0


@app.post("/process")
async def process_video(req: VideoRequest):
    job_id = str(uuid.uuid4())

    # Deduct credit server-side
    user_result = supabase.table("users").select("credits,plan").eq("id", req.user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = user_result.data[0]
    if user_data["plan"] != "pro" and user_data["credits"] <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining")

    if user_data["plan"] != "pro":
        dedent_credits(req.user_id)

    video_path = f"downloads/{job_id}.mp4"
    audio_path = f"downloads/{job_id}.mp3"

    try:
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': video_path,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([req.url])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Download error: {str(e)}")

    subprocess.run([
        'ffmpeg', '-i', video_path, '-q:a', '0', '-map', 'a', audio_path, '-y'
    ], capture_output=True)

    # Generate a thumbnail for the source video
    thumb_path = f"thumbnails/{job_id}.jpg"
    generate_thumbnail(video_path, thumb_path)
    thumb_url = f"{os.getenv('PUBLIC_URL', 'http://localhost:8000')}/thumbnails/{job_id}.jpg"

    with open(audio_path, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )

    segments_text = "\n".join([
        f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}"
        for s in transcript.segments
    ])

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": f"""Analyze this transcript and return the 3 best viral moments for YouTube Shorts/TikTok.

Transcript:
{segments_text}

Return ONLY a JSON with this exact format:
{{
  "clips": [
    {{"start": 10.5, "end": 40.2, "title": "Clip title", "reason": "Why viral"}},
    {{"start": 120.0, "end": 150.5, "title": "Clip title 2", "reason": "Why viral"}},
    {{"start": 200.0, "end": 230.0, "title": "Clip title 3", "reason": "Why viral"}}
  ]
}}"""
        }]
    )

    clips_data = json.loads(response.choices[0].message.content)
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

        clip_url = f"{os.getenv('PUBLIC_URL', 'http://localhost:8000')}/files/{job_id}_clip{i+1}.mp4"

        # Insert each clip into Supabase
        supabase.table("clips").insert({
            "user_id": req.user_id,
            "title": clip["title"],
            "status": "done",
            "video_url": clip_url,
            "thumbnail_url": thumb_url,
            "duration": round(duration, 1)
        }).execute()

        output_clips.append({
            "clip": i + 1,
            "title": clip["title"],
            "reason": clip["reason"],
            "start": clip["start"],
            "end": clip["end"],
            "file": clip_url,
            "thumbnail_url": thumb_url
        })

    os.remove(video_path)
    os.remove(audio_path)

    return {
        "job_id": job_id,
        "clips": output_clips,
        "total": len(output_clips)
    }


@app.post("/export")
async def export_clip(req: ExportRequest):
    job_id = str(uuid.uuid4())
    output_filename = f"{job_id}_export.mp4"
    output_path = f"outputs/{output_filename}"

    source_path = f"downloads/{job_id}_source.mp4"
    subprocess.run([
        'ffmpeg', '-i', req.video_url, '-c', 'copy', source_path, '-y'
    ], capture_output=True)

    if not os.path.exists(source_path):
        raise HTTPException(status_code=400, detail="Could not download source video")

    probe = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', source_path
    ], capture_output=True, text=True)

    total_duration = float(probe.stdout.strip() or 30)
    trim_s = req.trim_start / 100 * total_duration
    trim_d = (req.trim_end - req.trim_start) / 100 * total_duration
    trim_d = max(trim_d, 2)

    filter_chains = []

    # Build the filter chain step by step
    # 1. Always scale to 9:16
    vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"

    # 2. Apply visual filter
    if req.filter_style == "vivid":
        vf = f"{vf},eq=saturation=1.5:contrast=1.1"
    elif req.filter_style == "cinema":
        vf = f"{vf},eq=contrast=1.2:brightness=-0.1,colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3"
    elif req.filter_style == "bw":
        vf = f"{vf},hue=s=0"
    elif req.filter_style == "warm":
        vf = f"{vf},colorbalance=rs=.3:gs=.1:bs=-.2"
    elif req.filter_style == "cool":
        vf = f"{vf},colorbalance=rs=-.2:gs=.1:bs=.3"

    # 3. Subtitles
    subtitle_text = req.subtitle_text or "PeakClip"
    if req.subtitle_style != "none" and subtitle_text:
        style_configs = {
            "bold-yellow": "fontsize=h/18:fontcolor=yellow:borderw=3:bordercolor=black",
            "white-outline": "fontsize=h/18:fontcolor=white:borderw=3:bordercolor=black",
            "neon-green": "fontsize=h/18:fontcolor=#00ff88:borderw=2:bordercolor=#003322",
            "minimal-white": "fontsize=h/16:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=8",
            "tiktok-style": "fontsize=h/18:fontcolor=white:borderw=4:bordercolor=#fe2c55",
        }
        dt_params = style_configs.get(req.subtitle_style, style_configs["bold-yellow"])

        pos_map = {"top": "y=20", "middle": "y=(h-text_h)/2", "bottom": "y=h-text_h-80"}
        y_pos = pos_map.get(req.subtitle_position, pos_map["bottom"])

        safe_text = subtitle_text.replace("'", "'\\\\\\''").replace(":", "\\:")
        dt_filter = f"drawtext=text='{safe_text}':{dt_params}:{y_pos}:enable='between(t,0,{trim_d})'"
        vf = f"{vf},{dt_filter}"

    # 4. Watermark
    if req.watermark_text:
        pos_map_wm = {
            "top-right": "x=w-tw-20:y=20",
            "top-left": "x=20:y=20",
            "bottom-right": "x=w-tw-20:y=h-th-20",
            "bottom-left": "x=20:y=h-th-20",
        }
        wm_pos = pos_map_wm.get(req.watermark_position, pos_map_wm["top-right"])
        safe_wm = req.watermark_text.replace("'", "'\\\\\\''").replace(":", "\\:")
        wm_filter = f"drawtext=text='{safe_wm}':fontsize=h/28:fontcolor=white@0.8:borderw=2:bordercolor=black@0.5:{wm_pos}:enable='between(t,0,{trim_d})'"
        vf = f"{vf},{wm_filter}"

    cmd = [
        'ffmpeg',
        '-ss', str(trim_s),
        '-i', source_path,
        '-t', str(trim_d),
        '-vf', vf,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-y', output_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(status_code=400, detail=f"Export error: {result.stderr[:500]}")

    # Upload to Supabase Storage
    public_url = ""
    try:
        with open(output_path, 'rb') as f:
            storage_path = f"exports/{job_id}_export.mp4"
            supabase.storage.from_("clips").upload(storage_path, f)
            public_url = supabase.storage.from_("clips").get_public_url(storage_path)
    except Exception:
        public_url = f"{os.getenv('PUBLIC_URL', 'http://localhost:8000')}/files/{output_filename}"

    # Update clip record with the exported video URL
    supabase.table("clips").update({
        "video_url": public_url,
        "status": "done"
    }).eq("id", req.clip_id).execute()

    os.remove(source_path)

    return {
        "success": True,
        "video_url": public_url,
        "message": "Clip exported successfully"
    }


@app.post("/create-checkout-session")
async def create_checkout_session(data: dict):
    price_id = data.get("price_id")
    user_id = data.get("user_id")
    return_url = data.get("return_url", "http://localhost:3000/dashboard")

    if not price_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing price_id or user_id")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=return_url + "?plan=success",
            cancel_url=return_url + "?plan=cancelled",
            metadata={"user_id": user_id},
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/stripe-webhook")
async def stripe_webhook(payload: dict):
    event = payload
    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        # Determine plan from the price
        price_id = session.get("line_items", {}).get("data", [{}])[0].get("price", {}).get("id", "")
        plan_map = {
            "price_creator": "creator",
            "price_pro": "pro",
        }
        plan = plan_map.get(price_id, "creator")
        supabase.table("users").update({
            "plan": plan,
            "credits": 999 if plan == "pro" else 200
        }).eq("id", user_id).execute()
    return {"received": True}


@app.get("/clips/{user_id}")
def get_user_clips(user_id: str):
    result = supabase.table("clips").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"clips": result.data}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
