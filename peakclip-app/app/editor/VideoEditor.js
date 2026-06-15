'use client'
import { useReducer, useRef, useState, useEffect, useCallback } from 'react'

/* ── Constants ── */
const YLW = '#F5C518'
const BG = '#0D0D0D'
const PANEL = '#1A1A1A'
const TXT = '#FFFFFF'
const TXT2 = '#888888'
const TRK_VIDEO = '#2563EB'
const TRK_AUDIO = '#16A34A'
const TRK_TEXT = '#9333EA'
const FONT = 'system-ui, sans-serif'

/* ── Helpers ── */
const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }
const uid = () => Math.random().toString(36).slice(2, 8)

/* ── Reducer ── */
const init = {
  clips: [], audioTracks: [], textLayers: [],
  currentTime: 0, duration: 0, isPlaying: false,
  activePanel: null, volume: 1, zoom: 1,
  selectedClipId: null, trimStart: 0, trimEnd: 100,
  textInput: '', textSize: 16, textColor: '#FFFFFF',
  audioFile: null, audioVolume: 0.8, audioWaveform: [],
  history: [], historyIdx: -1,
}

function reducer(state, action) {
  const pushHistory = (s) => {
    if (state.historyIdx >= 0) {
      const h = state.history.slice(0, state.historyIdx + 1)
      h.push(structuredClone(s))
      return { ...s, history: h, historyIdx: h.length - 1 }
    }
    const h = [...state.history, structuredClone(s)]
    return { ...s, history: h, historyIdx: h.length - 1 }
  }
  switch (action.type) {
    case 'SET_VIDEO': {
      const clip = { id: uid(), type: 'video', label: action.name, src: action.src, start: 0, end: 100 }
      return pushHistory({ ...state, clips: [clip], duration: action.dur || 0 })
    }
    case 'SET_TIME': return { ...state, currentTime: action.t }
    case 'SET_DURATION': return { ...state, duration: action.d }
    case 'PLAY': return { ...state, isPlaying: true }
    case 'PAUSE': return { ...state, isPlaying: false }
    case 'SET_PANEL': return { ...state, activePanel: state.activePanel === action.p ? null : action.p }
    case 'SET_VOLUME': return { ...state, volume: action.v }
    case 'SET_ZOOM': return { ...state, zoom: Math.max(1, Math.min(5, action.z)) }
    case 'SELECT_CLIP': return { ...state, selectedClipId: action.id }
    case 'SET_TRIM_START': return { ...state, trimStart: action.v }
    case 'SET_TRIM_END': return { ...state, trimEnd: action.v }
    case 'SET_TEXT': return { ...state, textInput: action.v }
    case 'SET_TEXT_SIZE': return { ...state, textSize: action.v }
    case 'SET_TEXT_COLOR': return { ...state, textColor: action.v }
    case 'ADD_TEXT': {
      const tl = { id: uid(), text: action.text, size: state.textSize, color: state.textColor, x: 50, y: 80 }
      return pushHistory({ ...state, textLayers: [...state.textLayers, tl] })
    }
    case 'SET_AUDIO_FILE': {
      const t = { id: uid(), type: 'audio', label: action.name, src: action.src, volume: state.audioVolume }
      return pushHistory({ ...state, audioTracks: [...state.audioTracks, t] })
    }
    case 'SET_AUDIO_VOLUME': {
      const t = state.audioTracks.map(a => a.id === action.id ? { ...a, volume: action.v } : a)
      return { ...state, audioTracks: t }
    }
    case 'DELETE_CLIP': return pushHistory({ ...state, clips: state.clips.filter(c => c.id !== action.id), selectedClipId: null })
    case 'UNDO': {
      if (state.historyIdx <= 0) return state
      const prev = state.history[state.historyIdx - 1]
      return { ...prev, history: state.history, historyIdx: state.historyIdx - 1 }
    }
    case 'REDO': {
      if (state.historyIdx >= state.history.length - 1) return state
      const next = state.history[state.historyIdx + 1]
      return { ...next, history: state.history, historyIdx: state.historyIdx + 1 }
    }
    default: return state
  }
}

