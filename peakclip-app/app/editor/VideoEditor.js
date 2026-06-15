'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const C = {
  bg: '#0D0D0D',
  panel: '#141414',
  panel2: '#1C1C1C',
  panel3: '#242424',
  border: '#2A2A2A',
  accent: '#F5C518',
  accentDim: '#F5C51822',
  text: '#FFFFFF',
  muted: '#888888',
  dim: '#444444',
  vidTrack: '#1a3a6b',
  vidClip: '#2563EB',
  audTrack: '#1a3d25',
  audClip: '#16A34A',
  txtTrack: '#2d1a4a',
  txtClip: '#9333EA',
  musTrack: '#3d1a1a',
  musClip: '#DC2626',
  playhead: '#EF4444',
}

function fmt(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

let _id = 0
const uid = () => `id_${++_id}`

const SVG = ({ children, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)

const Icons = {
  play: <SVG><polygon points="5,3 19,12 5,21" fill="white" stroke="none" /></SVG>,
  pause: <SVG><rect x="6" y="4" width="4" height="16" rx="1" fill="white" stroke="none" /><rect x="14" y="4" width="4" height="16" rx="1" fill="white" stroke="none" /></SVG>,
  prev: <SVG><polygon points="19,20 9,12 19,4" fill={C.muted} stroke="none" /><line x1="5" y1="4" x2="5" y2="20" stroke={C.muted} /></SVG>,
  next: <SVG><polygon points="5,4 15,12 5,20" fill={C.muted} stroke="none" /><line x1="19" y1="4" x2="19" y2="20" stroke={C.muted} /></SVG>,
  undo: <SVG size={14}><path d="M3 7v6h6M3 13A9 9 0 1 0 5.7 5.7" /></SVG>,
  redo: <SVG size={14}><path d="M21 7v6h-6M21 13A9 9 0 1 1 18.3 5.7" /></SVG>,
  edit: <SVG size={13}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></SVG>,
  animate: <SVG size={13}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></SVG>,
  audio: <SVG size={13}><path d="M9 18V5l12-2v13M9 9l12-2" /></SVG>,
  ai: <SVG size={13}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></SVG>,
  star: <SVG size={14}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></SVG>,
  cursor: <SVG size={14}><path d="M5 3l14 9-7 1-3 7z" /></SVG>,
  media: <SVG size={14}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></SVG>,
  sticker: <SVG size={14}><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" /><path d="M12 8v4M12 16h.01" /></SVG>,
  text_t: <SVG size={14}><polyline points="4,7 4,4 20,4 20,7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></SVG>,
  subtitles: <SVG size={14}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></SVG>,
  effects: <SVG size={14}><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></SVG>,
  filter: <SVG size={14}><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" /></SVG>,
  music_note: <SVG size={14}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></SVG>,
  apps: <SVG size={14}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></SVG>,
  plus: <SVG size={12}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></SVG>,
  minus: <SVG size={12}><line x1="5" y1="12" x2="19" y2="12" /></SVG>,
  trash: <SVG size={14}><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></SVG>,
  snap: <SVG size={14}><path d="M18 20V10M12 20V4M6 20v-6" /></SVG>,
  vol: <SVG size={13}><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></SVG>,
  close: <SVG size={16}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></SVG>,
  captions_ai: <SVG size={22} stroke={C.accent}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></SVG>,
  hook: <SVG size={22} stroke="#FF6B6B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></SVG>,
  silence: <SVG size={22} stroke="#3B82F6"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><line x1="17" y1="9" x2="23" y2="15" /><line x1="23" y1="9" x2="17" y2="15" /></SVG>,
  broll: <SVG size={22} stroke="#8B5CF6"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" /></SVG>,
  face: <SVG size={22} stroke="#F59E0B"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" /></SVG>,
  smartcrop: <SVG size={22} stroke="#10B981"><path d="M5 9V5h4M19 9V5h-4M5 15v4h4M19 15v4h-4" /></SVG>,
}

function Drawer({ open, title, children, onClose }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }} />}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: C.panel, borderRadius: '14px 14px 0 0',
        borderTop: `1px solid ${C.border}`,
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.26s cubic-bezier(.32,0,.67,0)',
        zIndex: 50, maxHeight: '60%',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, color: C.text, fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>{title}</span>
          <button onClick={onClose} style={btnReset}><span style={{ color: C.muted }}>{Icons.close}</span></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>{children}</div>
      </div>
    </>
  )
}

