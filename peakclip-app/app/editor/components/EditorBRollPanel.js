'use client'
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, surface, borderSoft, hoverBg } from '../../../lib/editor-tokens'

const stockCategories = [
  { id: 'business', label: 'Negocios' },
  { id: 'nature', label: 'Naturaleza' },
  { id: 'tech', label: 'Tecnolog&iacute;a' },
  { id: 'people', label: 'Personas' },
  { id: 'urban', label: 'Urbano' },
  { id: 'abstract', label: 'Abstracto' },
]

const stockClips = [
  { id: 'b1', category: 'business', thumb: null, label: 'Oficina moderna' },
  { id: 'b2', category: 'business', thumb: null, label: 'Reuni&oacute;n equipo' },
  { id: 'n1', category: 'nature', thumb: null, label: 'Monta&ntilde;as' },
  { id: 'n2', category: 'nature', thumb: null, label: 'Olas mar' },
  { id: 't1', category: 'tech', thumb: null, label: 'C&oacute;digo pantalla' },
  { id: 't2', category: 'tech', thumb: null, label: 'Servidores' },
  { id: 'p1', category: 'people', thumb: null, label: 'Trabajo remoto' },
  { id: 'p2', category: 'people', thumb: null, label: 'Caminando calle' },
  { id: 'u1', category: 'urban', thumb: null, label: 'Ciudad noche' },
  { id: 'u2', category: 'urban', thumb: null, label: 'Tr&aacute;fico' },
  { id: 'a1', category: 'abstract', thumb: null, label: 'Part&iacute;culas' },
  { id: 'a2', category: 'abstract', thumb: null, label: 'Ondas' },
]

export default function EditorBRollPanel() {
  const [activeCat, setActiveCat] = useState('business')
  const { addClipToTimeline } = useEditorStore()

  const filtered = stockClips.filter(c => c.category === activeCat)

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
        {stockCategories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)}
            style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
              background: activeCat === cat.id ? brand : surface,
              color: activeCat === cat.id ? '#0f0f0f' : textDim,
              border: 'none', cursor: 'pointer',
            }}
            dangerouslySetInnerHTML={{ __html: cat.label }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {filtered.map(clip => (
          <div key={clip.id} onClick={() => addClipToTimeline(clip.id)}
            style={{
              height: 60, borderRadius: 6,
              background: surface,
              border: `1px solid ${borderSoft}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textDim} strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span style={{ fontSize: 9, color: textDim, fontWeight: 500 }}>{clip.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
