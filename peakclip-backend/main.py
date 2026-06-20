from dotenv import load_dotenv
load_dotenv()
import traceback
from fastapi import FastAPI, HTTPException, Depends, Header, Request, File, UploadFile
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
import threading
import json
import stripe
import tempfile
import re
import time
import shutil
import httpx
import asyncio
from collections import defaultdict
from urllib.parse import urlparse
import jwt as pyjwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
import base64

COOKIES_B64_HARDCODED = "IyBOZXRzY2FwZSBIVFRQIENvb2tpZSBGaWxlCiMgaHR0cHM6Ly9jdXJsLmhheHguc2UvcmZjL2Nvb2tpZV9zcGVjLmh0bWwKIyBUaGlzIGlzIGEgZ2VuZXJhdGVkIGZpbGUhIERvIG5vdCBlZGl0LgoKLnlvdXR1YmUuY29tCVRSVUUJLwlGQUxTRQkxODA1ODM0NDY4CV9nYQlHQTEuMS41MDczMjEwMDUuMTc3MTI3NDQ2OAoueW91dHViZS5jb20JVFJVRQkvCUZBTFNFCTE4MDU4MzQ0NzYJX2dhX1ZDR0VQWTQwVkIJR1MyLjEuczE3NzEyNzQ0NjgkbzEkZzEkdDE3NzEyNzQ0NzYkajUyJGwwJGgwCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxNzkyMTg3NDU0CV9fU2VjdXJlLUJVQ0tFVAlDS01ECi55b3V0dWJlLmNvbQlUUlVFCS8JRkFMU0UJMTc4NTY0NDU0NwlfZ2NsX2F1CTEuMS4xMjI3OTYyNjczLjE3Nzc4Njg1NDcKLnlvdXR1YmUuY29tCVRSVUUJLwlGQUxTRQkxODE1NTA5NjgxCUhTSUQJQXBHSDE3QjlFbVN3SGZjSVkKLnlvdXR1YmUuY29tCVRSVUUJLwlUUlVFCTE4MTU1MDk2ODEJU1NJRAlBQk5GSjlKSWNQdndhVWZWYwoueW91dHViZS5jb20JVFJVRQkvCUZBTFNFCTE4MTU1MDk2ODEJQVBJU0lECTk1Vm5rY05jWUljWTlsOEUvQW41eXRiUmdSU0Zsd19YMW8KLnlvdXR1YmUuY29tCVRSVUUJLwlUUlVFCTE4MTU1MDk2ODEJU0FQSVNJRAl2a1E5VGdSekpVSktmOHBzL0FDaTl0MUltT2duUGROSFVTCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxODE1NTA5NjgxCV9fU2VjdXJlLTFQQVBJU0lECXZrUTlUZ1J6SlVKS2Y4cHMvQUNpOXQxSW1PZ25QZE5IVVMKLnlvdXR1YmUuY29tCVRSVUUJLwlUUlVFCTE4MTU2MDM4MjYJX19TZWN1cmUtM1BBUElTSUQJdmtROVRnUnpKVUpLZjhwcy9BQ2k5dDFJbU9nblBkTkhVUwoueW91dHViZS5jb20JVFJVRQkvCUZBTFNFCTE4MTU1MDk2ODEJU0lECWcuYTAwMC13aW9oVUNkR2JuNFVxU0lSYU9mc1c3aV9HTHVoN0NqZVVranVic21QN0ZTemozX1B3NWdWTVYtUXpvLWJGOGttTnpJYUFBQ2dZS0FUWVNBUlVTRlFIR1gyTWlTWHZ2OTViREVBRFFlZUdLR3V4WWRSb1ZBVUY4eUtyeUY3eG90OEN3R2lGajZucTFMa3hUMDA3NgoueW91dHViZS5jb20JVFJVRQkvCVRSVUUJMTgxNTUwOTY4MQlfX1NlY3VyZS0xUFNJRAlnLmEwMDAtd2lvaFVDZEdibjRVcVNJUmFPZnNXN2lfR0x1aDdDamVVa2p1YnNtUDdGU3pqM19vOUNQS01xUEVZWXJ1VldaaFZ2RURnQUNnWUtBZElTQVJVU0ZRSEdYMk1pREF1SzVPcmVGUlNjQy1uaGhtQjhEeG9WQVVGOHlLcHpoQ0FnMjhibnVxcm5TMnlRc3hrbDAwNzYKLnlvdXR1YmUuY29tCVRSVUUJLwlUUlVFCTE4MTU2MDM4MjYJX19TZWN1cmUtM1BTSUQJZy5hMDAwLXdpb2hVQ2RHYm40VXFTSVJhT2ZzVzdpX0dMdWg3Q2plVWtqdWJzbVA3RlN6ajNfdldwNGxSUVR1THBGSnNxSU1lOVBFd0FDZ1lLQWZBU0FSVVNGUUhHWDJNaUR6aWdSd09IT3NEVUdycldhYkU4MkJvVkFVRjh5S3JlaFZOVUN0cEs3MTNxdFpaaENzejUwMDc2Ci55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxODE1NjQzMTg1CUxPR0lOX0lORk8JQUZtbUYyc3dSUUloQU9kS3NZSktSa0NYQ0diM3pWWFJ5bFNkcVlTZVdFUlFReFVTZXZhNWQ5T1BBaUJnejl5M3Q4a3ZKZmYyT1hGdVdjRG9YVG5TWXU2SE90OW5XWERVTEpJYUhnOlFVUTNNak5tZVZKT1kwTlBUM0JWYUd4cFRrOWZPV1Y0UjJkUVVEZDVjM1ZNU2xSb1QwUm1SM1JOYVRKaU1XNTRVRFpMT0VObmFHTk9OMXAwWm1GNWNVa3pWeTFVVkRoVGFraHFORTUwVG1kUVJUQlBURXRtTmxGalVsZzVkbFpHWlcxMlltcExRMDV0VVVoclIxQkVaa1ZCZVZwWFVtWlJlV3BZYjBsUlZHMDVhVXBTV0Zsd1IxWkNlR0YwUVhjemJGVkpObE14ZVZSUVRESktXbmx1YWtKQgoueW91dHViZS5jb20JVFJVRQkvCVRSVUUJMTc5NzA1NDM3OAlWSVNJVE9SX0lORk8xX0xJVkUJQWNCQkRqSlJfSjgKLnlvdXR1YmUuY29tCVRSVUUJLwlUUlVFCTE3OTcwNTQzNzgJVklTSVRPUl9QUklWQUNZX01FVEFEQVRBCUNnSkRUeElFR2dBZ0RBJTNEJTNECi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxODE2NDg0OTExCVBSRUYJZjY9NDAwMDAwODAmdm9sdW1lPTE4JmY3PTEwMCZ0ej1BbWVyaWNhLkJvZ290YSZyZXBlYXQ9Tk9ORSZhdXRvcGxheT10cnVlCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxODEzNDYwNTQ1CV9fU2VjdXJlLTFQU0lEVFMJc2lkdHMtQ2pVQnlvalFVN3prUldaWnhXZjlmMVlQWXRULVdDZVd6bWZRN2N2eDlGUUVZLVFhelFZNlJJV2dkaFVOeEp2QjNVbzJneXFRTUJBQQoueW91dHViZS5jb20JVFJVRQkvCVRSVUUJMTgxMzQ2MDU0NQlfX1NlY3VyZS0zUFNJRFRTCXNpZHRzLUNqVUJ5b2pRVTd6a1JXWlp4V2Y5ZjFZUFl0VC1XQ2VXem1mUTdjdng5RlFFWS1RYXpRWTZSSVdnZGhVTnhKdkIzVW8yZ3lxUU1CQUEKLnlvdXR1YmUuY29tCVRSVUUJLwlGQUxTRQkxODEzNDYwOTE4CVNJRENDCUFLRXlYeldRX2x6SGo4VHk2cHFpWTRXRGw0X3Mzd0dNa2F3ck5yd1BSS2VrZU5sZDIxR2lERjNiODFhUWN6OVRicDEzOUdZc1BwdwoueW91dHViZS5jb20JVFJVRQkvCVRSVUUJMTgxMzQ2MDkxOAlfX1NlY3VyZS0xUFNJRENDCUFLRXlYelc2WWZQV0ZPaEFGSFhUc0E5OUNqWWV1d0V5XzRRaVI1Yi1MMHBSVjNqLVNfaHRCaDJPeVJUeWpzSUtLWnZ4MnhzLXZBCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxODEzNDYwOTE4CV9fU2VjdXJlLTNQU0lEQ0MJQUtFeVh6V3g3cGcyRnBxUUlqeW45M3JTQV90a3RSakdHOExwcV9DUFZTVUpTaHliU28tbkVwOHhyM1UxV0ZLSER6eWlZZ1E3alBNCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxNzk3NDc2OTA2CVZJU0lUT1JfSU5GTzFfTElWRQl3R1pkSkJtR2F0QQoueW91dHViZS5jb20JVFJVRQkvCVRSVUUJMTc5NzQ3NjkwNglWSVNJVE9SX1BSSVZBQ1lfTUVUQURBVEEJQ2dKRFR4SUVHZ0FnSlElM0QlM0QKLnlvdXR1YmUuY29tCVRSVUUJLwlUUlVFCTAJWVNDCURtM1hnY1JGN0NnCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxNzk3NDcyOTczCV9fU2VjdXJlLVlOSUQJMTkuWVQ9VGVxS0lXamlmd1lvWnJXM2xSNWlsZzBJcjZEaWd5UXJzMEhFTlhmNVd5ZXFvX0FrWjJlaEI3dzQxLW1kSGNFX3Z6dlhzLTRiQjdoTEs5YXFpdE9jbnJYZWl3RXo1aDY5WVZ5d0wyZWxBSDZsNjI4UzMyT1V4LUV5bWg0NkNqVkVETnFPSDRnZnRIcHhPNmNUMTlZYU4wb2tUUmR1Wi1yeFA3UDd1eGJUcmc4OE1ybXljT3YtNzIxMHYzeTJrMjZTbDlnZU1kU21mOE9YWjQwUmFyVmNfM3lKYjIwbk5OQ1ZvYkJsZ3FhWENhdlR5aDdQWWk1eFdMSGlCbHN5V0F4SWNEa1FsSmVaalV2eEJQSVNqSDZDMzFBRlhZd25sZE95QTJpUGN2LVF5TlZsNFdHZ2gzcnFEQ2tnOFNrV2Y5a3B3MmFKVE1WeXlPRWVDZHZhUGNGY2ZBCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxNzk3NDcyOTczCV9fU2VjdXJlLVJPTExPVVRfVE9LRU4JQ1BHem9jT2E5TmNmRUpMbXhQZng5WlFER1BiVDdmVGNsSlVECi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkxNzk3NDcyOTk1CV9fU2VjdXJlLVlOSUQJMTkuWVQ9UXlvTHc3dTNva2dfVEpsLXpwVTNFMXpaeHpFRXRTSkpNWDhrMmdOS3EtMDBSNG5MWFlyR04wS0UtRnlwc3dvQUw4RnhFRWJqc2loLWRiclVDNnB1Zmc0Vk5kcVJtQ01fTHRkUmVuSFd1RFhJWGlDNzgxM1Q2Si1DczNkR3J5UkEtZTZ0RENwSGR6ZWZ1MlJ6TWd1OWE4d1Y2bVBidkNJaU1nY1A0ZFR0Tmt0NmppTldjY2RHUTdERDVjUk1PekJXYW9oQTJBaDRjTU5TWkk3Q0RLVVBPSlVoWlk2V3RDVnRTNWM5S1ROUHZHNWZ5S1B3OFd0RmQ1VTFSNVl1bzRCbWE2M252WkdMRzdoYWJ0UE54UGk3MExhY2w0WXlzWTR4WUpiY1R5cGduYzJ2aFpJYlNXTWQzY0pWSmxhOUxLQWcwQnRFT0dxamlybk9KczRQRUJpNmtBCi55b3V0dWJlLmNvbQlUUlVFCS8JVFJVRQkwCVlTQwkwWERQTE05SVZOSQoueW91dHViZS5jb20JVFJVRQkvCVRSVUUJMTc5NzQ3Mjk5NQlfX1NlY3VyZS1ST0xMT1VUX1RPS0VOCUNJXzd5ZnZBX3Zqb3NRRVF6T2pGXzl5VWxRTVl6T2pGXzl5VWxRTSUzRAo="

