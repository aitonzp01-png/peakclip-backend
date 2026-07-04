'use client'
import { useRef, useEffect, useState } from 'react'
import useEditorStore from '../store/editorStore'
import { bgPrimary, textSecondary, textDim, brand, brandGlow, brandDim, timelineBg, borderSoft } from '../../../lib/editor-tokens'
import icons from '../../../lib/icons'
import { formatTime } from '../../../lib/utils'

export default function EditorTimelineNew({ videoRef }) {
  const {
    currentTime, setCurrentTime, duration, setPlayheadPos,
    isPlaying, setIsPlaying, trimStart, setTrimStart,
    trimEnd, setTrimEnd, timelineZoom, trackTimelineZoom,
    setTrackTimelineZoom, setTimelineZoom, timelineHidden,
    setTimelineHidden, playheadDragging, setPlayheadDragging,
  } = useEditorStore()

  const rulerRef = useRef(null)
  const [waveformData, setWaveformData] = useState(null)
  const animRef = useRef(null)

  useEffect(() => {
    if (!videoRef?.current || !duration) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const vid = videoRef.current
    const onCanPlay = () => {
      try {
        const src = ctx.createMediaElementSource(vid)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        src.connect(analyser)
        analyser.connect(ctx.destination)
        const bufLen = analyser.frequencyBinCount
        const data = new Uint8Array(bufLen)
        const render = () => {
          analyser.getByteFrequencyData(data)
          setWaveformData(Array.from(data.slice(0, 64)))
          animRef.current = requestAnimationFrame(render)
        }
        render()
      } catch {}
    }
    vid.addEventListener('canplay', onCanPlay)
    return () => {
      vid.removeEventListener('canplay', onCanPlay)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [videoRef, duration])

  const handleRulerClick = (e) => {
    if (!rulerRef.current || !duration) return
    const rect = rulerRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(duration, pct * duration))
    setCurrentTime(time)
    setPlayheadPos(pct * 100)
    if (videoRef?.current) videoRef.current.currentTime = time
  }

  const handleTrimStartDrag = (e) => {
    e.stopPropagation()
    const onMove = (ev) => {
      if (!rulerRef.current || !duration) return
      const rect = rulerRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(trimEnd - 2, ((ev.clientX - rect.left) / rect.width) * 100))
      setTrimStart(pct)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleTrimEndDrag = (e) => {
    e.stopPropagation()
    const onMove = (ev) => {
      if (!rulerRef.current || !duration) return
      const rect = rulerRef.current.getBoundingClientRect()
      const pct = Math.max(trimStart + 2, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
      setTrimEnd(pct)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const togglePlay = () => {
    if (!videoRef?.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }

  const playheadLeft = duration ? (currentTime / duration) * 100 : 0

  return (
    <div style={{
      height: timelineHidden ? 36 : 180,
      background: timelineBg, borderTop: `1px solid ${borderSoft}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'height 0.3s',
    }}>
      <div style={{
        height: 36, background: bgPrimary,
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 8, flexShrink: 0,
      }}>
        <button onClick={() => setTimelineHidden(!timelineHidden)}
          style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', display: 'flex', padding: 4 }}
          title={timelineHidden ? 'Mostrar' : 'Ocultar'}
        >
          {timelineHidden ? icons.eye : icons.eyeOff}
        </button>

        <button style={{ ...toolBtnStyle }} title="Eliminar segmento">{icons.trash}</button>
        <button style={{ ...toolBtnStyle }} title="Separar audio">{icons.scissors}</button>
        <button style={{ ...toolBtnStyle }} title="Añadir capa">{icons.plus}</button>

        <div style={{ flex: 1 }} />

        <button onClick={() => { if (videoRef?.current) { videoRef.current.currentTime = 0; setCurrentTime(0); setPlayheadPos(0) } }}
          style={{ ...toolBtnStyle, color: textDim }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/></svg>
        </button>

        <button onClick={togglePlay}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: brand, color: '#0f0f0f', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14,
          }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>

        <button onClick={() => { if (videoRef?.current && duration) { videoRef.current.currentTime = duration; setCurrentTime(duration); setPlayheadPos(100) } }}
          style={{ ...toolBtnStyle, color: textDim }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2"/></svg>
        </button>

        <span style={{ color: textDim, fontSize: 12, fontFamily: 'monospace', minWidth: 120, textAlign: 'center' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div style={{ flex: 1 }} />

        <button onClick={() => setTrackTimelineZoom(Math.max(0.5, trackTimelineZoom - 0.2))}
          style={{ ...toolBtnStyle }}>{icons.zoomOut}</button>
        <button onClick={() => setTrackTimelineZoom(Math.min(5, trackTimelineZoom + 0.2))}
          style={{ ...toolBtnStyle }}>{icons.zoomIn}</button>
      </div>

      {!timelineHidden && (
        <div style={{ flex: 1, position: 'relative', overflow: 'auto' }} ref={rulerRef} onMouseDown={handleRulerClick}>
          <div style={{
            position: 'absolute', top: 20, left: 0, right: 0, bottom: 0,
            background: timelineBg,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 20,
              borderBottom: `1px solid ${borderSoft}`,
            }}>
              {duration > 0 && Array.from({ length: Math.ceil(duration / 5) + 1 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute', left: `${(i * 5 / duration) * 100}%`,
                  top: 0, height: 12, borderLeft: `1px solid ${borderSoft}`,
                }}>
                  <span style={{ fontSize: 9, color: textDim, paddingLeft: 3 }}>{i * 5}s</span>
                </div>
              ))}
            </div>

            <div style={{
              position: 'absolute',
              left: `${trimStart}%`, right: `${100 - trimEnd}%`,
              top: 22, bottom: 8,
              background: brandDim,
              borderLeft: `2px solid ${brand}`,
              borderRight: `2px solid ${brand}`,
              borderRadius: 4,
            }}>
              <div style={{
                position: 'absolute', height: '100%', width: waveformData ? `${waveformData.length}%` : '100%',
                display: 'flex', alignItems: 'flex-end', gap: 1,
              }}>
                {waveformData && waveformData.slice(0, 128).map((v, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${(v / 255) * 100}%`,
                    background: brand, opacity: 0.4, borderRadius: '1px 1px 0 0',
                    minHeight: 1,
                  }} />
                ))}
              </div>
            </div>

            <div style={{
              position: 'absolute', left: `${trimStart}%`, top: 22, bottom: 8, width: 8,
              cursor: 'ew-resize', zIndex: 10,
            }}>
              <div onMouseDown={handleTrimStartDrag} style={{
                width: 8, height: '100%', background: brand, borderRadius: '2px 0 0 2px', opacity: 0.8,
              }} />
            </div>
            <div style={{
              position: 'absolute', right: `${100 - trimEnd}%`, top: 22, bottom: 8, width: 8,
              cursor: 'ew-resize', zIndex: 10,
            }}>
              <div onMouseDown={handleTrimEndDrag} style={{
                width: 8, height: '100%', background: brand, borderRadius: '0 2px 2px 0', opacity: 0.8,
              }} />
            </div>

            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: 2,
              background: brand, zIndex: 20, pointerEvents: 'none',
              left: `${playheadLeft}%`, boxShadow: `0 0 8px ${brandGlow}`,
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

const toolBtnStyle = {
  background: 'none', border: 'none', color: textSecondary,
  cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 4,
}
