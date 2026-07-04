'use client'
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, borderSoft, hoverBg, brandDim, brandBorder } from '../../../lib/editor-tokens'

export default function EditorTextPanel() {
  const { textOverlays, addTextOverlay, updateTextOverlay, removeTextOverlay, selectedTextId, setSelectedTextId } = useEditorStore()
  const selected = textOverlays.find(t => t.id === selectedTextId)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 12 }}>
      <button onClick={() => addTextOverlay({ text: 'Nuevo texto' })}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8,
          background: brandDim, border: `1px solid ${brandBorder}`,
          color: brand, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 12,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        A&ntilde;adir texto
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {textOverlays.map(t => (
          <div key={t.id} onClick={() => setSelectedTextId(t.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              background: selectedTextId === t.id ? hoverBg : 'transparent',
              border: `1px solid ${selectedTextId === t.id ? borderSoft : 'transparent'}`,
            }}
          >
            <span style={{ color: textPrimary, fontSize: 12, fontWeight: 500 }}>{t.text}</span>
            <button onClick={(e) => { e.stopPropagation(); removeTextOverlay(t.id) }}
              style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer', padding: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>TEXTO</label>
            <input value={selected.text} onChange={e => updateTextOverlay(selected.id, { text: e.target.value })}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: bgSecondary, border: `1px solid ${borderSoft}`, color: textPrimary, fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>COLOR</label>
            <input type="color" value={selected.color || '#ffffff'} onChange={e => updateTextOverlay(selected.id, { color: e.target.value })}
              style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>TAMA&Ntilde;O ({selected.fontSize || 24}px)</label>
            <input type="range" min={12} max={120} value={selected.fontSize || 24} onChange={e => updateTextOverlay(selected.id, { fontSize: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