# In-memory job progress tracking (survives per session)
_job_progress = {}
_job_progress_lock = threading.Lock()

app = FastAPI()

@app.on_event("startup")
async def startup():
    cookies_b64 = COOKIES_B64_HARDCODED
    try:
        data = base64.b64decode(cookies_b64).decode("utf-8")
        with open("cookies.txt", "w", encoding="utf-8") as f:
            f.write(data)
        print(f"COOKIES: written {len(data)} bytes to cookies.txt")
    except Exception as e:
        print(f"COOKIES: failed to write: {e}")
    await run_migrations()

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
            print("   To fix: open https://supabase.com/dashboard/project/tjuiourlpbwivjzyewav/sql/new")
            print("   Paste the contents of peakclip-backend/schema.sql and click Run")
    else:
        print("SQL MIGRATION: credit_transactions table already exists (OK)")

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
RATE_LIMIT = 10
RATE_WINDOW = 60

def check_rate_limit(key: str):
    now = time.time()
    window_start = now - RATE_WINDOW
    rate_store[key] = [t for t in rate_store[key] if t > window_start]
    if len(rate_store[key]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    rate_store[key].append(now)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://peakclip-studio.vercel.app",
    "https://peakclip-app.railway.app",
    os.getenv("FRONTEND_URL", ""),
]
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"
        response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store"
    return response


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

