from dotenv import load_dotenv
load_dotenv()
import traceback
from fastapi import FastAPI, HTTPException, Depends, Header, Request, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from pydantic import BaseModel
from supabase import create_client
import yt_dlp
import openai
import subprocess
import os
import uuid
import json
import stripe
import tempfile
import re
import time
import httpx
import sys
import asyncio
from collections import defaultdict
from urllib.parse import urlparse
import base64
import random
import jwt as pyjwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

from contextlib import asynccontextmanager


def get_youtube_auth_config():
    """Load YouTube cookies/PO token from environment variables to bypass bot checks."""
    config = {"cookies_path": None, "extractor_args": {}}
    cookies_b64 = os.getenv("YOUTUBE_COOKIES_B64")
    if cookies_b64:
        try:
            import base64
            cookies_content = base64.b64decode(cookies_b64).decode('utf-8')
            path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")
            with open(path, "w", encoding="utf-8") as f:
                f.write(cookies_content)
            config["cookies_path"] = path
            print(f"YouTube cookies loaded ({len(cookies_content)} chars)")
        except Exception as e:
            print(f"YouTube cookies decode error: {e}")
    po_token = os.getenv("YOUTUBE_PO_TOKEN")
    visitor_data = os.getenv("YOUTUBE_VISITOR_DATA")
    if po_token:
        config["extractor_args"]["po_token"] = po_token
    if visitor_data:
        config["extractor_args"]["visitor_data"] = visitor_data
    # bgutil PO token provider auto-detects at ~/bgutil-ytdlp-pot-provider
    bgutil_home = "/root/bgutil-ytdlp-pot-provider/server"
    if os.path.isdir(bgutil_home):
        config["bgutil_home"] = bgutil_home
        print(f"bgutil PO token provider found at {bgutil_home}")
    else:
        print("bgutil PO token provider NOT found")
    return config


def get_working_proxy() -> str | None:
    """Return configured proxy. Free proxy lists are unreliable and disabled."""
    configured = os.getenv("YOUTUBE_PROXY")
    if configured:
        print(f"Using configured proxy: {configured[:40]}...")
        return configured
    return None


def extract_youtube_video_id(url: str) -> str | None:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/v/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def refresh_youtube_cookies_sync() -> bool:
    """Use Playwright to refresh YouTube cookies. Called before download if cookies exist."""
    return asyncio.run(refresh_youtube_cookies())

async def refresh_youtube_cookies() -> bool:
    """Use Playwright to refresh YouTube cookies from an existing session."""
    cookie_b64 = os.environ.get('YOUTUBE_COOKIES_B64')
    if not cookie_b64:
        return False
    try:
        import base64 as _b64
        cookies_content = _b64.b64decode(cookie_b64).decode('utf-8')
        playwright_cookies = []
        for line in cookies_content.split('\n'):
            if line.startswith('#') or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                playwright_cookies.append({
                    'name': parts[5], 'value': parts[6],
                    'domain': parts[0], 'path': parts[2],
                    'secure': parts[3] == 'TRUE',
                    'httpOnly': False,
                })
        if not playwright_cookies:
            return False
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
            context = await browser.new_context()
            await context.add_cookies(playwright_cookies)
            page = await context.new_page()
            await page.goto('https://www.youtube.com', timeout=30000)
            await page.wait_for_timeout(4000)
            cookies = await context.cookies()
            netscape_lines = ["# Netscape HTTP Cookie File", ""]
            for c in cookies:
                domain = c.get('domain', '')
                secure = 'TRUE' if c.get('secure') else 'FALSE'
                path = c.get('path', '/')
                expiry = str(int(c.get('expires', 0))) if c.get('expires', -1) != -1 else '0'
                name = c.get('name', '')
                value = c.get('value', '')
                netscape_lines.append(f"{domain}\t{'TRUE' if domain.startswith('.') else 'FALSE'}\t{path}\t{secure}\t{expiry}\t{name}\t{value}")
            cookie_path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")
            with open(cookie_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(netscape_lines))
            await browser.close()
            print(f"Cookies auto-refreshed: {len(cookies)} cookies")
            return True
    except Exception as e:
        print(f"Cookie auto-refresh failed (non-fatal): {e}")
        return False

