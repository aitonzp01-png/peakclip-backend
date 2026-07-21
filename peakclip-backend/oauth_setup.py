#!/usr/bin/env python3
"""
OAuth2 Token Setup for YouTube Downloads.

Run this LOCALLY (not on Railway) to generate OAuth2 tokens for yt-dlp.
Then base64-encode the token file and set it as YOUTUBE_OAUTH_TOKENS_B64 on Railway.

Usage:
  python oauth_setup.py                    # Interactive setup
  python oauth_setup.py --refresh          # Refresh existing tokens
  python oauth_setup.py --encode FILE      # Base64-encode a token file

Steps:
  1. Run this script locally: python oauth_setup.py
  2. Follow the browser prompts to authorize with your Google account
  3. The script saves tokens to ~/.cache/yt-dlp/youtube_oauth2.json
  4. Encode for Railway: python oauth_setup.py --encode ~/.cache/yt-dlp/youtube_oauth2.json
  5. Set the output as YOUTUBE_OAUTH_TOKENS_B64 environment variable on Railway
"""
import os
import sys
import json
import base64
import argparse
import urllib.request
import urllib.parse
import http.server
import threading
import time

CLIENT_ID = os.environ.get('YOUTUBE_OAUTH_CLIENT_ID', '')
CLIENT_SECRET = os.environ.get('YOUTUBE_OAUTH_CLIENT_SECRET', '')

TOKEN_DIR = os.path.expanduser('~/.cache/yt-dlp')
TOKEN_PATH = os.path.join(TOKEN_DIR, 'youtube_oauth2.json')

# yt-dlp's built-in OAuth URLs
GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
SCOPE = 'https://www.googleapis.com/auth/youtube'


def encode_token_file(path):
    """Base64-encode a token file for use as YOUTUBE_OAUTH_TOKENS_B64."""
    with open(path, 'r') as f:
        data = f.read()
    encoded = base64.b64encode(data.encode('utf-8')).decode('utf-8')
    print(f"\n{'='*60}")
    print(f"Base64-encoded tokens ({len(encoded)} chars):")
    print(f"{'='*60}")
    print(encoded)
    print(f"{'='*60}")
    print(f"\nSet this as YOUTUBE_OAUTH_TOKENS_B64 on Railway:")
    print(f"  railway variables set YOUTUBE_OAUTH_TOKENS_B64='{encoded[:40]}...'")
    return encoded