@app.on_event("startup")
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
        x = base64.urlsafe_b64decode(jwk["x"] + "==")
        y = base64.urlsafe_b64decode(jwk["y"] + "==")
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
    watermark_text: str = ""
    watermark_position: str = "top-right"
    music_track: str = "none"
    music_volume: int = 30
    filter_style: str = "none"
    resolution: str = "1080p"
    format: str = "mp4"
    fps: int = 30


@app.get("/")
def root():
    return {"status": "PeakClip API running"}


@app.get("/health")
def health():
    return {
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
    curl_cffi_ok = False
    try:
        import yt_dlp
        yt_dlp_ok = True
    except:
        yt_dlp_ok = False
    try:
        import curl_cffi
        curl_cffi_ok = True
    except:
        curl_cffi_ok = False
    try:
        import yt_dlp.extractor.youtube as yt_extract
        yt_version = getattr(yt_dlp, "__version__", "?")
    except:
        yt_version = "?"
    openai_key = os.getenv("OPENAI_API_KEY", "")
    supabase_url = os.getenv("SUPABASE_URL", "")
    cookies_path = "cookies.txt"
    cookies_info = "not found"
    if os.path.exists(cookies_path):
        size = os.path.getsize(cookies_path)
        lines = open(cookies_path).readlines()
        cookies_info = f"{size} bytes, {len(lines)} lines, 1st: {lines[0][:50] if lines else 'empty'}"
    return {
        "ffmpeg": ffmpeg_path or "NOT FOUND",
        "deno": deno_path or "NOT FOUND",
        "yt_dlp": yt_dlp_ok,
        "yt_dlp_version": yt_version,
        "curl_cffi": curl_cffi_ok,
        "cookies": cookies_info,
        "openai_key_set": bool(openai_key),
        "openai_key_prefix": openai_key[:8] + "..." if openai_key else "",
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
    """Generate SRT word-by-word subtitles with timestamps relative to clip_start."""
    clip_words = [w for w in words if w['start'] >= clip_start and w['end'] <= clip_end]
    lines = []
    idx = 1
    for w in clip_words:
        word_text = w['word'].strip()
        if not word_text:
            continue
        rel_start = max(0.0, w['start'] - clip_start)
        rel_end = w['end'] - clip_start
        lines.append(str(idx))
        lines.append(f"{format_srt_time(rel_start)} --> {format_srt_time(rel_end)}")
        lines.append(word_text)
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


# ──────────────────────────────────────────────────────────────


@app.get("/check-cookies")
def check_cookies():
    exists = os.path.exists("cookies.txt")
    if not exists:
        return {"cookies": False}
    size = os.path.getsize("cookies.txt")
    lines = open("cookies.txt").readlines()
    has_tabs = any("\t" in l for l in lines)
    return {
        "cookies": True,
        "size": size,
        "lines": len(lines),
        "has_tabs": has_tabs,
        "first_line": lines[0][:80] if lines else "",
        "sample": lines[1][:80] if len(lines) > 1 else "",
    }


@app.post("/upload-cookies")
async def upload_cookies(file: bytes = File(...)):
    path = "cookies.txt"
    with open(path, "wb") as f:
        f.write(file)
    return {"status": "ok", "message": f"Cookies saved ({len(file)} bytes)"}


@app.get("/test-dl")
def test_dl(url: str = "dQw4w9WgXcQ"):
    full_url = f"https://www.youtube.com/watch?v={url}" if "youtube.com" not in url and "youtu.be" not in url else url
    ydl_opts = get_ydl_opts()
    ydl_opts['socket_timeout'] = 15
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(full_url, download=False)
            best = info.get('requested_formats') or info.get('format')
            return {
                'ok': True,
                'title': info.get('title', '?'),
                'duration': info.get('duration', '?'),
                'id': info.get('id', '?'),
                'format': str(best)[:200],
                'used_cookies': os.path.exists('cookies.txt'),
            }
    except Exception as e:
        return {'ok': False, 'error': str(e)[:500]}


def _set_job(job_id, user_id, status, message=None):
    with _job_progress_lock:
        _job_progress[job_id] = {"id": job_id, "user_id": user_id, "status": status, "message": message}

def extract_json(text: str) -> dict:
    text = text.strip()
    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if m:
        text = m.group(1).strip()
    return json.loads(text)

def get_ydl_opts():
    opts = {
        'format': 'best[height<=720][ext=mp4]/best[ext=mp4]/best',
        'quiet': True, 'no_warnings': True,
        'socket_timeout': 60, 'retries': 10, 'fragment_retries': 10,
        'extractor_retries': 10, 'file_access_retries': 10,
        'sleep_interval': 10,
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'ios'],
                'skip': ['dash', 'hls'],
            }
        },
    }
    if os.path.exists('cookies.txt'):
        opts['cookiefile'] = 'cookies.txt'
    return opts

