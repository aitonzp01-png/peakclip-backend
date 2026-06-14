'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '../../lib/supabase'
import { brand, brandHover, brandGrad, brandDim, brandGlow, brandBorder, bgPrimary, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../lib/tokens'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const tc = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', fontFamily: fonts.mono, fontSize: '11px', color: textDim,
  },
  dot: (active) => ({
    width: '6px', height: '6px', borderRadius: '50%',
    background: active ? brand : borderStrong,
    transition: 'all 0.2s',
  }),
}

export default function Editor() {
  const [clip, setClip] = useState(null)
  const [clipId, setClipId] = useState(null)
  const [user, setUser] = useState(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [subtitleStyle, setSubtitleStyle] = useState('bold-yellow')
  const [subtitlePosition, setSubtitlePosition] = useState('bottom')
  const [subtitleText, setSubtitleText] = useState('')
  const [fontSize, setFontSize] = useState(14)
  const [watermark, setWatermark] = useState('')
  const [watermarkPosition, setWatermarkPosition] = useState('top-right')
  const [music, setMusic] = useState('none')
  const [musicVolume, setMusicVolume] = useState(30)
  const [activeFilter, setActiveFilter] = useState('none')
  const [saving, setSaving] = useState(false)
  const [exportStatus, setExportStatus] = useState('')
  const [exportUrl, setExportUrl] = useState('')
  const [activeTool, setActiveTool] = useState('trim')
  const [playheadPos, setPlayheadPos] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [timelineZoom, setTimelineZoom] = useState(1)
  const [showKeyframes, setShowKeyframes] = useState(false)
  const [tracks, setTracks] = useState([
    { id: 'video', label: 'Video', type: 'video', items: [{ id: 'v1', start: 0, end: 100, label: 'Clip 1' }] },
    { id: 'audio', label: 'Audio', type: 'audio', items: [] },
    { id: 'text', label: 'Text', type: 'text', items: [] },
  ])
  const [selectedTrack, setSelectedTrack] = useState('video')
  const [keyboardHint, setKeyboardHint] = useState('')
  const videoRef = useRef(null)
  const timelineRef = useRef(null)
  const animRef = useRef(null)
  const longPressRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setClipId(id)
      loadClip(id)
    }
    getSupabaseClient().auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user)
    })
    if (subtitleText) {
      setTracks(prev => prev.map(t => t.id === 'text' ? {
        ...t, items: [{ id: 'txt1', start: 0, end: 100, label: subtitleText.slice(0, 20) }]
      } : t))
    }
  }, [])

  useEffect(() => {
    if (subtitleText) {
      setTracks(prev => prev.map(t => t.id === 'text' ? {
        ...t, items: [{ id: 'txt1', start: 0, end: 100, label: subtitleText.slice(0, 20) }]
      } : t))
    } else {
      setTracks(prev => prev.map(t => t.id === 'text' ? { ...t, items: [] } : t))
    }
  }, [subtitleText])

  useEffect(() => {
    if (music !== 'none') {
      setTracks(prev => prev.map(t => t.id === 'audio' ? {
        ...t, items: [{ id: 'a1', start: 0, end: 100, label: music }]
      } : t))
    } else {
      setTracks(prev => prev.map(t => t.id === 'audio' ? { ...t, items: [] } : t))
    }
  }, [music])

  const loadClip = async (id) => {
    const { data } = await getSupabaseClient().from('clips').select('*').eq('id', id).single()
    if (data) {
      setClip(data)
      setSubtitleText(data.title || '')
    }
  }

  const subtitleStyles = [
    { id: 'bold-yellow', label: 'Bold Yellow', preview: { color: '#FFD700', fontWeight: 'bold', textShadow: '2px 2px 4px #000' } },
    { id: 'white-outline', label: 'Outline', preview: { color: '#fff', fontWeight: 'bold', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' } },
    { id: 'neon-green', label: 'Neon', preview: { color: '#00ff88', fontWeight: 'bold', textShadow: '0 0 8px #00ff88' } },
    { id: 'red-fire', label: 'Fire', preview: { color: '#ff4444', fontWeight: 'bold', textShadow: '0 0 8px #ff0000, 0 0 16px #ff0000' } },
    { id: 'minimal-white', label: 'Minimal', preview: { color: '#fff', fontWeight: '400', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' } },
    { id: 'tiktok-style', label: 'TikTok', preview: { color: '#fff', fontWeight: '900', textShadow: '2px 2px 0 #fe2c55, -2px -2px 0 #00f2ea' } },
  ]

  const musicTracks = [
    { id: 'none', label: 'No music', icon: '🔇' },
    { id: 'epic', label: 'Epic Cinematic', icon: '🎬' },
    { id: 'hype', label: 'Hype Beat', icon: '🔥' },
    { id: 'chill', label: 'Chill Lofi', icon: '🌊' },
    { id: 'gaming', label: 'Gaming Energy', icon: '🎮' },
    { id: 'viral', label: 'Viral Pop', icon: '📱' },
  ]

  const tools = [
    { id: 'trim', icon: '✂️', label: 'Trim' },
    { id: 'subtitles', icon: '💬', label: 'Text' },
    { id: 'watermark', icon: '©️', label: 'Logo' },
    { id: 'music', icon: '🎵', label: 'Audio' },
    { id: 'filter', icon: '✨', label: 'Filter' },
    { id: 'speed', icon: '⚡', label: 'Speed' },
    { id: 'transitions', icon: '🔄', label: 'Transitions' },
  ]

  const filters = [
    { id: 'none', label: 'Original', style: {} },
    { id: 'vivid', label: 'Vivid', style: { filter: 'saturate(1.5) contrast(1.1) brightness(1.05)' } },
    { id: 'cinema', label: 'Cinema', style: { filter: 'contrast(1.2) brightness(0.9) sepia(0.2)' } },
    { id: 'bw', label: 'B&W', style: { filter: 'grayscale(1) contrast(1.1)' } },
    { id: 'warm', label: 'Warm', style: { filter: 'sepia(0.4) saturate(1.3) hue-rotate(-10deg)' } },
    { id: 'cool', label: 'Cool', style: { filter: 'hue-rotate(30deg) saturate(0.9) brightness(1.1)' } },
  ]

  const transitions = [
    { id: 'fade', label: 'Fade', icon: '🌫️' },
    { id: 'slide', label: 'Slide', icon: '➡️' },
    { id: 'zoom', label: 'Zoom', icon: '🔍' },
    { id: 'wipe', label: 'Wipe', icon: '🧹' },
  ]

  const [selectedTransition, setSelectedTransition] = useState('fade')

  const waveformBars = useCallback((count) => {
    return Array.from({ length: count }, (_, i) => ({
      height: 15 + Math.sin(i * 0.7 + 1) * 12 + Math.sin(i * 1.3) * 8,
      active: i >= Math.floor(trimStart / 100 * count) && i <= Math.floor(trimEnd / 100 * count),
    }))
  }, [trimStart, trimEnd])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const playVideo = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      cancelAnimationFrame(animRef.current)
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
      const update = () => {
        if (videoRef.current) {
          const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100
          setPlayheadPos(Math.min(pct, 100))
        }
        animRef.current = requestAnimationFrame(update)
      }
      animRef.current = requestAnimationFrame(update)
    }
  }

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !videoRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setPlayheadPos(pct)
    if (videoRef.current.duration) {
      videoRef.current.currentTime = (pct / 100) * videoRef.current.duration
    }
  }

  const skipBack = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
    const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100
    setPlayheadPos(pct)
  }

  const skipForward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5)
    const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100
    setPlayheadPos(pct)
  }

  const handleExport = async () => {
    if (!clipId || !user) return
    setSaving(true)
    setExportStatus('Processing video...')
    setExportUrl('')

    const { data: { session } } = await getSupabaseClient().auth.getSession()

    try {
      const response = await fetch(`${BACKEND_URL}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          clip_id: clipId,
          video_url: clip?.video_url || '',
          trim_start: trimStart,
          trim_end: trimEnd,
          subtitle_text: subtitleText,
          subtitle_style: subtitleStyle,
          subtitle_position: subtitlePosition,
          watermark_text: watermark,
          watermark_position: watermarkPosition,
          music_track: music,
          music_volume: musicVolume,
          filter_style: activeFilter,
        })
      })

      if (response.ok) {
        const data = await response.json()
        setExportStatus('Clip exported successfully!')
        setExportUrl(data.video_url)
      } else {
        const err = await response.text()
        setExportStatus(`Export failed: ${err.slice(0, 100)}`)
      }
    } catch {
      setExportStatus('Could not connect to export server')
    }

    setSaving(false)
  }

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val / 100
    }
  }

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const showHint = (msg) => {
    setKeyboardHint(msg)
    setTimeout(() => setKeyboardHint(''), 2000)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          playVideo()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          skipForward()
          break
        case 's':
        case 'S':
          if (videoRef.current) {
            const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100
            setTrimStart(Math.max(0, pct))
            showHint(`Trim start set to ${Math.round(pct)}%`)
          }
          break
        case 'e':
        case 'E':
          if (videoRef.current) {
            const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100
            setTrimEnd(Math.min(100, pct))
            showHint(`Trim end set to ${Math.round(pct)}%`)
          }
          break
        case 'Escape':
          e.preventDefault()
          setActiveTool('trim')
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying])

  const selectedFilter = filters.find(f => f.id === activeFilter)?.style || {}

  const S = {
    phoneOuter: {
      position: 'relative',
      width: '200px', height: '355px',
      background: surface,
      borderRadius: '28px',
      border: `2px solid ${borderStrong}`,
      overflow: 'hidden',
      boxShadow: `0 0 0 8px ${surface}, 0 0 0 10px ${borderSoft}, 0 24px 48px rgba(0,0,0,0.8)`,
      flexShrink: 0,
    },
    panelSection: {
      marginBottom: '18px',
    },
    sectionLabel: {
      fontSize: '10px', color: textDim, textTransform: 'uppercase',
      letterSpacing: '1px', display: 'block', marginBottom: '8px',
      fontFamily: fonts.mono,
    },
    sliderRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '6px',
    },
    sliderLabel: {
      fontSize: '11px', color: textDim, fontFamily: fonts.body,
    },
    sliderValue: {
      fontSize: '11px', color: brand, fontFamily: fonts.mono, fontWeight: '600',
    },
    input: {
      width: '100%', padding: '10px 12px', borderRadius: '8px',
      border: `1px solid ${borderSoft}`, background: bgSecondary,
      color: textPrimary, fontSize: '13px', outline: 'none',
      fontFamily: fonts.body, transition: 'border-color 0.2s',
      boxSizing: 'border-box',
    },
    btn: (primary) => ({
      padding: '7px 18px', borderRadius: '6px', fontSize: '12px',
      fontWeight: '600', cursor: 'pointer', border: 'none',
      fontFamily: fonts.body,
      background: primary ? brandGrad : surface,
      color: primary ? '#000' : textSecondary,
      border: primary ? 'none' : `1px solid ${borderSoft}`,
      transition: 'all 0.15s',
    }),
    goldBtn: {
      background: brandGrad, color: '#000', border: 'none',
      borderRadius: '6px', padding: '7px 24px', fontWeight: '700',
      cursor: 'pointer', fontSize: '12px', fontFamily: fonts.body,
      minWidth: '120px', transition: 'opacity 0.2s',
    },
    goldLine: {
      height: '1px', background: brandGrad, opacity: 0.3, margin: '12px 0',
    },
    trackItem: (type) => ({
      position: 'absolute', top: '3px', bottom: '3px',
      borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', padding: '0 8px',
      minWidth: '12px', overflow: 'hidden',
      background: type === 'video' ? 'rgba(59,130,246,0.12)' :
                  type === 'audio' ? 'rgba(34,197,94,0.12)' :
                  'rgba(217,179,71,0.12)',
      border: `1px solid ${
        type === 'video' ? 'rgba(59,130,246,0.3)' :
        type === 'audio' ? 'rgba(34,197,94,0.3)' :
        brandBorder
      }`,
    }),
  }

  const renderTrimPanel = () => (
    <>
      <div style={S.panelSection}>
        <div style={S.sliderRow}>
          <span style={S.sliderLabel}>Start</span>
          <span style={S.sliderValue}>{Math.round(trimStart)}%</span>
        </div>
        <input type="range" min="0" max={trimEnd - 5} value={trimStart}
          onChange={e => setTrimStart(Number(e.target.value))}
          style={{ width: '100%', accentColor: brand }} />
      </div>
      <div style={S.panelSection}>
        <div style={S.sliderRow}>
          <span style={S.sliderLabel}>End</span>
          <span style={S.sliderValue}>{Math.round(trimEnd)}%</span>
        </div>
        <input type="range" min={trimStart + 5} max="100" value={trimEnd}
          onChange={e => setTrimEnd(Number(e.target.value))}
          style={{ width: '100%', accentColor: brand }} />
      </div>
      <div style={{
        background: bgSecondary, borderRadius: '8px', padding: '12px',
        textAlign: 'center', marginBottom: '18px',
      }}>
        <span style={{ fontSize: '11px', color: textDim, fontFamily: fonts.body }}>
          Duration:{' '}
        </span>
        <span style={{ color: brand, fontWeight: '700', fontSize: '14px' }}>
          {Math.round((trimEnd - trimStart) * 0.45)}s
        </span>
      </div>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Quick Presets</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {[
            { label: '15s', start: 0, end: 33 },
            { label: '30s', start: 0, end: 67 },
            { label: '60s', start: 0, end: 100 },
          ].map(p => (
            <button key={p.label} onClick={() => { setTrimStart(p.start); setTrimEnd(p.end) }}
              style={{
                background: bgSecondary, border: `1px solid ${borderSoft}`,
                borderRadius: '6px', padding: '8px', cursor: 'pointer',
                color: textPrimary, fontSize: '12px', fontFamily: fonts.body,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.background = brandDim }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.background = bgSecondary }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: textDim, fontFamily: fonts.mono }}>
        <span>⌘S = set in</span>
        <span>⌘E = set out</span>
      </div>
    </>
  )

  const renderTextPanel = () => (
    <>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Text</span>
        <input type="text" placeholder="Enter subtitle text..."
          value={subtitleText}
          onChange={e => setSubtitleText(e.target.value)}
          style={S.input}
          onFocus={e => { e.currentTarget.style.borderColor = brand }}
          onBlur={e => { e.currentTarget.style.borderColor = borderSoft }} />
      </div>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Style</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {subtitleStyles.map(s => (
            <div key={s.id} onClick={() => setSubtitleStyle(s.id)}
              style={{
                background: bgSecondary, border: `1px solid ${subtitleStyle === s.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (subtitleStyle !== s.id) e.currentTarget.style.borderColor = borderStrong }}
              onMouseLeave={e => { if (subtitleStyle !== s.id) e.currentTarget.style.borderColor = borderSoft }}>
              <div style={{ ...s.preview, fontSize: '13px', marginBottom: '4px' }}>Aa</div>
              <div style={{ fontSize: '9px', color: subtitleStyle === s.id ? brand : textDim }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Position</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'top', label: 'Top' },
            { id: 'middle', label: 'Mid' },
            { id: 'bottom', label: 'Bot' },
          ].map(p => (
            <div key={p.id} onClick={() => setSubtitlePosition(p.id)}
              style={{
                flex: 1, background: bgSecondary,
                border: `1px solid ${subtitlePosition === p.id ? brand : borderSoft}`,
                borderRadius: '6px', padding: '8px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (subtitlePosition !== p.id) e.currentTarget.style.borderColor = borderStrong }}
              onMouseLeave={e => { if (subtitlePosition !== p.id) e.currentTarget.style.borderColor = borderSoft }}>
              <span style={{ fontSize: '11px', color: subtitlePosition === p.id ? brand : textSecondary }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Font Size</span>
        <div style={S.sliderRow}>
          <span style={{ fontSize: '11px', color: textDim }}>Small</span>
          <span style={{ fontSize: '11px', color: brand, fontFamily: fonts.mono }}>{fontSize}px</span>
          <span style={{ fontSize: '11px', color: textDim }}>Large</span>
        </div>
        <input type="range" min="10" max="28" value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          style={{ width: '100%', accentColor: brand }} />
      </div>
    </>
  )

  const renderWatermarkPanel = () => (
    <>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Text / Handle</span>
        <input type="text" placeholder="@your_handle"
          value={watermark}
          onChange={e => setWatermark(e.target.value)}
          style={S.input}
          onFocus={e => { e.currentTarget.style.borderColor = brand }}
          onBlur={e => { e.currentTarget.style.borderColor = borderSoft }} />
      </div>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Position</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { id: 'top-left', label: '↖ Top Left' },
            { id: 'top-right', label: '↗ Top Right' },
            { id: 'bottom-left', label: '↙ Bot Left' },
            { id: 'bottom-right', label: '↘ Bot Right' },
          ].map(p => (
            <div key={p.id} onClick={() => setWatermarkPosition(p.id)}
              style={{
                background: bgSecondary,
                border: `1px solid ${watermarkPosition === p.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (watermarkPosition !== p.id) e.currentTarget.style.borderColor = borderStrong }}
              onMouseLeave={e => { if (watermarkPosition !== p.id) e.currentTarget.style.borderColor = borderSoft }}>
              <span style={{ fontSize: '11px', color: watermarkPosition === p.id ? brand : textSecondary }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{
        background: brandDim, border: `1px solid ${brandBorder}`,
        borderRadius: '8px', padding: '12px', fontSize: '11px',
        color: textSecondary, fontFamily: fonts.body, lineHeight: '1.5',
      }}>
        Watermark will appear on your exported clip. Use your TikTok/IG handle.
      </div>
    </>
  )

  const renderAudioPanel = () => (
    <>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Audio Track</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {musicTracks.map(t => (
            <div key={t.id} onClick={() => setMusic(t.id)}
              style={{
                background: bgSecondary,
                border: `1px solid ${music === t.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (music !== t.id) e.currentTarget.style.borderColor = borderStrong }}
              onMouseLeave={e => { if (music !== t.id) e.currentTarget.style.borderColor = borderSoft }}>
              <span style={{ fontSize: '13px', color: music === t.id ? brand : textSecondary }}>
                {t.icon} {t.label}
              </span>
              {music === t.id && (
                <span style={{ color: brand, fontSize: '12px' }}>●</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {music !== 'none' && (
        <div style={S.panelSection}>
          <span style={S.sectionLabel}>Volume</span>
          <div style={S.sliderRow}>
            <span style={S.sliderLabel}>🔈</span>
            <span style={S.sliderValue}>{musicVolume}%</span>
            <span style={S.sliderLabel}>🔊</span>
          </div>
          <input type="range" min="0" max="100" value={musicVolume}
            onChange={e => setMusicVolume(Number(e.target.value))}
            style={{ width: '100%', accentColor: brand }} />
        </div>
      )}
    </>
  )

  const renderFilterPanel = () => (
    <div style={S.panelSection}>
      <span style={S.sectionLabel}>Visual Filters</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {filters.map(f => (
          <div key={f.id} onClick={() => setActiveFilter(f.id)}
            style={{
              background: bgSecondary,
              border: `1px solid ${activeFilter === f.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '8px', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (activeFilter !== f.id) e.currentTarget.style.borderColor = borderStrong }}
            onMouseLeave={e => { if (activeFilter !== f.id) e.currentTarget.style.borderColor = borderSoft }}>
            <div style={{
              height: '52px', borderRadius: '6px', marginBottom: '6px',
              background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', ...f.style,
            }}>🎬</div>
            <span style={{ fontSize: '10px', color: activeFilter === f.id ? brand : textDim }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSpeedPanel = () => (
    <>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Playback Speed</span>
        <div style={{
          background: bgSecondary, borderRadius: '8px', padding: '20px 16px',
          textAlign: 'center',
        }}>
          <span style={{
            fontSize: '36px', fontWeight: '700', color: brand,
            fontFamily: fonts.display, letterSpacing: '1px',
          }}>{playbackSpeed}x</span>
        </div>
      </div>
      <div style={S.panelSection}>
        <input type="range" min="0.25" max="4" step="0.25" value={playbackSpeed}
          onChange={e => handleSpeedChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: brand }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '9px', color: textDim }}>0.25x</span>
          <span style={{ fontSize: '9px', color: textDim }}>4x</span>
        </div>
      </div>
      <div style={S.panelSection}>
        <span style={S.sectionLabel}>Quick Select</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
          {[0.5, 1, 1.5, 2].map(s => (
            <button key={s} onClick={() => handleSpeedChange(s)}
              style={{
                background: playbackSpeed === s ? brandDim : bgSecondary,
                border: `1px solid ${playbackSpeed === s ? brand : borderSoft}`,
                borderRadius: '6px', padding: '8px 4px', cursor: 'pointer',
                color: playbackSpeed === s ? brand : textSecondary,
                fontSize: '12px', fontWeight: playbackSpeed === s ? '700' : '400',
                fontFamily: fonts.mono, transition: 'all 0.15s',
              }}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </>
  )

  const renderTransitionsPanel = () => (
    <div style={S.panelSection}>
      <span style={S.sectionLabel}>Transition</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {transitions.map(t => (
          <div key={t.id} onClick={() => setSelectedTransition(t.id)}
            style={{
              background: bgSecondary,
              border: `1px solid ${selectedTransition === t.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '16px 8px', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (selectedTransition !== t.id) e.currentTarget.style.borderColor = borderStrong }}
            onMouseLeave={e => { if (selectedTransition !== t.id) e.currentTarget.style.borderColor = borderSoft }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{t.icon}</div>
            <span style={{ fontSize: '10px', color: selectedTransition === t.id ? brand : textDim }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPanelContent = () => {
    switch (activeTool) {
      case 'trim': return renderTrimPanel()
      case 'subtitles': return renderTextPanel()
      case 'watermark': return renderWatermarkPanel()
      case 'music': return renderAudioPanel()
      case 'filter': return renderFilterPanel()
      case 'speed': return renderSpeedPanel()
      case 'transitions': return renderTransitionsPanel()
      default: return renderTrimPanel()
    }
  }

  const wfBars = waveformBars(40)

  return (
    <div style={{
      height: '100vh', background: bgPrimary, color: textPrimary,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: fonts.body,
    }}>
      {/* Status Bar Hint */}
      {keyboardHint && (
        <div style={{
          position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)',
          background: brandDim, border: `1px solid ${brandBorder}`,
          borderRadius: '8px', padding: '6px 16px', fontSize: '11px',
          color: brand, zIndex: 1000, fontFamily: fonts.mono,
          animation: 'slideDown 0.2s ease',
        }}>
          {keyboardHint}
        </div>
      )}

      {/* TOP BAR */}
      <div style={{
        height: '52px', background: surface, borderBottom: `1px solid ${borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'transparent', border: 'none', color: textDim,
              cursor: 'pointer', fontSize: '18px', padding: '4px',
              fontFamily: fonts.body, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = textPrimary }}
            onMouseLeave={e => { e.currentTarget.style.color = textDim }}>
            ←
          </button>
          <span style={{
            color: brand, fontWeight: '700', fontSize: '16px',
            letterSpacing: '3px', fontFamily: fonts.display,
          }}>
            PEAKCLIP
          </span>
          <span style={{ color: textDim, fontSize: '12px' }}>|</span>
          <span style={{
            color: textDim, fontSize: '12px',
            maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {clip?.title?.slice(0, 40) || 'Editor'}
          </span>
          {clip?.video_url && (
            <a href={clip.video_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: brand, textDecoration: 'none', marginLeft: '4px' }}>
              Source ↗
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: textDim }}>🔊</span>
            <input type="range" min="0" max="100" value={volume}
              onChange={handleVolumeChange}
              style={{ width: '60px', accentColor: brand, height: '4px' }} />
          </div>
          {/* Speed */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {[0.5, 1, 1.5, 2].map(s => (
              <button key={s} onClick={() => handleSpeedChange(s)}
                style={{
                  padding: '4px 7px', borderRadius: '4px', cursor: 'pointer',
                  border: `1px solid ${playbackSpeed === s ? brand : borderSoft}`,
                  background: playbackSpeed === s ? brandDim : 'transparent',
                  color: playbackSpeed === s ? brand : textDim,
                  fontSize: '10px', fontFamily: fonts.mono, transition: 'all 0.15s',
                }}>
                {s}x
              </button>
            ))}
          </div>
          {/* Preview button */}
          <button onClick={playVideo}
            style={{
              ...S.btn(false),
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
            onMouseEnter={e => { if (!isPlaying) e.currentTarget.style.borderColor = borderStrong }}
            onMouseLeave={e => { if (!isPlaying) e.currentTarget.style.borderColor = borderSoft }}>
            <span>{isPlaying ? '⏸' : '▶'}</span>
            <span>{isPlaying ? 'Pause' : 'Preview'}</span>
          </button>
          {/* Export button */}
          <button onClick={handleExport} disabled={saving}
            style={{
              ...S.goldBtn,
              opacity: saving ? 0.5 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            {saving ? '⏳' : '⬇'} {saving ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT TOOL BAR */}
        <div style={{
          width: '64px', background: surface, borderRight: `1px solid ${borderSoft}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: '12px', gap: '2px', flexShrink: 0,
        }}>
          {tools.map(t => (
            <div key={t.id} onClick={() => setActiveTool(t.id)}
              role="tab" aria-selected={activeTool === t.id} tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setActiveTool(t.id) }}
              style={{
                width: '48px', padding: '8px 0', borderRadius: '10px',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                border: `1px solid ${activeTool === t.id ? brand : 'transparent'}`,
                background: activeTool === t.id ? brandDim : 'transparent',
              }}
              onMouseEnter={e => { if (activeTool !== t.id) { e.currentTarget.style.background = brandDim; e.currentTarget.style.borderColor = brandBorder } }}
              onMouseLeave={e => { if (activeTool !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}>
              <div style={{ fontSize: '18px', marginBottom: '2px', lineHeight: '1' }}>{t.icon}</div>
              <div style={{
                fontSize: '8px', color: activeTool === t.id ? brand : textDim,
                fontFamily: fonts.body,
              }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* CENTER - PHONE PREVIEW + TIMELINE */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: bgPrimary, padding: '16px', gap: '16px',
          minWidth: 0,
        }}>
          {/* Phone mockup */}
          <div style={S.phoneOuter}>
            {clip?.video_url ? (
              <video
                ref={videoRef}
                src={clip.video_url}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  ...selectedFilter,
                }}
                onEnded={() => { setIsPlaying(false); setPlayheadPos(100) }}
                onClick={playVideo}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(180deg, #1a1a2e, #0f3460)',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '8px', opacity: '0.5' }}>🎬</div>
                <div style={{ fontSize: '11px', color: textDim, textAlign: 'center', padding: '0 16px' }}>
                  Clip preview
                </div>
              </div>
            )}

            {/* Subtitle overlay */}
            {clip?.video_url && subtitleText && (
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                width: '88%', textAlign: 'center', pointerEvents: 'none',
                ...(subtitlePosition === 'bottom' ? { bottom: '12px' } :
                   subtitlePosition === 'middle' ? { top: '45%' } :
                   { top: '12px' }),
                ...subtitleStyles.find(s => s.id === subtitleStyle)?.preview,
                fontSize: `${fontSize}px`,
              }}>
                {subtitleText}
              </div>
            )}

            {/* Watermark overlay */}
            {watermark && clip?.video_url && (
              <div style={{
                position: 'absolute',
                ...(watermarkPosition === 'top-right' ? { top: '8px', right: '8px' } :
                   watermarkPosition === 'top-left' ? { top: '8px', left: '8px' } :
                   watermarkPosition === 'bottom-right' ? { bottom: '12px', right: '8px' } :
                   { bottom: '12px', left: '8px' }),
                fontSize: '10px', color: 'rgba(255,255,255,0.85)',
                background: 'rgba(0,0,0,0.45)',
                padding: '2px 7px', borderRadius: '4px',
                pointerEvents: 'none', fontFamily: fonts.body,
              }}>
                {watermark}
              </div>
            )}

            {/* Play indicator overlay */}
            {!isPlaying && clip?.video_url && (
              <div onClick={playVideo}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
                onMouseLeave={e => { e.currentTarget.style.opacity = 0 }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: brandGrad, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px', color: '#000',
                  boxShadow: `0 0 30px ${brandGlow}`,
                }}>▶</div>
              </div>
            )}
          </div>

          {/* Timeline area */}
          <div style={{
            width: '100%', maxWidth: '560px', display: 'flex',
            flexDirection: 'column', gap: '6px',
          }}>
            {/* Time ruler */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '0 4px', marginBottom: '2px',
              fontFamily: fonts.mono, fontSize: '9px', color: textDim,
            }}>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map(t => (
                <span key={t}>0:{t.toString().padStart(2, '0')}</span>
              ))}
            </div>

            {/* Multi-track timeline */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              {tracks.map(track => (
                <div key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  style={{
                    background: selectedTrack === track.id ? 'rgba(217,179,71,0.03)' : 'transparent',
                    border: `1px solid ${selectedTrack === track.id ? brandBorder : borderSoft}`,
                    borderRadius: '6px', height: '32px', position: 'relative',
                    overflow: 'hidden', display: 'flex', alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{
                    width: '52px', flexShrink: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: fonts.mono, fontSize: '8px', color: textDim,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    borderRight: `1px solid ${borderSoft}`, height: '100%',
                    background: bgSecondary,
                  }}>
                    {track.label}
                  </div>
                  <div style={{
                    flex: 1, position: 'relative', height: '100%', minWidth: 0,
                  }}>
                    {/* Waveform background for video track */}
                    {track.type === 'video' && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', gap: '2px', padding: '0 6px',
                        pointerEvents: 'none',
                      }}>
                        {wfBars.map((bar, i) => (
                          <div key={i} style={{
                            width: '3px', borderRadius: '2px',
                            height: `${bar.height}%`,
                            background: bar.active ? brandBorder : borderSoft,
                            transition: 'background 0.2s',
                          }} />
                        ))}
                      </div>
                    )}
                    {/* Track items */}
                    {track.items.map(item => (
                      <div key={item.id}
                        style={{
                          ...S.trackItem(track.type),
                          left: `${item.start}%`,
                          width: `${item.end - item.start}%`,
                        }}>
                        <span style={{
                          fontFamily: fonts.mono, fontSize: '8px',
                          color: track.type === 'video' ? '#60a5fa' :
                                track.type === 'audio' ? '#4ade80' : brand,
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                    {/* Playhead */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, width: '2px',
                      background: brand, zIndex: 6, pointerEvents: 'none',
                      left: `${playheadPos}%`,
                      boxShadow: `0 0 6px ${brandGlow}`,
                    }} />
                    {/* Selection region */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: `${trimStart}%`, width: `${trimEnd - trimStart}%`,
                      background: brandDim, pointerEvents: 'none',
                      borderLeft: `1px solid ${brand}`,
                      borderRight: `1px solid ${brand}`,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline interaction bar */}
            <div ref={timelineRef} onClick={handleTimelineClick}
              style={{
                position: 'relative', height: '20px', cursor: 'pointer',
                borderRadius: '4px', background: surface,
                border: `1px solid ${borderSoft}`,
              }}>
              {/* Playhead line */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '2px',
                background: brand, left: `${playheadPos}%`, zIndex: 5,
                boxShadow: `0 0 8px ${brandGlow}`,
              }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: brand, margin: '-5px 0 0 -4px',
                  boxShadow: `0 0 12px ${brandGlow}`,
                }} />
              </div>
              {/* Trim handles */}
              <div onMouseDown={(e) => {
                e.stopPropagation()
                const onMove = (ev) => {
                  const rect = timelineRef.current.getBoundingClientRect()
                  const pct = Math.max(0, Math.min(trimEnd - 5, ((ev.clientX - rect.left) / rect.width) * 100))
                  setTrimStart(pct)
                }
                const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
                document.addEventListener('mousemove', onMove)
                document.addEventListener('mouseup', onUp)
              }}
                style={{
                  position: 'absolute', left: `${trimStart}%`, top: 0, bottom: 0,
                  width: '4px', background: brand, zIndex: 10, cursor: 'ew-resize',
                  borderRadius: '2px',
                }} />
              <div onMouseDown={(e) => {
                e.stopPropagation()
                const onMove = (ev) => {
                  const rect = timelineRef.current.getBoundingClientRect()
                  const pct = Math.max(trimStart + 5, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
                  setTrimEnd(pct)
                }
                const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
                document.addEventListener('mousemove', onMove)
                document.addEventListener('mouseup', onUp)
              }}
                style={{
                  position: 'absolute', left: `${trimEnd}%`, top: 0, bottom: 0,
                  width: '4px', background: brand, zIndex: 10, cursor: 'ew-resize',
                  borderRadius: '2px',
                }} />
            </div>

            {/* Timeline info + controls row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '4px',
            }}>
              {/* Zoom controls */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setTimelineZoom(Math.max(1, timelineZoom - 1))}
                  style={{
                    width: '26px', height: '26px', borderRadius: '6px',
                    border: `1px solid ${borderSoft}`, background: 'transparent',
                    color: textDim, fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', lineHeight: '1',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = borderStrong; e.currentTarget.style.color = textPrimary }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.color = textDim }}>
                  −
                </button>
                <span style={{
                  fontFamily: fonts.mono, fontSize: '10px', color: textDim,
                  minWidth: '24px', textAlign: 'center', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {timelineZoom}x
                </span>
                <button onClick={() => setTimelineZoom(Math.min(5, timelineZoom + 1))}
                  style={{
                    width: '26px', height: '26px', borderRadius: '6px',
                    border: `1px solid ${borderSoft}`, background: 'transparent',
                    color: textDim, fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', lineHeight: '1',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = borderStrong; e.currentTarget.style.color = textPrimary }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.color = textDim }}>
                  +
                </button>
              </div>

              {/* Playback controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: fonts.mono, fontSize: '10px', color: textDim,
                  minWidth: '40px', textAlign: 'center',
                }}>
                  {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'}
                </span>

                <button onClick={skipBack}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: `1px solid ${borderSoft}`, background: 'transparent',
                    color: textDim, cursor: 'pointer', fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = borderStrong; e.currentTarget.style.color = textPrimary }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.color = textDim }}>
                  ⏪
                </button>

                <button onClick={playVideo}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: brandGrad, color: '#000', border: 'none',
                    cursor: 'pointer', fontSize: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isPlaying ? `0 0 20px ${brandGlow}` : 'none',
                  }}>
                  {isPlaying ? '⏸' : '▶'}
                </button>

                <button onClick={skipForward}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: `1px solid ${borderSoft}`, background: 'transparent',
                    color: textDim, cursor: 'pointer', fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = borderStrong; e.currentTarget.style.color = textPrimary }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.color = textDim }}>
                  ⏩
                </button>

                <span style={{
                  fontFamily: fonts.mono, fontSize: '10px', color: textDim,
                  minWidth: '40px', textAlign: 'center',
                }}>
                  {videoRef.current ? formatTime(videoRef.current.duration) : '0:45'}
                </span>
              </div>

              {/* Keyframe toggle */}
              <button onClick={() => setShowKeyframes(!showKeyframes)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '10px',
                  border: `1px solid ${showKeyframes ? brand : borderSoft}`,
                  background: showKeyframes ? brandDim : 'transparent',
                  color: showKeyframes ? brand : textDim,
                  cursor: 'pointer', fontFamily: fonts.mono,
                  transition: 'all 0.15s',
                }}>
                ⬥ Key
              </button>
            </div>
          </div>

          {/* Export status */}
          {exportStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              fontSize: '12px',
              color: exportStatus.includes('successfully') ? brand :
                    exportStatus.includes('failed') || exportStatus.includes('connect') ? '#ef4444' : textDim,
              fontFamily: fonts.body,
            }}>
              {exportStatus.includes('failed') || exportStatus.includes('connect') ? '⚠' : exportStatus.includes('successfully') ? '✓' : '⟳'}
              {' '}{exportStatus}
              {exportUrl && (
                <a href={exportUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: brand, textDecoration: 'underline', fontSize: '12px' }}>
                  View clip ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PROPERTIES PANEL */}
        <div style={{
          width: '280px', background: surface, borderLeft: `1px solid ${borderSoft}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Panel header */}
          <div style={{
            padding: '14px 18px', borderBottom: `1px solid ${borderSoft}`,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '18px', lineHeight: '1' }}>
              {tools.find(t => t.id === activeTool)?.icon}
            </span>
            <span style={{
              fontSize: '13px', fontWeight: '500', color: textSecondary,
              fontFamily: fonts.body,
            }}>
              {tools.find(t => t.id === activeTool)?.label}
            </span>
          </div>

          {/* Panel body */}
          <div style={{
            flex: 1, overflow: 'auto', padding: '16px 18px',
          }}>
            {renderPanelContent()}
          </div>

          {/* Panel footer - export */}
          <div style={{
            padding: '12px 16px', borderTop: `1px solid ${borderSoft}`,
          }}>
            <button onClick={handleExport} disabled={saving}
              style={{
                width: '100%', padding: '11px', borderRadius: '8px',
                border: 'none', background: brandGrad, color: '#000',
                fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontFamily: fonts.body,
                opacity: saving ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', transition: 'opacity 0.2s',
              }}>
              {saving ? '⏳' : '⬇'} {saving ? 'Exporting...' : 'Export clip'}
            </button>
          </div>
        </div>
      </div>

      {/* Style for animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: ${borderStrong};
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${brand};
          cursor: pointer;
          box-shadow: 0 0 8px ${brandGlow};
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${brand};
          cursor: pointer;
          border: none;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: ${borderStrong} transparent;
        }
        *::-webkit-scrollbar {
          width: 4px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: ${borderStrong};
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