def do_device_flow(client_id):
    """Start Google device flow to get user authorization."""
    # Step 1: Request device code
    data = urllib.parse.urlencode({
        'client_id': client_id,
        'scope': SCOPE,
    }).encode()
    req = urllib.request.Request(
        'https://oauthdevice.googleapis.com/device',
        data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
    device_code = resp['device_code']
    user_code = resp['user_code']
    verification_url = resp['verification_uri']
    interval = resp.get('interval', 5)

    print(f"\n{'='*60}")
    print(f"OAUTH2 DEVICE FLOW")
    print(f"{'='*60}")
    print(f"1. Go to: {verification_url}")
    print(f"2. Enter this code: {user_code}")
    print(f"3. Authorize with your Google account")
    print(f"{'='*60}\n")

    # Step 2: Poll for token
    while True:
        time.sleep(interval)
        try:
            poll_data = urllib.parse.urlencode({
                'client_id': client_id,
                'client_secret': CLIENT_SECRET,
                'device_code': device_code,
                'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',
            }).encode()
            poll_req = urllib.request.Request(
                'https://oauthdevice.googleapis.com/token',
                data=poll_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
            )
            poll_resp = json.loads(urllib.request.urlopen(poll_req, timeout=30).read().decode())
            if 'access_token' in poll_resp:
                return poll_resp
            if poll_resp.get('error') == 'authorization_pending':
                continue
            if poll_resp.get('error') == 'slow_down':
                interval += 5
                continue
            print(f"Error: {poll_resp}")
            return None
        except Exception as e:
            print(f"Poll error: {e}")
            continue


def do_web_flow(client_id, client_secret):
    """Start Google web OAuth flow using a local HTTP server."""
    import secrets
    state = secrets.token_urlsafe(16)
    redirect_uri = 'http://localhost:8765/callback'

    auth_url = (
        f"{GOOGLE_AUTH_URL}?client_id={client_id}"
        f"&redirect_uri={urllib.parse.quote(redirect_uri)}"
        f"&response_type=code&scope={urllib.parse.quote(SCOPE)}"
        f"&access_type=offline&prompt=consent&state={state}"
    )

    print(f"\n{'='*60}")
    print(f"OAUTH2 WEB FLOW")
    print(f"{'='*60}")
    print(f"1. Open this URL in your browser:")
    print(f"\n{auth_url}\n")
    print(f"2. Authorize with your Google account")
    print(f"3. You'll be redirected to localhost:8765 — the token will be captured automatically")
    print(f"{'='*60}\n")

    # Start a temporary HTTP server to capture the callback
    auth_code = None

    class CallbackHandler(http.server.BaseHTTPRequestHandler):
        nonlocal auth_code
        def do_GET(self):
            nonlocal auth_code
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            if 'code' in params:
                auth_code = params['code'][0]
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<h1>Authorization successful! You can close this tab.</h1>')
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<h1>Error: No code received</h1>')
        def log_message(self, format, *args):
            pass  # Suppress request logging

    server = http.server.HTTPServer(('localhost', 8765), CallbackHandler)
    server.timeout = 120
    while auth_code is None:
        server.handle_request()

    # Exchange code for tokens
    token_data = urllib.parse.urlencode({
        'client_id': client_id,
        'client_secret': client_secret,
        'code': auth_code,
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri,
    }).encode()
    req = urllib.request.Request(
        GOOGLE_TOKEN_URL,
        data=token_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
    return resp


def main():
    parser = argparse.ArgumentParser(description='YouTube OAuth2 Token Setup')
    parser.add_argument('--encode', type=str, help='Base64-encode an existing token file')
    parser.add_argument('--refresh', action='store_true', help='Refresh existing tokens')
    parser.add_argument('--web', action='store_true', help='Use web flow instead of device flow')
    args = parser.parse_args()

    if args.encode:
        encode_token_file(args.encode)
        return

    if not CLIENT_ID or not CLIENT_SECRET:
        print("ERROR: Set YOUTUBE_OAUTH_CLIENT_ID and YOUTUBE_OAUTH_CLIENT_SECRET env vars first.")
        print("These are Google OAuth2 client credentials (NOT the token).")
        print("Create them at: https://console.cloud.google.com/apis/credentials")
        sys.exit(1)

    if args.refresh:
        if not os.path.exists(TOKEN_PATH):
            print(f"ERROR: No token file at {TOKEN_PATH}. Run setup first.")
            sys.exit(1)
        with open(TOKEN_PATH) as f:
            tokens = json.load(f)
        refresh_token = tokens.get('refresh_token')
        if not refresh_token:
            print("ERROR: No refresh_token in token file. Run full setup.")
            sys.exit(1)
        print("Refreshing tokens...")
        data = urllib.parse.urlencode({
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token',
        }).encode()
        req = urllib.request.Request(
            GOOGLE_TOKEN_URL,
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
        )
        resp = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
        if 'access_token' not in resp:
            print(f"ERROR: Refresh failed: {resp}")
            sys.exit(1)
        tokens['access_token'] = resp['access_token']
        tokens['expires'] = time.time() + resp.get('expires_in', 3600)
        if 'refresh_token' in resp:
            tokens['refresh_token'] = resp['refresh_token']
        os.makedirs(TOKEN_DIR, exist_ok=True)
        with open(TOKEN_PATH, 'w') as f:
            json.dump(tokens, f, indent=2)
        print(f"Tokens refreshed! Expires in {resp.get('expires_in', 3600)}s")
        encode_token_file(TOKEN_PATH)
        return

    # Full setup flow
    if args.web:
        resp = do_web_flow(CLIENT_ID, CLIENT_SECRET)
    else:
        resp = do_device_flow(CLIENT_ID)

    if not resp or 'access_token' not in resp:
        print(f"ERROR: Authorization failed: {resp}")
        sys.exit(1)

    tokens = {
        'access_token': resp['access_token'],
        'refresh_token': resp.get('refresh_token', ''),
        'expires': time.time() + resp.get('expires_in', 3600),
        'token_type': resp.get('token_type', 'Bearer'),
    }

    os.makedirs(TOKEN_DIR, exist_ok=True)
    with open(TOKEN_PATH, 'w') as f:
        json.dump(tokens, f, indent=2)

    print(f"\nTokens saved to {TOKEN_PATH}")
    encode_token_file(TOKEN_PATH)


if __name__ == '__main__':
    main()
