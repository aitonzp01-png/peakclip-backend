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
import shutil
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

# ── Env vars debug ──
print("=== ENV VARS DEBUG ===")
b64_val = os.environ.get('YOUTUBE_COOKIES_B64', '')
print(f"YOUTUBE_COOKIES_B64 length: {len(b64_val)}")
print(f"YOUTUBE_PROXY: {os.environ.get('YOUTUBE_PROXY', 'NOT SET')[:40]}")
print(f"All env keys with YOUTUBE: {[k for k in os.environ if 'YOUTUBE' in k]}")
print("=== END ENV VARS ===")

def get_fresh_cookie_path() -> str | None:
    """Read YOUTUBE_COOKIES_B64 from env at runtime. Cache up to 2h."""
    cookie_path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")

    if os.path.exists(cookie_path):
        age = time.time() - os.path.getmtime(cookie_path)
        if age < 7200:
            return cookie_path

    cookies_b64 = os.environ.get('YOUTUBE_COOKIES_B64', '').strip()
    if not cookies_b64:
        print("WARNING: YOUTUBE_COOKIES_B64 not set or empty")
        return None

    try:
        cookies_b64_clean = ''.join(cookies_b64.split())
        cookies_bytes = base64.b64decode(cookies_b64_clean + '==')
        cookies_content = cookies_bytes.decode('utf-8')

        with open(cookie_path, 'w', encoding='utf-8') as f:
            f.write(cookies_content)

        valid_lines = [l for l in cookies_content.split('\n')
                       if l.strip() and not l.startswith('#')]
        print(f"Cookies decoded OK: {len(valid_lines)} cookies -> {cookie_path}")
        return cookie_path

    except Exception as e:
        print(f"Cookie decode error: {type(e).__name__}: {e}")
        print(f"B64 preview: {cookies_b64[:50]}...")
        return None


def get_youtube_auth_config():
    """Load YouTube cookies/PO token from environment variables to bypass bot checks."""
    config = {"cookies_path": get_fresh_cookie_path(), "extractor_args": {}}
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
    """Return configured proxy. Checks multiple common environment variables."""
    for key in ['YOUTUBE_PROXY', 'YTDLP_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY', 'PROXY_URL']:
        configured = os.getenv(key)
        if configured:
            print(f"Using configured proxy ({key}): {configured[:40]}...")
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


async def generate_youtube_cookies_via_playwright() -> bool:
    """Use Playwright to get anonymous YouTube session cookies.
    Quick: visits youtube.com, waits 5s, extracts cookies. No login needed since Deno handles JS challenges."""
    try:
        proxy_url = (
            os.environ.get('YOUTUBE_PROXY') or
            os.environ.get('YTDLP_PROXY') or
            os.environ.get('HTTP_PROXY') or
            os.environ.get('HTTPS_PROXY') or
            os.environ.get('PROXY_URL') or
            ''
        ).strip()
        playwright_proxy = None
        if proxy_url:
            parsed = urlparse(proxy_url)
            if parsed.hostname and parsed.port:
                server = f"{parsed.scheme}://{parsed.hostname}:{parsed.port}" if parsed.scheme else f"http://{parsed.hostname}:{parsed.port}"
                playwright_proxy = {'server': server}
                if parsed.username:
                    playwright_proxy['username'] = parsed.username
                if parsed.password:
                    playwright_proxy['password'] = parsed.password
                print(f"Cookie gen: using proxy {server}")

        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            context = await browser.new_context(
                proxy=playwright_proxy,
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            )
            page = await context.new_page()
            # Visit a real video page to trigger proper session cookies
            await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ', wait_until='domcontentloaded', timeout=30000)
            await page.wait_for_timeout(12000)

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
            print(f"Cookie gen: {len(cookies)} anonymous cookies saved")
            return True
    except Exception as e:
        print(f"Cookie gen failed (non-fatal): {e}")
        return False

