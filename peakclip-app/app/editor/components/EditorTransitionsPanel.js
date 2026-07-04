'use client'
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, surface, borderSoft, brandDim, brandBorder } from '../../../lib/editor-tokens'
import { transitionOptions } from '../../../lib/utils'

export default function EditorTransitionsPanel() {
  const { selectedTransition, setSelectedTransition, transitionDuration, setTransitionDuration } = useEditorStore()
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block' }}>TRANSICI&Oacute;N</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {transitionOptions.map(t => {
          const isSelected = selectedTransition === t.id
          return (
            <div key={t.id} onClick={() => setSelectedTransition(t.id)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '12px 8px', borderRadius: 8, textAlign: 'center',
                background: isSelected ? brandDim : surface,
                border: `1px solid ${isSelected ? brandBorder : borderSoft}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.id === 'none' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSelected ? brand : textDim} strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
              {t.id === 'fade' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSelected ? brand : textDim} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" opacity="0.5"/><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="2"/></svg>
              )}
              {(t.id === 'slide-left' || t.id === 'slide-right') && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSelected ? brand : textDim} strokeWidth="1.5"><polyline points={t.id === 'slide-left' ? '17 8 13 12 17 16' : '7 8 11 12 7 16'}/><line x1={t.id === 'slide-left' ? '7' : '17'} y1="12" x2={t.id === 'slide-left' ? '13' : '11'} y2="12"/></svg>
              )}
              {(t.id === 'zoom-in' || t.id === 'zoom-out') && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSelected ? brand : textDim} strokeWidth="1.5"><circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              )}
              {t.id === 'wipe' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSelected ? brand : textDim} strokeWidth="1.5"><path d="M4 4l16 16"/><path d="M4 8l12 12"/><path d="M4 12l8 8"/><path d="M4 16l4 4"/></svg>
              )}
              <div style={{ fontSize: 10, color: isSelected ? brand : textDim, marginTop: 4, fontWeight: 600 }}>{t.label}</div>
            </div>
          )
        })}
      </div>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>DURACI&Oacute;N ({transitionDuration}s)</label>
        <input type="range" min={0.1} max={1} step={0.05} value={transitionDuration} onChange={e => setTransitionDuration(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
    </div>
  )
}