YT_CLIENT_ID = "407408718192.apps.googleusercontent.com"

@app.get("/auth-youtube")
async def auth_youtube():
    scope = "https://www.googleapis.com/auth/youtube"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post("https://accounts.google.com/o/oauth2/device/code", data={
            "client_id": YT_CLIENT_ID,
            "scope": scope,
        })
        if r.status_code != 200:
            return {"error": f"device_code failed: {r.text}"}
        data = r.json()
        return {
            "verification_url": data["verification_url"],
            "user_code": data["user_code"],
            "device_code": data["device_code"],
            "expires_in": data.get("expires_in", 1800),
            "instructions": f"Visita {data['verification_url']} e ingresa el código: {data['user_code']}"
        }

@app.post("/auth-youtube/callback")
async def auth_youtube_callback(device_code: str):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post("https://www.googleapis.com/oauth2/v4/token", data={
            "client_id": YT_CLIENT_ID,
            "device_code": device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        })
        data = r.json()
        if "refresh_token" in data:
            with open("yt_oauth.json", "w") as f:
                json.dump({"refresh_token": data["refresh_token"]}, f)
            os.environ["YT_REFRESH_TOKEN"] = data["refresh_token"]
            setup_yt_oauth()
            return {"status": "ok", "message": "YouTube OAuth autenticado exitosamente"}
        if "error" in data and data["error"] == "authorization_pending":
            return {"status": "pending", "message": "Esperando autorización..."}
        if "error" in data and data["error"] == "slow_down":
            return {"status": "slow_down", "message": "Reintenta en 5 segundos"}
        return {"error": f"token failed: {r.text}"}

def setup_yt_oauth():
    rt = os.getenv("YT_REFRESH_TOKEN")
    if not rt and os.path.exists("yt_oauth.json"):
        rt = json.load(open("yt_oauth.json"))["refresh_token"]
    if rt:
        cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "yt-dlp", "downloader")
        os.makedirs(cache_dir, exist_ok=True)
        with open(os.path.join(cache_dir, "youtube-oauth.json"), "w") as f:
            json.dump({"refresh_token": rt, "access_token": "", "token_expiry": 0}, f)

setup_yt_oauth()

def _background_process(req: VideoRequest, user_id: str, job_id: str):
    video_path = f"downloads/{job_id}.mp4"
    audio_path = f"downloads/{job_id}.mp3"
    local_files = [video_path, audio_path]
    temp_files_extra = []

    _set_job(job_id, user_id, "downloading", "Downloading video from YouTube...")
    try:
        ydl_opts = get_ydl_opts()
        ydl_opts['outtmpl'] = video_path
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([req.url])
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Download failed: {str(e)[:200]}")
        return

    thumb_path = f"thumbnails/{job_id}.jpg"
    _set_job(job_id, user_id, "extracting", "Extracting audio and generating thumbnail...")
    try:
        subprocess.run(['ffmpeg', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', '-b:a', '32k', audio_path, '-y'], capture_output=True, timeout=300)
        generate_thumbnail(video_path, thumb_path)
        local_files.append(thumb_path)
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Audio extraction failed: {str(e)[:200]}")
        return

    _set_job(job_id, user_id, "transcribing", "Transcribing audio with Whisper AI...")
    try:
        with open(audio_path, 'rb') as f:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=f, response_format="verbose_json", timestamp_granularities=["word", "segment"])
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Transcription failed: {str(e)[:200]}")
        return

    words_data = []
    if hasattr(transcript, 'words') and transcript.words:
        for w in transcript.words:
            word_text = getattr(w, 'word', '') or ''
            w_start = getattr(w, 'start', None)
            w_end = getattr(w, 'end', None)
            if w_start is not None and w_end is not None and word_text.strip():
                words_data.append({"word": word_text, "start": w_start, "end": w_end})

    segments_text = "\n".join([f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}" for s in transcript.segments])

    prompt = f"""Analyze this transcript and return the 3 best viral moments for YouTube Shorts/TikTok.

Transcript:
{segments_text}

For each clip, classify the mood as one of: epic, hype, chill, funny, emotional, suspense.

Return ONLY a JSON with this exact format (no markdown, no code fences):
{{"clips":[{{"start":10.5,"end":40.2,"title":"...","reason":"...","mood":"hype"}},{{"start":120.0,"end":150.5,"title":"...","reason":"...","mood":"funny"}},{{"start":200.0,"end":230.0,"title":"...","reason":"...","mood":"emotional"}}]}}"""
    _set_job(job_id, user_id, "analyzing", "Analyzing transcript with AI to find viral moments...")
    try:
        for model_name in ["gpt-4o-mini", "gpt-4"]:
            try:
                response = client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}], timeout=60)
                clips_data = extract_json(response.choices[0].message.content)
                if "clips" in clips_data and len(clips_data["clips"]) > 0:
                    break
            except Exception:
                continue
        else:
            raise Exception("All models failed")
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Analysis failed: {str(e)[:200]}")
        return

    num_clips = len(clips_data["clips"])
    try:
        for i, clip in enumerate(clips_data["clips"]):
            _set_job(job_id, user_id, "rendering", f"Rendering clip {i+1} of {num_clips}...")
            output_path = f"outputs/{job_id}_clip{i+1}.mp4"
            duration = clip["end"] - clip["start"]
            clip_mood = clip.get("mood", "chill")
            clip_start = clip["start"]

            srt_path = os.path.join(tempfile.gettempdir(), f"{job_id}_clip{i+1}.srt")
            generate_srt_subtitle(words_data, clip_start, clip["end"], srt_path)
            temp_files_extra.append(srt_path)

            raw_clip = f"downloads/{job_id}_raw{i+1}.mp4"
            local_files.append(raw_clip)
            subprocess.run(['ffmpeg', '-ss', str(clip_start), '-i', video_path, '-t', str(duration),
                            '-c', 'copy', '-y', raw_clip], capture_output=True, timeout=120)

            music_path = resolve_music_path(clip_mood)
            
            no_subs = f"outputs/{job_id}_clip{i+1}_nosubs.mp4"
            local_files.append(no_subs)
            vid_filter = "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v]"
            audio_filter = ""
            if music_path:
                music_path_ff = music_path.replace('\\', '/')
                audio_filter = "[0:a]volume=1.0[a_main];[1:a]volume=0.18[a_music];[a_main][a_music]amix=inputs=2:duration=first[a]"
            else:
                audio_filter = "[0:a]anull[a]"
            parts = [vid_filter, audio_filter]
            step1 = ['ffmpeg', '-i', raw_clip]
            if music_path:
                step1 += ['-stream_loop', '-1', '-i', music_path_ff]
            step1 += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-y', no_subs]
            subprocess.run(step1, capture_output=True, timeout=600)

            if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                srt_path_ff = srt_path.replace('\\', '/')
                step2 = ['ffmpeg', '-i', no_subs, '-vf', f"subtitles={srt_path_ff}", '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', '-y', output_path]
                subprocess.run(step2, capture_output=True, timeout=300)
                if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                    shutil.copy2(no_subs, output_path)
            else:
                vid_filter = "[0:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2[v]"
                parts = [vid_filter, audio_filter]
                step1 = ['ffmpeg', '-i', raw_clip]
                if music_path:
                    step1 += ['-stream_loop', '-1', '-i', music_path_ff]
                step1 += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-y', no_subs]
                subprocess.run(step1, capture_output=True, timeout=600)
                if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                    srt_path_ff = srt_path.replace('\\', '/')
                    step2 = ['ffmpeg', '-i', no_subs, '-vf', f"subtitles={srt_path_ff}", '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', '-y', output_path]
                    subprocess.run(step2, capture_output=True, timeout=300)
                    if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                        shutil.copy2(no_subs, output_path)
                else:
                    shutil.copy2(raw_clip, output_path)

            local_files.append(output_path)

            _set_job(job_id, user_id, "uploading", f"Uploading clip {i+1} of {num_clips}...")
            clip_storage_url = ""
            try:
                with open(output_path, 'rb') as f:
                    storage_path = f"clips/{job_id}/{job_id}_clip{i+1}.mp4"
                    supabase.storage.from_("clips").upload(storage_path, f, {"content-type": "video/mp4", "upsert": "true"})
                    clip_storage_url = supabase.storage.from_("clips").get_public_url(storage_path)
            except Exception as e:
                print(f"BG [{job_id}] storage upload: {e}")

            thumb_storage_url = ""
            try:
                with open(thumb_path, 'rb') as f:
                    thumb_storage_path = f"thumbnails/{job_id}.jpg"
                    supabase.storage.from_("clips").upload(thumb_storage_path, f, {"content-type": "image/jpeg", "upsert": "true"})
                    thumb_storage_url = supabase.storage.from_("clips").get_public_url(thumb_storage_path)
            except Exception as e:
                print(f"BG [{job_id}] thumb upload: {e}")

            supabase.table("clips").insert({
                "user_id": user_id, "title": clip["title"], "status": "done",
                "video_url": clip_storage_url, "thumbnail_url": thumb_storage_url,
                "duration": round(duration, 1)
            }).execute()
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Rendering failed: {str(e)[:200]}")
        return
    finally:
        for f in local_files:
            try: os.unlink(f)
            except OSError: pass
        for f in temp_files_extra:
            try: os.unlink(f)
            except OSError: pass

    _set_job(job_id, user_id, "done", "All clips generated successfully!")
    print(f"BG DONE [{job_id}]")


