'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { brand, brandDim, brandBorder, surface, textPrimary, textSecondary, textDim, borderSoft, fonts } from '../../../lib/tokens'
import { subtitleStyles, filters } from '../../../lib/utils'
import { getActiveSegment } from '../../../lib/subtitles'
import useEditorStore from '../store/editorStore'

const ASPECT_RATIOS = {
  '9:16': { width: 324, height: 576, label: 'Phone' },
  '16:9': { width: 576, height: 324, label: 'Landscape' },
  '1:1': { width: 400, height: 400, label: 'Square' },
}

export default function EditorPreview({ videoRef }) {
  const {
    clip, isPlaying, playheadPos, aspectRatio,
    subtitles, currentTime, subtitleStyle, subtitlePosition, fontSize,
    watermark, watermarkPosition, activeFilter,
    videoError, videoLoading, videoLoaded,
  } = useEditorStore()
  const { setIsPlaying, setPlayheadPos, setCurrentTime, setDuration, setVideoError, setVideoLoading, setVideoLoaded } = useEditorStore()
  const [showPlayOverlay, setShowPlayOverlay] = useState(true)
  const containerRef = useRef(null)
  const animRef = useRef(null)
  const dims = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['9:16']
  const selectedFilter = filters.find(f => f.id === activeFilter)?.style || {}
  const selectedSubStyle = subtitleStyles.find(s => s.id === subtitleStyle)?.preview || subtitleStyles[0].preview

  const playVideo = useCallback(() => {
    if (!videoRef?.current) return
    if (isPlaying) {
      videoRef.current.pause()
      if (animRef.current) cancelAnimationFrame(animRef.current)
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
      const update = () => {
        if (videoRef.current) {
          const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
          setPlayheadPos(Math.min(pct, 100))
          setCurrentTime(videoRef.current.currentTime)
        }
        animRef.current = requestAnimationFrame(update)
      }
      animRef.current = requestAnimationFrame(update)
    }
  }, [isPlaying, videoRef, setIsPlaying, setPlayheadPos, setCurrentTime])

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  useEffect(() => {
    if (videoRef?.current) {
      const onMeta = () => setDuration(videoRef.current.duration)
      const onEnd = () => { setIsPlaying(false); setPlayheadPos(100) }
      const onPlay = () => setIsPlaying(true)
      const onPause = () => setIsPlaying(false)
      videoRef.current.addEventListener('loadedmetadata', onMeta)
      videoRef.current.addEventListener('ended', onEnd)
      videoRef.current.addEventListener('play', onPlay)
      videoRef.current.addEventListener('pause', onPause)
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', onMeta)
        videoRef.current?.removeEventListener('ended', onEnd)
        videoRef.current?.removeEventListener('play', onPlay)
        videoRef.current?.removeEventListener('pause', onPause)
      }
    }
  }, [clip])

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setPlayheadPos(pct)
    if (videoRef?.current?.duration) {
      videoRef.current.currentTime = (pct / 100) * videoRef.current.duration
    }
  }

  const previewWidth = dims.width > 400 ? 360 : dims.width
  const scale = previewWidth / dims.width
  const previewHeight = dims.height * scale

  return (
    <div className="editor-preview" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', padding: '20px', gap: '20px',
      minWidth: 0, position: 'relative',
    }}>
      {/* Preview canvas */}
      <div ref={containerRef} style={{
        position: 'relative',
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        background: '#000',
        borderRadius: aspectRatio === '9:16' ? '24px' : '12px',
        border: aspectRatio === '9:16'
          ? `2px solid rgba(255,255,255,0.08)`
          : `1px solid ${borderSoft}`,
        overflow: 'hidden',
        boxShadow: aspectRatio === '9:16'
          ? `0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.8)`
          : `0 0 0 1px ${borderSoft}, 0 16px 48px rgba(0,0,0,0.4)`,
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Device notch for phone */}
        {aspectRatio === '9:16' && (
          <div style={{
            position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
            width: '120px', height: '22px', background: '#000',
            borderRadius: '0 0 16px 16px', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1a1a1a' }} />
            <div style={{ width: '40px', height: '5px', borderRadius: '3px', background: '#1a1a1a' }} />
          </div>
        )}

        {/* Video */}
        {videoError ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#0B0B0B', gap: '12px', padding: '24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,80,80,0.5)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,80,80,0.7)', fontFamily: fonts.body, marginBottom: '4px' }}>
                Video failed to load
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontFamily: fonts.mono, wordBreak: 'break-all' }}>
                {videoError}
              </div>
            </div>
          </div>
        ) : clip?.video_url ? (
          <video
            ref={videoRef}
            src={clip.video_url}
            crossOrigin="anonymous"
            onLoadStart={() => setVideoLoading(true)}
            onCanPlay={() => { setVideoLoaded(true); setVideoLoading(false) }}
            onError={(e) => {
              const msg = e.target?.error?.message || `Code ${e.target?.error?.code || 'unknown'}`
              console.error('Video load error:', clip.video_url, msg)
              setVideoError(msg)
            }}
            style={{
              width: '100%', height: '100%', objectFit: 'contain',
              display: videoLoaded ? 'block' : 'none', background: '#000', ...selectedFilter,
            }}
            playsInline
          />
        ) : videoLoading && !videoLoaded ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#0B0B0B', gap: '16px',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '2px solid rgba(217,180,74,0.15)',
              borderTopColor: '#D9B44A',
              animation: 'spin 0.6s linear infinite',
            }} />
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: fonts.body }}>
              Loading video...
            </div>
          </div>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#0B0B0B',
            gap: '16px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <circle cx="8" cy="8" r="2"/>
              <path d="M2 16l5-5c.78-.78 2.05-.78 2.83 0L15 16"/>
              <path d="M15 13l1.5-1.5c.78-.78 2.05-.78 2.83 0L22 15"/>
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontFamily: fonts.body, marginBottom: '4px' }}>
                Drop video here
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', fontFamily: fonts.body }}>
                or browse files
              </div>
            </div>
          </div>
        )}

        {/* Subtitles */}
        {videoLoaded && (
          <SubtitleOverlay
            subtitles={subtitles}
            currentTime={currentTime}
            subtitlePosition={subtitlePosition}
            selectedSubStyle={selectedSubStyle}
            fontSize={fontSize}
            scale={scale}
          />
        )}

        {/* Watermark */}
        {watermark && videoLoaded && (
          <div style={{
            position: 'absolute',
            ...(watermarkPosition === 'top-right' ? { top: '12px', right: '12px' } :
               watermarkPosition === 'top-left' ? { top: '12px', left: '12px' } :
               watermarkPosition === 'bottom-right' ? { bottom: '20px', right: '12px' } :
               { bottom: '20px', left: '12px' }),
            fontSize: '11px', color: 'rgba(255,255,255,0.8)',
            background: 'rgba(0,0,0,0.5)',
            padding: '4px 10px', borderRadius: '6px',
            pointerEvents: 'none', fontFamily: fonts.body,
            zIndex: 5, backdropFilter: 'blur(4px)',
          }}>
            {watermark}
          </div>
        )}

        {/* Play button overlay */}
        {!isPlaying && videoLoaded && (
          <div onClick={playVideo}
            style={{
              position: 'absolute', inset: 0, zIndex: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: showPlayOverlay ? 1 : 0,
              transition: 'opacity 0.2s',
              background: 'rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Playback controls below preview - CapCut style */}
      <div style={{
        width: `${Math.max(previewWidth, 280)}px`, maxWidth: '480px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {/* Timecode row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={playVideo} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: textPrimary, display: 'flex', padding: '4px',
              borderRadius: '4px', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = brand}
              onMouseLeave={e => e.currentTarget.style.color = textPrimary}>
              {isPlaying
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              }
            </button>
            <span style={{
              fontFamily: fonts.mono, fontSize: '11px', color: textDim,
              letterSpacing: '0.5px',
            }}>
              {formatTime(videoRef?.current?.currentTime)} / {formatTime(videoRef?.current?.duration)}
            </span>
          </div>
          <div style={{
            fontFamily: fonts.mono, fontSize: '10px', color: 'rgba(255,255,255,0.15)',
          }}>
            {aspectRatio}
          </div>
        </div>

        {/* Scrub bar - thin line style */}
        <div onClick={handleTimelineClick}
          style={{
            position: 'relative', height: '3px', cursor: 'pointer',
            borderRadius: '2px', background: 'rgba(255,255,255,0.06)',
            transition: 'height 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.height = '5px'}
          onMouseLeave={e => e.currentTarget.style.height = '3px'}>
          <div style={{
            height: '100%', borderRadius: '2px',
            width: `${playheadPos}%`,
            background: '#fff',
            transition: 'width 0.05s linear',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: `${playheadPos}%`,
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#fff', transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 6px rgba(255,255,255,0.3)',
            transition: 'left 0.05s linear',
          }} />
        </div>
      </div>
    </div>
  )
}

function SubtitleOverlay({ subtitles, currentTime, subtitlePosition, selectedSubStyle, fontSize, scale }) {
  const active = getActiveSegment(subtitles, currentTime)
  if (!active || !active.text) return null
  return (
    <div style={{
      position: 'absolute', left: '50%',
      width: '90%', textAlign: 'center', pointerEvents: 'none', zIndex: 5,
      ...(subtitlePosition === 'bottom'
        ? { bottom: '24px', transform: 'translateX(-50%)' }
        : subtitlePosition === 'middle'
          ? { top: '50%', transform: 'translateX(-50%) translateY(-50%)' }
          : { top: '24px', transform: 'translateX(-50%)' }),
      fontSize: `${Math.round((active.style?.fontSize || fontSize) * (scale || 1))}px`,
      fontWeight: '800',
      fontFamily: '"Arial Black", Arial, sans-serif',
      letterSpacing: '0.3px',
      lineHeight: '1.3',
      maxWidth: '85%',
      whiteSpace: 'pre-wrap',
      ...selectedSubStyle,
      color: active.style?.color || selectedSubStyle.color,
      backgroundColor: 'transparent',
      textShadow: selectedSubStyle.textShadow || '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.5)',
    }}>
      {active.text}
    </div>
  )
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
