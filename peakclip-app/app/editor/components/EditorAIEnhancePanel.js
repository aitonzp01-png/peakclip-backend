'use client'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, surface, borderSoft, hoverBg } from '../../../lib/editor-tokens'

const aiTools = [
  { id: 'faceTracking', label: 'Seguimiento facial', icon: 'faceTracking' },
  { id: 'smartCrop', label: 'Recorte inteligente', icon: 'smartCrop' },
  { id: 'backgroundRemoval', label: 'Quitar fondo', icon: 'backgroundRemoval' },
  { id: 'upscale', label: 'Mejorar calidad', icon: 'upscale' },
]

const icons = {
  faceTracking: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="9" r="3"/><path d="M12 14c4 0 6 2 6 2"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>,
  smartCrop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>,
  backgroundRemoval: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3L3 21h18L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  upscale: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 3 21 3 21 9"/><line x1="12" y1="12" x2="21" y2="3"/><circle cx="12" cy="12" r="9"/></svg>,
}

export default function EditorAIEnhancePanel() {
  const { applyAIEnhance, aiPending } = useEditorStore()

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {aiTools.map(tool => (
        <div key={tool.id} onClick={() => applyAIEnhance(tool.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 10px', borderRadius: 8,
            background: surface, border: `1px solid ${borderSoft}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = surface}
        >
          <span style={{ color: brand }}>{icons[tool.icon]}</span>
          <span style={{ color: textPrimary, fontSize: 12, fontWeight: 500 }}>{tool.label}</span>
          {aiPending[tool.id] && (
            <span style={{ marginLeft: 'auto', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(196,255,61,0.3)', borderTopColor: brand, animation: 'spin 0.6s linear infinite' }} />
          )}
        </div>
      ))}
    </div>
  )
}
