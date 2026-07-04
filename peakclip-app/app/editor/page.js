'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '../../lib/supabase'
import { createClip } from '../../lib/api'
import useEditorStore from './store/editorStore'
import EditorTopBar from './components/EditorTopBar'
import EditorPreviewCanvas from './components/EditorPreviewCanvas'
import EditorTranscript from './components/EditorTranscript'
import EditorTimelineNew from './components/EditorTimelineNew'
import EditorSubtitlesPanel from './components/EditorSubtitlesPanel'
import EditorTextPanel from './components/EditorTextPanel'
import EditorAudioPanel from './components/EditorAudioPanel'
import EditorTransitionsPanel from './components/EditorTransitionsPanel'
import EditorAIEnhancePanel from './components/EditorAIEnhancePanel'
import EditorBRollPanel from './components/EditorBRollPanel'
import EditorBrandPanel from './components/EditorBrandPanel'
import EditorMultimediaPanel from './components/EditorMultimediaPanel'
import EditorToolsBar from './components/EditorToolsBar'
import EditorExportModal from './components/EditorExportModal'
import { bgPrimary, bgSecondary, surface, brand, brandDim, brandGlow, borderSoft, borderStrong, textPrimary, textSecondary, textDim } from '../../lib/editor-tokens'

const rightTabs = [
  { id: 'subtitles', label: 'Subt&iacute;tulos', comp: EditorSubtitlesPanel },
  { id: 'text', label: 'Texto', comp: EditorTextPanel },
  { id: 'audio', label: 'Audio', comp: EditorAudioPanel },
  { id: 'transitions', label: 'Transiciones', comp: EditorTransitionsPanel },
  { id: 'ai', label: 'IA', comp: EditorAIEnhancePanel },
  { id: 'broll', label: 'B-Roll', comp: EditorBRollPanel },
  { id: 'brand', label: 'Marca', comp: EditorBrandPanel },
  { id: 'multimedia', label: 'Multimedia', comp: EditorMultimediaPanel },
]