function Clip({ clip, pxPerSec, selected, onSelect, onUpdateStart }) {
  const drag = useRef(null)
  const onTS = (e) => {
    e.stopPropagation()
    drag.current = { x0: e.touches[0].clientX, s0: clip.start }
    onSelect(clip.id)
  }
  const onTM = (e) => {
    if (!drag.current) return
    const dx = e.touches[0].clientX - drag.current.x0
    onUpdateStart(clip.id, Math.max(0, drag.current.s0 + dx / pxPerSec))
  }
  const onTE = () => { drag.current = null }
  return (
    <div
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
      onClick={(e) => { e.stopPropagation(); onSelect(clip.id) }}
      style={{
        position: 'absolute', left: clip.start * pxPerSec,
        width: Math.max(24, clip.duration * pxPerSec),
        top: 2, bottom: 2, background: clip.color, borderRadius: 4,
        border: selected ? `2px solid ${C.accent}` : '2px solid transparent',
        display: 'flex', alignItems: 'center', padding: '0 6px',
        overflow: 'hidden', cursor: 'grab', touchAction: 'none',
        boxSizing: 'border-box', minWidth: 0,
      }}>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 1 }}>
        {clip.label}
      </span>
      {selected && <>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: C.accent, borderRadius: '3px 0 0 3px' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: C.accent, borderRadius: '0 3px 3px 0' }} />
      </>}
    </div>
  )
}

function TrackRow({ label, bgColor, clips, pxPerSec, totalDur, selectedId, onSelect, onUpdateStart }) {
  return (
    <div style={{ display: 'flex', height: 28, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.panel2, borderRight: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ position: 'relative', flex: 1, background: bgColor, minWidth: totalDur * pxPerSec + 60, overflow: 'visible' }}>
        {clips.map(c => (
          <Clip key={c.id} clip={c} pxPerSec={pxPerSec} selected={selectedId === c.id} onSelect={onSelect} onUpdateStart={onUpdateStart} />
        ))}
      </div>
    </div>
  )
}

