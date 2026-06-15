'use client'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import { formatTime, aspectRatios } from '../../../lib/utils'
import useEditorStore from '../store/editorStore'
import icons from '../../../lib/icons'

export default function EditorTopBar({ videoRef }) {
  const {
    clip, isPlaying, volume, playbackSpeed,
    aspectRatio, saving, exportStatus, user,
    setVolume, setPlaybackSpeed, setIsPlaying,
    setAspectRatio, setShowExportModal, setSaving,
    setExportStatus, setExportUrl, setKeyboardHint, showHint,
  } = useEditorStore()

  const handleExport = async () => {
    if (!clip?.id || !user) return
    setSaving(true)
    setExportStatus('Processing export...')
    setExportUrl('')

    const { getSupabaseClient } = await import('../../../lib/supabase')
    const { data: { session } } = await getSupabaseClient().auth.getSession()

    try {
      const store = useEditorStore.getState()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          clip_id: clip.id,
          video_url: clip.video_url || '',
          trim_start: store.trimStart,
          trim_end: store.trimEnd,
          subtitle_text: store.subtitleText,
          subtitle_style: store.subtitleStyle,
          subtitle_position: store.subtitlePosition,
          watermark_text: store.watermark,
          watermark_position: store.watermarkPosition,
          music_track: store.music,
          music_volume: store.musicVolume,
          filter_style: store.activeFilter,
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
      setExportStatus('Export server unavailable. Try again later.')
    }
    setSaving(false)
  }

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    if (videoRef?.current) videoRef.current.volume = val / 100
  }

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
    if (videoRef?.current) videoRef.current.playbackRate = speed
  }

  return (
    <div style={{
      height: '72px', background: 'rgba(11,11,11,0.95)', borderBottom: `1px solid ${borderSoft}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0, backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
        }} onClick={() => window.location.href = '/dashboard'}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#gold-grad)" />
            <path d="M14 6L14 22M6 14L22 14" stroke="#050505" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="gold-grad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#D9B44A" />
                <stop offset="1" stopColor="#E8C766" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{
            color: brand, fontWeight: '800', fontSize: '20px',
            letterSpacing: '4px', fontFamily: fonts.display,
          }}>PEAKCLIP</span>
        </div>
        <div style={{ width: '1px', height: '28px', background: borderSoft }} />
        <div className="editor-topbar-project" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: textSecondary, fontFamily: fonts.body, fontWeight: '500' }}>
            {clip?.title?.slice(0, 30) || 'New Project'}
          </div>
          {clip?.video_url && (
            <a href={clip.video_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: brand, textDecoration: 'none', opacity: 0.7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'middle' }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Source
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Aspect ratio selector */}
        <div style={{ display: 'flex', gap: '4px', background: bgSecondary, borderRadius: '8px', padding: '3px', border: `1px solid ${borderSoft}` }}>
          {aspectRatios.map(a => (
            <button key={a.id} onClick={() => setAspectRatio(a.id)}
              style={{
                padding: '5px 10px', borderRadius: '6px', border: 'none',
                background: aspectRatio === a.id ? brandDim : 'transparent',
                color: aspectRatio === a.id ? brand : textDim,
                cursor: 'pointer', fontSize: '11px', fontFamily: fonts.body,
                fontWeight: aspectRatio === a.id ? '600' : '400',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px',
              }}>
              <span style={{ display: 'flex' }}>{icons[a.icon]}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <button style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px' }}
          onMouseEnter={e => e.currentTarget.style.background = bgSecondary}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => showHint('Undo (Ctrl+Z)')}>{icons.undo}</button>
        <button style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px' }}
          onMouseEnter={e => e.currentTarget.style.background = bgSecondary}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => showHint('Redo (Ctrl+Shift+Z)')}>{icons.redo}</button>

        <div style={{ width: '1px', height: '24px', background: borderSoft }} />

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: textDim, display: 'flex' }}>{icons.audio}</span>
          <input type="range" min="0" max="100" value={volume}
            onChange={handleVolumeChange}
            style={{ width: '56px', accentColor: brand, height: '3px' }} />
        </div>

        {/* Speed */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {[0.5, 1, 1.5, 2].map(s => (
            <button key={s} onClick={() => handleSpeedChange(s)}
              style={{
                padding: '4px 8px', borderRadius: '5px', cursor: 'pointer',
                border: `1px solid ${playbackSpeed === s ? brand : borderSoft}`,
                background: playbackSpeed === s ? brandDim : 'transparent',
                color: playbackSpeed === s ? brand : textDim,
                fontSize: '10px', fontFamily: fonts.mono, fontWeight: '600',
                transition: 'all 0.15s',
              }}>
              {s}x
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: borderSoft }} />

        {/* Export button */}
        <button onClick={handleExport} disabled={saving}
          style={{
            background: brandGrad, color: '#000', border: 'none',
            borderRadius: '10px', padding: '10px 24px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px',
            fontFamily: fonts.body, opacity: saving ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s', letterSpacing: '0.5px',
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = `0 0 24px ${brandGlow}` }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L8 11M8 11L4 7M8 11L12 7M2 14H14" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {saving ? 'Exporting...' : 'Export'}
        </button>

        {/* Profile */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: brandGrad, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '13px', fontWeight: '700',
          color: '#000', cursor: 'pointer',
          border: `2px solid ${brandDim}`,
        }}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  )
}
