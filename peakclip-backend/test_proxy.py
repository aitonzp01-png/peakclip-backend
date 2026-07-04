#!/usr/bin/env python3
"""Diagnostic script to test proxy connectivity for PeakClip backend.
Run inside Railway shell: python test_proxy.py
"""
import os
import socket
import sys
from urllib.parse import urlparse


def get_proxy_url():
    for key in ['YOUTUBE_PROXY', 'YTDLP_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY', 'PROXY_URL']:
        val = os.environ.get(key)
        if val:
            return key, val.strip()
    return None, None


def test_direct_connect(host, port, timeout=10):
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.close()
        return True, "OK"
    except Exception as e:
        return False, str(e)


def test_proxy_request(proxy_url, target_url="https://www.youtube.com"):
    parsed = urlparse(proxy_url)
    try:
        import urllib.request
        proxy_handler = urllib.request.ProxyHandler({
            'http': proxy_url,
            'https': proxy_url,
        })
        opener = urllib.request.build_opener(proxy_handler)
        opener.addheaders = [
            ('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
        ]
        req = urllib.request.Request(target_url, method='HEAD')
        resp = opener.open(req, timeout=30)
        return True, f"HTTP {resp.status}"
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 60)
    print("PeakClip Proxy Diagnostic")
    print("=" * 60)

    key, proxy_url = get_proxy_url()
    if not proxy_url:
        print("ERROR: No proxy configured.")
        print("Set one of: YOUTUBE_PROXY, YTDLP_PROXY, HTTP_PROXY, HTTPS_PROXY, PROXY_URL")
        sys.exit(1)

    print(f"Proxy source : {key}")
    print(f"Proxy URL    : {proxy_url}")

    parsed = urlparse(proxy_url)
    print(f"Scheme       : {parsed.scheme or 'NOT SET'}")
    print(f"Host         : {parsed.hostname}")
    print(f"Port         : {parsed.port}")
    print(f"Username     : {parsed.username or 'NOT SET'}")
    print(f"Password     : {'*' * len(parsed.password) if parsed.password else 'NOT SET'}")
    print()

    if not parsed.hostname or not parsed.port:
        print("ERROR: Proxy URL missing host or port")
        sys.exit(1)

    # Test 1: direct TCP connection to proxy
    print(f"Test 1: Direct TCP connect to {parsed.hostname}:{parsed.port} ...")
    ok, msg = test_direct_connect(parsed.hostname, parsed.port)
    print(f"  Result: {'PASS' if ok else 'FAIL'} - {msg}")

    # Test 2: HTTP request through proxy
    print(f"Test 2: HTTP request through proxy to https://www.youtube.com ...")
    ok, msg = test_proxy_request(proxy_url)
    print(f"  Result: {'PASS' if ok else 'FAIL'} - {msg}")

    print()
    if ok:
        print("Proxy is working. The backend should be able to use it.")
    else:
        print("Proxy is NOT working. Check with provider: port, protocol, IP whitelist, credentials.")


if __name__ == "__main__":
    main()