/* ── Sub-components ── */

/* Playback controls bar */
function PlaybackBar({ state, dispatch, videoRef }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 12px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0, height: '40px', fontFamily: FONT, fontSize: '11px', color: TXT2,
    }}>
      <button onClick={() => {
        if (!videoRef.current) return
        if (state.isPlaying) { videoRef.current.pause() } else { videoRef.current.play().catch(() => {}) }
      }} style={{
        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
        background: YLW, color: '#000', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '14px',
      }}>
        {state.isPlaying
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
      </button>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: TXT2 }}>{fmt(state.currentTime)} / {fmt(state.duration)}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => dispatch({ type: 'SET_ZOOM', z: state.zoom - 0.5 })}
          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: TXT2, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: TXT2, display: 'flex', alignItems: 'center', padding: '0 4px' }}>{state.zoom.toFixed(1)}x</span>
        <button onClick={() => dispatch({ type: 'SET_ZOOM', z: state.zoom + 0.5 })}
          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: TXT2, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>
    </div>
  )
}

/* Timeline track */
function TimelineTrack({ label, color, children, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: '36px', marginBottom: '2px', borderRadius: '4px',
      background: 'rgba(255,255,255,0.02)', flexShrink: 0, ...style,
    }}>
      <div style={{
        width: '56px', flexShrink: 0, textAlign: 'center',
        fontFamily: FONT, fontSize: '9px', color: TXT2, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</div>
      <div style={{ flex: 1, position: 'relative', minHeight: '28px', minWidth: '400px', marginRight: '8px' }}>
        {children}
      </div>
    </div>
  )
}

