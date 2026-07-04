'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import useEditorStore from '../store/editorStore'
import { bgSecondary, textPrimary, textSecondary, textDim, brand, borderSoft, hoverBg, brandDim, brandBorder } from '../../../lib/editor-tokens'
import icons from '../../../lib/icons'

export default function EditorTranscript({ videoRef }) {
  const {
    transcript, setTranscript, updateWord, toggleWordDeleted,
    currentTime, setCurrentTime, setPlayheadPos,
  } = useEditorStore()

  const [contextMenu, setContextMenu] = useState(null)
  const [audioClean, setAudioClean] = useState(false)
  const containerRef = useRef(null)

  const jumpToWord = useCallback((word) => {
    if (videoRef?.current && word.startTime != null) {
      videoRef.current.currentTime = word.startTime
      setCurrentTime(word.startTime)
      setPlayheadPos(videoRef.current.duration ? (word.startTime / videoRef.current.duration) * 100 : 0)
    }
  }, [videoRef, setCurrentTime, setPlayheadPos])

  const handleContextMenu = (e, word) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, word })
  }

  useEffect(() => {
    const close = () => setContextMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  return (
    <div style={{
      width: 320, height: '100%',
      background: bgSecondary, borderRight: `1px solid ${borderSoft}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 16px', display: 'flex', gap: 8,
        borderBottom: `1px solid ${borderSoft}`,
      }}>
        <button onClick={() => setAudioClean(!audioClean)}
          style={{
            padding: '4px 12px', borderRadius: 100,
            background: audioClean ? brandDim : hoverBg,
            border: `1px solid ${audioClean ? brandBorder : borderSoft}`,
            color: audioClean ? brand : textSecondary,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          Limpieza de audio
        </button>
      </div>

      <div style={{
        padding: '8px 16px', display: 'flex', gap: 12,
        borderBottom: `1px solid ${borderSoft}`,
      }}>
        <button style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer' }}>{icons.search}</button>
        <button style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer' }}>{icons.filter}</button>
        <button style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer' }}>{icons.download}</button>
      </div>

      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        fontSize: 14, lineHeight: 1.8,
      }}>
        {transcript.length === 0 && (
          <div style={{ color: textDim, textAlign: 'center', paddingTop: 40 }}>
            No hay transcripci&oacute;n disponible
          </div>
        )}
        {transcript.map((word) => {
          const isActive = currentTime >= word.startTime && currentTime <= word.endTime
          return (
            <span
              key={word.id}
              onClick={() => jumpToWord(word)}
              onContextMenu={(e) => handleContextMenu(e, word)}
              style={{
                cursor: 'pointer', borderRadius: 3, padding: '1px 2px',
                background: isActive ? brand : 'transparent',
                color: word.deleted ? textDim : isActive ? '#0f0f0f' : textPrimary,
                fontWeight: isActive ? 700 : 400,
                textDecoration: word.deleted ? 'line-through' : 'none',
                transition: 'all 0.1s',
              }}
            >
              {word.word}{' '}
            </span>
          )
        })}
      </div>

      {contextMenu && (
        <div style={{
          position: 'fixed', left: contextMenu.x, top: contextMenu.y,
          background: '#ffffff', border: `1px solid ${borderSoft}`,
          borderRadius: 8, padding: '4px 0', zIndex: 9999,
          minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {[
            { label: 'Eliminar esta palabra', action: () => toggleWordDeleted(contextMenu.word.id) },
            { label: 'Cortar clip aqu\u00ed', action: () => {} },
            { label: 'Copiar texto', action: () => navigator.clipboard.writeText(contextMenu.word.word) },
          ].map((item) => (
            <button key={item.label} onClick={() => { item.action(); setContextMenu(null) }}
              style={{
                display: 'block', width: '100%', padding: '8px 16px',
                background: 'none', border: 'none', color: textPrimary,
                fontSize: 13, textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => e.target.style.background = hoverBg}
              onMouseLeave={e => e.target.style.background = 'none'}
            >{item.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