async def download_with_playwright(url: str, output_path: str) -> bool:
    """Download YouTube video using Playwright with cookies for auth."""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        print("Playwright: could not extract video ID")
        return False
    try:
        print(f"Trying Playwright v2 for {url}")

        # Read proxy from environment (same as yt-dlp)
        proxy_url = (
            os.environ.get('YOUTUBE_PROXY') or
            os.environ.get('YTDLP_PROXY') or
            os.environ.get('HTTP_PROXY') or
            os.environ.get('HTTPS_PROXY') or
            os.environ.get('PROXY_URL') or
            ''
        ).strip()
        playwright_proxy = None
        if proxy_url:
            from urllib.parse import urlparse
            parsed = urlparse(proxy_url)
            if parsed.hostname and parsed.port:
                server = f"{parsed.scheme}://{parsed.hostname}:{parsed.port}" if parsed.scheme else f"http://{parsed.hostname}:{parsed.port}"
                playwright_proxy = {'server': server}
                if parsed.username:
                    playwright_proxy['username'] = parsed.username
                if parsed.password:
                    playwright_proxy['password'] = parsed.password
                print(f"Playwright: using proxy {server}")
            else:
                print(f"Playwright: proxy URL invalid: {proxy_url[:40]}")
        else:
            print("Playwright: no proxy configured")

        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox',
                      '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
            )
            context = await browser.new_context(
                proxy=playwright_proxy,
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
            # PASO 0: Bloquear recursos pesados para cargar más rápido
            # ============================================================
            async def block_unnecessary(route, request):
                if request.resource_type in ['image', 'font', 'stylesheet', 'media']:
                    await route.abort()
                else:
                    await route.continue_()

            await page.route('**/*', block_unnecessary)

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
            # PASO 2: Navegar a YouTube con timeout 90s
            # ============================================================
            target_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"Playwright: navigating to {target_url}")
            try:
                await page.goto(target_url, wait_until='domcontentloaded', timeout=90000)
            except Exception as e:
                print(f"Playwright: goto failed (will retry once): {e}")
                try:
                    await page.wait_for_timeout(3000)
                    await page.goto(target_url, wait_until='domcontentloaded', timeout=90000)
                except Exception as e2:
                    print(f"Playwright: goto retry failed: {e2}")
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
            # PASO 4: Esperar chunks con timeout adaptativo (máx 45s)
            # ============================================================
            max_wait = 45
            interval = 3
            cycles = max_wait // interval
            last_total = 0
            idle_cycles = 0
            max_idle = 2  # 2 * 3s = 6s idle = done

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

            # Write raw temp files and remux with ffmpeg for a valid MP4
            raw_video = output_path + '.rawv.tmp'
            raw_audio = output_path + '.rawa.tmp'
            with open(raw_video, 'wb') as f:
                f.write(video_bytes)

            if audio_bytes:
                with open(raw_audio, 'wb') as f:
                    f.write(audio_bytes)
                mux_cmd = [
                    'ffmpeg', '-y',
                    '-i', raw_video,
                    '-i', raw_audio,
                    '-c', 'copy',
                    '-movflags', '+faststart',
                    output_path
                ]
            else:
                mux_cmd = [
                    'ffmpeg', '-y',
                    '-i', raw_video,
                    '-c', 'copy',
                    '-movflags', '+faststart',
                    output_path
                ]
            mux_result = subprocess.run(mux_cmd, capture_output=True, timeout=120)

            # Cleanup temp files
            for tmp in [raw_video, raw_audio]:
                try:
                    os.remove(tmp)
                except Exception:
                    pass

            if mux_result.returncode != 0:
                print(f"Playwright: remux failed: {mux_result.stderr.decode()[:300]}")
                # Fallback: save raw without remux
                with open(output_path, 'wb') as f:
                    f.write(video_bytes)
            else:
                print("Playwright: remux success")

            size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            if size < 1024:
                print(f"Playwright download too small: {size} bytes")
                return False

            # Validate downloaded file has real video duration
            probe = subprocess.run([
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_streams', '-show_entries', 'format=duration',
                output_path
            ], capture_output=True, text=True, timeout=15)
            try:
                probe_data = json.loads(probe.stdout)
                duration = float(probe_data.get('format', {}).get('duration', 0) or 0)
                has_video = any(s.get('codec_type') == 'video' for s in probe_data.get('streams', []))
                print(f"Playwright download validation: size={size} bytes, duration={duration:.1f}s, has_video={has_video}")
                if duration <= 0 or not has_video:
                    print("Playwright download invalid (no duration or no video stream), will try fallback")
                    return False
            except Exception as e:
                print(f"Playwright download validation failed: {e}, will try fallback")
                return False

            print(f"Playwright download success: {size} bytes")
            return True

    except Exception as e:
        print(f"Playwright fallback failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def download_with_invidious(url: str, output_path: str, proxy_url: str = None) -> bool:
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
            "https://iv.nboeck.de",
            "https://iv.datura.network",
            "https://iv.nboeck.de",
            "https://iv.melmac.space",
            "https://iv.datura.network",
        ]

    client_kwargs = {"timeout": 60, "follow_redirects": True}
    if proxy_url:
        client_kwargs["proxy"] = proxy_url
        print(f"Invidious: using proxy {proxy_url[:40]}...")
    else:
        print("Invidious: no proxy")

    with httpx.Client(**client_kwargs) as client:
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


def download_with_piped(url: str, output_path: str, proxy_url: str = None) -> bool:
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
            "https://api.piped.private.coffee",
            "https://pipedapi.adminforge.de",
            "https://pipedapi.drgns.space",
            "https://pipedapi.mha.fi",
            "https://pipedapi.adminforge.de",
        ]

    client_kwargs = {"timeout": 60, "follow_redirects": True}
    if proxy_url:
        client_kwargs["proxy"] = proxy_url
        print(f"Piped: using proxy {proxy_url[:40]}...")
    else:
        print("Piped: no proxy")

    with httpx.Client(**client_kwargs) as client:
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


def download_with_cobalt(url: str, output_path: str, proxy_url: str = None) -> bool:
    """Fallback downloader using cobalt.tools API for YouTube/TikTok/etc."""
    try:
        print(f"Trying cobalt.tools fallback for {url} (proxy={'yes' if proxy_url else 'no'})")
        client_kwargs = {"timeout": 120}
        if proxy_url:
            client_kwargs["proxy"] = proxy_url
        with httpx.Client(**client_kwargs) as client:
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


_bgutil_process = None
_BGUTIL_JS = None


def find_bgutil_js():
    """Find bgutil server JS in the filesystem."""
    search_paths = [
        '/root/bgutil-ytdlp-pot-provider/server/build/index.js',
        '/root/bgutil-ytdlp-pot-provider/server/dist/index.js',
        '/root/bgutil-ytdlp-pot-provider/build/index.js',
        '/root/bgutil-ytdlp-pot-provider/index.js',
    ]
    import glob as _glob
    found = _glob.glob('/root/bgutil-ytdlp-pot-provider/**/*.js', recursive=True)
    for f in found:
        print(f"bgutil JS candidate: {f}")
    for path in search_paths:
        if os.path.exists(path):
            print(f"bgutil server found: {path}")
            return path
    if found:
        print(f"bgutil JS files exist but none match expected paths: {found}")
    return None


def is_bgutil_running():
    """Check if bgutil HTTP server is responding on port 4416."""
    try:
        import urllib.request
        urllib.request.urlopen('http://127.0.0.1:4416/ping', timeout=2)
        return True
    except Exception:
        return False


