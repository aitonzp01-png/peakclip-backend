"""BLACKLIST yt-dlp-youtube-oauth2 plugin entirely.

The OAuth2 plugin creates a youtube+oauth2 extractor that takes priority
over the standard youtube extractor and causes 'No video formats found!'
errors even when OAuth tokens are valid. This patch forces yt-dlp to
skip the plugin entirely by deleting the plugin file from disk.
"""
import os
import sys
import shutil
import pkgutil

# Find and delete the yt-dlp-youtube-oauth2 plugin
deleted_any = False

# Strategy 1: use pkgutil to find youtubeoauth extractor files
for importer, modname, ispkg in pkgutil.iter_modules():
    if 'youtubeoauth' in modname and 'extractor' in str(importer.path_finder.path if hasattr(importer, 'path_finder') else ''):
        try:
            mod = importer.find_module(modname).load_module(modname)
            if hasattr(mod, '__file__') and mod.__file__:
                os.remove(mod.__file__)
                print(f"OAUTH2 PATCH: deleted {mod.__file__}")
                deleted_any = True
        except Exception:
            pass

# Strategy 2: search site-packages for youtubeoauth.py
try:
    import site
    for sp_dir in site.getsitepackages():
        for root, dirs, files in os.walk(sp_dir):
            for f in files:
                if f == 'youtubeoauth.py' or 'youtubeoauth' in f:
                    full = os.path.join(root, f)
                    try:
                        os.remove(full)
                        print(f"OAUTH2 PATCH: deleted {full}")
                        deleted_any = True
                    except OSError as e:
                        print(f"OAUTH2 PATCH: cant delete {full}: {e}")
except Exception as e:
    print(f"OAUTH2 PATCH: site-packages walk error: {e}")

# Strategy 3: check the plugin package directory
try:
    pkg_dir = None
    # Find yt_dlp_plugins_youtube_oauth2 package
    for importer, modname, ispkg in pkgutil.iter_modules():
        if modname == 'yt_dlp_plugins_youtube_oauth2':
            mod = importer.find_module(modname).load_module(modname)
            if hasattr(mod, '__file__') and mod.__file__:
                pkg_dir = os.path.dirname(mod.__file__)
            break
    if pkg_dir and os.path.isdir(pkg_dir):
        shutil.rmtree(pkg_dir)
        print(f"OAUTH2 PATCH: removed package dir {pkg_dir}")
        deleted_any = True
except Exception as e:
    print(f"OAUTH2 PATCH: pkg dir error: {e}")

# Strategy 4: remove from yt-dlp's user plugin dir
try:
    from yt_dlp.utils.config import get_config_dir
    user_plugin_dir = os.path.join(get_config_dir(), 'plugins')
    for root, dirs, files in os.walk(user_plugin_dir):
        for f in files:
            if 'youtubeoauth' in f:
                full = os.path.join(root, f)
                try:
                    os.remove(full)
                    print(f"OAUTH2 PATCH: deleted user plugin {full}")
                    deleted_any = True
                except OSError as e:
                    print(f"OAUTH2 PATCH: cant delete user plugin {full}: {e}")
except Exception as e:
    print(f"OAUTH2 PATCH: user plugin dir error: {e}")

# Strategy 5: also check common install locations
common_dirs = [
    os.path.expanduser("~/.yt-dlp/plugins"),
]
for d in common_dirs:
    if os.path.isdir(d):
        for root, dirs, files in os.walk(d):
            for f in files:
                if 'youtubeoauth' in f:
                    full = os.path.join(root, f)
                    try:
                        os.remove(full)
                        print(f"OAUTH2 PATCH: deleted {full}")
                        deleted_any = True
                    except OSError as e:
                        print(f"OAUTH2 PATCH: cant delete {full}: {e}")

if not deleted_any:
    print("OAUTH2 PATCH: no plugin files found to delete")

# Ensure the module isn't cached
for key in list(sys.modules.keys()):
    if 'youtubeoauth' in key:
        del sys.modules[key]
        print(f"OAUTH2 PATCH: purged sys.modules[{key}]")