@app.post("/upload")
async def upload_video(file: UploadFile = File(...), url: str = "", user: dict = Depends(get_current_user)):
    user_id = user["sub"]
    job_id = str(uuid.uuid4())
    video_path = f"downloads/{job_id}.mp4"
    os.makedirs("downloads", exist_ok=True)
    with open(video_path, "wb") as f:
        while chunk := await file.read(65536):
            f.write(chunk)
    
    def bg():
        _background_process_with_video(video_path, url, user_id, job_id)
    
    _set_job(job_id, user_id, "queued", "Video received, starting processing...")
    threading.Thread(target=bg, daemon=True).start()
    return {"job_id": job_id, "status": "processing", "message": "Processing uploaded video..."}

def _background_process_with_video(video_path: str, youtube_url: str, user_id: str, job_id: str):
    audio_path = f"downloads/{job_id}.mp3"
    local_files = [video_path, audio_path]
    temp_files_extra = []
    os.makedirs("thumbnails", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    
    thumb_path = f"thumbnails/{job_id}.jpg"
    local_files.append(thumb_path)
    _set_job(job_id, user_id, "extracting", "Extracting audio and generating thumbnail...")
    try:
        subprocess.run(['ffmpeg', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', '-b:a', '32k', audio_path, '-y'], capture_output=True, timeout=300)
        subprocess.run(['ffmpeg', '-i', video_path, '-ss', '00:00:01', '-vframes', '1', '-q:v', '2', thumb_path, '-y'], capture_output=True, timeout=30)
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Audio extraction failed: {str(e)[:200]}")
        return
    
    _set_job(job_id, user_id, "transcribing", "Transcribing audio with Whisper AI...")
    try:
        with open(audio_path, 'rb') as f:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=f, response_format="verbose_json", timestamp_granularities=["word", "segment"])
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Transcription failed: {str(e)[:200]}")
        return
    
    words_data = []
    if hasattr(transcript, 'words') and transcript.words:
        for w in transcript.words:
            word_text = getattr(w, 'word', '') or ''
            w_start = getattr(w, 'start', None)
            w_end = getattr(w, 'end', None)
            if w_start is not None and w_end is not None and word_text.strip():
                words_data.append({"word": word_text, "start": w_start, "end": w_end})
    segments_text = "\n".join([f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}" for s in transcript.segments]) if transcript.segments else ""
    
    prompt = f"""Analyze this transcript and return the 3 best viral moments for YouTube Shorts/TikTok.

Transcript:
{segments_text}

For each clip, classify the mood as one of: epic, hype, chill, funny, emotional, suspense.

Return ONLY a JSON with this exact format (no markdown, no code fences):
{{"clips":[{{"start":10.5,"end":40.2,"title":"...","reason":"...","mood":"hype"}},{{"start":120.0,"end":150.5,"title":"...","reason":"...","mood":"funny"}},{{"start":200.0,"end":230.0,"title":"...","reason":"...","mood":"emotional"}}]}}"""
    _set_job(job_id, user_id, "analyzing", "Analyzing transcript with AI to find viral moments...")
    try:
        for model_name in ["gpt-4o-mini", "gpt-4"]:
            try:
                response = client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}], timeout=60)
                clips_data = extract_json(response.choices[0].message.content)
                if "clips" in clips_data and len(clips_data["clips"]) > 0:
                    break
            except Exception:
                continue
        else:
            raise Exception("All models failed")
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Analysis failed: {str(e)[:200]}")
        return
    
    num_clips = len(clips_data["clips"])
    try:
        for i, clip in enumerate(clips_data["clips"]):
            _set_job(job_id, user_id, "rendering", f"Rendering clip {i+1} of {num_clips}...")
            output_path = f"outputs/{job_id}_clip{i+1}.mp4"
            duration = clip["end"] - clip["start"]
            clip_mood = clip.get("mood", "chill")
            clip_start = clip["start"]
            
            raw_clip_path = f"downloads/{job_id}_raw{i+1}.mp4"
            local_files.append(raw_clip_path)
            subprocess.run(['ffmpeg', '-ss', str(clip_start), '-i', video_path, '-t', str(duration), '-c', 'copy', '-y', raw_clip_path], capture_output=True, timeout=120)
            
            srt_path = os.path.join(tempfile.gettempdir(), f"{job_id}_clip{i+1}.srt")
            srt_lines = []
            for w in words_data:
                if w["start"] >= clip_start and w["end"] <= clip["end"]:
                    srt_lines.append(w)
            with open(srt_path, 'w', encoding='utf-8') as f:
                idx = 1
                for w in srt_lines:
                    start_srt = f"{int(w['start']//3600):02d}:{int((w['start']%3600)//60):02d}:{w['start']%60:06.3f}".replace('.', ',')
                    end_srt = f"{int(w['end']//3600):02d}:{int((w['end']%3600)//60):02d}:{w['end']%60:06.3f}".replace('.', ',')
                    f.write(f"{idx}\n{start_srt} --> {end_srt}\n{w['word']}\n\n")
                    idx += 1
            temp_files_extra.append(srt_path)
            
            music_path = resolve_music_path(clip_mood)
            
            # Step 1: render video without subtitles first (scale + pad to 9:16)
            no_subs = f"outputs/{job_id}_clip{i+1}_nosubs.mp4"
            local_files.append(no_subs)
            vid_filter = "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v]"
            audio_filter = ""
            if music_path:
                music_path_ff = music_path.replace('\\', '/')
                audio_filter = "[0:a]volume=1.0[a_main];[1:a]volume=0.18[a_music];[a_main][a_music]amix=inputs=2:duration=first[a]"
            else:
                audio_filter = "[0:a]anull[a]"
            parts = [vid_filter, audio_filter]
            step1 = ['ffmpeg', '-i', raw_clip_path]
            if music_path:
                music_path_ff = music_path.replace('\\', '/')
                step1 += ['-stream_loop', '-1', '-i', music_path_ff]
            step1 += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-y', no_subs]
            subprocess.run(step1, capture_output=True, timeout=600)
            
            if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                # Step 2: burn subtitles onto the rendered video
                srt_path_ff = srt_path.replace('\\', '/')
                step2 = ['ffmpeg', '-i', no_subs, '-vf', f"subtitles={srt_path_ff}", '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', '-y', output_path]
                subprocess.run(step2, capture_output=True, timeout=300)
                if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                    shutil.copy2(no_subs, output_path)
            else:
                # Fallback at 720p
                vid_filter = "[0:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2[v]"
                parts = [vid_filter, audio_filter]
                step1 = ['ffmpeg', '-i', raw_clip_path]
                if music_path:
                    step1 += ['-stream_loop', '-1', '-i', music_path_ff]
                step1 += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-y', no_subs]
                subprocess.run(step1, capture_output=True, timeout=600)
                if os.path.exists(no_subs) and os.path.getsize(no_subs) >= 1024:
                    srt_path_ff = srt_path.replace('\\', '/')
                    step2 = ['ffmpeg', '-i', no_subs, '-vf', f"subtitles={srt_path_ff}", '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', '-y', output_path]
                    subprocess.run(step2, capture_output=True, timeout=300)
                    if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                        shutil.copy2(no_subs, output_path)
                else:
                    shutil.copy2(raw_clip_path, output_path)
            
            local_files.append(output_path)
            
            _set_job(job_id, user_id, "uploading", f"Uploading clip {i+1} of {num_clips}...")
            clip_storage_url = ""
            try:
                with open(output_path, 'rb') as f:
                    storage_path = f"clips/{job_id}/{job_id}_clip{i+1}.mp4"
                    supabase.storage.from_("clips").upload(storage_path, f, {"content-type": "video/mp4", "upsert": "true"})
                    clip_storage_url = supabase.storage.from_("clips").get_public_url(storage_path)
            except Exception as e:
                print(f"BG [{job_id}] storage upload: {e}")
            
            thumb_storage_url = ""
            try:
                with open(thumb_path, 'rb') as f:
                    thumb_storage_path = f"thumbnails/{job_id}.jpg"
                    supabase.storage.from_("clips").upload(thumb_storage_path, f, {"content-type": "image/jpeg", "upsert": "true"})
                    thumb_storage_url = supabase.storage.from_("clips").get_public_url(thumb_storage_path)
            except Exception as e:
                print(f"BG [{job_id}] thumb upload: {e}")
            
            supabase.table("clips").insert({
                "user_id": user_id, "title": clip["title"], "status": "done",
                "video_url": clip_storage_url, "thumbnail_url": thumb_storage_url,
                "duration": round(duration, 1)
            }).execute()
    except Exception as e:
        _set_job(job_id, user_id, "error", f"Rendering failed: {str(e)[:200]}")
        return
    finally:
        for f in local_files:
            try: os.unlink(f)
            except OSError: pass
        for f in temp_files_extra:
            try: os.unlink(f)
            except OSError: pass
    
    _set_job(job_id, user_id, "done", "All clips generated successfully!")