function AIPanel() {
  const tools = [
    { icon: Icons.captions_ai, name: 'Auto Captions', desc: 'Generate viral subtitles with AI', color: C.accent },
    { icon: Icons.hook, name: 'Hook Detection', desc: 'Find best attention-grabbing moments', color: '#FF6B6B' },
    { icon: Icons.silence, name: 'Remove Silence', desc: 'Auto-cut dead air and pauses', color: '#3B82F6' },
    { icon: Icons.broll, name: 'Auto B-Roll', desc: 'Smart secondary footage matching', color: '#8B5CF6' },
    { icon: Icons.face, name: 'Face Tracking', desc: 'Auto-track faces in video', color: '#F59E0B' },
    { icon: Icons.smartcrop, name: 'Smart Crop', desc: 'AI-powered reframing for 9:16', color: '#10B981' },
  ]
  return (
    <div>
      <div style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}33`, borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: C.accent, fontSize: 16 }}>✨</span>
        <div>
          <div style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>AI STUDIO</div>
          <div style={{ color: C.muted, fontSize: 11 }}>Select an AI tool to enhance your clip</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {tools.map(t => (
          <button key={t.name} onClick={() => alert(`${t.name} — coming soon!`)}
            style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 10px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: t.color }}>{t.icon}</span>
            <span style={{ color: C.text, fontSize: 12, fontWeight: 700, display: 'block' }}>{t.name}</span>
            <span style={{ color: C.muted, fontSize: 10, display: 'block', lineHeight: 1.3 }}>{t.desc}</span>
            <span style={{ color: t.color, fontSize: 10, fontWeight: 600 }}>Apply →</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function EditPanel({ selectedId, clips, onTrim }) {
  const clip = [...clips].find(c => c.id === selectedId)
  if (!clip) return <p style={{ color: C.muted, fontSize: 13 }}>Select a clip on the timeline to edit it.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: C.panel2, borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Selected clip</div>
        <div style={{ color: C.text, fontWeight: 700 }}>{clip.label}</div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{fmt(clip.start)} – {fmt(clip.start + clip.duration)} · {fmt(clip.duration)}</div>
      </div>
      <div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Trim</div>
        <div style={{ height: 36, background: C.panel3, borderRadius: 8, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '10%', right: '15%', top: 4, bottom: 4, background: clip.color, borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 600 }}>{clip.label}</span>
          </div>
          <div style={{ position: 'absolute', left: '10%', top: 0, bottom: 0, width: 8, background: C.accent, borderRadius: '4px 0 0 4px', cursor: 'ew-resize' }} />
          <div style={{ position: 'absolute', right: '15%', top: 0, bottom: 0, width: 8, background: C.accent, borderRadius: '0 4px 4px 0', cursor: 'ew-resize' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, background: '#7f1d1d', border: 'none', borderRadius: 8, padding: 10, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => onTrim(selectedId)}>Delete Clip</button>
        <button style={{ flex: 1, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Split Here</button>
      </div>
    </div>
  )
}

function AudioPanel({ audioClips, onImport, volume, setVolume }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={onImport} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.panel2, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
        <span style={{ fontSize: 22 }}>🎵</span>
        <div>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Import Audio</div>
          <div style={{ color: C.muted, fontSize: 11 }}>MP3, AAC, WAV supported</div>
        </div>
        <span style={{ marginLeft: 'auto', color: C.accent, fontSize: 20 }}>{Icons.plus}</span>
      </button>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 5 }}>{Icons.vol} Volume</span>
          <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{volume}%</span>
        </div>
        <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(+e.target.value)}
          style={{ width: '100%', accentColor: C.accent, height: 4 }} />
      </div>
      <div style={{ height: 52, background: C.panel2, borderRadius: 8, display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 8px', gap: 1.5 }}>
        {audioClips.length > 0
          ? Array.from({ length: 48 }).map((_, i) => (
              <div key={i} style={{ flex: 1, background: C.audClip, borderRadius: 1, height: `${15 + Math.abs(Math.sin(i * 0.8) * 60 + Math.sin(i * 0.3) * 30)}%`, opacity: 0.85 }} />
            ))
          : <span style={{ color: C.dim, fontSize: 12 }}>No audio imported yet</span>
        }
      </div>
      {audioClips.map(a => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.panel2, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.audClip, flexShrink: 0 }} />
          <span style={{ flex: 1, color: C.text, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</span>
          <span style={{ color: C.muted, fontSize: 11 }}>{fmt(a.duration)}</span>
        </div>
      ))}
    </div>
  )
}

function AnimatePanel() {
  const anims = ['Fade In','Slide Left','Zoom In','Bounce','Spin','Typewriter','Glitch','Flash']
  const [sel, setSel] = useState(null)
  return (
    <div>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Select an animation for the active clip</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {anims.map(a => (
          <button key={a} onClick={() => setSel(a)} style={{
            background: sel === a ? C.accentDim : C.panel2,
            border: `1px solid ${sel === a ? C.accent : C.border}`,
            borderRadius: 8, padding: '10px 8px',
            color: sel === a ? C.accent : C.text,
            fontSize: 12, fontWeight: sel === a ? 700 : 400, cursor: 'pointer',
          }}>{a}</button>
        ))}
      </div>
      {sel && <button style={{ marginTop: 12, width: '100%', background: C.accent, border: 'none', borderRadius: 8, padding: 10, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        onClick={() => alert(`Applied: ${sel}`)}>Apply {sel}</button>}
    </div>
  )
}

const sideTools = [
  { key: 'starred', icon: Icons.star, label: 'Starred' },
  { key: 'cursor', icon: Icons.cursor, label: 'Select' },
  { key: 'media', icon: Icons.media, label: 'Media' },
  { key: 'sticker', icon: Icons.sticker, label: 'Sticker' },
  { key: 'text_t', icon: Icons.text_t, label: 'Text' },
  { key: 'subtitles', icon: Icons.subtitles, label: 'Captions' },
  { key: 'effects', icon: Icons.effects, label: 'Effects' },
  { key: 'filter', icon: Icons.filter, label: 'Filter' },
  { key: 'music_note', icon: Icons.music_note, label: 'Music' },
  { key: 'apps', icon: Icons.apps, label: 'Apps' },
]

const btnReset = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const iconBtn = { background: '#1f1f1f', border: `1px solid #2a2a2a`, borderRadius: 5, width: 22, height: 22, color: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }
const importBtn = { display: 'flex', alignItems: 'center', gap: 12, background: '#1C1C1C', border: '1px dashed #2A2A2A', borderRadius: 10, padding: 14, cursor: 'pointer', width: '100%', textAlign: 'left' }

export default function VideoEditor() {
  const [videoClips, setVideoClips] = useState([])
  const [audioClips, setAudioClips] = useState([])
  const [textClips, setTextClips] = useState([])
  const [musicClips, setMusicClips] = useState([])

  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [pxPerSec, setPxPerSec] = useState(28)
  const [selectedId, setSelectedId] = useState(null)
  const [videoSrc, setVideoSrc] = useState(null)
  const [audioSrc, setAudioSrc] = useState(null)
  const [volume, setVolume] = useState(80)

  const [rightTab, setRightTab] = useState('ai')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sideDrawer, setSideDrawer] = useState(null)
  const [newText, setNewText] = useState('')

  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const timelineRef = useRef(null)
  const animRef = useRef(null)
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)

  const allClips = [...videoClips, ...audioClips, ...textClips, ...musicClips]
  const totalDur = Math.max(30, ...allClips.map(c => c.start + c.duration))

  useEffect(() => {
    if (playing) {
      const tick = () => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime)
          if (videoRef.current.ended) setPlaying(false)
        } else {
          setCurrentTime(t => { if (t >= totalDur) { setPlaying(false); return 0 } return t + 0.05 })
        }
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(animRef.current)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, totalDur])

  useEffect(() => {
    if (!videoRef.current) return
    playing ? videoRef.current.play().catch(() => {}) : videoRef.current.pause()
  }, [playing])

  useEffect(() => {
    if (!timelineRef.current || !playing) return
    const el = timelineRef.current
    const px = currentTime * pxPerSec + 44
    if (px > el.scrollLeft + el.clientWidth - 60) el.scrollLeft = px - 60
  }, [currentTime, pxPerSec, playing])

  const scrub = useCallback((e) => {
    const el = timelineRef.current
    if (!el) return
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - el.getBoundingClientRect().left + el.scrollLeft - 44
    const t = Math.max(0, Math.min(totalDur, x / pxPerSec))
    setCurrentTime(t)
    if (videoRef.current) videoRef.current.currentTime = t
  }, [pxPerSec, totalDur])

  const updateStart = (id, s) => {
    const upd = arr => arr.map(c => c.id === id ? { ...c, start: s } : c)
    setVideoClips(upd); setAudioClips(upd); setTextClips(upd); setMusicClips(upd)
  }

  const deleteClip = (id) => {
    const rm = arr => arr.filter(c => c.id !== id)
    setVideoClips(rm); setAudioClips(rm); setTextClips(rm); setMusicClips(rm)
    setSelectedId(null)
  }

  const handleVideoImport = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    setVideoSrc(url)
    const v = document.createElement('video')
    v.src = url
    v.onloadedmetadata = () => {
      const dur = v.duration || 10
      setVideoClips(prev => [...prev, { id: uid(), type: 'video', label: f.name.replace(/\.[^.]+$/, ''), start: 0, duration: dur, color: C.vidClip }])
    }
    setSideDrawer(null)
  }

  const handleAudioImport = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    setAudioSrc(url)
    const a = document.createElement('audio')
    a.src = url
    a.onloadedmetadata = () => {
      const dur = a.duration || 10
      setAudioClips(prev => [...prev, { id: uid(), label: f.name.replace(/\.[^.]+$/, ''), start: 0, duration: dur, color: C.audClip }])
    }
    setSideDrawer(null)
  }

  const addText = () => {
    if (!newText.trim()) return
    setTextClips(prev => [...prev, { id: uid(), label: newText, start: currentTime, duration: 5, color: C.txtClip }])
    setNewText('')
    setSideDrawer(null)
  }

  const tickStep = pxPerSec >= 40 ? 1 : pxPerSec >= 20 ? 3 : 5
  const ticks = []
  for (let i = 0; i <= Math.ceil(totalDur); i += tickStep) ticks.push(i)

  const tabStyle = (key) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 2, height: '100%', border: 'none',
    background: rightTab === key ? C.accentDim : 'none',
    borderBottom: rightTab === key ? `2px solid ${C.accent}` : '2px solid transparent',
    cursor: 'pointer', padding: '4px 2px', borderRadius: 0,
    color: rightTab === key ? C.accent : C.muted,
    fontSize: 10, fontWeight: rightTab === key ? 700 : 400,
    transition: 'all 0.15s',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: C.text }}>

      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 22, height: 22, background: C.accent, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>▶</div>
          <span style={{ color: C.accent, fontWeight: 800, fontSize: 11, letterSpacing: -0.5 }}>PEAKCLIP</span>
        </div>
        <span style={{ color: C.muted, fontSize: 11 }}>New Project</span>
        <div style={{ flex: 1 }} />
        {['9:16', '16:9', '1:1'].map((r, i) => (
          <div key={r} style={{ padding: '2px 6px', background: i === 0 ? C.accent : C.panel2, borderRadius: 10, fontSize: 9, color: i === 0 ? '#000' : C.muted, fontWeight: 700 }}>{r}</div>
        ))}
        <button style={btnReset}><span style={{ color: C.muted }}>{Icons.undo}</span></button>
        <button style={btnReset}><span style={{ color: C.muted }}>{Icons.redo}</span></button>
        <div style={{ display: 'flex', gap: 0, background: C.panel2, borderRadius: 6, overflow: 'hidden' }}>
          {['0.5x','1x','1.5x','2x'].map((s, i) => (
            <div key={s} style={{ padding: '3px 5px', fontSize: 9, color: i === 1 ? C.accent : C.muted, fontWeight: i === 1 ? 700 : 400, background: i === 1 ? C.accentDim : 'none', cursor: 'pointer' }}>{s}</div>
          ))}
        </div>
        <button style={{ background: C.accent, border: 'none', borderRadius: 7, padding: '5px 10px', color: '#000', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => alert('Export your video')}>
          <span style={{ fontSize: 10 }}>⬇</span> Export
        </button>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.accent }}>J</div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: 36, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 0, overflowY: 'auto', background: C.panel }}>
          {sideTools.map(t => (
            <button key={t.key} onClick={() => setSideDrawer(d => d === t.key ? null : t.key)}
              style={{ ...btnReset, width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: sideDrawer === t.key ? C.accentDim : 'none',
                borderLeft: sideDrawer === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
                color: sideDrawer === t.key ? C.accent : C.muted,
              }}>
              {t.icon}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, marginBottom: 10 }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', position: 'relative', minHeight: 0 }}>
            <div style={{ position: 'relative', height: '100%', maxWidth: 180, aspectRatio: '9/16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: -8, borderRadius: 24, border: `2px solid #2a2a2a`, background: '#111', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, background: '#222', borderRadius: 2 }} />
              </div>
              {videoSrc ? (
                <video ref={videoRef} src={videoSrc} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1, borderRadius: 12 }}
                  onEnded={() => setPlaying(false)} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', position: 'relative', zIndex: 1, width: '100%', height: '100%' }}
                  onClick={() => videoInputRef.current?.click()}>
                  <div style={{ width: 40, height: 40, border: `1.5px dashed ${C.dim}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📂</div>
                  <span style={{ color: C.dim, fontSize: 12, textAlign: 'center' }}>Drop video here</span>
                  <span style={{ color: '#333', fontSize: 10 }}>or browse files</span>
                </div>
              )}
              {audioSrc && <audio ref={audioRef} src={audioSrc} />}
            </div>
          </div>

          <div style={{ height: 36, borderTop: `1px solid ${C.border}`, display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.panel }}>
            {[
              { key: 'edit', icon: Icons.edit, label: 'Edit' },
              { key: 'animate', icon: Icons.animate, label: 'Animate' },
              { key: 'audio', icon: Icons.audio, label: 'Audio' },
              { key: 'ai', icon: Icons.ai, label: 'AI' },
            ].map(t => (
              <button key={t.key} style={tabStyle(t.key)} onClick={() => { setRightTab(t.key); setDrawerOpen(true) }}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.panel, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Timeline</span>
          <span style={{ fontSize: 10, color: C.dim }}>{allClips.length} clips</span>
          <div style={{ flex: 1 }} />
          <button style={iconBtn} onClick={() => setPxPerSec(p => Math.max(8, p - 8))}>{Icons.minus}</button>
          <span style={{ fontSize: 10, color: C.muted, minWidth: 24, textAlign: 'center' }}>{pxPerSec}</span>
          <button style={iconBtn} onClick={() => setPxPerSec(p => Math.min(120, p + 8))}>{Icons.plus}</button>
          <div style={{ width: 1, height: 14, background: C.border, margin: '0 4px' }} />
          <span style={{ color: C.muted, fontSize: 10 }}>{Icons.snap}</span>
          <span style={{ color: C.muted, fontSize: 10, marginLeft: 2 }}>Snap</span>
        </div>

        <div ref={timelineRef} style={{ overflowX: 'scroll', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
          onTouchStart={scrub}>
          <div style={{ minWidth: totalDur * pxPerSec + 100, position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, height: 20, display: 'flex', background: C.panel2, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 44, flexShrink: 0 }} />
              <div style={{ position: 'relative', flex: 1, minWidth: totalDur * pxPerSec + 60 }}>
                {ticks.map(t => (
                  <div key={t} style={{ position: 'absolute', left: t * pxPerSec, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 8, color: C.dim, paddingLeft: 2, paddingTop: 2, whiteSpace: 'nowrap' }}>{fmt(t)}</span>
                    <div style={{ width: 1, flex: 1, background: C.border }} />
                  </div>
                ))}
              </div>
            </div>

            <TrackRow label="VIDEO" bgColor={C.vidTrack} clips={videoClips} pxPerSec={pxPerSec} totalDur={totalDur} selectedId={selectedId} onSelect={setSelectedId} onUpdateStart={updateStart} />
            <TrackRow label="AUDIO" bgColor={C.audTrack} clips={audioClips} pxPerSec={pxPerSec} totalDur={totalDur} selectedId={selectedId} onSelect={setSelectedId} onUpdateStart={updateStart} />
            <TrackRow label="TEXT" bgColor={C.txtTrack} clips={textClips} pxPerSec={pxPerSec} totalDur={totalDur} selectedId={selectedId} onSelect={setSelectedId} onUpdateStart={updateStart} />
            <TrackRow label="MUSIC" bgColor={C.musTrack} clips={musicClips} pxPerSec={pxPerSec} totalDur={totalDur} selectedId={selectedId} onSelect={setSelectedId} onUpdateStart={updateStart} />

            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 44 + currentTime * pxPerSec, width: 2, background: C.playhead, pointerEvents: 'none', zIndex: 20 }}>
              <div style={{ width: 10, height: 10, background: C.playhead, borderRadius: '50%', marginLeft: -4, marginTop: 20 }} />
            </div>
          </div>
        </div>

        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderTop: `1px solid ${C.border}` }}>
          <button style={btnReset}>{Icons.prev}</button>
          <button onClick={() => setPlaying(p => !p)} style={{ width: 36, height: 36, borderRadius: '50%', background: C.accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {playing ? Icons.pause : Icons.play}
          </button>
          <button style={btnReset}>{Icons.next}</button>
          <span style={{ fontSize: 11, color: C.muted }}>{fmt(currentTime)} / {fmt(totalDur)}</span>
          <div style={{ flex: 1 }} />
          {selectedId && (
            <button onClick={() => deleteClip(selectedId)} style={{ background: '#7f1d1d', border: 'none', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {Icons.trash} Del
            </button>
          )}
        </div>
      </div>

      <Drawer open={sideDrawer === 'media'} title="Import Media" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => videoInputRef.current?.click()} style={importBtn}>
            <span style={{ fontSize: 22 }}>🎬</span>
            <div><div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Import Video</div><div style={{ color: C.muted, fontSize: 11 }}>MP4, MOV, WebM</div></div>
          </button>
          <button onClick={() => audioInputRef.current?.click()} style={importBtn}>
            <span style={{ fontSize: 22 }}>🎵</span>
            <div><div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Import Audio</div><div style={{ color: C.muted, fontSize: 11 }}>MP3, AAC, WAV</div></div>
          </button>
        </div>
      </Drawer>

      <Drawer open={sideDrawer === 'text_t'} title="Add Text" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="Type your text..."
            onKeyDown={e => e.key === 'Enter' && addText()}
            style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {['#FFFFFF','#F5C518','#EF4444','#3B82F6','#10B981','#8B5CF6'].map(c => (
              <div key={c} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${C.border}` }} />
            ))}
          </div>
          <button onClick={addText} style={{ background: C.accent, border: 'none', borderRadius: 8, padding: 11, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Add to Timeline
          </button>
        </div>
      </Drawer>

      <Drawer open={sideDrawer === 'subtitles'} title="Auto Captions" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '16px 0' }}>
          <span style={{ fontSize: 36 }}>🤖</span>
          <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', margin: 0 }}>AI transcribes your video and adds synced text overlays.</p>
          <button style={{ background: C.accent, border: 'none', borderRadius: 8, padding: '11px 28px', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            onClick={() => alert('Auto-captions would process the video here')}>Generate Captions</button>
        </div>
      </Drawer>

      <Drawer open={sideDrawer === 'effects'} title="Effects" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['Blur','Vignette','Glow','Grain','VHS','Glitch','B&W','Warm','Cool'].map(ef => (
            <button key={ef} onClick={() => alert(`Effect: ${ef}`)} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 4px', color: C.text, fontSize: 11, cursor: 'pointer' }}>{ef}</button>
          ))}
        </div>
      </Drawer>

      <Drawer open={sideDrawer === 'filter'} title="Filters" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['Original','Vivid','Muted','Cinematic','Portrait','Food','Night','Golden','Fade'].map(f => (
            <button key={f} onClick={() => alert(`Filter: ${f}`)} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 4px', color: C.text, fontSize: 11, cursor: 'pointer' }}>{f}</button>
          ))}
        </div>
      </Drawer>

      <Drawer open={sideDrawer === 'music_note'} title="Music" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Upbeat Pop','Chill Lo-fi','Epic Cinematic','Corporate','Acoustic','Electronic'].map(t => (
            <button key={t} onClick={() => {
              setMusicClips(prev => [...prev, { id: uid(), label: t, start: 0, duration: 15, color: C.musClip }])
              setSideDrawer(null)
            }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 18 }}>🎵</span>
              <span style={{ color: C.text, fontSize: 13 }}>{t}</span>
              <span style={{ marginLeft: 'auto', color: C.accent, fontSize: 10, fontWeight: 700 }}>ADD</span>
            </button>
          ))}
        </div>
      </Drawer>

      <Drawer open={sideDrawer === 'sticker'} title="Stickers" onClose={() => setSideDrawer(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, textAlign: 'center' }}>
          {['🔥','⭐','💯','🎉','✨','💪','🎬','📱','👀','❤️','🚀','💫'].map(s => (
            <button key={s} onClick={() => alert(`Sticker ${s} added`)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer' }}>{s}</button>
          ))}
        </div>
      </Drawer>

      <Drawer open={drawerOpen}
        title={rightTab === 'edit' ? 'Edit' : rightTab === 'animate' ? 'Animate' : rightTab === 'audio' ? 'Audio' : 'AI Studio'}
        onClose={() => setDrawerOpen(false)}>
        {rightTab === 'ai' && <AIPanel />}
        {rightTab === 'edit' && <EditPanel selectedId={selectedId} clips={allClips} onTrim={deleteClip} />}
        {rightTab === 'animate' && <AnimatePanel />}
        {rightTab === 'audio' && <AudioPanel audioClips={audioClips} onImport={() => audioInputRef.current?.click()} volume={volume} setVolume={setVolume} />}
      </Drawer>

      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoImport} />
      <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioImport} />
    </div>
  )
}
