'use client'
import { useState, useEffect, useRef } from 'react'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import { formatTime, aspectRatios } from '../../../lib/utils'
import useEditorStore from '../store/editorStore'
import icons from '../../../lib/icons'
import { updateClip } from '../../../lib/api'

export default function EditorTopBar({ videoRef }) {
  const {
    clip, volume, playbackSpeed,
    aspectRatio, user,
    setVolume, setPlaybackSpeed,
    setAspectRatio, setShowExportModal, setKeyboardHint, showHint,
  } = useEditorStore()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const titleInputRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showUserMenu])

  const startEditingTitle = () => {
    setTitleInput(clip?.title || 'New Project')
    setEditingTitle(true)
  }

  const saveTitle = async () => {
    const trimmed = titleInput.trim()
    if (!trimmed) { setEditingTitle(false); return }
    if (clip?.id && !clip.id.startsWith('demo_')) {
      await updateClip(clip.id, { title: trimmed })
    }
    const store = useEditorStore.getState()
    store.setClip({ ...clip, title: trimmed })
    setEditingTitle(false)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') saveTitle()
    if (e.key === 'Escape') setEditingTitle(false)
  }

  const handleLogout = async () => {
    const { getSupabaseClient } = await import('../../../lib/supabase')
    await getSupabaseClient().auth.signOut()
    window.location.href = '/login'
  }

  const handleExport = () => {
    if (!clip?.id || !user) return
    setShowExportModal(true)
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
        <div className="editor-topbar-project" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={!editingTitle ? startEditingTitle : undefined}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: '13px', fontFamily: fonts.body, fontWeight: '500',
                color: textPrimary, background: bgSecondary,
                border: `1px solid ${brandBorder}`, borderRadius: '6px',
                padding: '4px 8px', outline: 'none', width: '180px',
              }}
            />
          ) : (
            <>
              <span style={{
                fontSize: '13px', color: textSecondary, fontFamily: fonts.body,
                fontWeight: '500', borderBottom: `1px dashed ${borderSoft}`,
              }}>
                {clip?.title?.slice(0, 30) || 'New Project'}
              </span>
              <span style={{ color: textDim, opacity: 0.4, display: 'flex' }}>{icons.pencil}</span>
            </>
          )}
          {clip?.video_url && !editingTitle && (
            <a href={clip.video_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: brand, textDecoration: 'none', opacity: 0.7 }}>
              {icons.externalLink} Source
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
        <button onClick={handleExport}
          style={{
            background: brandGrad, color: '#000', border: 'none',
            borderRadius: '10px', padding: '10px 24px', fontWeight: '700',
            cursor: 'pointer', fontSize: '13px',
            fontFamily: fonts.body,
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s', letterSpacing: '0.5px',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px ${brandGlow}` }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L8 11M8 11L4 7M8 11L12 7M2 14H14" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export
        </button>

        {/* Profile with dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <div onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: brandGrad, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '13px', fontWeight: '700',
              color: '#000', cursor: 'pointer',
              border: `2px solid ${showUserMenu ? brand : brandDim}`,
              transition: 'border-color 0.15s',
            }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: surface, border: `1px solid ${borderSoft}`,
              borderRadius: '12px', padding: '6px', minWidth: '180px',
              zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <div style={{
                padding: '8px 12px', borderBottom: `1px solid ${borderSoft}`,
                marginBottom: '4px',
              }}>
                <div style={{ fontSize: '12px', color: textPrimary, fontWeight: '600' }}>{user?.email}</div>
              </div>
              <button onClick={() => { window.location.href = '/dashboard' }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', border: 'none', background: 'none',
                  color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                  fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = textPrimary }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                <span style={{ display: 'flex', color: textDim }}>{icons.grid}</span>
                Dashboard
              </button>
              <button onClick={() => { window.location.href = '/dashboard?tab=settings' }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', border: 'none', background: 'none',
                  color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                  fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = textPrimary }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                <span style={{ display: 'flex', color: textDim }}>{icons.settings}</span>
                Settings
              </button>
              <button onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', border: 'none', background: 'none',
                  color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                  fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                  borderTop: `1px solid ${borderSoft}`, marginTop: '4px', paddingTop: '10px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = '#EF4444' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                <span style={{ display: 'flex', color: textDim }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


