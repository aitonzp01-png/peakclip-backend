'use client'
import { useRef, useCallback, useMemo, useState } from 'react'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, hoverBg, fonts } from '../../../lib/editor-tokens'
import { trackItemsToSegments } from '../../../lib/subtitles'
import useEditorStore from '../store/editorStore'

export default function EditorTimeline({ videoRef }) {
  const timelineRef = useRef(null)
  const trackContentRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const [liveItem, setLiveItem] = useState(null)
  const {
    tracks, selectedTrackId, playheadPos, trimStart, trimEnd,
    timelineZoom, isPlaying, duration, setPlayheadPos, setSelectedTrackId,
    setTimelineZoom, setIsPlaying, updateSubtitle, setSelectedSubtitleId,
  } = useEditorStore()

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !videoRef?.current || drag) return
    const rect = timelineRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setPlayheadPos(pct)
    if (videoRef.current.duration) {
      videoRef.current.currentTime = (pct / 100) * videoRef.current.duration
    }
  }

  const pctToTime = (pct) => {
    const dur = duration || videoRef?.current?.duration || 0
    return Math.max(0, Math.min(dur, (pct / 100) * dur))
  }

  const handleItemMouseDown = (e, track, item, mode = 'move') => {
    e.stopPropagation()
    if (!trackContentRef.current) return
    const rect = trackContentRef.current.getBoundingClientRect()
    const startX = e.clientX
    const startPct = item.start
    const endPct = item.end
    setSelectedTrackId(track.id)
    if (item.segment?.id) setSelectedSubtitleId(item.segment.id)
    setDrag({ trackId: track.id, itemId: item.id, mode, startX, rectWidth: rect.width, startPct, endPct })
    setLiveItem({ ...item })

    const handleMouseMove = (ev) => {
      const dx = ev.clientX - startX
      const dpct = (dx / rect.width) * 100 * timelineZoom
      setDrag(prev => prev && ({ ...prev, dxPct: dpct }))

      setLiveItem(prev => {
        if (!prev) return null
        if (mode === 'move') {
          const width = endPct - startPct
          let newStart = Math.max(0, Math.min(100 - width, startPct + dpct))
          return { ...prev, start: newStart, end: newStart + width }
        } else if (mode === 'resize-left') {
          let newStart = Math.max(0, Math.min(endPct - 2, startPct + dpct))
          return { ...prev, start: newStart }
        } else if (mode === 'resize-right') {
          let newEnd = Math.max(startPct + 2, Math.min(100, endPct + dpct))
          return { ...prev, end: newEnd }
        }
        return prev
      })
    }

    const handleMouseUp = () => {
      setLiveItem(prev => {
        if (prev && prev.segment?.id) {
          updateSubtitle(prev.segment.id, {
            start: pctToTime(prev.start),
            end: pctToTime(prev.end),
          })
        }
        return null
      })
      setDrag(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const skipBack = useCallback(() => {
    if (!videoRef?.current) return
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
    const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
    setPlayheadPos(pct)
  }, [videoRef, setPlayheadPos])

  const skipForward = useCallback(() => {
    if (!videoRef?.current) return
    videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5)
    const pct = videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0
    setPlayheadPos(pct)
  }, [videoRef, setPlayheadPos])

  const waveformBars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      height: 15 + Math.sin(i * 0.7 + 1) * 12 + Math.sin(i * 1.3) * 8 + Math.cos(i * 0.4) * 5,
      active: i >= Math.floor(trimStart / 100 * 60) && i <= Math.floor(trimEnd / 100 * 60),
    }))
  }, [trimStart, trimEnd])

  const timeMarkers = useMemo(() => {
    const markers = []
    const totalSecs = duration || 60
    const steps = Math.min(20, Math.ceil(totalSecs / 3))
    const stepSec = totalSecs / steps
    for (let i = 0; i <= steps; i++) {
      const secs = Math.round(i * stepSec)
      const min = Math.floor(secs / 60)
      const sec = secs % 60
      markers.push({ pos: (i / steps) * 100, label: `${min}:${sec.toString().padStart(2, '0')}` })
    }
    return markers
  }, [duration])

  return (
    <div className="editor-timeline" style={{
      height: '220px', background: bgSecondary, borderTop: `1px solid ${borderSoft}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderTopLeftRadius: '12px', borderTopRightRadius: '12px',
    }}>
      {/* Timeline header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: `1px solid ${borderSoft}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: textSecondary, fontWeight: '600', fontFamily: fonts.body }}>
            Timeline
          </span>
          <span style={{ fontSize: '9px', color: textDim, fontFamily: fonts.mono }}>
            {tracks.length} tracks
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Zoom controls */}
          <button onClick={() => setTimelineZoom(Math.max(1, timelineZoom - 1))}
            style={{
              width: '24px', height: '24px', borderRadius: '5px',
              border: `1px solid ${borderSoft}`, background: 'transparent',
              color: textDim, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', lineHeight: '1',
            }}>
            −
          </button>
          <span style={{
            fontFamily: fonts.mono, fontSize: '9px', color: textDim,
            minWidth: '20px', textAlign: 'center',
          }}>
            {timelineZoom}x
          </span>
          <button onClick={() => setTimelineZoom(Math.min(5, timelineZoom + 1))}
            style={{
              width: '24px', height: '24px', borderRadius: '5px',
              border: `1px solid ${borderSoft}`, background: 'transparent',
              color: textDim, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', lineHeight: '1',
            }}>
            +
          </button>

          <div style={{ width: '1px', height: '16px', background: borderSoft, marginLeft: '4px' }} />

          {/* Snap toggle */}
          <button style={{
            padding: '4px 8px', borderRadius: '4px', fontSize: '9px',
            border: `1px solid ${borderSoft}`, background: 'transparent',
            color: textDim, cursor: 'pointer', fontFamily: fonts.mono,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '3px', verticalAlign: 'middle' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Snap
          </button>
        </div>
      </div>

      {/* Tracks area */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '8px 16px',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {/* Time ruler */}
        <div style={{
          display: 'flex', gap: '0', marginBottom: '2px',
          fontFamily: fonts.mono, fontSize: '8px', color: textDim,
          position: 'relative', height: '14px', marginLeft: '60px',
        }}>
          {timeMarkers.map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${m.pos}%`, top: 0,
              transform: 'translateX(-50%)',
            }}>
              {m.label}
            </div>
          ))}
        </div>

        {/* Tracks */}
        {tracks.map(track => (
          <div key={track.id}
            onClick={() => setSelectedTrackId(track.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '32px',
              background: selectedTrackId === track.id ? brandDim : 'transparent',
              borderRadius: '6px',
              border: `1px solid ${selectedTrackId === track.id ? brandBorder : 'transparent'}`,
              transition: 'all 0.15s', cursor: 'pointer',
            }}>
            {/* Track label */}
            <div style={{
              width: '52px', flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: fonts.mono, fontSize: '8px', color: textDim,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {track.label}
            </div>

            {/* Track content */}
            <div ref={el => { timelineRef.current = el; trackContentRef.current = el }} onClick={handleTimelineClick}
              style={{
                flex: 1, position: 'relative', height: '100%', minWidth: 0,
              }}>
              {/* Waveform for video */}
              {track.type === 'video' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', gap: '2px', padding: '0 4px',
                  pointerEvents: 'none',
                }}>
                  {waveformBars.map((bar, i) => (
                    <div key={i} style={{
                      width: '3px', borderRadius: '2px',
                      height: `${bar.height}%`,
                      background: bar.active ? borderStrong : borderSoft,
                      transition: 'background 0.2s', opacity: 0.6,
                    }} />
                  ))}
                </div>
              )}

              {/* Track items */}
              {track.items.map(item => {
                const isDragging = drag?.trackId === track.id && drag?.itemId === item.id
                const displayItem = isDragging && liveItem ? liveItem : item
                const canEdit = track.type === 'text'
                return (
                  <div key={item.id}
                    onMouseDown={e => canEdit && handleItemMouseDown(e, track, item, 'move')}
                    style={{
                      position: 'absolute', top: '3px', bottom: '3px',
                      left: `${displayItem.start * timelineZoom}%`,
                      width: `${(displayItem.end - displayItem.start) * timelineZoom}%`,
                      borderRadius: '4px', cursor: canEdit ? 'move' : 'pointer',
                      display: 'flex', alignItems: 'center', padding: '0 8px',
                      overflow: 'hidden', transition: isDragging ? 'none' : 'all 0.15s',
                      background: track.type === 'video' ? 'rgba(59,130,246,0.15)' :
                                 track.type === 'audio' ? 'rgba(34,197,94,0.15)' :
                                 track.type === 'music' ? brandDim :
                                 brandDim,
                      border: `1px solid ${
                        track.type === 'video' ? 'rgba(59,130,246,0.3)' :
                        track.type === 'audio' ? 'rgba(34,197,94,0.3)' :
                        track.type === 'music' ? brandBorder :
                        brandBorder
                      }`,
                      zIndex: isDragging ? 10 : 1,
                    }}>
                    {canEdit && (
                      <>
                        <div onMouseDown={e => handleItemMouseDown(e, track, item, 'resize-left')}
                          style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                            cursor: 'w-resize', zIndex: 2,
                          }} />
                        <div onMouseDown={e => handleItemMouseDown(e, track, item, 'resize-right')}
                          style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px',
                            cursor: 'e-resize', zIndex: 2,
                          }} />
                      </>
                    )}
                    <span style={{
                      fontFamily: fonts.mono, fontSize: '8px',
                      color: track.type === 'video' ? '#60a5fa' :
                            track.type === 'audio' ? '#4ade80' :
                            track.type === 'music' ? brand : brand,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis', userSelect: 'none',
                    }}>
                      {displayItem.label}
                    </span>
                  </div>
                )
              })}

              {/* Selection region */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${trimStart}%`, width: `${trimEnd - trimStart}%`,
                background: brandDim, pointerEvents: 'none',
                borderLeft: `1px solid ${brand}`,
                borderRight: `1px solid ${brand}`,
                opacity: 0.5,
              }} />

              {/* Playhead */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '2px',
                background: brand, zIndex: 6, pointerEvents: 'none',
                left: `${playheadPos}%`,
                boxShadow: `0 0 8px ${brandGlow}`,
                transition: 'left 0.05s linear',
              }}>
                <div style={{
                  position: 'absolute', top: '-4px', left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: brand,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Playback controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '16px', padding: '8px 0', borderTop: `1px solid ${borderSoft}`,
        flexShrink: 0,
      }}>
        <button onClick={skipBack}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            border: `1px solid ${borderSoft}`, background: 'transparent',
            color: textDim, cursor: 'pointer', fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line y1="4" x2="5" y2="4" x1="5"/><line y1="20" x2="5" y2="20" x1="5"/></svg>
        </button>

        <button onClick={() => {
          if (!videoRef?.current) return
          if (isPlaying) videoRef.current.pause()
          else videoRef.current.play().catch(() => {})
        }}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: brandGrad, color: '#000', border: 'none',
            cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: isPlaying ? `0 0 20px ${brandGlow}` : 'none',
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            {isPlaying
              ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
              : <polygon points="5 3 19 12 5 21 5 3"/>
            }
          </svg>
        </button>

        <button onClick={skipForward}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            border: `1px solid ${borderSoft}`, background: 'transparent',
            color: textDim, cursor: 'pointer', fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg>
        </button>
      </div>
    </div>
  )
}
