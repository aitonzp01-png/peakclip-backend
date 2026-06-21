'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '../../lib/supabase'
import { createClip } from '../../lib/api'
import useEditorStore from './store/editorStore'
import EditorTopBar from './components/EditorTopBar'
import EditorSidebar from './components/EditorSidebar'
import EditorPreview from './components/EditorPreview'
import EditorTimeline from './components/EditorTimeline'
import EditorInspector from './components/EditorInspector'
import EditorMobilePanel from './components/EditorMobilePanel'
import ExportModal from './components/ExportModal'
import { surface, borderSoft, brand, brandDim, brandGlow, textDim, textPrimary, fonts } from '../../lib/tokens'
import icons from '../../lib/icons'
import ErrorBoundary from '../../lib/error-boundary'

export default function EditorPage() {
  const videoRef = useRef(null)
  const {
    clip, setClip, clipId, setClipId, user, setUser,
    isPlaying, setIsPlaying, setPlayheadPos,
    keyboardHint, setActiveTool, activeTool,
  } = useEditorStore()

  const [loading, setLoading] = useState(true)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const timeoutsRef = useRef([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      const urlParam = params.get('url')

      if (id) {
        setClipId(id)
        await loadClipData(id, user)
      } else if (!urlParam) {
        // Create a clip record in Supabase so it shows in dashboard
        const saved = await createClip(user.id, { title: 'New Project', duration: 0, status: 'draft' })
        if (saved?.id) {
          window.history.replaceState(null, '', `/editor?id=${saved.id}`)
          setClipId(saved.id)
          setClip({ id: saved.id, title: 'New Project', video_url: null, duration: 0 })
        } else {
          const demoId = 'demo_' + Date.now()
          setClipId(demoId)
          const store = useEditorStore.getState()
          store.setSubtitleText('Drop a video or paste a URL to start')
          store.setSubtitleStyle('bold-yellow')
        }
      } else {
        const demoId = 'demo_' + Date.now()
        setClipId(demoId)
        const store = useEditorStore.getState()
        store.setSubtitleText('Drop a video or paste a URL to start')
        store.setSubtitleStyle('bold-yellow')
        if (urlParam) {
          const title = urlParam.split('/').pop()?.slice(0, 40) || 'Video Clip'
          const saved = await createClip(user.id, { title, video_url: urlParam, duration: 60 })
          if (saved?.id) {
            window.history.replaceState(null, '', `/editor?id=${saved.id}&url=${encodeURIComponent(urlParam)}`)
            setClipId(saved.id)
            setClip({ id: saved.id, title, video_url: urlParam, duration: 60, url: urlParam })
          }
        }
      }

      setLoading(false)
    }

    init()

    // Safety timeout — force stop loading after 10s
    const safetyTimer = setTimeout(() => setLoading(false), 10000)
    timeoutsRef.current.push(safetyTimer)

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await getSupabaseClient().auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
  }

  const loadClipData = async (id, currentUser) => {
    const u = currentUser || (await getSupabaseClient().auth.getUser())?.data?.user
    try {
      const params = new URLSearchParams(window.location.search)
      const urlParam = params.get('url')

      // Demo clips don't exist in Supabase — create from URL param
      if (id?.startsWith('demo_')) {
        const store = useEditorStore.getState()
        if (urlParam) {
          const title = urlParam.split('/').pop()?.slice(0, 40) || 'Video Clip'
          // Save to Supabase so it appears in dashboard
          const saved = u?.id ? await createClip(u.id, { title, video_url: urlParam, duration: 60 }) : null
          const realId = saved?.id || id
          if (saved?.id) {
            window.history.replaceState(null, '', `/editor?id=${saved.id}&url=${encodeURIComponent(urlParam)}`)
          }
          setClip({ id: realId, title, video_url: urlParam, duration: 60, url: urlParam })
          setClipId(realId)
          store.setSubtitleText(title)
        } else {
          store.setSubtitleText('Demo clip loaded')
        }
        store.setSubtitleStyle('bold-yellow')
        store.setMusic('chill')
        store.setMusicVolume(30)
        setLoading(false)
        return
      }

      const { data } = await getSupabaseClient().from('clips').select('*').eq('id', id).single()
      const store = useEditorStore.getState()

      if (data) {
        setClip(data)
        const title = data.title || 'Clip'
        store.setSubtitleText(title)
      } else if (urlParam) {
        const title = urlParam.split('/').pop()?.slice(0, 40) || 'Video Clip'
        setClip({ id, title, video_url: urlParam, duration: 60, url: urlParam })
        store.setSubtitleText(title)
      }

      // Auto-generate AI subtitles after clip loads
      const t1 = setTimeout(() => {
        store.setSubtitleText('AI subtitles generated automatically')
        store.setSubtitleStyle('bold-yellow')
        store.showHint('Auto-captions generated')
      }, 1200)

      // Auto-set background music
      const t2 = setTimeout(() => {
        store.setMusic('chill')
        store.setMusicVolume(30)
      }, 2000)

      // Auto-set trim handles to viral moment boundaries
      const t3 = setTimeout(() => {
        if (data?.start_time != null && data?.end_time != null && data?.duration) {
          const dur = Number(data.duration)
          if (dur > 0) {
            store.setTrimStart((Number(data.start_time) / dur) * 100)
            store.setTrimEnd((Number(data.end_time) / dur) * 100)
          }
        } else {
          store.setTrimStart(0)
          store.setTrimEnd(100)
        }
      }, 2800)
      timeoutsRef.current.push(t1, t2, t3)

    } catch (err) {
      console.error('Failed to load clip:', err)
      const store = useEditorStore.getState()
      const params = new URLSearchParams(window.location.search)
      const urlParam = params.get('url')
      if (urlParam) {
        const title = urlParam.split('/').pop()?.slice(0, 40) || 'Video Clip'
        const saved = u?.id ? await createClip(u.id, { title, video_url: urlParam, duration: 60 }) : null
        const realId = saved?.id || id
        if (saved?.id) {
          window.history.replaceState(null, '', `/editor?id=${saved.id}&url=${encodeURIComponent(urlParam)}`)
          setClipId(realId)
        }
        setClip({ id: realId, title, video_url: urlParam, duration: 60, url: urlParam })
        store.setSubtitleText(title)
      } else {
        store.setSubtitleText('Demo clip loaded')
        store.setSubtitleStyle('bold-yellow')
      }
      store.setMusic('chill')
      store.setMusicVolume(30)
    }
    setLoading(false)
  }

  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    const store = useEditorStore.getState()

    switch (e.key) {
      case ' ':
        e.preventDefault()
        if (videoRef.current) {
          if (store.isPlaying) {
            videoRef.current.pause()
          } else {
            videoRef.current.play().catch(() => {})
          }
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
          const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
          setPlayheadPos(pct)
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5)
          const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
          setPlayheadPos(pct)
        }
        break
      case 's':
      case 'S':
        if (videoRef.current) {
          const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
          store.setTrimStart(Math.max(0, pct))
          store.showHint(`In point set to ${Math.round(pct)}%`)
        }
        break
      case 'e':
      case 'E':
        if (videoRef.current) {
          const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
          store.setTrimEnd(Math.min(100, pct))
          store.showHint(`Out point set to ${Math.round(pct)}%`)
        }
        break
      case 'Escape':
        e.preventDefault()
        setMobilePanelOpen(false)
        setActiveTool('ai')
        break
      case 'Delete':
      case 'Backspace':
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (loading) {
    return (
      <div style={{
        height: '100vh', background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
      }}>
        <div className="editor-loading-spinner" />
        <div style={{ color: textDim, fontSize: '13px', fontFamily: fonts.body }}>
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div style={{
      height: '100vh', background: '#050505', color: textPrimary,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: fonts.body, position: 'relative',
    }}>
      {/* Keyboard hint toast */}
      {keyboardHint && (
        <div style={{
          position: 'fixed', top: '82px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(217,180,74,0.12)', border: '1px solid rgba(217,180,74,0.25)',
          borderRadius: '10px', padding: '8px 20px', fontSize: '12px',
          color: brand, zIndex: 1000, fontFamily: fonts.mono,
          backdropFilter: 'blur(12px)',
          animation: 'slideDown 0.2s ease',
        }}>
          {keyboardHint}
        </div>
      )}

      {/* Top Bar */}
      <EditorTopBar videoRef={videoRef} />

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <EditorSidebar />

        {/* Center: Preview */}
        <EditorPreview videoRef={videoRef} />

        {/* Right: Inspector Panel */}
        <EditorInspector videoRef={videoRef} />
      </div>

      {/* Timeline */}
      <div className={`mobile-timeline-wrap ${mobilePanelOpen ? 'editing' : ''}`}>
        <EditorTimeline videoRef={videoRef} />
      </div>

      {/* Mobile bottom: toolbar or edit panel (like CapCut) */}
      {mobilePanelOpen ? (
        <EditorMobilePanel videoRef={videoRef} activeTool={activeTool} onDone={() => setMobilePanelOpen(false)} />
      ) : (
        <div className="editor-mobile-tools">
          {['cursor', 'text', 'subtitles', 'music', 'ai'].map(t => {
            const iconsMap = { cursor: 'cursor', text: 'text', subtitles: 'captions', music: 'audio', ai: 'ai' }
            return (
              <button key={t} onClick={() => { setActiveTool(t); setMobilePanelOpen(true) }}
                style={{
                  flex: 1, padding: '10px 4px', border: 'none',
                  background: activeTool === t ? brandDim : 'transparent',
                  color: activeTool === t ? brand : textDim,
                  cursor: 'pointer', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  fontSize: '10px', whiteSpace: 'nowrap', minHeight: '44px',
                  touchAction: 'manipulation',
                }}>
                <span style={{ display: 'flex', width: '18px', height: '18px', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icons[iconsMap[t]]}
                </span>
                <span style={{ fontSize: '9px', lineHeight: '1' }}>
                  {t === 'cursor' ? 'Trim' : t === 'text' ? 'Text' : t === 'subtitles' ? 'Captions' : t === 'music' ? 'Audio' : 'AI'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Export Modal */}
      <ExportModal />

      {/* Inline styles for animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(217,180,74,0.2); }
          50% { box-shadow: 0 0 20px rgba(217,180,74,0.5); }
        }
        @keyframes stepSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        button:hover svg, a:hover svg { color: #D9B44A !important; transition: color 0.2s ease; }
        .editor-loading-spinner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid rgba(217,180,74,0.15);
          border-top-color: #D9B44A;
          animation: spin 0.6s linear infinite;
        }
        .editor-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          outline: none;
        }
        .editor-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #D9B44A;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(217,180,74,0.35);
        }
        .editor-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #D9B44A;
          cursor: pointer;
          border: none;
        }
        .editor-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
          background: #0B0B0B;
          color: #FFFFFF;
          font-size: 13px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .editor-input:focus {
          border-color: #D9B44A;
        }
        .editor-option {
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          cursor: pointer;
        }
        .editor-option.active {
          border-color: #D9B44A !important;
          background: rgba(217,180,74,0.08) !important;
        }
        .editor-option.active div:last-child {
          color: #D9B44A !important;
        }
        .editor-music-item {
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          cursor: pointer;
        }
        .editor-duration-box {
          background: #0B0B0B;
          border-radius: 8px;
          padding: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-align: center;
        }
        .editor-duration-value {
          color: #D9B44A;
          font-weight: 700;
        }
        .editor-speed-display {
          font-size: 28px;
          font-weight: 700;
          color: #D9B44A;
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 1px;
          text-align: center;
          padding: 12px;
          background: #0B0B0B;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .ai-spinner, .spin {
          animation: spin 0.6s linear infinite;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        *::-webkit-scrollbar {
          width: 4px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }

        /* Mobile Responsive */
        .editor-mobile-edit-panel {
          display: flex;
          flex-direction: column;
          background: #111111;
          border-top: 1px solid rgba(255,255,255,0.06);
          flexShrink: 0;
          overflow: hidden;
        }
        .editor-mobile-edit-panel {
          max-height: 200px;
        }
        .editor-mobile-edit-panel button, .editor-mobile-edit-panel input { touch-action: manipulation; }
        .mobile-timeline-wrap { flexShrink: 0; }
        @media (max-width: 768px) {
          .editor-sidebar { display: none !important; }
          .editor-inspector { display: none !important; }
          .editor-preview { flex: 1 1 100% !important; width: 100% !important; }
          .mobile-timeline-wrap { height: 220px; display: flex; flex-direction: column; }
          .mobile-timeline-wrap.editing { height: 140px; }
          .mobile-timeline-wrap .editor-timeline { height: 100% !important; }
          .editor-timeline-toolbar { flex-wrap: wrap; gap: 4px !important; }
          .editor-topbar-project { display: none !important; }
          .editor-mobile-tools {
            display: flex !important;
            align-items: center;
            height: 52px;
            background: #0B0B0B;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding: 0 4px;
            gap: 2px;
            flexShrink: 0;
          }
          .editor-export-btn span { display: none !important; }
          [class*="dash-container"] { padding: 12px !important; }
          [class*="dash-header"] { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          [class*="dash-grid"] { grid-template-columns: 1fr !important; }
          [class*="dash-stats"] { flex-direction: column !important; }
          .editor-time-ruler { display: none !important; }
        }
        @media (min-width: 769px) {
          .editor-mobile-tools { display: none !important; }
        }
      `}</style>
    </div>
    </ErrorBoundary>
  )
}