@app.get("/test-process")
def test_process_sync(url: str = "dQw4w9WgXcQ"):
    full_url = f"https://www.youtube.com/watch?v={url}" if "youtube.com" not in url and "youtu.be" not in url else url
    req = VideoRequest(url=full_url)
    job_id = str(uuid.uuid4())
    user_id = "00000000-0000-0000-0000-000000000000"
    errors = []
    steps = {}

    _set_job(job_id, user_id, "queued", "Starting...")
    video_path = f"downloads/{job_id}.mp4"
    audio_path = f"downloads/{job_id}.mp3"
    local_files = [video_path, audio_path]

    _set_job(job_id, user_id, "downloading")
    try:
        ydl_opts = get_ydl_opts()
        ydl_opts['outtmpl'] = video_path
        ydl_opts['socket_timeout'] = 30
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([req.url])
        steps['download'] = 'ok'
    except Exception as e:
        steps['download'] = str(e)[:200]
        return {"job_id": job_id, "steps": steps, "error": f"Download: {e}"}

    thumb_path = f"thumbnails/{job_id}.jpg"
    local_files.append(thumb_path)
    _set_job(job_id, user_id, "extracting")
    try:
        subprocess.run(['ffmpeg', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', '-b:a', '32k', audio_path, '-y'], capture_output=True, timeout=300)
        steps['extract_audio'] = 'ok'
        try:
            subprocess.run(['ffmpeg', '-i', video_path, '-ss', '00:00:01', '-vframes', '1', '-q:v', '2', thumb_path, '-y'], capture_output=True, timeout=30)
            steps['thumbnail'] = 'ok'
        except Exception as e:
            steps['thumbnail'] = str(e)[:100]
    except Exception as e:
        steps['extract_audio'] = str(e)[:200]
        return {"job_id": job_id, "steps": steps, "error": f"Audio: {e}"}

    _set_job(job_id, user_id, "transcribing")
    try:
        with open(audio_path, 'rb') as f:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=f, response_format="verbose_json", timestamp_granularities=["word", "segment"])
        steps['transcribe'] = f'ok ({len(transcript.words or [])} words)'
    except Exception as e:
        steps['transcribe'] = str(e)[:200]
        return {"job_id": job_id, "steps": steps, "error": f"Whisper: {e}"}

    words_data = []
    if hasattr(transcript, 'words') and transcript.words:
        for w in transcript.words:
            word_text = getattr(w, 'word', '') or ''
            w_start = getattr(w, 'start', None)
            w_end = getattr(w, 'end', None)
            if w_start is not None and w_end is not None and word_text.strip():
                words_data.append({"word": word_text, "start": w_start, "end": w_end})
    segments_text = "\n".join([f"[{s.start:.1f}s - {s.end:.1f}s]: {s.text}" for s in transcript.segments])

    prompt = f"""Analyze this transcript and return the 3 best viral moments for YouTube Shorts/TikTok.

Transcript:
{segments_text}

For each clip, classify the mood as one of: epic, hype, chill, funny, emotional, suspense.

Return ONLY a JSON with this exact format (no markdown, no code fences):
{{"clips":[{{"start":10.5,"end":40.2,"title":"...","reason":"...","mood":"hype"}},{{"start":120.0,"end":150.5,"title":"...","reason":"...","mood":"funny"}},{{"start":200.0,"end":230.0,"title":"...","reason":"...","mood":"emotional"}}]}}"""
    _set_job(job_id, user_id, "analyzing")
    try:
        for model_name in ["gpt-4o-mini", "gpt-4"]:
            try:
                response = client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}], timeout=60)
                clips_data = extract_json(response.choices[0].message.content)
                if "clips" in clips_data and len(clips_data["clips"]) > 0:
                    break
            except Exception:
                continue
        else:
            raise Exception("All models failed")
        steps['analyze'] = f'ok ({len(clips_data["clips"])} clips)'
    except Exception as e:
        steps['analyze'] = str(e)[:200]
        return {"job_id": job_id, "steps": steps, "error": f"GPT: {e}"}

    num_clips = len(clips_data["clips"])
    try:
        for i, clip in enumerate(clips_data["clips"]):
            _set_job(job_id, user_id, "rendering", f"Rendering clip {i+1} of {num_clips}...")
            output_path = f"outputs/{job_id}_clip{i+1}.mp4"
            duration = clip["end"] - clip["start"]
            clip_mood = clip.get("mood", "chill")
            clip_start = clip["start"]

            srt_path = os.path.join(tempfile.gettempdir(), f"{job_id}_clip{i+1}.srt")
            srt_lines = []
            for w in words_data:
                if w["start"] >= clip_start and w["end"] <= clip["end"]:
                    srt_lines.append(w)
            with open(srt_path, 'w', encoding='utf-8') as f:
                idx = 1
                for w in srt_lines:
                    start_srt = f"{int(w['start']//3600):02d}:{int((w['start']%3600)//60):02d}:{w['start']%60:06.3f}".replace('.', ',')
                    end_srt = f"{int(w['end']//3600):02d}:{int((w['end']%3600)//60):02d}:{w['end']%60:06.3f}".replace('.', ',')
                    f.write(f"{idx}\n{start_srt} --> {end_srt}\n{w['word']}\n\n")
                    idx += 1

            srt_path_ff = srt_path.replace('\\', '/')
            video_filter = (
                f"[0:v]subtitles={srt_path_ff}:force_style="
                f"'Fontname=Arial,Fontsize=48,PrimaryColour=&H0073BADF,"
                f"BackColour=&H80000000,Outline=0,Bold=1,Alignment=2,MarginV=60'"
                ",scale=1080:1920:force_original_aspect_ratio=decrease,"
                "pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v]"
            )

            raw_clip = f"downloads/{job_id}_raw{i+1}.mp4"
            local_files.append(raw_clip)
            # Step 1: extract raw clip (no encoding, very low memory)
            r1 = subprocess.run(['ffmpeg', '-ss', str(clip_start), '-i', video_path, '-t', str(duration),
                                 '-c', 'copy', '-an', '-y', raw_clip], capture_output=True, timeout=120)
            if r1.returncode != 0:
                steps[f'render_clip_{i+1}'] = f'extract failed: {r1.returncode}'
                return {"job_id": job_id, "steps": steps, "error": f"Extract clip {i+1} failed"}
            # Step 2: process extracted clip (much smaller input)
            srt_path_ff_esc = srt_path_ff.replace(":", "\\:").replace("'", "'\\\\''")
            video_filter = (
                f"[0:v]subtitles={srt_path_ff}:force_style="
                f"'Fontname=Arial,Fontsize=48,PrimaryColour=&H0073BADF,"
                f"BackColour=&H80000000,Outline=0,Bold=1,Alignment=2,MarginV=60'"
                ",scale=1080:1920:force_original_aspect_ratio=decrease,"
                "pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v]"
            )
            r2 = subprocess.run(['ffmpeg', '-i', raw_clip,
                                 '-filter_complex', video_filter,
                                 '-map', '[v]', '-c:v', 'libx264', '-preset', 'ultrafast',
                                 '-an', '-y', output_path], capture_output=True, timeout=600)
            if r2.returncode == -9:
                steps[f'render_clip_{i+1}'] = 'OOM on subtitles, trying minimal'
                r3 = subprocess.run(['ffmpeg', '-i', raw_clip,
                                     '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2',
                                     '-c:v', 'mpeg4', '-qscale:v', '5', '-an', '-y', output_path],
                                    capture_output=True, timeout=600)
                if r3.returncode != 0:
                    steps[f'render_clip_{i+1}'] = f'minimal also failed: {r3.returncode}'
                    return {"job_id": job_id, "steps": steps, "error": f"Render clip {i+1} OOM even minimal"}
            elif r2.returncode != 0:
                steps[f'render_clip_{i+1}'] = f'ffmpeg exit {r2.returncode}: {r2.stderr.decode()[:200]}'
                return {"job_id": job_id, "steps": steps, "error": f"Render clip {i+1} failed"}
            if os.path.getsize(output_path) < 1024:
                steps[f'render_clip_{i+1}'] = f'file too small ({os.path.getsize(output_path)} bytes), trying mpeg4 fallback'
                fallback_cmd = ['ffmpeg', '-i', raw_clip,
                               '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2',
                               '-c:v', 'mpeg4', '-qscale:v', '5', '-an', '-y', output_path]
                subprocess.run(fallback_cmd, capture_output=True, timeout=600)
            steps[f'render_clip_{i+1}'] = f'ok ({os.path.getsize(output_path)} bytes)'
            local_files.append(output_path)

        steps['render'] = 'ok'
    except Exception as e:
        steps['render'] = str(e)[:200]
        return {"job_id": job_id, "steps": steps, "error": f"Render loop: {e}"}
    finally:
        for f in local_files:
            try: os.unlink(f)
            except OSError: pass

    _set_job(job_id, user_id, "done", "All clips generated successfully!")
    return {"job_id": job_id, "steps": steps, "status": "done"}


