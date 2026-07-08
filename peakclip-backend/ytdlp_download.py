"""Helper script to run a single yt-dlp download in a separate process.

Called by main.py via subprocess.run(timeout=...) so the download can be
hard-killed if it hangs. Accepts a JSON blob of options via argv[1].
"""
import json
import sys
import yt_dlp


def build_opts(raw_opts):
    """Return a copy of options with string impersonate targets converted."""
    opts = dict(raw_opts)
    imp = opts.get("impersonate")
    if isinstance(imp, str):
        try:
            from yt_dlp.networking.impersonate import ImpersonateTarget
            opts["impersonate"] = ImpersonateTarget.from_str(imp)
        except Exception as e:
            print(f"Invalid impersonate target '{imp}': {e}", file=sys.stderr)
            del opts["impersonate"]
    return opts


def run_download(url, opts):
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])


def main():
    if len(sys.argv) < 2:
        print("Usage: ytdlp_download.py '<json_options>'", file=sys.stderr)
        sys.exit(2)

    raw = json.loads(sys.argv[1])
    url = raw.pop("url")

    # First try with impersonation if requested.
    opts = build_opts(raw)
    try:
        run_download(url, opts)
        return
    except yt_dlp.utils.YoutubeDLError as e:
        err_msg = str(e).lower()
        if "impersonate target" in err_msg and "is not available" in err_msg:
            print(f"Impersonate target unavailable: {e}. Retrying without impersonation.", file=sys.stderr)
        else:
            raise

    # Retry without impersonation.
    opts_no_imp = dict(raw)
    opts_no_imp.pop("impersonate", None)
    run_download(url, opts_no_imp)


if __name__ == "__main__":
    main()
