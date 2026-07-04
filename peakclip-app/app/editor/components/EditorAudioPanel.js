'use client'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, borderSoft } from '../../../lib/editor-tokens'
import { musicTracks } from '../../../lib/utils'

export default function EditorAudioPanel() {
  const { originalVolume, setOriginalVolume, audioCleanEnabled, setAudioCleanEnabled, musicTrack, setMusicTrack, musicVolume, setMusicVolume } = useEditorStore()

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>VOLUMEN ORIGINAL ({originalVolume}%)</label>
        <input type="range" min={0} max={100} value={originalVolume} onChange={e => setOriginalVolume(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: textPrimary, fontSize: 12, fontWeight: 500 }}>Limpiar ruido de fondo</span>
        <button onClick={() => setAudioCleanEnabled(!audioCleanEnabled)}
          style={{
            width: 36, height: 20, borderRadius: 10, border: 'none',
            background: audioCleanEnabled ? brand : borderSoft,
            cursor: 'pointer', position: 'relative',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, width: 16, height: 16,
            background: '#fff', borderRadius: '50%',
            transform: audioCleanEnabled ? 'translateX(18px)' : 'translateX(2px)',
            transition: 'transform 0.2s',
          }} />
        </button>
      </div>
      <div style={{ borderTop: `1px solid ${borderSoft}`, paddingTop: 12 }}>
        <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>M&Uacute;SICA DE FONDO</label>
        <select value={musicTrack} onChange={e => setMusicTrack(e.target.value)}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: bgSecondary, border: `1px solid ${borderSoft}`, color: textPrimary, fontSize: 12 }}
        >
          {musicTracks.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>
      {musicTrack !== 'none' && (
        <div>
          <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>VOLUMEN M&Uacute;SICA ({musicVolume}%)</label>
          <input type="range" min={0} max={100} value={musicVolume} onChange={e => setMusicVolume(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      )}
    </div>
  )
}