@app.post("/process")
async def process_video(req: VideoRequest, user: dict = Depends(get_current_user)):
    check_rate_limit(f"process:{user['sub']}")
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

    _set_job(job_id, user_id, "queued", "Starting processing...")
    threading.Thread(target=_background_process, args=(req, user_id, job_id), daemon=True).start()

    return {"job_id": job_id, "status": "processing", "message": "Your video is being processed. Check My Clips in a few minutes."}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    with _job_progress_lock:
        job = _job_progress.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/export")
async def export_clip(req: ExportRequest, user: dict = Depends(get_current_user)):
    check_rate_limit(f"export:{user['sub']}")
    user_id = user["sub"]
    job_id = str(uuid.uuid4())
    output_ext = req.format if req.format in ("mov", "webm") else "mp4"
    output_filename = f"{job_id}_export.{output_ext}"
    output_path = f"outputs/{output_filename}"
    local_files = []

    source_path = f"downloads/{job_id}_source.mp4"
    subprocess.run([
        'ffmpeg', '-i', req.video_url, '-c', 'copy', source_path, '-y'
    ], capture_output=True)

    if not os.path.exists(source_path):
        raise HTTPException(status_code=400, detail="Could not download source video")
    local_files.append(source_path)

    probe = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', source_path
    ], capture_output=True, text=True)

    total_duration = float(probe.stdout.strip() or 30)
    trim_s = req.trim_start / 100 * total_duration
    trim_d = (req.trim_end - req.trim_start) / 100 * total_duration
    trim_d = max(trim_d, 2)

    # Resolution mapping
    res_map = {"720p": "720:1280", "1080p": "1080:1920", "4k": "2160:3840"}
    target_res = res_map.get(req.resolution, "1080:1920")

    temp_files = []

    try:
        # Build filter chain
        vf = f"scale={target_res}:force_original_aspect_ratio=decrease,pad={target_res}:(ow-iw)/2:(oh-ih)/2"

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
            '-preset', 'fast',
            '-c:a', acodec,
        ])
        if af_filter:
            cmd.extend(['-filter_complex', af_filter])
        cmd.extend(['-y', output_path])

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"Export error: {result.stderr[:500]}")
        local_files.append(output_path)

        # Upload to Supabase Storage
        public_url = ""
        try:
            with open(output_path, 'rb') as f:
                storage_path = f"exports/{output_filename}"
                supabase.storage.from_("clips").upload(storage_path, f, {"content-type": f"video/{output_ext}", "upsert": "true"})
                public_url = supabase.storage.from_("clips").get_public_url(storage_path)
        except Exception as e:
            print(f"Storage upload failed: {e}")

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
    check_rate_limit(f"checkout:{user['sub']}")
    user_id = user["sub"]
    price_id = data.get("price_id")
    return_url = data.get("return_url", "http://localhost:3000/dashboard")

    if not price_id:
        raise HTTPException(status_code=400, detail="Missing price_id")

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
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if sig_header:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")
    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        price_id = session.get("line_items", {}).get("data", [{}])[0].get("price", {}).get("id", "")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
