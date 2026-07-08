"""Helper script to run a single yt-dlp download in a separate process.

Called by main.py via subprocess.run(timeout=...) so the download can be
hard-killed if it hangs. Accepts a JSON blob of options via argv[1].
"""
import json
import sys
import yt_dlp


def main():
    if len(sys.argv) < 2:
        print("Usage: ytdlp_download.py '<json_options>'", file=sys.stderr)
        sys.exit(2)

    opts = json.loads(sys.argv[1])
    url = opts.pop("url")

    # Convert string impersonate targets to ImpersonateTarget objects.
    # When options are round-tripped through JSON, yt-dlp does not parse
    # the string automatically before checking supported targets.
    imp = opts.get("impersonate")
    if isinstance(imp, str):
        try:
            from yt_dlp.networking.impersonate import ImpersonateTarget
            opts["impersonate"] = ImpersonateTarget.from_str(imp)
        except Exception as e:
            print(f"Invalid impersonate target '{imp}': {e}", file=sys.stderr)
            sys.exit(2)

    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])


if __name__ == "__main__":
    main()
