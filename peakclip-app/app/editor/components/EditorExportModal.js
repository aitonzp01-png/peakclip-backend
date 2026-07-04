'use client'
import { useState } from 'react'
import { bgSecondary, textPrimary, textSecondary, textDim, brand, borderSoft, surface } from '../../../lib/editor-tokens'

const resolutions = ['720p', '1080p', '4K']
const formats = ['MP4', 'MOV', 'WebM']

export default function EditorExportModal({ onClose }) {
  const [res, setRes] = useState('1080p')
  const [fmt, setFmt] = useState('MP4')
  const [includeSubs, setIncludeSubs] = useState(true)

  const handleExport = () => {
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(4px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', border: `1px solid ${borderSoft}`,
        borderRadius: 16, width: '100%', maxWidth: 400, padding: 24,
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: textPrimary, fontWeight: 900, fontSize: 20, margin: 0, marginBottom: 4 }}>Exportar clip</h2>
        <p style={{ color: textSecondary, fontSize: 13, margin: 0, marginBottom: 24 }}>Elige el formato y calidad para exportar.</p>

        <label style={{ color: textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Resoluci&oacute;n</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {resolutions.map(r => (
            <button key={r} onClick={() => setRes(r)}
              style={{
                padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid',
                background: res === r ? brand : 'transparent',
                color: res === r ? '#0f0f0f' : textSecondary,
                borderColor: res === r ? brand : borderSoft,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{r}</button>
          ))}
        </div>

        <label style={{ color: textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Formato</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
          {formats.map(f => (
            <button key={f} onClick={() => setFmt(f)}
              style={{
                padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid',
                background: fmt === f ? brand : 'transparent',
                color: fmt === f ? '#0f0f0f' : textSecondary,
                borderColor: fmt === f ? brand : borderSoft,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{f}</button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, padding: '12px 16px',
          background: surface, borderRadius: 12,
        }}>
          <span style={{ color: textPrimary, fontSize: 13, fontWeight: 500 }}>Incluir subt&iacute;tulos</span>
          <button onClick={() => setIncludeSubs(!includeSubs)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none',
              background: includeSubs ? brand : borderSoft,
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 20, height: 20,
              background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s',
              transform: includeSubs ? 'translateX(20px)' : 'translateX(2px)',
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              border: `1px solid ${borderSoft}`,
              background: 'transparent', color: textSecondary,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >Cancelar</button>
          <button onClick={handleExport}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: brand, color: '#0f0f0f', border: 'none',
              fontWeight: 900, fontSize: 13, cursor: 'pointer',
            }}
          >Exportar clip</button>
        </div>
      </div>
    </div>
  )
}