/* Clip strip on timeline */
function ClipStrip({ clip, color, selected, onSelect, onTouchStart, zoom, trimStart, trimEnd }) {
  const left = clip.start * zoom
  const w = (clip.end - clip.start) * zoom
  return (
    <div onPointerDown={(e) => { e.stopPropagation(); onSelect(clip.id) }}
      onTouchStart={(e) => onTouchStart && onTouchStart(e, clip)}
      style={{
        position: 'absolute', top: '2px', bottom: '2px',
        left: `${left}%`, width: `${Math.max(w, 2)}%`,
        borderRadius: '4px', cursor: 'pointer', overflow: 'hidden',
        background: `${color}22`, border: `1.5px solid ${selected ? YLW : color}44`,
        transition: 'border-color 0.15s',
        display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px',
        minWidth: '20px', touchAction: 'none',
      }}>
      <div style={{
        width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#fff', fontWeight: '700',
      }}>
        {clip.type === 'video' ? '▶' : clip.type === 'audio' ? '♪' : 'T'}
      </div>
      <span style={{
        fontFamily: FONT, fontSize: '8px', color: TXT2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{clip.label}</span>
    </div>
  )
}

/* Bottom drawer panel */
function BottomPanel({ state, dispatch, videoRef, audioCtxRef }) {
  if (!state.activePanel) return null

  const panels = {
    trim: <TrimPanel state={state} dispatch={dispatch} />,
    text: <TextPanel state={state} dispatch={dispatch} />,
    captions: <CaptionsPanel />,
    audio: <AudioPanel state={state} dispatch={dispatch} audioCtxRef={audioCtxRef} />,
    ai: <AIPanel />,
  }

  const labels = { trim: 'Trim', text: 'Text', captions: 'Captions', audio: 'Audio', ai: 'AI Studio' }

  return (
    <div style={{
      background: PANEL, borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      overflow: 'hidden', fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: TXT }}>{labels[state.activePanel]}</span>
        <button onClick={() => dispatch({ type: 'SET_PANEL', p: state.activePanel })}
          style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#222', color: TXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: '10px 12px', maxHeight: '180px', overflow: 'auto' }}>
        {panels[state.activePanel]}
      </div>
    </div>
  )
}

function TrimPanel({ state, dispatch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT }}>
      <div>
        <div style={{ fontSize: '9px', color: TXT2, marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Start</span><span style={{ color: YLW }}>{Math.round(state.trimStart)}%</span>
        </div>
        <input type="range" min="0" max={state.trimEnd - 5} value={state.trimStart}
          onChange={e => dispatch({ type: 'SET_TRIM_START', v: Number(e.target.value) })}
          style={{ width: '100%', height: '4px', accentColor: YLW, cursor: 'pointer' }} />
      </div>
      <div>
        <div style={{ fontSize: '9px', color: TXT2, marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>End</span><span style={{ color: YLW }}>{Math.round(state.trimEnd)}%</span>
        </div>
        <input type="range" min={state.trimStart + 5} max="100" value={state.trimEnd}
          onChange={e => dispatch({ type: 'SET_TRIM_END', v: Number(e.target.value) })}
          style={{ width: '100%', height: '4px', accentColor: YLW, cursor: 'pointer' }} />
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[
          { label: '15s', s: 0, e: 33 }, { label: '30s', s: 0, e: 67 }, { label: '60s', s: 0, e: 100 },
        ].map(p => (
          <button key={p.label} onClick={() => { dispatch({ type: 'SET_TRIM_START', v: p.s }); dispatch({ type: 'SET_TRIM_END', v: p.e }) }}
            style={{
              flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
              padding: '8px', cursor: 'pointer', color: TXT, fontSize: '10px', fontFamily: FONT,
            }}>{p.label}</button>
        ))}
      </div>
      {state.clips.length > 0 && (
        <button onClick={() => dispatch({ type: 'DELETE_CLIP', id: state.selectedClipId || state.clips[0]?.id })}
          style={{
            padding: '8px', borderRadius: '6px', border: 'none', background: '#ef444422', color: '#ef4444',
            cursor: 'pointer', fontSize: '10px', fontFamily: FONT,
          }}>Delete Clip</button>
      )}
    </div>
  )
}

function TextPanel({ state, dispatch }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT }}>
      <input value={state.textInput} onChange={e => dispatch({ type: 'SET_TEXT', v: e.target.value })}
        placeholder="Enter text..."
        style={{
          width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
          background: '#111', color: TXT, fontSize: '13px', outline: 'none', fontFamily: FONT, boxSizing: 'border-box',
        }} />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', color: TXT2, marginBottom: '4px' }}>Size: {state.textSize}px</div>
          <input type="range" min="12" max="48" value={state.textSize}
            onChange={e => dispatch({ type: 'SET_TEXT_SIZE', v: Number(e.target.value) })}
            style={{ width: '100%', height: '4px', accentColor: YLW, cursor: 'pointer' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: TXT2 }}>Color</span>
        {['#FFFFFF','#F5C518','#FF4444','#22C55E','#3B82F6','#A855F7'].map(c => (
          <button key={c} onClick={() => dispatch({ type: 'SET_TEXT_COLOR', v: c })}
            style={{
              width: '24px', height: '24px', borderRadius: '50%', border: state.textColor === c ? `2px solid ${YLW}` : '2px solid transparent',
              background: c, cursor: 'pointer',
            }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[
          { id: 'top', label: 'Top' }, { id: 'middle', label: 'Mid' }, { id: 'bottom', label: 'Bot' },
        ].map(p => (
          <button key={p.id}
            style={{
              flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
              padding: '8px', cursor: 'pointer', color: TXT2, fontSize: '10px', fontFamily: FONT,
            }}>{p.label}</button>
        ))}
      </div>
      <button onClick={() => { if (state.textInput) dispatch({ type: 'ADD_TEXT', text: state.textInput }) }}
        style={{
          padding: '10px', borderRadius: '6px', border: 'none', background: YLW, color: '#000',
          cursor: 'pointer', fontSize: '11px', fontWeight: '600', fontFamily: FONT,
        }}>Add Text</button>
    </div>
  )
}

function CaptionsPanel() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: FONT }}>
      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TXT2} strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 10h4"/><path d="M14 10h4"/><path d="M6 14h8"/></svg>
      </div>
      <div style={{ fontSize: '12px', color: TXT2 }}>Auto-captions coming soon</div>
    </div>
  )
}