async def download_with_playwright(url: str, output_path: str) -> bool:
    """Download YouTube video using Playwright with cookies for auth."""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        print("Playwright: could not extract video ID")
        return False
    try:
        print(f"Trying Playwright v2 for {url}")
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox',
                      '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
            )
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
            )

            # Load cookies
            cookie_path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")
            if not os.path.exists(cookie_path):
                cookie_path = "cookies.txt"
            if os.path.exists(cookie_path):
                try:
                    pw_cookies = []
                    with open(cookie_path, 'r') as f:
                        for line in f.read().split('\n'):
                            if line.startswith('#') or not line.strip():
                                continue
                            parts = line.split('\t')
                            if len(parts) >= 7:
                                pw_cookies.append({
                                    'name': parts[5], 'value': parts[6],
                                    'domain': parts[0], 'path': parts[2],
                                    'secure': parts[3] == 'TRUE',
                                    'httpOnly': False,
                                })
                    if pw_cookies:
                        await context.add_cookies(pw_cookies)
                        print(f"Playwright: loaded {len(pw_cookies)} cookies from {cookie_path}")
                except Exception as e:
                    print(f"Playwright cookie load failed: {e}")

            page = await context.new_page()

            # Anti-detection
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['en-US','en']});
                window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){} };
            """)

            # ============================================================
            # PASO 1: Configurar response listener ANTES de navegar
            # NO page.route() con route.fetch() => ENOTFOUND en Railway
            # USAR page.on('response') => browser ya recibio la respuesta
            # ============================================================
            video_chunks = []
            audio_chunks = []
            seen_urls = set()

            async def on_response(response):
                req_url = response.url
                if 'googlevideo.com' not in req_url or 'videoplayback' not in req_url:
                    return
                if req_url in seen_urls:
                    return
                seen_urls.add(req_url)
                try:
                    body = await response.body()
                    if len(body) < 10000:
                        return
                    from urllib.parse import urlparse, parse_qs
                    params = parse_qs(urlparse(req_url).query)
                    mime = params.get('mime', [''])[0].lower()
                    itag = params.get('itag', ['0'])[0]

                    AUDIO_ITAGS = {'139','140','141','249','250','251','256','258','327'}
                    is_audio = 'audio' in mime or itag in AUDIO_ITAGS

                    if is_audio:
                        audio_chunks.append(body)
                        print(f"Playwright captured AUDIO: {len(body)}B (itag={itag})")
                    else:
                        video_chunks.append(body)
                        print(f"Playwright captured VIDEO: {len(body)}B (itag={itag})")
                except Exception as e:
                    print(f"Playwright response capture error: {e}")

            page.on('response', on_response)

            # ============================================================
            # PASO 2: Navegar a YouTube
            # ============================================================
            target_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"Playwright: navigating to {target_url}")
            try:
                await page.goto(target_url, wait_until='domcontentloaded', timeout=30000)
            except Exception as e:
                print(f"Playwright: goto failed: {e}")
                await browser.close()
                return False

            # ============================================================
            # PASO 3: Forzar reproduccion del video
            # ============================================================
            await page.wait_for_timeout(3000)

            # Accept consent overlays
            for selector in [
                'button[aria-label*="Accept"]',
                'button:has-text("Accept all")',
                'button:has-text("I agree")',
                'button:has-text("Reject all")',
            ]:
                try:
                    btn = page.locator(selector).first
                    if await btn.is_visible(timeout=1000):
                        await btn.click()
                        await page.wait_for_timeout(1000)
                except Exception:
                    pass

            # Trigger playback via multiple strategies
            for play_strategy in [
                "document.querySelector('video')?.play().catch(()=>{})",
                None,
                None,
            ]:
                if play_strategy:
                    try:
                        await page.evaluate(play_strategy)
                    except Exception:
                        pass

            # Click the player as fallback
            try:
                await page.click('#movie_player', timeout=3000)
            except Exception:
                pass

            # Unmute and force audio stream loading (CRITICAL for DASH audio)
            try:
                await page.evaluate("""
                    const v = document.querySelector('video');
                    if (v) {
                        v.muted = false;
                        v.volume = 1.0;
                        v.play().catch(() => {});
                    }
                    const player = document.getElementById('movie_player');
                    if (player && player.unMute) player.unMute();
                    if (player && player.setVolume) player.setVolume(100);
                """)
            except Exception:
                pass

            print("Playwright: triggered native player, waiting for video stream...")

            # ============================================================
            # PASO 4: Esperar chunks con timeout adaptativo
            # ============================================================
            max_wait = 90
            interval = 3
            cycles = max_wait // interval
            last_total = 0
            idle_cycles = 0
            max_idle = 4  # 4 * 3s = 12s idle = done

            for i in range(cycles):
                await page.wait_for_timeout(interval * 1000)
                current_total = len(video_chunks) + len(audio_chunks)

                if current_total > 0 and current_total == last_total:
                    idle_cycles += 1
                    if idle_cycles >= max_idle:
                        break
                else:
                    idle_cycles = 0
                last_total = current_total

                # If we have video but no audio yet, seek to force YouTube to load audio stream
                if len(video_chunks) > 0 and len(audio_chunks) == 0 and i == 10:
                    try:
                        await page.evaluate("""
                            const v = document.querySelector('video');
                            if (v) { v.currentTime = 0.1; v.play().catch(()=>{}); }
                        """)
                        print("Playwright: seek to 0.1s to force audio stream load")
                    except Exception:
                        pass

            print(f"Playwright: collected {len(video_chunks)} video + {len(audio_chunks)} audio chunks")

            await browser.close()

            # ============================================================
            # PASO 5: Escribir archivo y mezclar con ffmpeg si necesario
            # ============================================================
            video_bytes = b''.join(video_chunks)
            audio_bytes = b''.join(audio_chunks)

            print(f"Playwright: video={len(video_bytes)}B audio={len(audio_bytes)}B")

            if not video_bytes:
                print("Playwright: no video data captured")
                return False

            if audio_bytes:
                tmp_video = output_path + '.video.tmp'
                tmp_audio = output_path + '.audio.tmp'
                with open(tmp_video, 'wb') as f:
                    f.write(video_bytes)
                with open(tmp_audio, 'wb') as f:
                    f.write(audio_bytes)

                result = subprocess.run([
                    'ffmpeg', '-y',
                    '-i', tmp_video,
                    '-i', tmp_audio,
                    '-c:v', 'copy', '-c:a', 'aac', '-shortest',
                    output_path
                ], capture_output=True, timeout=120)

                for tmp in [tmp_video, tmp_audio]:
                    try: os.remove(tmp)
                    except: pass

                if result.returncode != 0:
                    print(f"Playwright: ffmpeg mux failed, saving video-only: {result.stderr.decode()[:300]}")
                    with open(output_path, 'wb') as f:
                        f.write(video_bytes)
                else:
                    print("Playwright: ffmpeg mux success")
            else:
                with open(output_path, 'wb') as f:
                    f.write(video_bytes)

            size = os.path.getsize(output_path)
            if size >= 1024:
                print(f"Playwright download success: {size} bytes")
                return True
            else:
                print(f"Playwright download too small: {size} bytes")
                return False

    except Exception as e:
        print(f"Playwright fallback failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def download_with_invidious(url: str, output_path: str) -> bool:
    """Fallback downloader using Invidious instances for YouTube."""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        print("Invidious fallback: could not extract video ID")
        return False

    invidious_instances = []

    # Try fetching the official Invidious instance list first
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as fc:
            r = fc.get("https://api.invidious.io/instances.json")
            if r.status_code == 200:
                for inst in r.json():
                    if isinstance(inst, list) and len(inst) >= 2:
                        monitor = inst[1]
                        if monitor.get("type") == "https" and monitor.get("api") and not monitor.get("broken"):
                            uri = monitor.get("uri", "")
                            if uri and uri.startswith("https://"):
                                invidious_instances.append(uri)
                print(f"Invidious: fetched {len(invidious_instances)} instances from official list")
    except Exception as e:
        print(f"Invidious: could not fetch official list: {e}")

    # Fallback static list
    if not invidious_instances:
        invidious_instances = [
            "https://inv.nadeko.net",
            "https://yewtu.be",
            "https://invidious.fdn.fr",
            "https://inv.tux.pizza",
            "https://invidious.perennialte.ch",
            "https://vid.puffyan.us",
            "https://invidious.nerdvpn.de",
            "https://yt.artemislena.eu",
        ]

    with httpx.Client(timeout=60, follow_redirects=True) as client:
        for base in invidious_instances:
            try:
                print(f"Trying Invidious instance {base} for {video_id}")
                r = client.get(f"{base}/api/v1/videos/{video_id}")
                if r.status_code != 200:
                    print(f"Invidious {base} status: {r.status_code}")
                    continue
                data = r.json()
                # Prefer adaptive formats with both video and audio
                formats = data.get("adaptiveFormats", []) + data.get("formatStreams", [])
                download_url = None
                for fmt in formats:
                    if fmt.get("type", "").startswith("video") and "audio" in fmt.get("type", ""):
                        url_candidate = fmt.get("url")
                        if url_candidate:
                            download_url = url_candidate
                            break
                if not download_url and formats:
                    # Fall back to any format
                    for fmt in formats:
                        url_candidate = fmt.get("url")
                        if url_candidate:
                            download_url = url_candidate
                            break
                if not download_url:
                    print(f"Invidious {base}: no download url")
                    continue
                with client.stream("GET", download_url, timeout=300) as stream:
                    stream.raise_for_status()
                    with open(output_path, "wb") as f:
                        for chunk in stream.iter_bytes(chunk_size=8192):
                            f.write(chunk)
                if os.path.getsize(output_path) >= 1024:
                    print(f"Invidious download success from {base}: {output_path} ({os.path.getsize(output_path)} bytes)")
                    return True
            except Exception as e:
                print(f"Invidious {base} failed: {e}")
                continue
    print("All Invidious instances failed")
    return False


def download_with_piped(url: str, output_path: str) -> bool:
    """Fallback downloader using Piped instances for YouTube."""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        print("Piped fallback: could not extract video ID")
        return False

    piped_instances = []

    # Try fetching the official Piped instance list first
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as fc:
            r = fc.get("https://piped-instances.kavin.rocks/")
            if r.status_code == 200:
                for inst in r.json():
                    api_url = inst.get("api_url", "")
                    if api_url and api_url.startswith("https://"):
                        piped_instances.append(api_url)
                piped_instances.sort(key=lambda u: 0 if "kavin.rocks" in u else 1)  # prioritize kavin
                print(f"Piped: fetched {len(piped_instances)} instances from official list")
    except Exception as e:
        print(f"Piped: could not fetch official list: {e}")

    # Fallback static list
    if not piped_instances:
        piped_instances = [
            "https://pipedapi.kavin.rocks",
            "https://pipedapi.moomoo.me",
            "https://pipedapi.adminforge.de",
            "https://pipedapi.ducks.party",
            "https://pipedapi.lunar.icu",
            "https://pipedapi.tokhmi.xyz",
            "https://pipedapi.syncpundit.io",
        ]

    with httpx.Client(timeout=60, follow_redirects=True) as client:
        for base in piped_instances:
            try:
                print(f"Trying Piped instance {base} for {video_id}")
                r = client.get(f"{base}/streams/{video_id}")
                if r.status_code != 200:
                    print(f"Piped {base} status: {r.status_code}")
                    continue
                data = r.json()
                # Try video streams first, then audio+video
                streams = data.get("videoStreams", []) + data.get("audioStreams", [])
                # Prefer format with both video and audio
                download_url = None
                for s in streams:
                    if s.get("videoOnly"):
                        continue
                    url_candidate = s.get("url") or s.get("playbackUrl")
                    if url_candidate and (download_url is None or s.get("quality") == "720p"):
                        download_url = url_candidate
                if not download_url and streams:
                    download_url = streams[0].get("url") or streams[0].get("playbackUrl")
                if not download_url:
                    print(f"Piped {base}: no download url")
                    continue
                with client.stream("GET", download_url, timeout=300) as stream:
                    stream.raise_for_status()
                    with open(output_path, "wb") as f:
                        for chunk in stream.iter_bytes(chunk_size=8192):
                            f.write(chunk)
                if os.path.getsize(output_path) >= 1024:
                    print(f"Piped download success from {base}: {output_path} ({os.path.getsize(output_path)} bytes)")
                    return True
            except Exception as e:
                print(f"Piped {base} failed: {e}")
                continue
    print("All Piped instances failed")
    return False


def download_with_cobalt(url: str, output_path: str) -> bool:
    """Fallback downloader using cobalt.tools API for YouTube/TikTok/etc."""
    try:
        print(f"Trying cobalt.tools fallback for {url}")
        with httpx.Client(timeout=120) as client:
            # Try current cobalt API (v10+) with updated parameters
            r = client.post(
                "https://api.cobalt.tools/",
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                json={"url": url}
            )
            if r.status_code == 400 and "shut down" in r.text.lower():
                print(f"cobalt.tools: public API unavailable ({r.status_code})")
                return False
            if r.status_code != 200:
                print(f"cobalt.tools error: {r.status_code} {r.text[:200]}")
                return False
            data = r.json()
            status = data.get("status", "")
            if status == "error":
                print(f"cobalt.tools error: {data.get('text', 'unknown error')}")
                return False
            download_url = data.get("url")
            if not download_url:
                print("cobalt.tools no download url")
                return False
            with client.stream("GET", download_url, timeout=300) as stream:
                stream.raise_for_status()
                with open(output_path, "wb") as f:
                    for chunk in stream.iter_bytes(chunk_size=8192):
                        f.write(chunk)
            if os.path.getsize(output_path) >= 1024:
                print(f"cobalt.tools download success: {output_path} ({os.path.getsize(output_path)} bytes)")
                return True
        return False
    except Exception as e:
        print(f"cobalt.tools fallback failed: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - fast yt-dlp upgrade only
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'yt-dlp[default]'],
                                capture_output=True, text=True, timeout=60)
        print(f"yt-dlp upgrade: {result.returncode == 0}")
        ver = subprocess.run([sys.executable, '-m', 'yt_dlp', '--version'], capture_output=True, text=True, timeout=10)
        print(f"yt-dlp version: {ver.stdout.strip() or 'unknown'}")
    except Exception as e:
        print(f"yt-dlp upgrade skipped: {e}")
    await run_migrations()
    await fetch_jwks()
    await run_migrations()
    await fetch_jwks()
    yield
    # Shutdown (nothing to do)

app = FastAPI(lifespan=lifespan)

async def run_migrations():
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not service_key:
        print("MIGRATION SKIPPED: missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return
    project_ref = supabase_url.split("https://")[1].split(".")[0]

    # Check if credit_transactions table exists via REST API
    ct_exists = False
    try:
        supabase.table("credit_transactions").select("id").limit(1).execute()
        ct_exists = True
    except Exception:
        pass

    if not ct_exists:
        sql = """
            CREATE TABLE IF NOT EXISTS public.credit_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('purchase', 'consume', 'refund')),
                job_id UUID,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
                ON public.credit_transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
                ON public.credit_transactions(created_at DESC);

            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO public.users (id, email, credits, plan)
                VALUES (NEW.id, NEW.email, 3, 'free');
                INSERT INTO public.credit_transactions (user_id, amount, type)
                VALUES (NEW.id, 3, 'purchase');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        """
        sql_success = False
        sql_errors = []
        async with httpx.AsyncClient(timeout=30) as client:
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            }
            for url in [
                f"https://{project_ref}.supabase.co/sql/v1/query",
                f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
            ]:
                try:
                    res = await client.post(url, json={"query": sql}, headers=headers)
                    if res.status_code == 200:
                        print(f"SQL MIGRATION OK via {url.split('/')[-1]}")
                        sql_success = True
                        break
                    sql_errors.append(f"{url.split('/')[-1]}: {res.status_code} {res.text[:100]}")
                except Exception as e:
                    sql_errors.append(f"{url.split('/')[-1]}: {e}")
        if not sql_success:
            print("⚠️ CREDIT_TRANSACTIONS TABLE MISSING — DDL not available via API")
            for err in sql_errors:
                print(f"   {err}")
            print("   To fix: open supabase dashboard > SQL editor and run peakclip-app/schema.sql")
    else:
        print("SQL MIGRATION: credit_transactions table already exists (OK)")

    # Ensure stripe_customer_id column exists on users table
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            }
            alter_sql = "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;"
            for url in [
                f"https://{project_ref}.supabase.co/sql/v1/query",
                f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
            ]:
                try:
                    res = await client.post(url, json={"query": alter_sql}, headers=headers)
                    if res.status_code == 200:
                        print(f"COLUMN MIGRATION: stripe_customer_id added (OK)")
                        break
                except Exception:
                    pass
    except Exception as e:
        print(f"COLUMN MIGRATION error: {e}")

    # Add start_time / end_time columns to clips table if missing
    try:
        supabase.table("clips").select("start_time,end_time").limit(1).execute()
        print("SQL MIGRATION: start_time/end_time columns already exist (OK)")
    except Exception:
        async with httpx.AsyncClient(timeout=15) as client:
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            }
            alter_sql = "ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS start_time NUMERIC; ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS end_time NUMERIC;"
            for url in [
                f"https://{project_ref}.supabase.co/sql/v1/query",
                f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
            ]:
                try:
                    res = await client.post(url, json={"query": alter_sql}, headers=headers)
                    if res.status_code == 200:
                        print("SQL MIGRATION: added start_time/end_time columns (OK)")
                        break
                except Exception:
                    pass

    # Ensure 'clips' storage bucket exists and is public
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            update_res = await client.put(
                f"https://{project_ref}.supabase.co/storage/v1/bucket/clips",
                json={"public": True},
                headers={"Authorization": f"Bearer {service_key}", "Content-Type": "application/json"},
            )
            if update_res.status_code in (200, 201, 204):
                print("STORAGE BUCKET 'clips' is public (OK)")
            elif update_res.status_code == 400:
                create_res = await client.post(
                    f"https://{project_ref}.supabase.co/storage/v1/bucket",
                    json={"id": "clips", "name": "clips", "public": True, "file_size_limit": 524288000, "allowed_mime_types": ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png"]},
                    headers={"Authorization": f"Bearer {service_key}", "Content-Type": "application/json"},
                )
                if create_res.status_code in (200, 201):
                    print("STORAGE BUCKET 'clips' created (OK)")
                else:
                    print(f"STORAGE BUCKET create: {create_res.status_code} {create_res.text[:200]}")
            else:
                print(f"STORAGE BUCKET update: {update_res.status_code} {update_res.text[:200]}")
    except Exception as e:
        print(f"STORAGE BUCKET error: {e}")

# In-memory rate limiter
rate_store = defaultdict(list)
rate_lock = asyncio.Lock()
RATE_LIMIT = 10
RATE_WINDOW = 60

async def check_rate_limit(key: str):
    async with rate_lock:
        now = time.time()
        window_start = now - RATE_WINDOW
        rate_store[key] = [t for t in rate_store[key] if t > window_start]
        if len(rate_store[key]) >= RATE_LIMIT:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
        rate_store[key].append(now)

# In-memory job store for status tracking
jobs_store: dict = {}

FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = [o.strip() for o in FRONTEND_URL.split(",") if o.strip()] or [
    "http://localhost:3000",
    "https://peakclip-studio.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    print(f"[ERROR] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {str(exc)[:200]}"},
        headers=headers,
    )


def upload_to_storage(local_path: str, bucket: str, storage_path: str, content_type: str, max_retries: int = 3) -> str:
    """Upload a local file to Supabase Storage and verify the public URL is accessible and non-empty."""
    if not os.path.exists(local_path):
        print(f"UPLOAD SKIP: {local_path} missing")
        return ""
    size = os.path.getsize(local_path)
    if size < 1024:
        print(f"UPLOAD SKIP: {local_path} too small ({size} bytes)")
        return ""

    url = ""
    for attempt in range(max_retries):
        try:
            with open(local_path, 'rb') as f:
                file_bytes = f.read()
                supabase.storage.from_(bucket).upload(
                    storage_path,
                    file_bytes,
                    {"content-type": content_type, "upsert": "true"}
                )
            url = supabase.storage.from_(bucket).get_public_url(storage_path)
            # Verify URL is accessible and non-empty
            try:
                r = httpx.head(url, timeout=10, follow_redirects=True)
                content_length = int(r.headers.get("content-length", 0))
                if r.status_code == 200 and content_length > 1024:
                    print(f"UPLOAD OK: {url} ({content_length} bytes, {r.headers.get('content-type', 'unknown')})")
                    return url
                else:
                    print(f"UPLOAD VERIFY {r.status_code} size={content_length}: {url}")
            except Exception as ve:
                print(f"UPLOAD VERIFY ERROR: {ve}")
            if attempt < max_retries - 1:
                time.sleep(1.5 * (attempt + 1))
        except Exception as e:
            print(f"UPLOAD ATTEMPT {attempt + 1} FAILED: {e}")
            if attempt < max_retries - 1:
                time.sleep(1.5 * (attempt + 1))
    print(f"UPLOAD FAILED after {max_retries}: {storage_path}")
    return url


def verify_video_valid(path: str) -> bool:
    """Check that a video file is valid and non-empty using ffprobe."""
    if not os.path.exists(path) or os.path.getsize(path) < 1024:
        return False
    try:
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path],
            capture_output=True, text=True, timeout=30
        )
        duration = float(result.stdout.strip())
        return duration > 0
    except Exception as e:
        print(f"FFPROBE ERROR: {e}")
        return False

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = time.time() - start
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {request.method} {request.url.path} -> {response.status_code} ({elapsed:.2f}s)")
    return response


os.makedirs("downloads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
os.makedirs("thumbnails", exist_ok=True)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# JWT verification
supabase_url = os.getenv("SUPABASE_URL")
_jwks_keys = []

async def fetch_jwks():
    global _jwks_keys
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{supabase_url}/auth/v1/.well-known/jwks.json")
            if r.status_code == 200:
                _jwks_keys = r.json().get("keys", [])
                print(f"JWKS loaded: {len(_jwks_keys)} keys")
            else:
                print(f"JWKS fetch failed: {r.status_code}")
    except Exception as e:
        print(f"JWKS fetch error: {e}")

async def get_current_user(authorization: str = Header(...)):
    import base64
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token or token == "null":
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        header = pyjwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid token (no kid)")
    jwk = next((k for k in _jwks_keys if k.get("kid") == kid), None)
    if not jwk:
        raise HTTPException(status_code=401, detail=f"Invalid token (unknown kid: {kid})")
    try:
        from base64 import urlsafe_b64decode
        x = urlsafe_b64decode(jwk["x"] + "==")
        y = urlsafe_b64decode(jwk["y"] + "==")
        pub_key = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), b"\x04" + x + y)
        pem = pub_key.public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo
        )
        payload = pyjwt.decode(
            token,
            pem,
            algorithms=[jwk.get("alg", "ES256")],
            options={"verify_exp": True, "verify_aud": False}
        )
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {type(e).__name__}: {e}")


class VideoRequest(BaseModel):
    url: str


class ExportRequest(BaseModel):
    clip_id: str
    video_url: str
    trim_start: float = 0
    trim_end: float = 100
    subtitle_text: str = ""
    subtitle_style: str = "bold-yellow"
    subtitle_position: str = "bottom"
    font_size: int = 14
    watermark_text: str = ""
    watermark_position: str = "top-right"
    music_track: str = "none"
    music_volume: int = 30
    filter_style: str = "none"
    resolution: str = "1080p"
    format: str = "mp4"
    fps: int = 30


try:
    _GIT_COMMIT = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], text=True).strip()
except Exception:
    _GIT_COMMIT = "unknown"


@app.get("/")
def root():
    return {"status": "PeakClip API running", "commit": _GIT_COMMIT}


@app.get("/version")
def version():
    return {"commit": _GIT_COMMIT}


@app.get("/health")
def health():
    return {
        "status": "PeakClip API running",
        "jwks_keys": len(_jwks_keys),
        "jwks_loaded": len(_jwks_keys) > 0,
        "supabase_url": supabase_url,
    }


@app.get("/debug")
def debug():
    import shutil
    ffmpeg_path = shutil.which("ffmpeg")
    deno_path = shutil.which("deno")
    yt_dlp_ok = True
    try:
        import yt_dlp
        yt_dlp_ok = True
    except:
        yt_dlp_ok = False
    openai_key = os.getenv("OPENAI_API_KEY", "")
    supabase_url = os.getenv("SUPABASE_URL", "")
    return {
        "ffmpeg": ffmpeg_path or "NOT FOUND",
        "deno": deno_path or "NOT FOUND",
        "yt_dlp": yt_dlp_ok,
        "openai_key_set": bool(openai_key),
        "supabase_url": supabase_url,
        "allowed_origins": ALLOWED_ORIGINS,
        "cwd": os.getcwd(),
        "music_dir_exists": os.path.isdir("music"),
    }


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
        try:
            supabase.table("credit_transactions").insert({
                "user_id": user_id,
                "amount": -1,
                "type": "consume",
            }).execute()
        except Exception as e:
            print(f"credit_transactions insert failed (non-fatal): {e}")
        return new_credits
    return 0


def validate_video_url(url: str):
    parsed = urlparse(url)
    if parsed.scheme not in ("https", "http"):
        raise HTTPException(status_code=400, detail="URL must use http or https")
    private_patterns = [
        r"^localhost$", r"^127\.", r"^10\.", r"^172\.(1[6-9]|2\d|3[01])\.",
        r"^192\.168\.", r"^0\.0\.0\.0$", r"^::1$", r"^metadata\.",
    ]
    hostname = parsed.hostname or ""
    for pattern in private_patterns:
        if re.match(pattern, hostname):
            raise HTTPException(status_code=400, detail="URL pointing to private network not allowed")
    return url


def sanitize_drawtext(text: str) -> str:
    return re.sub(r"[^\w\s@.,!?¿¡\-:;'\"()]", "", text)


# ─── Subtitle + Music helpers ───────────────────────────────

MUSIC_DIR = "music"
MOOD_TRACKS = {
    "epic": "epic.mp3",
    "hype": "hype.mp3",
    "chill": "chill.mp3",
    "funny": "funny.mp3",
    "emotional": "emotional.mp3",
    "suspense": "suspense.mp3",
}
os.makedirs(MUSIC_DIR, exist_ok=True)


def format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def generate_srt_subtitle(words, clip_start, clip_end, output_path):
    """Generate SRT subtitles grouped into readable phrases with timestamps relative to clip_start."""
    clip_words = [w for w in words if w['start'] >= clip_start and w['end'] <= clip_end]
    if not clip_words:
        return

    # Group words into phrases (3-7 words each, break on punctuation or max length)
    phrases = []
    current_phrase = []
    for w in clip_words:
        word_text = w['word'].strip()
        if not word_text:
            continue
        current_phrase.append(w)
        # Break phrase on sentence-ending punctuation or max 7 words
        if len(current_phrase) >= 7 or word_text.endswith(('.', '!', '?', ',')):
            phrases.append(current_phrase)
            current_phrase = []
    if current_phrase:
        phrases.append(current_phrase)

    # Merge very short phrases (less than 3 words) with the next one
    merged = []
    i = 0
    while i < len(phrases):
        group = phrases[i]
        while len(group) < 3 and i + 1 < len(phrases):
            i += 1
            group.extend(phrases[i])
        merged.append(group)
        i += 1

    lines = []
    idx = 1
    for phrase in merged:
        phrase_text = ' '.join(w['word'] for w in phrase)
        if not phrase_text.strip():
            continue
        rel_start = max(0.0, phrase[0]['start'] - clip_start)
        rel_end = phrase[-1]['end'] - clip_start
        if rel_end <= rel_start:
            rel_end = rel_start + 0.5
        lines.append(str(idx))
        lines.append(f"{format_srt_time(rel_start)} --> {format_srt_time(rel_end)}")
        lines.append(phrase_text)
        lines.append("")
        idx += 1

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))


def resolve_music_path(mood: str) -> str | None:
    filename = MOOD_TRACKS.get(mood)
    if not filename:
        return None
    path = os.path.join(MUSIC_DIR, filename)
    return path if os.path.isfile(path) else None


def burn_subtitles_onto_video(input_path: str, srt_path: str, output_path: str, timeout: int = 180) -> bool:
    """Burn subtitles onto a video, trying multiple fallback styles."""
    if not os.path.exists(input_path) or os.path.getsize(input_path) < 1024:
        return False
    srt_path_ff = srt_path.replace('\\', '/')
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
    styles = [
        f"subtitles={srt_path_ff}:force_style='Fontname=DejaVu Sans,Fontsize=36,PrimaryColour=&H00FFFFFF,BackColour=&HCC000000,Outline=2,Bold=1,Alignment=2,MarginV=20'",
        f"subtitles={srt_path_ff}:force_style='Fontname=Arial,Fontsize=36,PrimaryColour=&H00FFFFFF,BackColour=&HCC000000,Outline=2,Bold=1,Alignment=2,MarginV=20'",
        f"subtitles={srt_path_ff}:force_style='Fontname=FreeSans,Fontsize=36,PrimaryColour=&H00FFFFFF,BackColour=&HCC000000,Outline=2,Bold=1,Alignment=2,MarginV=20'",
        f"subtitles={srt_path_ff}",
    ]
    for style in styles:
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass
        cmd = [
            'ffmpeg', '-i', input_path,
            '-vf', style,
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'fast',
            '-c:a', 'copy', '-movflags', '+faststart', '-y', output_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=timeout)
        if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) >= 1024:
            print(f"Subtitles burned successfully with style: {style[:60]}...")
            return True
        else:
            err = result.stderr.decode('utf-8', errors='replace')[:200] if result.stderr else 'unknown'
            print(f"Subtitle burn failed for style '{style[:40]}...': {err[:120]}")
    # Last resort: copy without subtitles
    try:
        shutil.copy2(input_path, output_path)
        print(f"WARNING: subtitles could not be burned, copied without subtitles: {output_path}")
    except Exception as e:
        print(f"ERROR: could not copy fallback video: {e}")
    return False


# ──────────────────────────────────────────────────────────────


def process_video_background(job_id: str, user_id: str, url: str):
    """Background task: download video, transcribe, generate clips, upload to storage."""
    jobs_store[job_id] = {"status": "processing", "message": "Starting download..."}
    video_path = f"downloads/{job_id}.mp4"
    audio_path = f"downloads/{job_id}.mp3"
    local_files = [video_path, audio_path]

    try:
        # Auto-refresh cookies if they exist (keeps session alive)
        if os.environ.get('YOUTUBE_COOKIES_B64'):
            refresh_youtube_cookies_sync()
        auth_cfg = get_youtube_auth_config()

        is_youtube = extract_youtube_video_id(url) is not None
        downloaded = False

        # ── Phase 1: Playwright (real browser) FIRST for YouTube ──
        # Real browser bypasses YouTube's JS-based bot detection which blocks yt-dlp on datacenter IPs
        if is_youtube:
            jobs_store[job_id] = {"status": "processing", "message": "Downloading with browser..."}
            downloaded = asyncio.run(download_with_playwright(url, video_path))

        # ── Phase 2: yt-dlp with retries (primary for non-YouTube, fallback for YouTube) ──
        if not downloaded:
            jobs_store[job_id] = {"status": "processing", "message": "Downloading with yt-dlp..."}
            strategies = [
                {'player_client': ['web', 'ios'], 'player_skip': ['webpage']},
                {'player_client': ['android', 'ios'], 'player_skip': ['webpage']},
                {'player_client': ['web', 'android'], 'player_skip': ['webpage']},
                {'player_client': ['tv']},
                {'player_client': ['web_creator']},
                {'player_client': ['tv_embedded']},
                {'player_client': ['web_embedded']},
                {'player_client': ['android_vr']},
                {'player_client': ['mweb']},
                {},
                {'player_client': ['ios']},
                {'player_client': ['android']},
                {'player_client': ['web']},
                {'player_client': ['web_music'], 'player_skip': ['webpage', 'configs']},
                {'player_client': ['android_music'], 'player_skip': ['webpage', 'configs']},
                {'player_client': ['android_producer'], 'player_skip': ['webpage', 'configs']},
                {'player_client': ['android', 'web'], 'player_skip': ['webpage', 'configs', 'js']},
                {'player_client': ['android', 'web', 'ios']},
                {'player_client': ['android', 'tv'], 'player_skip': ['webpage', 'configs'], 'skip': ['webpage']},
                {'player_client': ['web'], 'player_skip': ['webpage', 'configs', 'js'], 'include_incomplete_formats': True},
                {'player_client': ['android'], 'player_skip': ['webpage', 'configs'], 'include_incomplete_formats': True},
                {'player_client': ['ios'], 'player_skip': ['webpage', 'configs'], 'include_incomplete_formats': True},
                {'player_client': ['tv_embedded'], 'player_skip': ['webpage', 'configs'], 'include_incomplete_formats': True},
            ]
            impersonate_profiles = [
                None, 'chrome', 'chrome-131', 'chrome-130', 'chrome-120',
                'safari', 'safari-17', 'edge', 'firefox',
            ]
            user_agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
                'Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
                'Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/128.0.0.0 TV Safari/537.36',
            ]
            format_fallbacks = [
                'worst[ext=mp4]/worst',
                'worstvideo+worstaudio/worst',
                'best[ext=mp4]/best',
                'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'bestvideo+bestaudio/best',
                'worstvideo+bestaudio/worst',
                'bestaudio/best',
                'worst',
                'worstvideo[ext=mp4]/worst[ext=mp4]/worst',
                'bv[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]',
                'bv*+ba/b',
                '17', '36', '5', '18', '34', '35', '43', '247+140',
            ]
            proxy = get_working_proxy()
            for attempt in range(36):
                cfg = strategies[attempt % len(strategies)]
                ua = user_agents[attempt % len(user_agents)]
                fmt = format_fallbacks[attempt % len(format_fallbacks)]
                imp = impersonate_profiles[attempt % len(impersonate_profiles)]
                try:
                    ydl_opts = {
                        'format': fmt,
                        'outtmpl': video_path,
                        'quiet': True,
                        'no_warnings': True,
                        'extract_flat': False,
                        'sleep_interval': 1,
                        'sleep_interval_requests': 1,
                        'extractor_retries': 3,
                        'file_access_retries': 3,
                        'throttledratelimit': 100000,
                        'ignore_no_formats_error': True,
                        'allow_unplayable_formats': True,
                        'no_check_certificate': True,
                        'socket_timeout': 60,
                        'http_headers': {
                            'User-Agent': ua,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                        },
                    }
                    if proxy:
                        ydl_opts['proxy'] = proxy
                    if imp:
                        ydl_opts['impersonate'] = imp
                    if auth_cfg["cookies_path"]:
                        ydl_opts['cookiefile'] = auth_cfg["cookies_path"]
                    extractor_args = {'youtube': cfg} if cfg else {'youtube': {}}
                    if auth_cfg["extractor_args"]:
                        extractor_args['youtube'].update(auth_cfg["extractor_args"])
                    if auth_cfg.get("bgutil_home"):
                        extractor_args['youtubepot-bgutilscript'] = {'server_home': auth_cfg["bgutil_home"]}
                    if extractor_args['youtube'] or extractor_args.get('youtubepot-bgutilscript'):
                        ydl_opts['extractor_args'] = extractor_args
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([url])
                    if os.path.getsize(video_path) >= 1024:
                        downloaded = True
                        break
                except Exception as e:
                    err_lower = str(e).lower()
                    if any(x in err_lower for x in ["rate-limited", "no video formats", "format not available", "requested format", "too small"]):
                        if attempt < 35:
                            wait = min(3 + attempt, 30)
                            print(f"YouTube issue (attempt {attempt+1}/36): {err_lower[:80]} (strategy={cfg}, imp={imp}, proxy={proxy[:40] if proxy else 'none'}), waiting {wait}s...")
                            time.sleep(wait)
                            continue
                    break

        # ── Phase 3: Invidious → Piped → cobalt (last resort) ──
        if not downloaded:
            jobs_store[job_id] = {"status": "processing", "message": "Trying alternative sources..."}
            downloaded = (
                download_with_invidious(url, video_path) or
                download_with_piped(url, video_path) or
                download_with_cobalt(url, video_path)
            )

        if not downloaded:
            jobs_store[job_id] = {"status": "error", "message": "Could not download video from this URL. Please try another video or upload the file directly."}
            return

        jobs_store[job_id] = {"status": "processing", "message": "Extracting audio..."}
        # Check if video has an audio track first
        probe = subprocess.run([
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_streams', '-select_streams', 'a', video_path
        ], capture_output=True, text=True)
        has_audio = False
        try:
            probe_data = json.loads(probe.stdout)
            has_audio = len(probe_data.get('streams', [])) > 0
        except Exception:
            has_audio = False

        if has_audio:
            result = subprocess.run([
                'ffmpeg', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', '-b:a', '24k', audio_path, '-y'
            ], capture_output=True, text=True)
            if result.returncode != 0 or not os.path.exists(audio_path) or os.path.getsize(audio_path) < 512:
                print(f"Audio extraction failed (rc={result.returncode}), retrying with alternate codec...")
                result = subprocess.run([
                    'ffmpeg', '-y', '-i', video_path,
                    '-vn', '-acodec', 'libmp3lame', '-q:a', '4',
                    '-ar', '16000', '-ac', '1',
                    audio_path
                ], capture_output=True, text=True, timeout=60)
        else:
            # No audio track — generate silent audio matching video duration
            print("Video has no audio track, generating silent audio...")
            dur_probe = subprocess.run([
                'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1', video_path
            ], capture_output=True, text=True)
            try:
                vid_dur = max(float(dur_probe.stdout.strip() or 1), 1)
            except (ValueError, TypeError):
                vid_dur = 1
            result = subprocess.run([
                'ffmpeg', '-y', '-f', 'lavfi', '-i',
                f'anullsrc=r=16000:cl=mono:d={vid_dur}',
                '-ar', '16000', '-ac', '1', '-b:a', '24k',
                audio_path
            ], capture_output=True, text=True, timeout=60)

        if not os.path.exists(audio_path) or os.path.getsize(audio_path) < 512:
            raise FileNotFoundError(f"Could not extract audio from video: {audio_path} (video size: {os.path.getsize(video_path)} bytes)")

        # Generate a thumbnail for the source video
        thumb_path = f"thumbnails/{job_id}.jpg"
        generate_thumbnail(video_path, thumb_path)
        local_files.append(thumb_path)

        jobs_store[job_id] = {"status": "processing", "message": "Transcribing with Whisper..."}
        with open(audio_path, 'rb') as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"]
            )

        words_data = []
        if hasattr(transcript, 'words') and transcript.words:
            for w in transcript.words:
                word_text = getattr(w, 'word', '') or ''
                w_start = getattr(w, 'start', None)
                w_end = getattr(w, 'end', None)
                if w_start is not None and w_end is not None and word_text.strip():
                    words_data.append({"word": word_text, "start": w_start, "end": w_end})

        segments_text = "\n".join([
            f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}"
            for s in transcript.segments
        ])

        jobs_store[job_id] = {"status": "processing", "message": "Analyzing viral moments with AI..."}
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[{
                "role": "system",
                "content": "You are a viral clip analyzer. Return ONLY valid JSON, no markdown, no code fences.",
            }, {
                "role": "user",
                "content": f"""Analyze this transcript and return the 3 best viral moments for YouTube Shorts/TikTok.

