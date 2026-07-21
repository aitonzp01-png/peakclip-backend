#!/usr/bin/env python3
"""
YouTube OAuth2 Token Setup — Uses yt-dlp's built-in OAuth2 client.

NO Google Cloud Console needed. Just run this script locally and follow
the browser prompts to authorize with your Google account.

Steps:
  1. pip install yt-dlp
  2. python youtube_oauth_setup.py
  3. Browser opens → authorize with Google
  4. Script saves tokens and prints the base64 string
  5. Set YOUTUBE_OAUTH_TOKENS_B64 on Railway with the printed string

Usage:
  python youtube_oauth_setup.py              # Full interactive setup
  python youtube_oauth_setup.py --encode     # Re-encode existing token file
"""
import os
import sys
import json
import base64
import subprocess
import tempfile

TOKEN_DIR = os.path.expanduser('~/.cache/yt-dlp')
TOKEN_PATH = os.path.join(TOKEN_DIR, 'youtube_oauth2.json')


def encode_and_print(path):
    with open(path, 'r') as f:
        data = f.read()
    encoded = base64.b64encode(data.encode('utf-8')).decode('utf-8')
    print(f"\n{'='*60}")
    print("BASE64 TOKEN (copy this entire string):")
    print(f"{'='*60}")
    print(encoded)
    print(f"{'='*60}")
    print(f"\nSet this on Railway:")
    print(f'  railway variables set YOUTUBE_OAUTH_TOKENS_B64="{encoded[:50]}..."')
    print(f"\nOr paste the full string in Railway dashboard → Variables → YOUTUBE_OAUTH_TOKENS_B64")
    return encoded


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--encode':
        if os.path.exists(TOKEN_PATH):
            encode_and_print(TOKEN_PATH)
        else:
            print(f"ERROR: No token file at {TOKEN_PATH}")
            print("Run the full setup first (without --encode)")
        return

    print("="*60)
    print("YouTube OAuth2 Setup for PeakClip")
    print("="*60)
    print()
    print("This will open your browser to authorize with Google.")
    print("Use the SAME Google account that watches YouTube videos.")
    print()

    # Use yt-dlp's built-in OAuth2 flow
    # The trick: --username oauth2 triggers the OAuth2 device flow
    try:
        result = subprocess.run(
            [
                sys.executable, '-m', 'yt_dlp',
                '--username', 'oauth2',
                '--password', '',
                '--verbose',
                '-o', os.path.join(tempfile.gettempdir(), 'oauth_test.%(ext)s'),
                '--no-download',
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            ],
            timeout=300,
            text=True,
        )
        # Even if download fails, the tokens should be saved
    except subprocess.TimeoutExpired:
        print("Timed out waiting for authorization. Try again.")
        return
    except FileNotFoundError:
        print("ERROR: yt-dlp not found. Install it: pip install yt-dlp")
        return

    # Check if tokens were saved
    if not os.path.exists(TOKEN_PATH):
        print(f"\nERROR: Token file not found at {TOKEN_PATH}")
        print("The OAuth2 flow may not have completed.")
        print("Try running manually:")
        print(f"  {sys.executable} -m yt_dlp --username oauth2 --password '' https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        return

    print(f"\nTokens saved to: {TOKEN_PATH}")
    encode_and_print(TOKEN_PATH)


if __name__ == '__main__':
    main()