export default function EditorPage() {
  const videoRef = useRef(null)
  const timeoutsRef = useRef([])

  const {
    clip, setClip, clipId, setClipId, user, setUser,
    isPlaying, setIsPlaying, setPlayheadPos,
    keyboardHint, setActiveTool, activeTool, toolsPanelOpen, setToolsPanelOpen,
    loading, setLoading, setKeyboardHint,
    timelineHidden,
  } = useEditorStore()

  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightTab, setRightTab] = useState('subtitles')
  const [activeToolLoc, setActiveToolLoc] = useState(null)
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isMobile = windowWidth > 0 && windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth <= 1024

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
        } else {
          store.setSubtitleText('')
        }
        setLoading(false)
        return
      }

      const { data } = await getSupabaseClient().from('clips').select('*').eq('id', id).single()
      const store = useEditorStore.getState()

      if (data) {
        setClip(data)
        if (data.subtitles_srt) {
          store.loadSubtitlesFromSRT(data.subtitles_srt)
        } else {
          store.setSubtitles([])
        }
      } else if (urlParam) {
        const title = urlParam.split('/').pop()?.slice(0, 40) || 'Video Clip'
        setClip({ id, title, video_url: urlParam, duration: 60, url: urlParam })
        store.setSubtitleText('')
      }

      // Apply trim from clip data: for processed clips, use full 0-100%
      store.setTrimStart(0)
      store.setTrimEnd(100)

      // Set music based on clip mood if available
      if (data?.mood) {
        store.setMusic(data.mood)
        store.setMusicVolume(30)
      } else {
        store.setMusic('none')
        store.setMusicVolume(30)
      }

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
        store.setSubtitleText('')
      } else {
        store.setSubtitleText('')
        store.setSubtitleStyle('bold-yellow')
      }
      store.setMusic('chill')
      store.setMusicVolume(30)
    }
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      try {
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
        const saved = await createClip(user.id, { title: 'New Project', duration: 0, status: 'draft' })
        if (saved?.id) {
          window.history.replaceState(null, '', `/editor?id=${saved.id}`)
          setClipId(saved.id)
          setClip({ id: saved.id, title: 'New Project', video_url: null, duration: 0 })
        } else {
          const demoId = 'demo_' + Date.now()
          setClipId(demoId)
        }
      } else {
        const demoId = 'demo_' + Date.now()
        setClipId(demoId)
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
      } catch (err) {
        console.error('Editor init error:', err)
        setLoading(false)
      }
    }

    init()

    const safetyTimer = setTimeout(() => setLoading(false), 10000)
    timeoutsRef.current.push(safetyTimer)

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    const store = useEditorStore.getState()

    switch (e.key) {
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const store = useEditorStore.getState()
          if (e.shiftKey) store.redo()
          else store.undo()
          return
        }
        break
      case ' ':
        e.preventDefault()
        if (videoRef.current) {
          if (store.isPlaying) videoRef.current.pause()
          else videoRef.current.play().catch(() => {})
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
      case 'Escape':
        e.preventDefault()
        setToolsPanelOpen(false)
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
        height: '100vh', background: bgPrimary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${brandDim}`, borderTopColor: brand, animation: 'spin 0.6s linear infinite' }} />
        <div style={{ color: textDim, fontSize: 13, fontWeight: 500 }}>Cargando editor...</div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{
        height: '100vh', background: bgPrimary, color: textPrimary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center',
      }}>
        <div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="1.5" style={{ marginBottom: 16 }}>
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Peakclip Editor</h2>
          <p style={{ color: textDim, fontSize: 13, lineHeight: 1.5 }}>
            El editor est&aacute; optimizado para desktop.<br />
            Abre esta p&aacute;gina en un ordenador para editarlo.
          </p>
        </div>
      </div>
    )
  }

  const RightPanel = rightTabs.find(t => t.id === rightTab)?.comp || EditorSubtitlesPanel
  const rightPanelWidth = toolsPanelOpen ? (isTablet ? 240 : 280) : 0

  return (
    <div style={{
      height: '100vh', background: bgPrimary, color: textPrimary,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
        input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: rgba(0,0,0,0.08); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${brand}; cursor: pointer; box-shadow: 0 0 8px ${brandGlow}; }
        input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${brand}; cursor: pointer; border: none; }
        input[type="color"] { -webkit-appearance: none; border: none; border-radius: 4px; cursor: pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
        select { -webkit-appearance: none; appearance: none; }
      `}</style>

      {/* Keyboard hint */}
      {keyboardHint && (
        <div style={{
          position: 'fixed', top: 66, left: '50%', transform: 'translateX(-50%)',
          background: bgSecondary, border: `1px solid ${borderSoft}`,
          borderRadius: 10, padding: '8px 20px', fontSize: 12,
          color: brand, zIndex: 1000,
          backdropFilter: 'blur(12px)', pointerEvents: 'none',
          animation: 'slideDown 0.2s ease',
        }}>
          {keyboardHint}
        </div>
      )}

      {/* Top Bar - 56px */}
      <div style={{ height: 56, flexShrink: 0 }}>
        <EditorTopBar videoRef={videoRef} />
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left Panel - Transcript (320px) */}
        {leftPanelOpen && (
          <div style={{
            width: isTablet ? 260 : 320, flexShrink: 0,
            background: bgSecondary, borderRight: `1px solid ${borderSoft}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderBottom: `1px solid ${borderSoft}`,
            }}>
              <span style={{ color: textDim, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>TRANSCRIPCI&Oacute;N</span>
              <button onClick={() => setLeftPanelOpen(false)}
                style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer', padding: 4, display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <EditorTranscript />
            </div>
          </div>
        )}

        {/* Left toggle button when closed */}
        {!leftPanelOpen && (
          <button onClick={() => setLeftPanelOpen(true)}
            style={{
              width: 24, flexShrink: 0, cursor: 'pointer',
              background: bgSecondary, border: 'none', color: textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRight: `1px solid ${borderSoft}`,
            }}
            title="Abrir transcripci&oacute;n"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}

        {/* Center: Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <EditorPreviewCanvas videoRef={videoRef} />
        </div>

        {/* Right Panel (280px) - Tabs */}
        <div style={{
          width: rightPanelWidth, flexShrink: 0, overflow: 'hidden',
          transition: 'width 0.2s', background: bgSecondary,
          borderLeft: rightPanelWidth > 0 ? `1px solid ${borderSoft}` : 'none',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Tab bar */}
          {(rightPanelWidth > 0 || toolsPanelOpen) && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 0,
              padding: '6px 6px 0', borderBottom: `1px solid ${borderSoft}`,
            }}>
              {rightTabs.map(t => (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  style={{
                    padding: '6px 8px', borderRadius: '6px 6px 0 0', fontSize: 10, fontWeight: 600,
                    background: rightTab === t.id ? bgPrimary : 'transparent',
                    color: rightTab === t.id ? brand : textDim,
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    borderBottom: rightTab === t.id ? `2px solid ${brand}` : '2px solid transparent',
                  }}
                  dangerouslySetInnerHTML={{ __html: t.label }}
                />
              ))}
              <button onClick={() => { setToolsPanelOpen(false); setActiveTool(null) }}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: textDim, cursor: 'pointer', padding: '4px 6px', display: 'flex',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <RightPanel />
          </div>
        </div>

        {/* Right open button when closed */}
        {!toolsPanelOpen && (
          <button onClick={() => setToolsPanelOpen(true)}
            style={{
              width: 24, flexShrink: 0, cursor: 'pointer',
              background: bgSecondary, border: 'none', color: textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: `1px solid ${borderSoft}`,
            }}
            title="Abrir herramientas"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>

      {/* Timeline */}
      <EditorTimelineNew videoRef={videoRef} />

      {/* Export Modal */}
      <EditorExportModal />

      {/* Floating tools bar */}
      <div style={{
        position: 'absolute', left: leftPanelOpen ? (isTablet ? 268 : 328) : 32,
        bottom: timelineHidden ? 44 : 188,
        zIndex: 50,
      }}>
        <EditorToolsBar activeTool={activeToolLoc} setActiveTool={setActiveToolLoc} />
      </div>
    </div>
  )
}