def start_bgutil_server():
    """Start bgutil-ytdlp-pot-provider HTTP server and wait until ready."""
    global _bgutil_process, _BGUTIL_JS

    if is_bgutil_running():
        print("bgutil server already running")
        return "http://127.0.0.1:4416"

    bgutil_js = find_bgutil_js()
    if not bgutil_js:
        print("bgutil server JS not found")
        return None

    _BGUTIL_JS = bgutil_js
    try:
        import urllib.request
        print(f"Starting bgutil server: node {bgutil_js}")
        proc = subprocess.Popen(
            ['node', bgutil_js],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(bgutil_js),
        )
        _bgutil_process = proc

        for i in range(15):
            time.sleep(1)
            try:
                urllib.request.urlopen('http://127.0.0.1:4416/ping', timeout=1)
                print(f"bgutil server ready after {i+1}s (pid={proc.pid})")
                return "http://127.0.0.1:4416"
            except Exception:
                continue

        print("bgutil server did not respond after 15s")
        return None
    except Exception as e:
        print(f"bgutil start failed: {e}")
        return None


def monitor_bgutil():
    """Restart bgutil if it crashes."""
    while True:
        time.sleep(30)
        if not is_bgutil_running():
            print("bgutil server down, restarting...")
            start_bgutil_server()


def get_bgutil_config():
    """Return bgutil configuration for yt-dlp extractor_args if available."""
    config = {}
    if is_bgutil_running():
        config['youtubepot'] = {'pot_bgutil_base_url': 'http://127.0.0.1:4416'}
        print("yt-dlp using bgutil HTTP server")
        return config

    bgutil_url = os.environ.get('BGUTIL_POT_URL')
    if bgutil_url:
        config['youtubepot'] = {'pot_bgutil_base_url': bgutil_url}
        print(f"yt-dlp using bgutil HTTP server at {bgutil_url}")
        return config

    try:
        import yt_dlp_plugins.extractor.getpot_bgutil
        config['youtubepot'] = {'po_provider': 'bgutil'}
        print("yt-dlp using bgutil pip plugin")
        return config
    except ImportError:
        print("bgutil pip plugin not available")

    bgutil_home = "/root/bgutil-ytdlp-pot-provider/server"
    if os.path.isdir(bgutil_home):
        config['youtubepot-bgutilscript'] = {'server_home': bgutil_home}
        print("yt-dlp using bgutil script provider")
        return config

    return config


def try_install_oauth2_plugin():
    """Install yt-dlp-youtube-oauth2 plugin as fallback auth."""
    try:
        result = subprocess.run(
            ['pip', 'install', 'yt-dlp-youtube-oauth2', '--quiet'],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode == 0:
            print("yt-dlp-youtube-oauth2 plugin installed")
            return True
        else:
            print(f"oauth2 plugin install failed: {result.stderr[-200:]}")
            return False
    except Exception as e:
        print(f"oauth2 plugin install failed: {e}")
        return False


class YTDLPLogger:
    def debug(self, msg):
        if '[debug]' not in msg:
            print(f"yt-dlp: {msg}")
    def warning(self, msg):
        print(f"yt-dlp WARNING: {msg}")
    def error(self, msg):
        print(f"yt-dlp ERROR: {msg}")


YTDLP_STRATEGIES = [
    {'player_client': ['tv_embedded'], 'player_skip': []},
    {'player_client': ['tv'], 'player_skip': []},
    {'player_client': ['web_safari'], 'player_skip': []},
    {'player_client': ['mweb'], 'player_skip': []},
    {'player_client': ['web'], 'player_skip': ['webpage']},
    {'player_client': ['android'], 'player_skip': ['webpage']},
    {'player_client': ['ios'], 'player_skip': ['webpage']},
    {'player_client': ['web', 'tv'], 'player_skip': []},
]


def build_ydl_opts(strategy, proxy_url, output_template):
    cookie_file = get_fresh_cookie_path()
    print(f"yt-dlp: cookies={'OK:'+cookie_file if cookie_file else 'NONE'} "
          f"proxy={'OK' if proxy_url else 'NONE'}")

    opts = {
        'format': (
            'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]'
            '/bestvideo[height<=1080]+bestaudio/best'
        ),
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'extractor_retries': 5,
        'file_access_retries': 5,
        'fragment_retries': 5,
        'retries': 5,
        'socket_timeout': 120,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        },
        'merge_output_format': 'mp4',
        'logger': YTDLPLogger(),
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['es', 'en', 'es-419'],
        'postprocessors': [
            {
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            },
            {
                'key': 'FFmpegSubtitlesConvertor',
                'format': 'srt',
            }
        ],
    }
    opts['geo_bypass'] = True
    opts['geo_bypass_country'] = 'US'
    opts['noplaylist'] = True
    if proxy_url:
        opts['proxy'] = proxy_url
    if cookie_file:
        opts['cookiefile'] = cookie_file
    extractor_args = {'youtube': {
        'player_client': strategy['player_client'],
        'skip': ['dash', 'hls'],
    }}
    if strategy.get('player_skip'):
        extractor_args['youtube']['player_skip'] = strategy['player_skip']
    # Add bgutil PO token provider if available (for web client)
    bgutil_cfg = get_bgutil_config()
    if bgutil_cfg:
        extractor_args.update(bgutil_cfg)
    opts['extractor_args'] = extractor_args
    return opts