function AudioPanel({ state, dispatch, audioCtxRef }) {
  const fileRef = useRef(null)
  const [analyser, setAnalyser] = useState(null)

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    dispatch({ type: 'SET_AUDIO_FILE', name: f.name, src: url })
    // Visualize waveform
    const ctx = audioCtxRef?.current || new (window.AudioContext || window.webkitAudioContext)()
    if (!audioCtxRef?.current) audioCtxRef.current = ctx
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const buf = await ctx.decodeAudioData(ev.target.result)
      const raw = buf.getChannelData(0)
      const bars = []
      const step = Math.floor(raw.length / 60)
      for (let i = 0; i < 60; i++) { let s = 0; for (let j = 0; j < step; j++) { s += Math.abs(raw[i * step + j] || 0) }; bars.push(Math.min(1, s / step * 3)) }
      setAnalyser(bars)
    }; reader.readAsArrayBuffer(f)
  }, [dispatch, audioCtxRef])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT }}>
      <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
      <button onClick={() => fileRef.current?.click()}
        style={{
          padding: '10px', borderRadius: '6px', border: `1px dashed ${TXT2}44`, background: '#111',
          cursor: 'pointer', color: TXT2, fontSize: '11px', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Add Audio
      </button>
      {state.audioTracks.length > 0 && (
        <div>
          <div style={{ fontSize: '9px', color: TXT2, marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Volume</span><span style={{ color: YLW }}>{Math.round(state.audioTracks[0]?.volume * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={state.audioTracks[0]?.volume || 0}
            onChange={e => dispatch({ type: 'SET_AUDIO_VOLUME', id: state.audioTracks[0]?.id, v: Number(e.target.value) })}
            style={{ width: '100%', height: '4px', accentColor: YLW, cursor: 'pointer' }} />
        </div>
      )}
      {analyser && (
        <div style={{ display: 'flex', gap: '1px', alignItems: 'flex-end', height: '32px', padding: '4px 0' }}>
          {analyser.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${Math.max(4, v * 32)}px`, borderRadius: '2px', background: YLW, opacity: 0.4 + v * 0.6 }} />
          ))}
        </div>
      )}
    </div>
  )
}

function AIPanel() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: FONT }}>
      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TXT2} strokeWidth="1.5"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5v1h-4v-1c0-2-2-3-2-5a4 4 0 014-4z"/><path d="M8 16h8"/><path d="M10 19h4"/><path d="M12 22v-3"/></svg>
      </div>
      <div style={{ fontSize: '12px', color: TXT2 }}>AI tools coming soon</div>
    </div>
  )
}

/* ── Main VideoEditor component ── */
export default function VideoEditor() {
  const [state, dispatch] = useReducer(reducer, init)
  const videoRef = useRef(null)
  const timelineRef = useRef(null)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const [videoSrc, setVideoSrc] = useState(null)
  const [videoName, setVideoName] = useState('')
  const [dragging, setDragging] = useState(false)

  /* Playhead tracking */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const update = () => {
      if (!v.paused) {
        dispatch({ type: 'SET_TIME', t: v.currentTime })
        dispatch({ type: 'SET_DURATION', d: v.duration || 0 })
        rafRef.current = requestAnimationFrame(update)
      }
    }
    const onPlay = () => { dispatch({ type: 'PLAY' }); rafRef.current = requestAnimationFrame(update) }
    const onPause = () => { dispatch({ type: 'PAUSE' }); rafRef.current && cancelAnimationFrame(rafRef.current) }
    const onTime = () => { dispatch({ type: 'SET_TIME', t: v.currentTime }) }
    const onLoaded = () => { dispatch({ type: 'SET_DURATION', d: v.duration || 0 }) }
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onLoaded)
    return () => {
      v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onLoaded)
      rafRef.current && cancelAnimationFrame(rafRef.current)
    }
  }, [videoSrc])

  /* File upload */
  const importVideo = useCallback((file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideoSrc(url)
    setVideoName(file.name)
    const tempVideo = document.createElement('video')
    tempVideo.preload = 'metadata'
    tempVideo.onloadedmetadata = () => {
      dispatch({ type: 'SET_VIDEO', src: url, name: file.name, dur: tempVideo.duration })
    }
    tempVideo.src = url
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer?.files?.[0]; if (f?.type?.startsWith('video/')) importVideo(f)
  }, [importVideo])

  const handleFileInput = useCallback((e) => {
    const f = e.target.files?.[0]; if (f?.type?.startsWith('video/')) importVideo(f)
  }, [importVideo])

  /* Timeline touch scrub */
  const handleTimelineTouch = useCallback((e) => {
    if (!timelineRef.current || !videoRef.current || !videoRef.current.duration) return
    const rect = timelineRef.current.getBoundingClientRect()
    const touch = e.touches?.[0] || e.changedTouches?.[0] || e
    const pct = (touch.clientX - rect.left) / rect.width
    const t = Math.max(0, Math.min(videoRef.current.duration, pct * videoRef.current.duration))
    videoRef.current.currentTime = t
    dispatch({ type: 'SET_TIME', t })
  }, [])

  /* Trim region on timeline */
  const trimPct = state.duration > 0 ? state.currentTime / state.duration * 100 : 0
  const totalTimelineWidth = Math.max(400, (state.duration || 60) * state.zoom * 3)

  return (
    <div style={{
      height: '100dvh', background: BG, color: TXT, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: FONT, position: 'relative',
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, height: '48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: YLW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#000' }}>P</div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: TXT }}>{videoName || 'PeakClip'}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.historyIdx <= 0}
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: state.historyIdx <= 0 ? '#333' : TXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={state.historyIdx >= state.history.length - 1}
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: state.historyIdx >= state.history.length - 1 ? '#333' : TXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          </button>
          <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: YLW, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      {/* ── Video Preview ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#080808', position: 'relative', overflow: 'hidden',
        minHeight: '120px',
      }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}>
        {videoSrc ? (
          <div style={{
            position: 'relative', width: '100%', maxWidth: '380px', aspectRatio: '9/16',
            background: '#000', borderRadius: '12px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          }}>
            <video ref={videoRef} src={videoSrc} playsInline preload="auto"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            {/* Text overlays */}
            {state.textLayers.map(t => (
              <div key={t.id} style={{
                position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
                transform: 'translate(-50%, -50%)', color: t.color, fontSize: `${t.size}px`,
                fontWeight: '700', textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                pointerEvents: 'none', whiteSpace: 'nowrap',
                fontFamily: FONT,
              }}>{t.text}</div>
            ))}
          </div>
        ) : (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            cursor: 'pointer', padding: '32px', borderRadius: '12px',
            border: `2px dashed ${dragging ? YLW : 'rgba(255,255,255,0.1)'}`,
            background: dragging ? `${YLW}11` : 'transparent',
            transition: 'all 0.2s',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dragging ? YLW : TXT2} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span style={{ fontSize: '13px', color: dragging ? YLW : TXT2 }}>Import Video</span>
            <input type="file" accept="video/*" onChange={handleFileInput} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* ── Playback Controls ── */}
      <PlaybackBar state={state} dispatch={dispatch} videoRef={videoRef} />

      {/* ── Timeline ── */}
      <div style={{
        background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
        height: state.activePanel ? 'calc(140px)' : 'calc(220px)',
        transition: 'height 0.2s',
      }}>
        <div ref={timelineRef}
          onTouchStart={handleTimelineTouch}
          onTouchMove={handleTimelineTouch}
          onPointerDown={(e) => {
            if (e.target === timelineRef.current) handleTimelineTouch(e)
          }}
          style={{
            height: '100%', overflowX: 'auto', overflowY: 'hidden',
            padding: '8px 0', position: 'relative',
            WebkitOverflowScrolling: 'touch',
          }}>
          <div style={{ minWidth: `${totalTimelineWidth}px`, padding: '0 8px', position: 'relative' }}>
            {/* Time ruler */}
            <div style={{
              display: 'flex', fontFamily: 'monospace', fontSize: '8px', color: TXT2,
              marginBottom: '4px', marginLeft: '60px', height: '16px', position: 'relative',
            }}>
              {Array.from({ length: Math.ceil(state.duration / 5) || 12 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute', left: `${(i * 5 / (state.duration || 60)) * 100}%`,
                  transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                }}>{fmt(i * 5)}</div>
              ))}
            </div>
            {/* Track: Video */}
            <TimelineTrack label="Video" color={TRK_VIDEO}>
              {state.clips.filter(c => c.type === 'video').map(c => (
                <ClipStrip key={c.id} clip={c} color={TRK_VIDEO} selected={state.selectedClipId === c.id}
                  onSelect={(id) => dispatch({ type: 'SELECT_CLIP', id })}
                  zoom={state.zoom} trimStart={state.trimStart} trimEnd={state.trimEnd} />
              ))}
            </TimelineTrack>
            {/* Track: Audio */}
            <TimelineTrack label="Audio" color={TRK_AUDIO}>
              {state.audioTracks.filter(c => c.type === 'audio').map(c => (
                <ClipStrip key={c.id} clip={c} color={TRK_AUDIO} selected={state.selectedClipId === c.id}
                  onSelect={(id) => dispatch({ type: 'SELECT_CLIP', id })}
                  zoom={state.zoom} trimStart={state.trimStart} trimEnd={state.trimEnd} />
              ))}
            </TimelineTrack>
            {/* Track: Text */}
            <TimelineTrack label="Text" color={TRK_TEXT}>
              {state.textLayers.map(c => {
                const clip = { ...c, type: 'text', label: c.text.slice(0, 16), start: 0, end: 100 }
                return (
                  <ClipStrip key={c.id} clip={clip} color={TRK_TEXT} selected={state.selectedClipId === c.id}
                    onSelect={(id) => dispatch({ type: 'SELECT_CLIP', id })}
                    zoom={state.zoom} trimStart={state.trimStart} trimEnd={state.trimEnd} />
                )
              })}
            </TimelineTrack>

            {/* Playhead */}
            <div style={{
              position: 'absolute', top: '20px', bottom: '4px', width: '2px',
              background: '#EF4444', zIndex: 10, pointerEvents: 'none',
              left: `${trimPct}%`,
              boxShadow: '0 0 6px #EF444488',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444',
                position: 'absolute', top: '-4px', left: '-4px',
              }} />
            </div>

            {/* Trim region highlight */}
            {state.clips.length > 0 && (
              <div style={{
                position: 'absolute', top: '20px', bottom: '4px', pointerEvents: 'none',
                left: `${state.trimStart}%`, width: `${state.trimEnd - state.trimStart}%`,
                background: `${YLW}18`, borderLeft: `1px solid ${YLW}44`, borderRight: `1px solid ${YLW}44`,
                borderRadius: '2px',
              }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Panel (slides up when a tool is selected) ── */}
      <BottomPanel state={state} dispatch={dispatch} videoRef={videoRef} audioCtxRef={audioCtxRef} />

      {/* ── Bottom Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '52px', flexShrink: 0,
        background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '0 2px', gap: '2px',
      }}>
        {[
          { id: 'trim', label: 'Trim', icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z' },
          { id: 'text', label: 'Text', icon: 'M4 7V4h16v3M9 20h6M12 4v16' },
          { id: 'captions', label: 'Captions', icon: 'M2 4h20v16H2zM6 10h4M14 10h4M6 14h8' },
          { id: 'audio', label: 'Audio', icon: 'M9 18V5l12-2v13M6 18a3 3 0 100 6 3 3 0 000-6zM18 16a3 3 0 100 6 3 3 0 000-6z' },
          { id: 'ai', label: 'AI', icon: 'M12 2a4 4 0 014 4c0 2-2 3-2 5v1h-4v-1c0-2-2-3-2-5a4 4 0 014-4zM8 16h8M10 19h4M12 22v-3' },
        ].map(t => (
          <button key={t.id} onClick={() => dispatch({ type: 'SET_PANEL', p: t.id })}
            style={{
              flex: 1, height: '44px', border: 'none', borderRadius: '8px',
              background: state.activePanel === t.id ? `${YLW}16` : 'transparent',
              color: state.activePanel === t.id ? YLW : TXT2, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '2px', fontFamily: FONT, touchAction: 'manipulation',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            <span style={{ fontSize: '8px', lineHeight: '1' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
