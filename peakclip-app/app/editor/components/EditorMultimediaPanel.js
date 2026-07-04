'use client'
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, borderSoft, surface, brandDim } from '../../../lib/editor-tokens'

export default function EditorMultimediaPanel() {
  const { addMediaTrack } = useEditorStore()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    const url = URL.createObjectURL(file)
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image'
    addMediaTrack({ type, url, name: file.name })
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        style={{
          padding: '20px 12px', borderRadius: 8, textAlign: 'center',
          border: `2px dashed ${dragOver ? brand : borderSoft}`,
          background: dragOver ? brandDim : surface,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? brand : textDim} strokeWidth="1.5" style={{ marginBottom: 6 }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div style={{ color: dragOver ? brand : textDim, fontSize: 11, fontWeight: 500 }}>Arrastra archivos aqu&iacute;</div>
        <div style={{ color: textDim, fontSize: 9, marginTop: 2 }}>Video, audio o imagen</div>
      </div>
      <input type="file" accept="video/*,audio/*,image/*" id="media-upload" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) { handleFile(f); e.target.value = '' } }}
      />
      <label htmlFor="media-upload"
        style={{
          display: 'block', textAlign: 'center', padding: '8px 0', borderRadius: 6,
          background: bgSecondary, border: `1px solid ${borderSoft}`,
          color: textPrimary, fontSize: 12, cursor: 'pointer', fontWeight: 500,
        }}
      >
        Seleccionar archivos
      </label>
    </div>
  )
}
