'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

const THUMBNAIL_QUALITIES = [
  'maxresdefault',
  'hqdefault',
  'mqdefault',
  'default',
];

export default function ClipCard({
  clip,
  onRename,
  onDownload,
  onDelete,
  activeDropdown,
  setActiveDropdown,
}) {
  const [thumbQualityIdx, setThumbQualityIdx] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const loadKeyRef = useRef(0);

  const ytThumbSrc =
    clip.youtube_video_id && !useFallback
      ? `https://img.youtube.com/vi/${clip.youtube_video_id}/${THUMBNAIL_QUALITIES[thumbQualityIdx]}.jpg`
      : null;

  const src = ytThumbSrc || clip.thumbnail_url;
  const isNew = new Date() - new Date(clip.created_at) < 24 * 60 * 60 * 1000;

  const handleImgError = useCallback(() => {
    if (thumbQualityIdx < THUMBNAIL_QUALITIES.length - 1) {
      setThumbQualityIdx((prev) => prev + 1);
      setImgLoaded(false);
    } else {
      setUseFallback(true);
      setImgLoaded(false);
    }
    loadKeyRef.current += 1;
  }, [thumbQualityIdx]);

  const handleImgLoad = useCallback(() => {
    setImgLoaded(true);
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="pc-clip-card"
      onClick={() => (window.location.href = `/editor?id=${clip.id}`)}
    >
      <div className="pc-clip-thumb">
        {!imgLoaded && <div className="pc-skeleton" />}

        {src ? (
          <Image
            key={loadKeyRef.current}
            src={src}
            alt={clip.youtube_title || clip.title || 'Clip'}
            fill
            className="pc-clip-img"
            style={{ objectFit: 'cover', opacity: imgLoaded ? 1 : 0 }}
            onError={handleImgError}
            onLoad={handleImgLoad}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : null}

        <div className="pc-thumb-overlay" />

        <div className="pc-play-btn">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        </div>

        {clip.duration != null && (
          <span className="pc-duration-badge">
            {formatDuration(clip.duration)}
          </span>
        )}

        {clip.status === 'processing' && (
          <span className="pc-badge pc-badge-processing">Processing</span>
        )}
        {isNew && clip.status !== 'processing' && (
          <span className="pc-badge pc-badge-new">New</span>
        )}
      </div>

      <div className="pc-clip-info">
        {clip.youtube_title && (
          <div className="pc-video-title">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            {clip.youtube_title}
          </div>
        )}

        {clip.youtube_channel && (
          <div className="pc-channel-name">@{clip.youtube_channel}</div>
        )}

        {clip.title && (
          <div className="pc-clip-name">
            Clip: &ldquo;{clip.title}&rdquo;
          </div>
        )}

        <div className="pc-clip-footer">
          <span className="pc-clip-date">
            {new Date(clip.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(
                  activeDropdown === clip.id ? null : clip.id
                );
              }}
              className="db-clip-menu-btn"
            >
              ···
            </button>

            {activeDropdown === clip.id && (
              <div className="db-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(null);
                    onRename(clip.id, clip.title);
                  }}
                  className="db-dropdown-item"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(null);
                    onDownload(clip);
                  }}
                  className="db-dropdown-item"
                >
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(null);
                    onDelete(clip.id);
                  }}
                  className="db-dropdown-item delete"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
