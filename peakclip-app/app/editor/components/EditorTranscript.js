'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import useEditorStore from '../store/editorStore'
import { bgSecondary, textPrimary, textSecondary, textDim, brand, borderSoft, hoverBg, brandDim, brandBorder, fonts } from '../../../lib/editor-tokens'

export default function EditorTranscript({ videoRef }) {
  const { transcript, currentTime, setCurrentTime, setPlayheadPos, updateWord, toggleWordDeleted } = useEditorStore()
  const [contextMenu, setContextMenu] = useState(null)
  const [editingWordId, setEditingWordId] = useState(null)
  const [editText, setEditText] = useState('')
  const containerRef = useRef(null)
  const activeWordRef = useRef(null)

  const activeWordIndex = transcript.findIndex(
    w => !w.deleted && currentTime >= w.startTime && currentTime <= w.endTime
  )

  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current
      const wordEl = activeWordRef.current
      const containerRect = container.getBoundingClientRect()
      const wordRect = wordEl.getBoundingClientRect()
      if (wordRect.top < containerRect.top + 60 || wordRect.bottom > containerRect.bottom - 60) {
        wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeWordIndex])

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

  const handleEditStart = (word) => {
    setEditingWordId(word.id)
    setEditText(word.word)
    setContextMenu(null)
  }

  const handleEditSave = () => {
    if (editingWordId && editText.trim()) {
      updateWord(editingWordId, { word: editText.trim() })
    }
    setEditingWordId(null)
    setEditText('')
  }

  const handleDeleteWord = (wordId) => {
    toggleWordDeleted(wordId)
    setContextMenu(null)
  }

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    const ms = Math.floor((s - Math.floor(s)) * 1000)
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  return (
    <div style={{
      width: 320, height: '100%',
      background: bgSecondary, borderRight: `1px solid ${borderSoft}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '10px 16px', display: 'flex', gap: 6, alignItems: 'center',
        borderBottom: `1px solid ${borderSoft}`,
      }}>
        <span style={{
          fontSize: '11px', fontWeight: '700', color: textPrimary,
          fontFamily: fonts.body, letterSpacing: '0.5px',
        }}>
          Transcription
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: fonts.mono, fontSize: '9px', color: textDim }}>
          {transcript.filter(w => !w.deleted).length} words
        </span>
      </div>

      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto', padding: '8px 12px',
      }}>
        {transcript.length === 0 && (
          <div style={{ color: textDim, textAlign: 'center', paddingTop: 40, fontSize: 13 }}>
            No transcription available
          </div>
        )}
        {transcript.map((word, idx) => {
          const isActive = idx === activeWordIndex
          return (
            <span
              key={word.id}
              ref={isActive ? activeWordRef : null}
              onClick={() => jumpToWord(word)}
              onContextMenu={(e) => handleContextMenu(e, word)}
              style={{
                cursor: 'pointer',
                borderRadius: '3px',
                padding: '1px 2px',
                display: 'inline-block',
                background: isActive ? brand : 'transparent',
                color: word.deleted ? textDim : isActive ? '#0f0f0f' : textPrimary,
                fontWeight: isActive ? 700 : 400,
                textDecoration: word.deleted ? 'line-through' : 'none',
                fontSize: 14,
                lineHeight: 1.8,
                transition: 'all 0.08s',
              }}
              title={`${formatTime(word.startTime)} \u2192 ${formatTime(word.endTime)}`}
            >
              {word.word}
              {' '}
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
            { label: 'Edit word', action: () => handleEditStart(contextMenu.word) },
            { label: 'Delete word', action: () => handleDeleteWord(contextMenu.word.id) },
            { label: `Jump to ${formatTime(contextMenu.word.startTime)}`, action: () => {
              jumpToWord(contextMenu.word)
              setContextMenu(null)
            }},
            { label: 'Copy text', action: () => {
              navigator.clipboard.writeText(contextMenu.word.word)
              setContextMenu(null)
            }},
          ].map((item) => (
            <button key={item.label} onClick={item.action}
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

      {editingWordId && (
        <div style={{
          padding: '8px 12px', borderTop: `1px solid ${borderSoft}`,
          display: 'flex', gap: 6,
        }}>
          <input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditingWordId(null) }}
            autoFocus
            style={{
              flex: 1, padding: '6px 10px', borderRadius: '6px',
              border: `1px solid ${brandBorder}`, fontSize: 13,
              outline: 'none',
            }}
          />
          <button onClick={handleEditSave}
            style={{
              padding: '6px 12px', borderRadius: '6px',
              background: brandDim, border: `1px solid ${brandBorder}`,
              color: brand, fontWeight: 700, fontSize: 11, cursor: 'pointer',
            }}>
            Save
          </button>
        </div>
      )}
    </div>
  )
}
