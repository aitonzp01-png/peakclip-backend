'use client'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, borderSoft, hoverBg } from '../../../lib/editor-tokens'

const tools = [
  { id: 'select', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg> },
  { id: 'hand', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8"/><path d="M18 8a2 2 0 014 0v6a8 8 0 01-8 8h-2c-2.21 0-4.21-.9-5.66-2.34L3.5 14.5a1.5 1.5 0 012.12-2.12L7 13.5"/></svg> },
  { id: 'razor', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="2" x2="12" y2="22"/></svg> },
  { id: 'crop', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg> },
  { id: 'text', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 7 4 4 20 4 20 7"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg> },
  { id: 'sticker', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
]

export default function EditorToolsBar({ activeTool, setActiveTool }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      padding: '4px 8px', background: bgSecondary, borderRadius: 8, border: `1px solid ${borderSoft}`,
    }}>
      {tools.map(t => (
        <button key={t.id} onClick={() => setActiveTool(t.id === activeTool ? null : t.id)}
          style={{
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeTool === t.id ? brand : 'transparent',
            color: activeTool === t.id ? '#0f0f0f' : textDim,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { if (activeTool !== t.id) e.currentTarget.style.background = hoverBg }}
          onMouseLeave={e => { if (activeTool !== t.id) e.currentTarget.style.background = 'transparent' }}
          title={t.id}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
