"""DISABLED yt-dlp-youtube-oauth2 plugin.

This patch replaces the plugin file to make it a transparent pass-through
to the standard youtube extractor. The OAuth2 plugin creates a youtube+oauth2
extractor that takes priority over the standard youtube extractor and causes
'No video formats found!' errors. This patch makes it do nothing extra.
"""
import importlib
import inspect

from yt_dlp.extractor.youtube import YoutubeBaseInfoExtractor

YOUTUBE_IES = filter(
    lambda member: issubclass(member[1], YoutubeBaseInfoExtractor),
    inspect.getmembers(importlib.import_module('yt_dlp.extractor.youtube'), inspect.isclass)
)

for _, ie in YOUTUBE_IES:
    class _YouTubeOAuthDisabled(ie, plugin_name='oauth2'):
        _NETRC_MACHINE = 'youtube'
        _use_oauth2 = False
        # No overrides — everything delegates to parent (standard youtube extractor)