Transcript:
{segments_text}

RULES:
- Each clip MUST be 30-60 seconds long (ideal for shorts).
- Prioritize: strong hooks in first 3s, emotional peaks, surprising twists, humor, high-energy moments, or controversy.
- NEVER reuse the same timestamp range for multiple clips.
- Classify mood as: epic, hype, chill, funny, emotional, suspense.

HOOK SCORE RUBRIC (1-10):
- 1-3: Low energy, no clear hook, would not retain scrollers.
- 4-5: Decent moment but slow start or weak payoff.
- 6-7: Good hook, solid engagement, decent retention potential.
- 8-9: Strong hook in first 3s, emotional/surprising payoff, very rewatchable.
- 10: Perfect viral hook, instant emotional impact, would explode on FYP.

VARY THE SCORES: The 3 clips should have clearly different scores reflecting their relative virality. Not all clips are equally viral.

Return JSON with this exact format:
{{"clips": [
  {{"start": 10.5, "end": 45.0, "title": "Short punchy title", "reason": "Specific reason this is viral — what emotion, twist, or hook makes it work", "mood": "hype", "hook_score": 8}},
  {{"start": 120.0, "end": 155.0, "title": "Another title", "reason": "Another specific reason", "mood": "funny", "hook_score": 6}},
  {{"start": 200.0, "end": 235.0, "title": "Third title", "reason": "Third specific reason", "mood": "emotional", "hook_score": 4}}
]}}"""
            }]
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("\n", 1)[0]
            if raw.endswith("```"):
                raw = raw[:-3]
        clips_data = json.loads(raw)
        clips_data["clips"].sort(key=lambda c: c.get("hook_score", 5), reverse=True)

        # Verify downloaded video duration and clamp clip timestamps
        probe_dur = subprocess.run([
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', video_path
        ], capture_output=True, text=True, timeout=15)
        try:
            video_duration = float(probe_dur.stdout.strip())
        except Exception:
            video_duration = 0
        print(f"Downloaded video duration: {video_duration:.1f}s")
        for clip in clips_data["clips"]:
            if video_duration > 0 and clip["start"] >= video_duration:
                print(f"WARNING: clip start {clip['start']}s exceeds video duration {video_duration:.1f}s, adjusting")
                clip["start"] = max(0, video_duration - 60)
                clip["end"] = video_duration

        output_clips = []
        temp_files_extra = []

        try:
            for i, clip in enumerate(clips_data["clips"]):
                output_path = f"outputs/{job_id}_clip{i+1}.mp4"
                clip_start = clip["start"]
                raw_duration = clip["end"] - clip["start"]
                duration = max(15, min(raw_duration, 60))
                clip["end"] = clip_start + duration
                clip_mood = clip.get("mood", "chill")

                srt_path = os.path.join(tempfile.gettempdir(), f"{job_id}_clip{i+1}.srt")
                generate_srt_subtitle(words_data, clip_start, clip["end"], srt_path)
                temp_files_extra.append(srt_path)

                music_path = resolve_music_path(clip_mood)

                no_subs = f"outputs/{job_id}_clip{i+1}_nosubs.mp4"
                local_files.append(no_subs)

                # Render video: -vf for video (lightweight), filter_complex only for audio
                no_subs = f"outputs/{job_id}_clip{i+1}_nosubs.mp4"
                local_files.append(no_subs)
                music_path_ff = music_path.replace('\\', '/') if music_path else None
                vid_filter = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280"

                # Detect if video has audio track
                probe_audio = subprocess.run([
                    'ffprobe', '-v', 'quiet', '-select_streams', 'a',
                    '-show_entries', 'stream=codec_type',
                    '-of', 'default=noprint_wrappers=1:nokey=1', video_path
                ], capture_output=True, text=True, timeout=15)
                has_audio = bool(probe_audio.stdout.strip())
                print(f"Video has audio track: {has_audio}")

                # Build render command with stable input ordering
                # Cases:
                # 1) music + has_audio: inputs=[video(0), music(1)] -> map 0:v, [a]
                # 2) music + !has_audio: inputs=[video(0), music(1)] -> map 0:v, [a]
                # 3) !music + has_audio: inputs=[video(0)] -> map 0:v, 0:a
                # 4) !music + !has_audio: inputs=[video(0), anullsrc(1)] -> map 0:v, 1:a
                if music_path and has_audio:
                    step1 = [
                        'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                        '-stream_loop', '-1', '-i', music_path_ff,
                        '-t', str(duration), '-vf', vid_filter,
                        '-filter_complex', '[0:a]volume=1.0[a_main];[1:a]volume=0.15[a_music];[a_main][a_music]amix=inputs=2:duration=first:dropout_transition=2[a]',
                        '-map', '0:v', '-map', '[a]',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                    ]
                elif music_path and not has_audio:
                    step1 = [
                        'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                        '-stream_loop', '-1', '-i', music_path_ff,
                        '-t', str(duration), '-vf', vid_filter,
                        '-filter_complex', '[1:a]volume=0.15[a]',
                        '-map', '0:v', '-map', '[a]',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                    ]
                elif not music_path and has_audio:
                    step1 = [
                        'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                        '-t', str(duration), '-vf', vid_filter,
                        '-filter_complex', '[0:a]dynaudnorm=p=0.95[a]',
                        '-map', '0:v', '-map', '[a]',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                    ]
                else:
                    step1 = [
                        'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                        '-t', str(duration), '-vf', vid_filter,
                        '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '128k', '-shortest',
                        '-movflags', '+faststart', '-y', no_subs
                    ]

                r1 = subprocess.run(step1, capture_output=True, timeout=600)
                print(f"Render exit={r1.returncode}, no_subs={'OK' if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024 else 'FAIL'}")
                if r1.returncode != 0:
                    print(f"Render stderr: {r1.stderr.decode()[:500]}")

                if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                    print(f"Burning subtitles from {srt_path}")
                    if burn_subtitles_onto_video(no_subs, srt_path, output_path):
                        print("Subtitles OK")
                    else:
                        shutil.copy2(no_subs, output_path)
                        print("Subtitles failed, copied without")
                else:
                    # Last resort: handle missing audio with anullsrc
                    print("Last resort: ultrafast direct")
                    if has_audio:
                        last_resort_cmd = [
                            'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                            '-t', str(duration), '-vf', vid_filter,
                            '-map', '0:v', '-map', '0:a',
                            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                            '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs]
                    else:
                        last_resort_cmd = [
                            'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                            '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                            '-t', str(duration), '-vf', vid_filter,
                            '-map', '0:v', '-map', '1:a',
                            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                            '-c:a', 'aac', '-b:a', '128k', '-shortest',
                            '-movflags', '+faststart', '-y', no_subs]
                    subprocess.run(last_resort_cmd, capture_output=True, timeout=600)
                    if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                        burn_subtitles_onto_video(no_subs, srt_path, output_path)

                local_files.append(output_path)

                jobs_store[job_id] = {"status": "processing", "message": f"Uploading clip {i+1}..."}
                if not verify_video_valid(output_path):
                    print(f"GENERATED VIDEO INVALID: {output_path}")
                    clip_storage_url = ""
                    thumb_storage_url = ""
                else:
                    storage_path = f"{job_id}/{job_id}_clip{i+1}.mp4"
                    clip_storage_url = upload_to_storage(output_path, "clips", storage_path, "video/mp4")
                    thumb_storage_path = f"thumbnails/{job_id}.jpg"
                    thumb_storage_url = upload_to_storage(thumb_path, "clips", thumb_storage_path, "image/jpeg")

                supabase.table("clips").insert({
                    "user_id": user_id,
                    "title": clip["title"],
                    "status": "done" if clip_storage_url else "error",
                    "video_url": clip_storage_url,
                    "thumbnail_url": thumb_storage_url,
                    "duration": round(duration, 1),
                    "start_time": clip_start,
                    "end_time": clip["end"]
                }).execute()

                output_clips.append({
                    "clip": i + 1,
                    "title": clip["title"],
                    "reason": clip["reason"],
                    "mood": clip_mood,
                    "start": clip["start"],
                    "end": clip["end"],
                    "hook_score": clip.get("hook_score", 5),
                    "file": clip_storage_url,
                    "thumbnail_url": thumb_storage_url
                })
        finally:
            for f in local_files:
                try: os.unlink(f)
                except OSError: pass
            for f in temp_files_extra:
                try: os.unlink(f)
                except OSError: pass

        jobs_store[job_id] = {"status": "done", "message": f"{len(output_clips)} clips ready", "clips": output_clips}
    except Exception as e:
        print(f"PROCESS ERROR: {e}")
        traceback.print_exc()
        jobs_store[job_id] = {"status": "error", "message": str(e)[:200]}


@app.post("/process")
async def process_video(req: VideoRequest, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    await check_rate_limit(f"process:{user['sub']}")
    user_id = user["sub"]
    job_id = str(uuid.uuid4())

    validate_video_url(req.url)

    user_result = supabase.table("users").select("credits,plan").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = user_result.data[0]
    if user_data["plan"] != "pro" and user_data["credits"] <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining")

    if user_data["plan"] != "pro":
        dedent_credits(user_id)

    background_tasks.add_task(process_video_background, job_id, user_id, req.url)
    jobs_store[job_id] = {"status": "processing", "message": "Started processing"}
    return {"status": "processing", "job_id": job_id}


@app.post("/export")
async def export_clip(req: ExportRequest, user: dict = Depends(get_current_user)):
    await check_rate_limit(f"export:{user['sub']}")
    user_id = user["sub"]
    job_id = str(uuid.uuid4())
    output_ext = req.format if req.format in ("mov", "webm") else "mp4"
    output_filename = f"{job_id}_export.{output_ext}"
    output_path = f"outputs/{output_filename}"
    local_files = []

    # Determine source: use processed clip from Supabase if available, otherwise download
    source_path = None

    # 1) Try getting the clip's processed video from Supabase Storage
    try:
        supabase_url = supabase.table("clips").select("video_url").eq("id", req.clip_id).eq("user_id", user_id).execute()
        clip_data = supabase_url.data
        if clip_data:
            stored_url = (clip_data[0].get("video_url") or "").strip()
            # Skip if it's a YouTube URL (not a processed video)
            if stored_url and not extract_youtube_video_id(stored_url):
                source_path = f"downloads/{job_id}_source.mp4"
                print(f"Export: fetching stored clip from {stored_url[:80]}...")
                r = httpx.get(stored_url, timeout=120, follow_redirects=True)
                if r.status_code == 200 and len(r.content) >= 1024:
                    with open(source_path, "wb") as f:
                        f.write(r.content)
                    print(f"Export: using stored clip from Supabase ({os.path.getsize(source_path)} bytes)")
                else:
                    print(f"Export: stored clip fetch failed (status={r.status_code}, size={len(r.content)})")
                    source_path = None
            elif stored_url:
                print(f"Export: stored video_url is a YouTube URL, skipping (use req.video_url as fallback)")
    except Exception as e:
        print(f"Export: stored clip error: {e}")
        source_path = None

    # Source validation
    if source_path and os.path.getsize(source_path) < 1024:
        print(f"Export: source too small ({os.path.getsize(source_path)} bytes), discarding")
        source_path = None

    # 2) Fallback: download from the provided URL (works for direct MP4 URLs)
    if not source_path:
        video_url = (req.video_url or "").strip()
        if not video_url:
            raise HTTPException(status_code=400, detail="No video source available. Submit this video via Dashboard first to download and process it.")

        is_yt = extract_youtube_video_id(video_url)
        if is_yt:
            raise HTTPException(
                status_code=400,
                detail="This clip links to a YouTube URL that hasn't been downloaded yet. Submit it via Dashboard → Process to download and analyze it first."
            )

        source_path = f"downloads/{job_id}_source.mp4"
        result = subprocess.run([
            'ffmpeg', '-i', video_url, '-c', 'copy', source_path, '-y'
        ], capture_output=True, text=True)
        if not os.path.exists(source_path) or os.path.getsize(source_path) < 1024:
            err_msg = result.stderr.strip().split('\n')[-5:] if result.stderr else ["unknown ffmpeg error"]
            raise HTTPException(status_code=400, detail=f"Could not download source video: {' '.join(err_msg)[:300]}")
        local_files.append(source_path)

    probe = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', source_path
    ], capture_output=True, text=True)

    try:
        total_duration = float(probe.stdout.strip())
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"Could not probe source video. Source size: {os.path.getsize(source_path)} bytes. ffprobe: {probe.stderr[:200]}")
    if total_duration <= 0:
        raise HTTPException(status_code=400, detail=f"Invalid source duration: {total_duration}s. File may be corrupt.")

    trim_s = req.trim_start / 100 * total_duration
    trim_d = (req.trim_end - req.trim_start) / 100 * total_duration
    trim_d = max(trim_d, 2)
    print(f"Export: source={os.path.getsize(source_path)}B dur={total_duration}s trim={trim_s}-{trim_s+trim_d}s")

    # Resolution mapping
    res_map = {"720p": "720:1280", "1080p": "1080:1920", "4k": "2160:3840"}
    target_res = res_map.get(req.resolution, "1080:1920")

    temp_files = []

    try:
        # Build filter chain
        vf = f"scale={target_res}:force_original_aspect_ratio=increase,crop={target_res}"

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

        # Subtitles via textfile
        subtitle_text = req.subtitle_text or "PeakClip"
        if req.subtitle_style != "none" and subtitle_text:
            fs = req.font_size
            style_configs = {
                "bold-yellow": f"fontsize={fs}:fontcolor=yellow:borderw=3:bordercolor=black",
                "white-outline": f"fontsize={fs}:fontcolor=white:borderw=3:bordercolor=black",
                "neon-green": f"fontsize={fs}:fontcolor=#00ff88:borderw=2:bordercolor=#003322",
                "minimal-white": f"fontsize={fs}:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=8",
                "tiktok-style": f"fontsize={fs}:fontcolor=white:borderw=4:bordercolor=#fe2c55",
            }
            dt_params = style_configs.get(req.subtitle_style, style_configs["bold-yellow"])
            pos_map = {"top": "y=20", "middle": "y=(h-text_h)/2", "bottom": "y=h-text_h-80"}
            y_pos = pos_map.get(req.subtitle_position, pos_map["bottom"])
            safe_text = sanitize_drawtext(subtitle_text)
            textfile = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
            textfile.write(safe_text)
            textfile.close()
            temp_files.append(textfile.name)
            sub_path = textfile.name.replace("\\", "/")
            dt_filter = f"drawtext=textfile='{sub_path}':{dt_params}:{y_pos}:enable='between(t,0,{trim_d})'"
            vf = f"{vf},{dt_filter}"

        # Watermark via textfile
        if req.watermark_text:
            pos_map_wm = {
                "top-right": "x=w-tw-20:y=20",
                "top-left": "x=20:y=20",
                "bottom-right": "x=w-tw-20:y=h-th-20",
                "bottom-left": "x=20:y=h-th-20",
            }
            wm_pos = pos_map_wm.get(req.watermark_position, pos_map_wm["top-right"])
            safe_wm = sanitize_drawtext(req.watermark_text)
            wm_textfile = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
            wm_textfile.write(safe_wm)
            wm_textfile.close()
            temp_files.append(wm_textfile.name)
            wm_sub_path = wm_textfile.name.replace("\\", "/")
            wm_filter = f"drawtext=textfile='{wm_sub_path}':fontsize=h/28:fontcolor=white@0.8:borderw=2:bordercolor=black@0.5:{wm_pos}:enable='between(t,0,{trim_d})'"
            vf = f"{vf},{wm_filter}"

        # Audio filter chain
        af_parts = []

        # Background music mixing
        music_path = None
        if req.music_track not in ("none", "", 0, "0", None):
            music_path = f"downloads/{job_id}_music.mp3"
            try:
                # Map track IDs to SoundHelix free MP3 URLs
                track_map = {
                    "epic": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                    "hype": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                    "chill": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                    "gaming": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                    "viral": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
                }
                music_url = track_map.get(str(req.music_track))
                if music_url:
                    subprocess.run([
                        'ffmpeg', '-i', music_url, '-t', str(trim_d + 1),
                        '-q:a', '0', music_path, '-y'
                    ], capture_output=True)
                    if os.path.exists(music_path):
                        local_files.append(music_path)
                        vol = max(0, min(req.music_volume, 100)) / 100.0
                        af_parts.append(f"[1:a]volume={vol}[music]")
                        af_parts.append("[0:a][music]amix=inputs=2:duration=first:dropout_transition=2")
            except Exception as e:
                print(f"Music mixing failed: {e}")

        # Apply audio filter if any
        af_filter = None
        if af_parts:
            af_filter = ";".join(af_parts)

        # Video codec selection
        vcodec = "libx264"
        acodec = "aac"
        if output_ext == "webm":
            vcodec = "libvpx-vp9"
            acodec = "libopus"
        elif output_ext == "mov":
            vcodec = "libx264"
            acodec = "aac"

        cmd = [
            'ffmpeg',
            '-ss', str(trim_s),
            '-i', source_path,
        ]
        if music_path and os.path.exists(music_path):
            cmd.extend(['-i', music_path])
        cmd.extend([
            '-t', str(trim_d),
            '-vf', vf,
            '-r', str(req.fps),
            '-c:v', vcodec,
        ])
        if vcodec == 'libx264':
            cmd.extend(['-pix_fmt', 'yuv420p', '-movflags', '+faststart'])
        cmd.extend([
            '-preset', 'fast',
            '-c:a', acodec,
        ])
        if af_filter:
            cmd.extend(['-filter_complex', af_filter])
        cmd.extend(['-y', output_path])

        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"Export: ffmpeg exit={result.returncode} output_size={os.path.getsize(output_path) if os.path.exists(output_path) else 0}")
        if result.returncode != 0:
            err_lines = result.stderr.strip().split('\n')[-10:] if result.stderr else ["unknown ffmpeg error"]
            raise HTTPException(status_code=400, detail=f"Export error: {' | '.join(err_lines)[:500]}")

        if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
            size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            source_size = os.path.getsize(source_path)
            stderr_tail = result.stderr.strip().split('\n')[-5:] if result.stderr else ["no stderr"]
            raise HTTPException(status_code=400, detail=f"Export produced empty file ({size}B). Source: {source_size}B, trim: {trim_s:.1f}s-{trim_s+trim_d:.1f}s dur:{total_duration}s. ffmpeg: {' | '.join(stderr_tail)[:300]}")

        local_files.append(output_path)

        # Upload to Supabase Storage
        storage_path = f"exports/{output_filename}"
        public_url = upload_to_storage(output_path, "clips", storage_path, f"video/{output_ext}")

        if not public_url:
            raise HTTPException(status_code=400, detail="Export failed: could not upload to storage")

        # Update clip record
        supabase.table("clips").update({
            "video_url": public_url,
            "status": "done"
        }).eq("id", req.clip_id).eq("user_id", user_id).execute()

        return {
            "success": True,
            "video_url": public_url,
            "message": "Clip exported successfully"
        }
    finally:
        for f in local_files:
            try: os.unlink(f)
            except OSError: pass
        for f in temp_files:
            try: os.unlink(f)
            except OSError: pass


@app.post("/create-checkout-session")
async def create_checkout_session(data: dict, user: dict = Depends(get_current_user)):
    await check_rate_limit(f"checkout:{user['sub']}")
    user_id = user["sub"]
    price_id = data.get("price_id")
    return_url = data.get("return_url", f"{FRONTEND_URL}/dashboard")

    if not price_id:
        raise HTTPException(status_code=400, detail="Missing price_id")

    try:
        # Find or create Stripe Customer
        user_result = supabase.table("users").select("email,stripe_customer_id").eq("id", user_id).execute()
        user_email = user_result.data[0]["email"] if user_result.data else None
        customer_id = user_result.data[0].get("stripe_customer_id") if user_result.data else None

        if not customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={"user_id": user_id},
            )
            customer_id = customer.id
            supabase.table("users").update({"stripe_customer_id": customer_id}).eq("id", user_id).execute()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=return_url + "?plan=success",
            cancel_url=return_url + "?plan=cancelled",
            metadata={"user_id": user_id, "price_id": price_id},
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        price_id = session["metadata"].get("price_id", "")
        plan_map = {
            "price_creator": "creator",
            "price_pro": "pro",
        }
        plan = plan_map.get(price_id, "creator")
        credit_amount = 999 if plan == "pro" else 200
        supabase.table("users").update({
            "plan": plan,
            "credits": credit_amount
        }).eq("id", user_id).execute()
        try:
            supabase.table("credit_transactions").insert({
                "user_id": user_id,
                "amount": credit_amount,
                "type": "purchase",
            }).execute()
        except Exception as e:
            print(f"credit_transactions insert failed (non-fatal): {e}")
    return {"received": True}


@app.get("/clips")
def get_user_clips(user: dict = Depends(get_current_user)):
    user_id = user["sub"]
    result = supabase.table("clips").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"clips": result.data}


@app.get("/status/{job_id}")
async def get_job_status(job_id: str, user: dict = Depends(get_current_user)):
    job = jobs_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    url: str = Form(""),
    user: dict = Depends(get_current_user),
):
    await check_rate_limit(f"upload:{user['sub']}")
    user_id = user["sub"]
    job_id = str(uuid.uuid4())

    user_result = supabase.table("users").select("credits,plan").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = user_result.data[0]
    if user_data["plan"] != "pro" and user_data["credits"] <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining")

    if user_data["plan"] != "pro":
        dedent_credits(user_id)

    video_path = f"downloads/{job_id}.mp4"
    audio_path = f"downloads/{job_id}.mp3"
    local_files = [video_path, audio_path]

    # Save uploaded file
    content = await file.read()
    with open(video_path, "wb") as f:
        f.write(content)
    print(f"UPLOAD: saved {len(content)} bytes to {video_path}")

    jobs_store[job_id] = {"status": "processing", "message": "Extracting audio..."}

    result = subprocess.run([
        'ffmpeg', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', '-b:a', '24k', audio_path, '-y'
    ], capture_output=True, text=True)
    if result.returncode != 0 or not os.path.exists(audio_path) or os.path.getsize(audio_path) < 512:
        result = subprocess.run([
            'ffmpeg', '-y', '-i', video_path,
            '-vn', '-acodec', 'libmp3lame', '-q:a', '4',
            '-ar', '16000', '-ac', '1',
            audio_path
        ], capture_output=True, text=True, timeout=60)
    if not os.path.exists(audio_path) or os.path.getsize(audio_path) < 512:
        raise FileNotFoundError(f"Could not extract audio from uploaded video: {audio_path}")

    thumb_path = f"thumbnails/{job_id}.jpg"
    generate_thumbnail(video_path, thumb_path)
    local_files.append(thumb_path)

    jobs_store[job_id] = {"status": "processing", "message": "Transcribing audio..."}

    with open(audio_path, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["word", "segment"]
        )

    words_data = []
    if hasattr(transcript, 'words') and transcript.words:
        for w in transcript.words:
            word_text = getattr(w, 'word', '') or ''
            w_start = getattr(w, 'start', None)
            w_end = getattr(w, 'end', None)
            if w_start is not None and w_end is not None and word_text.strip():
                words_data.append({"word": word_text, "start": w_start, "end": w_end})

    segments_text = "\n".join([
        f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}"
        for s in transcript.segments
    ])

    jobs_store[job_id] = {"status": "processing", "message": "Analyzing viral moments with AI..."}

    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[{
            "role": "system",
            "content": "You are a viral clip analyzer. Return ONLY valid JSON, no markdown, no code fences.",
        }, {
            "role": "user",
            "content": f"""Analyze this transcript and return the 3 best viral moments for YouTube Shorts/TikTok.