def download_with_ytdlp(url: str, output_path: str, proxy_url: str = None) -> tuple[bool, str | None, str | None]:
    """Download video with yt-dlp trying multiple player_client strategies."""
    import yt_dlp
    video_path = output_path
    subtitle_path = None
    
    for i, strategy in enumerate(YTDLP_STRATEGIES):
        print(f"yt-dlp strategy {i+1}/{len(YTDLP_STRATEGIES)}: player_client={strategy['player_client']}")
        try:
            opts = build_ydl_opts(strategy, proxy_url, output_path)
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
            if os.path.exists(video_path) and os.path.getsize(video_path) > 1024:
                print(f"yt-dlp success with strategy {i+1}, video size: {os.path.getsize(video_path)} bytes")
                
                # Find subtitle files after successful download
                import glob
                srt_files = glob.glob(os.path.join(os.path.dirname(video_path), '*.srt'))
                if srt_files:
                    subtitle_path = srt_files[0]
                    print(f"Found subtitle file: {subtitle_path}")
                    # Prefer Spanish subtitles (.es or .es-419)
                    es_files = [f for f in srt_files if '.es' in f]
                    if es_files:
                        # Prefer es-419 over es
                        es419_files = [f for f in es_files if '.es-419.' in f]
                        if es419_files:
                            subtitle_path = es419_files[0]
                        else:
                            subtitle_path = es_files[0]
                        print(f"Using Spanish subtitle file: {subtitle_path}")
                return True, video_path, subtitle_path
        except Exception as e:
            err = str(e)[:120]
            print(f"yt-dlp strategy {i+1} failed: {err}")
            continue
    return False, None, None


