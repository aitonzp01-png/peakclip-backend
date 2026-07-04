'use client'
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, borderSoft } from '../../../lib/editor-tokens'

export default function EditorBrandPanel() {
  const { brandSettings, setBrandSettings } = useEditorStore()

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>COLOR PRINCIPAL</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="color" value={brandSettings.primaryColor} onChange={e => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
            style={{ width: 36, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          />
          <span style={{ color: textDim, fontSize: 11, fontFamily: 'monospace' }}>{brandSettings.primaryColor}</span>
        </div>
      </div>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>COLOR SECUNDARIO</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="color" value={brandSettings.secondaryColor} onChange={e => setBrandSettings({ ...brandSettings, secondaryColor: e.target.value })}
            style={{ width: 36, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          />
          <span style={{ color: textDim, fontSize: 11, fontFamily: 'monospace' }}>{brandSettings.secondaryColor}</span>
        </div>
      </div>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>LOGO</label>
        <div
          style={{
            width: '100%', height: 80, borderRadius: 6,
            border: `1px dashed ${borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ color: textDim, fontSize: 11 }}>Arrastra o selecciona logo</span>
        </div>
      </div>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>WATERMARK</label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: textPrimary, fontSize: 12, fontWeight: 500 }}>Mostrar marca de agua</span>
          <button onClick={() => setBrandSettings({ ...brandSettings, watermark: !brandSettings.watermark })}
            style={{
              width: 36, height: 20, borderRadius: 10, border: 'none',
              background: brandSettings.watermark ? brand : borderSoft,
              cursor: 'pointer', position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 16, height: 16,
              background: '#fff', borderRadius: '50%',
              transform: brandSettings.watermark ? 'translateX(18px)' : 'translateX(2px)',
              transition: 'transform 0.2s',
            }} />
          </button>
        </div>
      </div>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>POSICI&Oacute;N WATERMARK</label>
        <select value={brandSettings.watermarkPosition} onChange={e => setBrandSettings({ ...brandSettings, watermarkPosition: e.target.value })}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: bgSecondary, border: `1px solid ${borderSoft}`, color: textPrimary, fontSize: 12 }}
        >
          <option value="bottom-right">Inferior derecha</option>
          <option value="bottom-left">Inferior izquierda</option>
          <option value="top-right">Superior derecha</option>
          <option value="top-left">Superior izquierda</option>
        </select>
      </div>
    </div>
  )
}