Transcript:
{segments_text}

RULES:
- Each clip MUST be 30-60 seconds long (ideal for shorts).
- Prioritize: strong hooks in first 3s, emotional peaks, surprising twists, humor, high-energy moments, or controversy.
- NEVER reuse the same timestamp range for multiple clips.
- Classify mood as: epic, hype, chill, funny, emotional, suspense.

HOOK SCORE RUBRIC (1-10):
- 1-3: Low energy, no clear hook, would not retain scrollers.
- 4-5: Decent moment but slow start or weak payoff.
- 6-7: Good hook, solid engagement, decent retention potential.
- 8-9: Strong hook in first 3s, emotional/surprising payoff, very rewatchable.
- 10: Perfect viral hook, instant emotional impact, would explode on FYP.

VARY THE SCORES: The 3 clips should have clearly different scores reflecting their relative virality. Not all clips are equally viral.

Return JSON with this exact format:
{{"clips": [
  {{"start": 10.5, "end": 45.0, "title": "Short punchy title", "reason": "Specific reason this is viral", "mood": "hype", "hook_score": 8}},
  {{"start": 120.0, "end": 155.0, "title": "Another title", "reason": "Another specific reason", "mood": "funny", "hook_score": 6}},
  {{"start": 200.0, "end": 235.0, "title": "Third title", "reason": "Third specific reason", "mood": "emotional", "hook_score": 4}}
]}}"""
        }]
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("\n", 1)[0]
        if raw.endswith("```"):
            raw = raw[:-3]
    clips_data = json.loads(raw)
    clips_data["clips"].sort(key=lambda c: c.get("hook_score", 5), reverse=True)

    # Verify downloaded video duration and clamp clip timestamps
    probe_dur = subprocess.run([
        'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', video_path
    ], capture_output=True, text=True, timeout=15)
    try:
        video_duration = float(probe_dur.stdout.strip())
    except Exception:
        video_duration = 0
    print(f"Downloaded video duration: {video_duration:.1f}s")
    for clip in clips_data["clips"]:
        if video_duration > 0 and clip["start"] >= video_duration:
            print(f"WARNING: clip start {clip['start']}s exceeds video duration {video_duration:.1f}s, adjusting")
            clip["start"] = max(0, video_duration - 60)
            clip["end"] = video_duration

    output_clips = []
    temp_files_extra = []

    try:
        for i, clip in enumerate(clips_data["clips"]):
            output_path = f"outputs/{job_id}_clip{i+1}.mp4"
            clip_start = clip["start"]
            raw_duration = clip["end"] - clip["start"]
            duration = max(15, min(raw_duration, 60))
            clip["end"] = clip_start + duration
            clip_mood = clip.get("mood", "chill")

            srt_path = os.path.join(tempfile.gettempdir(), f"{job_id}_clip{i+1}.srt")
            generate_srt_subtitle(words_data, clip_start, clip["end"], srt_path)
            temp_files_extra.append(srt_path)

            music_path = resolve_music_path(clip_mood)
            
            # Step 1: render video+audio without subtitles (h264, 9:16 portrait)
            no_subs = f"outputs/{job_id}_clip{i+1}_nosubs.mp4"
            local_files.append(no_subs)

            # Detect if video has audio track
            probe_audio = subprocess.run([
                'ffprobe', '-v', 'quiet', '-select_streams', 'a',
                '-show_entries', 'stream=codec_type',
                '-of', 'default=noprint_wrappers=1:nokey=1', video_path
            ], capture_output=True, text=True, timeout=15)
            has_audio = bool(probe_audio.stdout.strip())
            print(f"Video has audio track: {has_audio}")

            vid_filter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
            music_path_ff = music_path.replace('\\', '/') if music_path else None

            # Build render command with stable input ordering
            if music_path and has_audio:
                step1 = [
                    'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                    '-stream_loop', '-1', '-i', music_path_ff,
                    '-t', str(duration), '-vf', vid_filter,
                    '-filter_complex', '[0:a]volume=1.0[a_main];[1:a]volume=0.15[a_music];[a_main][a_music]amix=inputs=2:duration=first:dropout_transition=2[a]',
                    '-map', '0:v', '-map', '[a]',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                ]
            elif music_path and not has_audio:
                step1 = [
                    'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                    '-stream_loop', '-1', '-i', music_path_ff,
                    '-t', str(duration), '-vf', vid_filter,
                    '-filter_complex', '[1:a]volume=0.15[a]',
                    '-map', '0:v', '-map', '[a]',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                ]
            elif not music_path and has_audio:
                step1 = [
                    'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                    '-t', str(duration), '-vf', vid_filter,
                    '-filter_complex', '[0:a]dynaudnorm=p=0.95[a]',
                    '-map', '0:v', '-map', '[a]',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                ]
            else:
                step1 = [
                    'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                    '-t', str(duration), '-vf', vid_filter,
                    '-map', '0:v', '-map', '1:a',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
                    '-c:a', 'aac', '-b:a', '128k', '-shortest',
                    '-movflags', '+faststart', '-y', no_subs
                ]
            subprocess.run(step1, capture_output=True, timeout=600)

            if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                # Step 2: burn subtitles onto the rendered video
                srt_path_ff = srt_path.replace('\\', '/')
                step2 = ['ffmpeg', '-i', no_subs,
                         '-vf', f"subtitles={srt_path_ff}:force_style='Fontname=DejaVu Sans,Fontsize=36,PrimaryColour=&H00FFFFFF,BackColour=&HCC000000,Outline=2,Bold=1,Alignment=2,MarginV=20'",
                         '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
                         '-c:a', 'copy', '-movflags', '+faststart', '-y', output_path]
                subprocess.run(step2, capture_output=True, timeout=300)
                if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                    shutil.copy2(no_subs, output_path)
            else:
                # Fallback: render at 720p (lower memory), handle missing audio
                print("Fallback: 720p render")
                vid_filter = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280"
                if has_audio:
                    last_resort = [
                        'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                        '-t', str(duration), '-vf', vid_filter,
                        '-map', '0:v', '-map', '0:a',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs]
                else:
                    last_resort = [
                        'ffmpeg', '-ss', str(clip_start), '-i', video_path,
                        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                        '-t', str(duration), '-vf', vid_filter,
                        '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '128k', '-shortest',
                        '-movflags', '+faststart', '-y', no_subs]
                subprocess.run(last_resort, capture_output=True, timeout=600)
                if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                    burn_subtitles_onto_video(no_subs, srt_path, output_path)
                else:
                    subprocess.run(['ffmpeg', '-ss', str(clip_start), '-i', video_path, '-t', str(duration),
                                    '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280',
                                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-c:a', 'aac', '-movflags', '+faststart', '-y', output_path],
                                   capture_output=True, timeout=300)

            local_files.append(output_path)

            if not verify_video_valid(output_path):
                print(f"GENERATED VIDEO INVALID: {output_path}")
                clip_storage_url = ""
                thumb_storage_url = ""
            else:
                storage_path = f"{job_id}/{job_id}_clip{i+1}.mp4"
                clip_storage_url = upload_to_storage(output_path, "clips", storage_path, "video/mp4")

                thumb_storage_path = f"thumbnails/{job_id}.jpg"
                thumb_storage_url = upload_to_storage(thumb_path, "clips", thumb_storage_path, "image/jpeg")

            supabase.table("clips").insert({
                "user_id": user_id,
                "title": clip["title"],
                "status": "done" if clip_storage_url else "error",
                "video_url": clip_storage_url,
                "thumbnail_url": thumb_storage_url,
                "duration": round(duration, 1),
                "start_time": clip_start,
                "end_time": clip["end"]
            }).execute()

            output_clips.append({
                "clip": i + 1,
                "title": clip["title"],
                "reason": clip["reason"],
                "mood": clip_mood,
                "start": clip["start"],
                "end": clip["end"],
                "hook_score": clip.get("hook_score", 5),
                "file": clip_storage_url,
                "thumbnail_url": thumb_storage_url
            })

        jobs_store[job_id] = {"status": "done", "message": f"{len(output_clips)} clips ready"}
    except Exception as e:
        jobs_store[job_id] = {"status": "error", "message": str(e)[:200]}
        raise
    finally:
        for f in local_files:
            try: os.unlink(f)
            except OSError: pass
        for f in temp_files_extra:
            try: os.unlink(f)
            except OSError: pass

    return {
        "job_id": job_id,
        "clips": output_clips,
        "total": len(output_clips)
    }


@app.get("/create-portal-session")
async def create_portal_session(user: dict = Depends(get_current_user)):
    from fastapi.responses import RedirectResponse
    user_id = user["sub"]
    user_result = supabase.table("users").select("email,stripe_customer_id").eq("id", user_id).execute()
    if not user_result.data:
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?tab=settings&error=user_not_found")

    customer_id = user_result.data[0].get("stripe_customer_id")
    if not customer_id:
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?tab=settings&error=no_customer")

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{FRONTEND_URL}/dashboard?tab=settings",
        )
        return RedirectResponse(url=session.url)
    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?tab=settings&error={str(e)[:50]}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