async def check_js_runtime():
    """Check if Deno/Node are available for yt-dlp JS challenges."""
    for cmd, name in [('deno', 'Deno'), ('node', 'Node.js')]:
        try:
            result = subprocess.run([cmd, '--version'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print(f"JS runtime available: {name} - {result.stdout.strip()[:80]}")
                return True
        except Exception:
            pass
    print("WARNING: no JS runtime found for yt-dlp (Deno/Node). YouTube extraction may fail.")
    return False


async def test_ytdlp_on_startup():
    """Probar yt-dlp al iniciar para diagnosticar el problema."""
    import yt_dlp
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    proxy = os.environ.get('YOUTUBE_PROXY', '')
    cookie_path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")

    await check_js_runtime()

    print("=== yt-dlp STARTUP TEST ===")
    print(f"Proxy: {proxy[:40] if proxy else 'NONE'}")
    print(f"Cookies: {os.path.exists(cookie_path)}")

    clients = [s['player_client'][0] for s in YTDLP_STRATEGIES]
    for client in clients:
        try:
            opts = {
                'quiet': True,
                'no_warnings': True,
                'geo_bypass': True,
                'geo_bypass_country': 'US',
                'proxy': proxy or None,
                'cookiefile': cookie_path if os.path.exists(cookie_path) else None,
                'extractor_args': {'youtube': {'player_client': [client], 'skip': ['dash', 'hls']}},
                'skip_download': True,
                'format': 'best',
                'logger': YTDLPLogger(),
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(test_url, download=False)
                print(f"TEST {client} CON proxy: OK - {info.get('title', '?')[:40]}")
        except Exception as e:
            print(f"TEST {client} CON proxy: FAIL - {str(e)[:120]}")

    # Test web client without proxy
    try:
        opts = {
            'quiet': True,
            'no_warnings': True,
            'geo_bypass': True,
            'geo_bypass_country': 'US',
            'extractor_args': {'youtube': {'player_client': ['web'], 'skip': ['dash', 'hls']}},
            'skip_download': True,
            'format': 'best',
            'logger': YTDLPLogger(),
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(test_url, download=False)
            print(f"TEST web SIN proxy: OK - {info.get('title', '?')[:40]}")
    except Exception as e:
        print(f"TEST web SIN proxy: FAIL - {str(e)[:120]}")

    print("=== END yt-dlp TEST ===")





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

    # Start bgutil PO token provider server
    bgutil_url = start_bgutil_server()
    if bgutil_url:
        os.environ['BGUTIL_POT_URL'] = bgutil_url
        threading.Thread(target=monitor_bgutil, daemon=True).start()
        print("bgutil monitor started")
    else:
        print("[bgutil] Server not available — pip plugin fallback will be used")

    # Install yt-dlp-youtube-oauth2 as fallback auth
    try_install_oauth2_plugin()

    # Diagnostic yt-dlp test on startup
    try:
        await test_ytdlp_on_startup()
    except Exception as e:
        print(f"yt-dlp startup test error: {e}")

    await run_migrations()
    await fetch_jwks()
    await run_migrations()
    await fetch_jwks()
    yield
    # Shutdown
    if _bgutil_process:
        try:
            _bgutil_process.terminate()
        except Exception:
            pass

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

    # Add start_time / end_time / subtitles_srt / srt_url columns to clips table if missing
    try:
        supabase.table("clips").select("start_time,end_time,subtitles_srt,srt_url").limit(1).execute()
        print("SQL MIGRATION: start_time/end_time/subtitles_srt/srt_url columns already exist (OK)")
    except Exception as e:
        print(f"SQL MIGRATION: clips columns missing, attempting to add: {e}")
        async with httpx.AsyncClient(timeout=15) as client:
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            }
            alter_sql = (
                "ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS start_time NUMERIC;"
                "ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS end_time NUMERIC;"
                "ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS subtitles_srt TEXT;"
                "ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS srt_url TEXT;"
                "NOTIFY pgrst, 'reload schema';"
            )
            sql_success = False
            sql_errors = []
            for url in [
                f"https://{project_ref}.supabase.co/sql/v1/query",
                f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
            ]:
                try:
                    res = await client.post(url, json={"query": alter_sql}, headers=headers)
                    if res.status_code == 200:
                        print("SQL MIGRATION: added start_time/end_time/subtitles_srt/srt_url columns (OK)")
                        sql_success = True
                        break
                    else:
                        sql_errors.append(f"{url}: {res.status_code} {res.text[:200]}")
                except Exception as ex:
                    sql_errors.append(f"{url}: {ex}")
            if not sql_success:
                print("SQL MIGRATION WARNING: could not add subtitles_srt column")
                for err in sql_errors:
                    print(f"  {err}")

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
    srt_content: str = ""
    subtitle_style: str = "bold-yellow"
    subtitle_position: str = "bottom"
    font_size: int = 14
    watermark_text: str = ""
    watermark_position: str = "top-right"
    music_track: str = "none"
    music_volume: int = 30
    include_audio: bool = False
    filter_style: str = "none"
    resolution: str = "1080p"
    format: str = "mp4"
    fps: int = 30


class SubtitleStyle(BaseModel):
    clip_id: str
    video_url: str
    srt_url: str
    font_size: int = 18
    font_color: str = "white"
    background: bool = True
    background_opacity: float = 0.6
    position: str = "bottom"
    bold: bool = True
    outline: int = 2
    font_name: str = "DejaVu Sans"


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


@app.get("/diagnose/proxy")
def diagnose_proxy():
    """Test proxy connectivity from the running backend."""
    import socket
    from urllib.parse import urlparse
    from urllib.request import ProxyHandler, build_opener, Request

    proxy_key = None
    proxy_url = ""
    for key in ['YOUTUBE_PROXY', 'YTDLP_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY', 'PROXY_URL']:
        val = os.environ.get(key)
        if val:
            proxy_key = key
            proxy_url = val.strip()
            break

    if not proxy_url:
        return JSONResponse({
            "configured": False,
            "message": "No proxy configured. Set YOUTUBE_PROXY, YTDLP_PROXY, HTTP_PROXY, HTTPS_PROXY or PROXY_URL."
        })

    parsed = urlparse(proxy_url)
    host = parsed.hostname
    port = parsed.port
    masked_url = proxy_url
    if parsed.password:
        masked_url = proxy_url.replace(parsed.password, '*' * len(parsed.password))

    result = {
        "configured": True,
        "source": proxy_key,
        "proxy_url": masked_url,
        "scheme": parsed.scheme or None,
        "host": host,
        "port": port,
        "username": parsed.username or None,
        "has_password": bool(parsed.password),
    }

    if not host or not port:
        result["valid"] = False
        result["error"] = "Proxy URL missing host or port"
        return JSONResponse(result)

    # Test 1: direct TCP connection
    try:
        sock = socket.create_connection((host, port), timeout=10)
        sock.close()
        result["tcp_connect"] = {"ok": True, "message": "OK"}
    except Exception as e:
        result["tcp_connect"] = {"ok": False, "message": str(e)}

    # Test 2: HTTP request through proxy
    try:
        proxy_handler = ProxyHandler({'http': proxy_url, 'https': proxy_url})
        opener = build_opener(proxy_handler)
        opener.addheaders = [
            ('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
        ]
        req = Request("https://www.youtube.com", method='HEAD')
        resp = opener.open(req, timeout=30)
        result["http_request"] = {"ok": True, "status": resp.status}
    except Exception as e:
        result["http_request"] = {"ok": False, "message": str(e)}

    result["working"] = result.get("tcp_connect", {}).get("ok") and result.get("http_request", {}).get("ok")
    return JSONResponse(result)


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
    """Generate SRT subtitles grouped into readable phrases with timestamps relative to clip_start.
    Returns the SRT content as a string."""
    clip_words = [w for w in words if w['start'] >= clip_start and w['end'] <= clip_end]
    if not clip_words:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("")
        return ""

    # Group words into phrases (3-7 words each, break on punctuation or max length)
    phrases = []
    current_phrase = []
    for w in clip_words:
        word_text = w['word'].strip()
        if not word_text:
            continue
        current_phrase.append(w)
        # Break phrase on sentence-ending punctuation or max 5 words (shorter for vertical video)
        if len(current_phrase) >= 5 or word_text.endswith(('.', '!', '?', ',')):
            phrases.append(current_phrase)
            current_phrase = []
    if current_phrase:
        phrases.append(current_phrase)

    # Merge very short phrases (less than 3 words) with the next one
    merged = []
    i = 0
    while i < len(phrases):
        group = phrases[i]
        while len(group) < 2 and i + 1 < len(phrases):
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

    srt_content = "\n".join(lines)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(srt_content)
    return srt_content


def resolve_music_path(mood: str) -> str | None:
    filename = MOOD_TRACKS.get(mood)
    if not filename:
        return None
    path = os.path.join(MUSIC_DIR, filename)
    return path if os.path.isfile(path) else None


def burn_subtitles_onto_video(input_path: str, srt_path: str, output_path: str, timeout: int = 180, force_style: str = None) -> bool:
    """Burn subtitles onto a video, trying multiple fallback styles.
    Font size is computed responsively based on video height unless force_style is provided."""
    if not os.path.exists(input_path) or os.path.getsize(input_path) < 1024:
        return False
    srt_path_ff = srt_path.replace('\\', '/')
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    if force_style is None:
        # Probe video height to compute responsive font size
        height = 1280
        try:
            probe = subprocess.run([
                'ffprobe', '-v', 'quiet', '-select_streams', 'v',
                '-show_entries', 'stream=height',
                '-of', 'default=noprint_wrappers=1:nokey=1', input_path
            ], capture_output=True, text=True, timeout=15)
            if probe.stdout.strip():
                height = int(probe.stdout.strip())
        except Exception:
            pass
        # Scale font size with height: very small for 9:16 vertical videos
        font_size = max(16, min(34, height // 70))
        margin_v = max(8, height // 100)
        print(f"Subtitle burn: video height={height}, font_size={font_size}, margin_v={margin_v}")
        force_style = f"Fontname=DejaVu Sans,Fontsize={font_size},PrimaryColour=&H00FFFFFF,BackColour=&HCC000000,Outline=2,Bold=1,Alignment=2,MarginV={margin_v}"

    styles = [
        f"subtitles={srt_path_ff}:force_style='{force_style}'",
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
        auth_cfg = get_youtube_auth_config()

        async def download_video_async(url: str, video_path: str, job_id: str) -> tuple[bool, str | None, str | None]:
            is_youtube = extract_youtube_video_id(url) is not None
            downloaded = False
            video_path_result = None
            subtitle_path_result = None
            proxy = get_working_proxy()

            # ── Phase 1: yt-dlp with proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Downloading with yt-dlp..."}
                success, v_path, s_path = await asyncio.to_thread(download_with_ytdlp, url, video_path, proxy)
                if success:
                    downloaded = True
                    video_path_result = v_path
                    subtitle_path_result = s_path

            # ── Phase 2: yt-dlp without proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Downloading with yt-dlp (direct)..."}
                success, v_path, s_path = await asyncio.to_thread(download_with_ytdlp, url, video_path, None)
                if success:
                    downloaded = True
                    video_path_result = v_path
                    subtitle_path_result = s_path

            # ── Phase 3: yt-dlp retry with proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Retrying download..."}
                success, v_path, s_path = await asyncio.to_thread(download_with_ytdlp, url, video_path, proxy)
                if success:
                    downloaded = True
                    video_path_result = v_path
                    subtitle_path_result = s_path

            # ── Phase 4: yt-dlp retry without proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Retrying download (direct)..."}
                success, v_path, s_path = await asyncio.to_thread(download_with_ytdlp, url, video_path, None)
                if success:
                    downloaded = True
                    video_path_result = v_path
                    subtitle_path_result = s_path

            # ── Phase 5: Piped / Invidious without proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Trying Piped/Invidious (direct)..."}
                success = (
                    await asyncio.to_thread(download_with_piped, url, video_path, None) or
                    await asyncio.to_thread(download_with_invidious, url, video_path, None)
                )
                if success:
                    downloaded = True
                    video_path_result = video_path
                    subtitle_path_result = None

            # ── Phase 6: Piped / Invidious with proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Trying Piped/Invidious (proxy)..."}
                success = (
                    await asyncio.to_thread(download_with_piped, url, video_path, proxy) or
                    await asyncio.to_thread(download_with_invidious, url, video_path, proxy)
                )
                if success:
                    downloaded = True
                    video_path_result = video_path
                    subtitle_path_result = None

            # ── Phase 7: cobalt.tools direct ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Trying cobalt.tools..."}
                success = await asyncio.to_thread(download_with_cobalt, url, video_path, None)
                if success:
                    downloaded = True
                    video_path_result = video_path
                    subtitle_path_result = None

            # ── Phase 8: cobalt with proxy ──
            if is_youtube and not downloaded:
                jobs_store[job_id] = {"status": "processing", "message": "Trying cobalt.tools (proxy)..."}
                success = await asyncio.to_thread(download_with_cobalt, url, video_path, proxy)
                if success:
                    downloaded = True
                    video_path_result = video_path
                    subtitle_path_result = None

            return downloaded, video_path_result, subtitle_path_result

        async def download_with_timeout(url, video_path, job_id, timeout_seconds=300):
            try:
                return await asyncio.wait_for(download_video_async(url, video_path, job_id), timeout=timeout_seconds)
            except asyncio.TimeoutError:
                print(f"DOWNLOAD TIMEOUT after {timeout_seconds}s for {url}")
                return False

        downloaded, video_path_result, subtitle_path_result = asyncio.run(download_with_timeout(url, video_path, job_id))

        if not downloaded:
            jobs_store[job_id] = {"status": "error", "message": "Could not download video from this URL. Please try another video or upload the file directly."}
            return

        # Use video_path_result if available (more reliable path)
        if video_path_result and video_path_result != video_path:
            video_path = video_path_result
        if subtitle_path_result and os.path.exists(subtitle_path_result):
            subtitle_path = subtitle_path_result

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
                srt_content = generate_srt_subtitle(words_data, clip_start, clip["end"], srt_path)
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
                # 3) !music + has_audio: inputs=[video(0)] -> map 0:v, [a]
                # 4) !music + !has_audio: filter_complex anullsrc+atrim -> map 0:v, [a]
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
                        '-t', str(duration), '-vf', vid_filter,
                        '-filter_complex', f'anullsrc=r=44100:cl=stereo,atrim=duration={duration}[a]',
                        '-map', '0:v', '-map', '[a]',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                    ]

                r1 = subprocess.run(step1, capture_output=True, timeout=600)
                print(f"Render exit={r1.returncode}, no_subs={'OK' if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024 else 'FAIL'}")
                if r1.returncode != 0:
                    print(f"Render stderr: {r1.stderr.decode()[:500]}")

                if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                    print(f"Copying rendered video without subtitles (SRT saved separately for editor)")
                    shutil.copy2(no_subs, output_path)
                else:
                    # Last resort: handle missing audio with anullsrc+atrim
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
                            '-t', str(duration), '-vf', vid_filter,
                            '-filter_complex', f'anullsrc=r=44100:cl=stereo,atrim=duration={duration}[a]',
                            '-map', '0:v', '-map', '[a]',
                            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                            '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs]
                    subprocess.run(last_resort_cmd, capture_output=True, timeout=600)
                    if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                        shutil.copy2(no_subs, output_path)

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

                # Upload SRT file to Supabase Storage for frontend editing
                srt_storage_url = ""
                if srt_content and clip_storage_url:
                    try:
                        srt_storage_path = f"{job_id}/{job_id}_clip{i+1}.srt"
                        srt_storage_url = upload_to_storage(srt_path, "clips", srt_storage_path, "text/plain") or ""
                        print(f"SRT uploaded: {srt_storage_url}")
                    except Exception as e:
                        print(f"SRT upload failed: {e}")

                try:
                    supabase.table("clips").insert({
                        "user_id": user_id,
                        "title": clip["title"],
                        "status": "done" if clip_storage_url else "error",
                        "video_url": clip_storage_url,
                        "thumbnail_url": thumb_storage_url,
                        "srt_url": srt_storage_url,
                        "duration": round(duration, 1),
                        "start_time": clip_start,
                        "end_time": clip["end"],
                        "subtitles_srt": srt_content or ""
                    }).execute()
                except Exception as e:
                    print(f"Clip insert warning (subtitles_srt/srt_url may need migration): {e}")
                    # Retry without subtitles_srt/srt_url if columns missing
                    try:
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
                    except Exception as e2:
                        print(f"Clip insert failed: {e2}")

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
                with httpx.stream("GET", stored_url, timeout=120, follow_redirects=True) as r:
                    if r.status_code == 200:
                        with open(source_path, "wb") as f:
                            for chunk in r.iter_bytes(chunk_size=1024*1024):
                                f.write(chunk)
                        size = os.path.getsize(source_path)
                        if size >= 1024:
                            print(f"Export: using stored clip from Supabase ({size} bytes)")
                        else:
                            print(f"Export: stored clip too small ({size} bytes)")
                            source_path = None
                    else:
                        print(f"Export: stored clip fetch failed (status={r.status_code})")
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
        vf = (
            f"scale={target_res}:force_original_aspect_ratio=increase,"
            f"crop={target_res},"
            f"setsar=1,"
            f"format=yuv420p"
        )

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

        # Subtitles: SRT content (timed segments) or plain text fallback
        srt_content = (req.srt_content or "").strip()
        subtitle_text = (req.subtitle_text or "").strip()
        if srt_content:
            srt_file = tempfile.NamedTemporaryFile(mode="w", suffix=".srt", delete=False, encoding="utf-8")
            srt_file.write(srt_content)
            srt_file.close()
            temp_files.append(srt_file.name)
            srt_path_ff = srt_file.name.replace("\\", "/")
            align_map = {"top": "8", "middle": "5", "bottom": "2"}
            alignment = align_map.get(req.subtitle_position, "2")
            fs = req.font_size
            color_map = {
                "bold-yellow": "&H0000FFFF",
                "white-outline": "&H00FFFFFF",
                "neon-green": "&H0000FF88",
                "minimal-white": "&H00FFFFFF",
                "tiktok-style": "&H00FFFFFF",
            }
            primary = color_map.get(req.subtitle_style, "&H00FFFFFF")
            force_style = (
                f"Fontname=DejaVu Sans,"
                f"Fontsize={fs},"
                f"PrimaryColour={primary},"
                f"BackColour=&H80000000,"
                f"Outline=2,Bold=1,"
                f"Alignment={alignment},"
                f"MarginV=60"
            )
            vf = f"{vf},subtitles={srt_path_ff}:force_style='{force_style}'"
        elif req.subtitle_style != "none" and subtitle_text:
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

        # Audio handling — original audio optional, music optional
        has_music = req.music_track not in ("none", "", 0, "0", None)
        music_path = None
        af_filter = None

        if has_music:
            music_path = f"downloads/{job_id}_music.mp3"
            try:
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
                        if req.include_audio:
                            # Mix original audio with music
                            af_filter = f"[1:a]volume={vol}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[a]"
                        else:
                            # Only music, no original audio
                            af_filter = f"[1:a]volume={vol}[a]"
            except Exception as e:
                print(f"Music mixing failed: {e}")
                music_path = None

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
            cmd.extend([
                '-pix_fmt', 'yuv420p',
                '-colorspace', 'bt709',
                '-color_trc', 'bt709',
                '-color_primaries', 'bt709',
                '-color_range', 'tv',
                '-movflags', '+faststart',
            ])
        crf_map = {'720p': '23', '1080p': '22', '4k': '24'}
        crf = crf_map.get(req.resolution, '23')
        cmd.extend(['-crf', crf])
        cmd.extend(['-preset', 'fast'])
        if af_filter:
            cmd.extend(['-filter_complex', af_filter, '-map', '0:v', '-map', '[a]', '-c:a', acodec])
        elif req.include_audio:
            cmd.extend(['-c:a', acodec])
        else:
            cmd.extend(['-an'])
        cmd.extend(['-y', output_path])

        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"Export: ffmpeg exit={result.returncode} output_size={os.path.getsize(output_path) if os.path.exists(output_path) else 0}")
        if result.returncode != 0:
            print(f"EXPORT FFMPEG STDERR:\n{result.stderr[-2000:]}")
            err_lines = result.stderr.strip().split('\n')[-5:] if result.stderr else ["unknown ffmpeg error"]
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


@app.post("/admin/refresh-cookies")
async def refresh_cookies_endpoint(request: Request):
    """Refresh cookies from YOUTUBE_COOKIES_B64 env var without redeploy."""
    auth = request.headers.get('X-Admin-Key', '')
    if auth != os.environ.get('ADMIN_KEY', 'peakclip-admin-2026'):
        raise HTTPException(403, "Unauthorized")

    cookie_path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")
    if os.path.exists(cookie_path):
        os.remove(cookie_path)

    result = get_fresh_cookie_path()
    if result:
        return {"success": True, "message": "Cookies refreshed", "path": result}
    else:
        raise HTTPException(400, "YOUTUBE_COOKIES_B64 not set in environment")


@app.post("/burn-subtitles")
async def burn_subtitles_endpoint(style: SubtitleStyle, user: dict = Depends(get_current_user)):
    """Burn subtitles onto a video with customizable style."""
    await check_rate_limit(f"burn-subtitles:{user['sub']}")
    user_id = user["sub"]
    job_id = str(uuid.uuid4())

    video_path = f"downloads/{job_id}_source.mp4"
    srt_path = f"downloads/{job_id}_subtitles.srt"
    output_path = f"outputs/{job_id}_burned.mp4"
    local_files = [video_path, srt_path, output_path]

    try:
        # Download video
        r = httpx.get(style.video_url, timeout=120, follow_redirects=True)
        if r.status_code != 200 or len(r.content) < 1024:
            raise HTTPException(status_code=400, detail="Could not download source video")
        with open(video_path, "wb") as f:
            f.write(r.content)

        # Download SRT
        r_srt = httpx.get(style.srt_url, timeout=60, follow_redirects=True)
        if r_srt.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not download subtitle file")
        with open(srt_path, "wb") as f:
            f.write(r_srt.content)

        # Build force_style string
        COLOR_MAP = {
            'white': '&H00FFFFFF',
            'yellow': '&H0000FFFF',
            'cyan': '&H00FFFF00',
            'green': '&H0000FF00',
            'red': '&H000000FF',
            'black': '&H00000000',
        }
        POSITION_MAP = {
            'bottom': 2,
            'top': 8,
            'middle': 5,
        }
        primary_color = COLOR_MAP.get(style.font_color.lower(), '&H00FFFFFF')
        alignment = POSITION_MAP.get(style.position.lower(), 2)
        margin_v = 60 if style.position.lower() == 'bottom' else 20
        back_color = f"&H{int(style.background_opacity * 255):02X}000000" if style.background else '&H00000000'

        force_style = (
            f"Fontname={style.font_name},"
            f"Fontsize={style.font_size},"
            f"PrimaryColour={primary_color},"
            f"BackColour={back_color},"
            f"Outline={style.outline},"
            f"Bold={1 if style.bold else 0},"
            f"Alignment={alignment},"
            f"MarginV={margin_v}"
        )

        if not burn_subtitles_onto_video(video_path, srt_path, output_path, force_style=force_style):
            raise HTTPException(status_code=400, detail="Failed to burn subtitles")

        # Upload result
        storage_path = f"burned/{job_id}_burned.mp4"
        public_url = upload_to_storage(output_path, "clips", storage_path, "video/mp4")
        if not public_url:
            raise HTTPException(status_code=400, detail="Failed to upload burned video")

        return {"success": True, "video_url": public_url}
    finally:
        for f in local_files:
            try: os.unlink(f)
            except OSError: pass


@app.post("/save-subtitles")
async def save_subtitles_endpoint(data: dict, user: dict = Depends(get_current_user)):
    """Save edited SRT content for a clip, upload to storage, and update the clip row."""
    await check_rate_limit(f"save-subtitles:{user['sub']}")
    user_id = user["sub"]
    clip_id = data.get("clip_id")
    srt_content = data.get("srt_content", "")

    if not clip_id:
        raise HTTPException(status_code=400, detail="Missing clip_id")

    # Verify ownership
    try:
        clip_result = supabase.table("clips").select("id,user_id").eq("id", clip_id).single().execute()
        clip = clip_result.data
        if not clip or clip.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this clip")
    except Exception as e:
        print(f"save-subtitles ownership check failed: {e}")
        raise HTTPException(status_code=404, detail="Clip not found")

    srt_path = f"downloads/{clip_id}_subtitles.srt"
    try:
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        storage_path = f"subtitles/{clip_id}_subtitles.srt"
        srt_url = upload_to_storage(srt_path, "clips", storage_path, "text/srt")

        update_payload = {"subtitles_srt": srt_content}
        if srt_url:
            update_payload["srt_url"] = srt_url

        supabase.table("clips").update(update_payload).eq("id", clip_id).execute()

        return {"success": True, "srt_url": srt_url or "", "subtitles_srt": srt_content}
    finally:
        try:
            if os.path.exists(srt_path):
                os.unlink(srt_path)
        except OSError:
            pass


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
            srt_content = generate_srt_subtitle(words_data, clip_start, clip["end"], srt_path)
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
                    '-t', str(duration), '-vf', vid_filter,
                    '-filter_complex', f'anullsrc=r=44100:cl=stereo,atrim=duration={duration}[a]',
                    '-map', '0:v', '-map', '[a]',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs
                ]
            subprocess.run(step1, capture_output=True, timeout=600)

            if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                print(f"Copying rendered video without subtitles (SRT saved separately)")
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
                        '-t', str(duration), '-vf', vid_filter,
                        '-filter_complex', f'anullsrc=r=44100:cl=stereo,atrim=duration={duration}[a]',
                        '-map', '0:v', '-map', '[a]',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', no_subs]
                subprocess.run(last_resort, capture_output=True, timeout=600)
                if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                    shutil.copy2(no_subs, output_path)
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

            # Upload SRT file to Supabase Storage for frontend editing
            srt_storage_url = ""
            if srt_content and clip_storage_url:
                try:
                    srt_storage_path = f"{job_id}/{job_id}_clip{i+1}.srt"
                    srt_storage_url = upload_to_storage(srt_path, "clips", srt_storage_path, "text/plain") or ""
                    print(f"SRT uploaded: {srt_storage_url}")
                except Exception as e:
                    print(f"SRT upload failed: {e}")

            try:
                supabase.table("clips").insert({
                    "user_id": user_id,
                    "title": clip["title"],
                    "status": "done" if clip_storage_url else "error",
                    "video_url": clip_storage_url,
                    "thumbnail_url": thumb_storage_url,
                    "srt_url": srt_storage_url,
                    "duration": round(duration, 1),
                    "start_time": clip_start,
                    "end_time": clip["end"],
                    "subtitles_srt": srt_content or ""
                }).execute()
            except Exception as e:
                print(f"Clip insert warning (subtitles_srt/srt_url may need migration): {e}")
                try:
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
                except Exception as e2:
                    print(f"Clip insert failed: {e2}")

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
