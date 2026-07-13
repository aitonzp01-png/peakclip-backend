"""BLACKLIST yt-dlp-youtube-oauth2 plugin entirely.

The OAuth2 plugin creates a youtube+oauth2 extractor that takes priority
over the standard youtube extractor and causes 'No video formats found!'
errors even when OAuth tokens are valid. This patch forces yt-dlp to
skip the plugin entirely by deleting the plugin file from disk.
"""
import os
import sys
import shutil

# Find and delete the yt-dlp-youtube-oauth2 plugin
try:
    import yt_dlp_plugins
    ie_dir = os.path.join(os.path.dirname(yt_dlp_plugins.__file__), 'extractor')
    target = os.path.join(ie_dir, 'youtubeoauth.py')
    if os.path.exists(target):
        os.remove(target)
        print(f"OAUTH2 PATCH: deleted {target}")
    # Clear __pycache__
    pycache = os.path.join(ie_dir, '__pycache__')
    if os.path.isdir(pycache):
        for fname in os.listdir(pycache):
            if 'youtubeoauth' in fname:
                os.remove(os.path.join(pycache, fname))
                print(f"OAUTH2 PATCH: deleted cache {fname}")
    # Also check for the plugin package dir
    pkg_dir = os.path.join(os.path.dirname(yt_dlp_plugins.__file__), '..', 'yt_dlp_plugins_youtube_oauth2')
    if os.path.isdir(pkg_dir):
        shutil.rmtree(pkg_dir)
        print(f"OAUTH2 PATCH: removed {pkg_dir}")
except Exception as e:
    print(f"OAUTH2 PATCH: error finding plugin: {e}")

# Ensure the module isn't cached
if 'yt_dlp_plugins.extractor.youtubeoauth' in sys.modules:
    del sys.modules['yt_dlp_plugins.extractor.youtubeoauth']
