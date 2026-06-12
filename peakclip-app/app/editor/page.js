'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { brand, brandGrad, brandDim } from '../../lib/tokens'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function Editor() {
  const [clip, setClip] = useState(null)
  const [clipId, setClipId] = useState(null)
  const [user, setUser] = useState(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [subtitleStyle, setSubtitleStyle] = useState('bold-yellow')
  const [subtitlePosition, setSubtitlePosition] = useState('bottom')
  const [subtitleText, setSubtitleText] = useState('')
  const [watermark, setWatermark] = useState('')
  const [watermarkPosition, setWatermarkPosition] = useState('top-right')
  const [music, setMusic] = useState('none')
  const [musicVolume, setMusicVolume] = useState(30)
  const [saving, setSaving] = useState(false)
  const [activeTool, setActiveTool] = useState('trim')
  const [activeFilter, setActiveFilter] = useState('none')
  const [playheadPos, setPlayheadPos] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [exportStatus, setExportStatus] = useState('')
  const [exportUrl, setExportUrl] = useState('')
  const videoRef = useRef(null)
  const timelineRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setClipId(id)
      loadClip(id)
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user)
    })
  }, [])

  const loadClip = async (id) => {
    const { data } = await supabase.from('clips').select('*').eq('id', id).single()
    if (data) {
      setClip(data)
      setSubtitleText(data.title || '')
    }
  }

  const subtitleStyles = [
    { id: 'bold-yellow', label: 'Bold Yellow', preview: { color: '#FFD700', fontWeight: 'bold', fontSize: '14px', textShadow: '2px 2px 4px #000' } },
    { id: 'white-outline', label: 'Outline', preview: { color: '#fff', fontWeight: 'bold', fontSize: '14px', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' } },
    { id: 'neon-green', label: 'Neon', preview: { color: '#00ff88', fontWeight: 'bold', fontSize: '14px', textShadow: '0 0 8px #00ff88' } },
    { id: 'red-fire', label: 'Fire', preview: { color: '#ff4444', fontWeight: 'bold', fontSize: '14px', textShadow: '0 0 8px #ff0000' } },
    { id: 'minimal-white', label: 'Minimal', preview: { color: '#fff', fontWeight: '400', fontSize: '13px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' } },
    { id: 'tiktok-style', label: 'TikTok', preview: { color: '#fff', fontWeight: '900', fontSize: '14px', textShadow: '2px 2px 0 #fe2c55' } },
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
  ]

  const filters = [
    { id: 'none', label: 'Original', style: {} },
    { id: 'vivid', label: 'Vivid', style: { filter: 'saturate(1.5) contrast(1.1)' } },
    { id: 'cinema', label: 'Cinema', style: { filter: 'contrast(1.2) brightness(0.9) sepia(0.2)' } },
    { id: 'bw', label: 'B&W', style: { filter: 'grayscale(1)' } },
    { id: 'warm', label: 'Warm', style: { filter: 'sepia(0.4) saturate(1.3)' } },
    { id: 'cool', label: 'Cool', style: { filter: 'hue-rotate(30deg) saturate(0.9)' } },
  ]

  const playVideo = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      cancelAnimationFrame(animRef.current)
      setIsPlaying(false)
    } else {
      videoRef.current.play()
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

  const handleExport = async () => {
    if (!clipId || !user) return
    setSaving(true)
    setExportStatus('Processing video with AI...')
    setExportUrl('')

    try {
      const response = await fetch(`${BACKEND_URL}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipId,
          user_id: user.id,
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
        setExportStatus('✅ Clip exported successfully!')
        setExportUrl(data.video_url)
      } else {
        const err = await response.text()
        setExportStatus(`❌ Export failed: ${err.slice(0, 100)}`)
      }
    } catch {
      setExportStatus('❌ Could not connect to export server')
    }

    setSaving(false)
  }

  const selectedFilter = filters.find(f => f.id === activeFilter)?.style || {}

  return (
    <div className="editor-layout">
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button onClick={() => window.location.href = '/dashboard'} className="editor-back-btn" aria-label="Back to dashboard">←</button>
          <span className="editor-brand" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '3px', color: brand }}>
            PEAKCLIP
          </span>
          <span className="editor-separator">|</span>
          <span className="editor-filename">{clip?.title?.slice(0, 40) || 'Editor'}</span>
          {clip?.video_url && (
            <a href={clip.video_url} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: '12px', fontSize: '11px', color: brand, textDecoration: 'none' }}>
              Source ↗
            </a>
          )}
        </div>
        <div className="editor-topbar-right">
          <button className="editor-preview-btn" onClick={playVideo}>
            {isPlaying ? '⏸ Pause' : '▶ Preview'}
          </button>
          <button onClick={handleExport} disabled={saving} className="editor-export-btn">
            {saving ? '⏳ Exporting...' : '⬇ Export'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-toolbar">
          {tools.map(t => (
            <div
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={`editor-tool${activeTool === t.id ? ' active' : ''}`}
              role="tab"
              aria-selected={activeTool === t.id}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setActiveTool(t.id) }}
            >
              <div className="editor-tool-icon">{t.icon}</div>
              <div className="editor-tool-label">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="editor-canvas">
          <div className="editor-phone">
            {clip?.video_url ? (
              <video
                ref={videoRef}
                src={clip.video_url}
                style={{ width: '100%', height: '100%', objectFit: 'cover', ...selectedFilter }}
                onEnded={() => setIsPlaying(false)}
              />
            ) : (
              <div className="editor-phone-placeholder">
                <div className="editor-phone-placeholder-icon">🎬</div>
                <div className="editor-phone-placeholder-text">Clip preview</div>
              </div>
            )}

            {clip?.video_url && subtitleText && subtitleStyle !== 'none' && (
              <div className="editor-subtitle-overlay" style={{
                [subtitlePosition === 'bottom' ? 'bottom' : subtitlePosition === 'top' ? 'top' : 'top']: subtitlePosition === 'middle' ? '45%' : '16px',
                transform: 'translateX(-50%)',
                ...subtitleStyles.find(s => s.id === subtitleStyle)?.preview
              }}>
                {subtitleText}
              </div>
            )}

            {watermark && clip?.video_url && (
              <div className="editor-watermark" style={{
                ...(watermarkPosition === 'top-right' ? { top: '10px', right: '10px' } :
                   watermarkPosition === 'top-left' ? { top: '10px', left: '10px' } :
                   watermarkPosition === 'bottom-right' ? { bottom: '36px', right: '10px' } :
                   { bottom: '36px', left: '10px' }),
                fontFamily: "'Poppins', sans-serif", fontSize: '11px'
              }}>
                {watermark}
              </div>
            )}
          </div>

          <div className="editor-timeline-wrap">
            <div
              className="editor-timeline-track"
              ref={timelineRef}
              onClick={handleTimelineClick}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute', left: `${i * 2.5}%`, bottom: '20%',
                  width: '1.5%', height: `${20 + Math.sin(i * 0.8) * 15}%`,
                  background: `rgba(255,255,255,${0.04 + Math.sin(i * 0.8) * 0.04})`,
                  borderRadius: '1px'
                }} />
              ))}
              <div className="editor-timeline-selection" style={{
                left: `${trimStart}%`, width: `${trimEnd - trimStart}%`,
                background: brandDim,
              }} />
              <div className="editor-timeline-playhead" style={{ left: `${playheadPos}%` }} />

              {/* Trim handles */}
              <div
                style={{
                  position: 'absolute', left: `${trimStart}%`, top: 0, bottom: 0,
                  width: '4px', background: brand, zIndex: 5, cursor: 'ew-resize'
                }}
                onMouseDown={(e) => {
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
              />
              <div
                style={{
                  position: 'absolute', left: `${trimEnd}%`, top: 0, bottom: 0,
                  width: '4px', background: brand, zIndex: 5, cursor: 'ew-resize'
                }}
                onMouseDown={(e) => {
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
              />
            </div>
            <div className="editor-timeline-info">
              <span>0:00</span>
              <span className="editor-timeline-duration" style={{ color: brand }}>
                {Math.round((trimEnd - trimStart) * 0.45)}s selected
              </span>
              <span>0:45</span>
            </div>
          </div>

          {exportStatus && (
            <div style={{
              fontSize: '12px', color: exportStatus.includes('✅') ? brand : exportStatus.includes('❌') ? '#ef4444' : '#999',
              fontFamily: "'Poppins', sans-serif", marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              {exportStatus}
              {exportUrl && (
                <a href={exportUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: brand, textDecoration: 'underline', fontSize: '12px' }}>
                  View exported clip ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="editor-panel">
          <div className="editor-panel-header">
            <div className="editor-panel-title">
              {tools.find(t => t.id === activeTool)?.icon} {tools.find(t => t.id === activeTool)?.label}
            </div>
          </div>

          <div className="editor-panel-body">
            {activeTool === 'trim' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div className="editor-slider-row">
                    <span className="editor-slider-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Start</span>
                    <span className="editor-slider-value" style={{ color: brand }}>{trimStart}%</span>
                  </div>
                  <input type="range" min="0" max={trimEnd - 5} value={trimStart}
                    onChange={e => setTrimStart(Number(e.target.value))}
                    className="editor-slider" />
                </div>
                <div>
                  <div className="editor-slider-row">
                    <span className="editor-slider-label" style={{ fontFamily: "'Poppins', sans-serif" }}>End</span>
                    <span className="editor-slider-value" style={{ color: brand }}>{trimEnd}%</span>
                  </div>
                  <input type="range" min={trimStart + 5} max="100" value={trimEnd}
                    onChange={e => setTrimEnd(Number(e.target.value))}
                    className="editor-slider" />
                </div>
                <div className="editor-duration-box">
                  Duration: <span className="editor-duration-value">{Math.round((trimEnd - trimStart) * 0.45)}s</span>
                </div>
              </div>
            )}

            {activeTool === 'subtitles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Text</span>
                  <input
                    type="text" placeholder="Enter subtitle text..."
                    value={subtitleText}
                    onChange={e => setSubtitleText(e.target.value)}
                    className="editor-input"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
                <div>
                  <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Style</span>
                  <div className="editor-grid-2">
                    {subtitleStyles.map(s => (
                      <div key={s.id} onClick={() => setSubtitleStyle(s.id)}
                        className={`editor-option${subtitleStyle === s.id ? ' active' : ''}`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}>
                        <div className="editor-option-preview" style={{ ...s.preview, fontSize: '11px', marginBottom: '5px' }}>Aa</div>
                        <div className="editor-option-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Position</span>
                  <div className="editor-grid-3">
                    {[{ id: 'top', label: '⬆ Top' }, { id: 'middle', label: '↔ Mid' }, { id: 'bottom', label: '⬇ Bot' }].map(p => (
                      <div key={p.id} onClick={() => setSubtitlePosition(p.id)}
                        className={`editor-option${subtitlePosition === p.id ? ' active' : ''}`}
                        style={{ flex: 1, fontFamily: "'Poppins', sans-serif" }}>
                        <div className="editor-option-label">{p.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'watermark' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Text / Handle</span>
                  <input
                    type="text" placeholder="@your_handle"
                    value={watermark}
                    onChange={e => setWatermark(e.target.value)}
                    className="editor-input"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
                <div>
                  <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Position</span>
                  <div className="editor-grid-2">
                    {[
                      { id: 'top-left', label: '↖ Top Left' },
                      { id: 'top-right', label: '↗ Top Right' },
                      { id: 'bottom-left', label: '↙ Bot Left' },
                      { id: 'bottom-right', label: '↘ Bot Right' },
                    ].map(p => (
                      <div key={p.id} onClick={() => setWatermarkPosition(p.id)}
                        className={`editor-option${watermarkPosition === p.id ? ' active' : ''}`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}>
                        <div className="editor-option-label">{p.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'music' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Audio track</span>
                <div className="editor-music-list">
                  {musicTracks.map(t => (
                    <div key={t.id} onClick={() => setMusic(t.id)}
                      className={`editor-music-item${music === t.id ? ' active' : ''}`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="editor-music-label">{t.icon} {t.label}</span>
                      {music === t.id && <span className="editor-music-check" style={{ color: brand }}>▶</span>}
                    </div>
                  ))}
                </div>
                {music !== 'none' && (
                  <div style={{ marginTop: '8px' }}>
                    <div className="editor-slider-row">
                      <span className="editor-slider-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Volume</span>
                      <span className="editor-slider-value" style={{ color: brand }}>{musicVolume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={musicVolume}
                      onChange={e => setMusicVolume(Number(e.target.value))}
                      className="editor-slider" />
                  </div>
                )}
              </div>
            )}

            {activeTool === 'filter' && (
              <div>
                <span className="editor-section-label" style={{ fontFamily: "'Poppins', sans-serif" }}>Visual filters</span>
                <div className="editor-grid-2">
                  {filters.map(f => (
                    <div key={f.id} onClick={() => setActiveFilter(f.id)}
                      className={`editor-option${activeFilter === f.id ? ' active' : ''}`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <div style={{
                        height: '60px',
                        background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                        ...f.style,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                        borderRadius: '8px'
                      }}>
                        🎬
                      </div>
                      <div className="editor-option-label">{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="editor-panel-footer">
            <button onClick={handleExport} disabled={saving} className="editor-panel-footer-btn">
              {saving ? '⏳ Exporting...' : '⬇ Export clip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
