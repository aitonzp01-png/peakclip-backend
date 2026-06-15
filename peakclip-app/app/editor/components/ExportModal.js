'use client'
import { useState } from 'react'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import useEditorStore from '../store/editorStore'

const resolutions = [
  { id: '720p', label: '720p', res: '1280×720', desc: 'Fast export, good quality' },
  { id: '1080p', label: '1080p', res: '1920×1080', desc: 'Standard HD quality' },
  { id: '4k', label: '4K', res: '3840×2160', desc: 'Maximum quality' },
]

const formats = [
  { id: 'mp4', label: 'MP4', desc: 'Best compatibility' },
  { id: 'mov', label: 'MOV', desc: 'High quality' },
  { id: 'webm', label: 'WEBM', desc: 'Web optimized' },
]

export default function ExportModal() {
  const { showExportModal, setShowExportModal, saving, exportStatus, exportUrl } = useEditorStore()
  const [resolution, setResolution] = useState('1080p')
  const [format, setFormat] = useState('mp4')
  const [fps, setFps] = useState(30)

  if (!showExportModal) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease',
    }} onClick={() => setShowExportModal(false)}>
      <div onClick={e => e.stopPropagation()} style={{
        background: surface, border: `1px solid ${borderSoft}`,
        borderRadius: '20px', width: '420px', maxWidth: '90vw',
        overflow: 'hidden', animation: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: `1px solid ${borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: fonts.display, letterSpacing: '1px' }}>
              Export Clip
            </div>
            <div style={{ fontSize: '11px', color: textDim, marginTop: '2px' }}>
              Choose your export settings
            </div>
          </div>
          <button onClick={() => setShowExportModal(false)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: `1px solid ${borderSoft}`, background: 'transparent',
              color: textDim, cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Resolution */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '10px', color: textDim, textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono,
            }}>
              Resolution
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {resolutions.map(r => (
                <button key={r.id} onClick={() => setResolution(r.id)}
                  style={{
                    flex: 1, background: resolution === r.id ? brandDim : bgSecondary,
                    border: `1px solid ${resolution === r.id ? brand : borderSoft}`,
                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: resolution === r.id ? brand : textPrimary, fontFamily: fonts.display }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: '10px', color: textDim, marginTop: '2px' }}>{r.res}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '10px', color: textDim, textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono,
            }}>
              Format
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {formats.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  style={{
                    flex: 1, background: format === f.id ? brandDim : bgSecondary,
                    border: `1px solid ${format === f.id ? brand : borderSoft}`,
                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: format === f.id ? brand : textPrimary, fontFamily: fonts.display }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: '10px', color: textDim, marginTop: '2px' }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* FPS */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '10px', color: textDim, textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono,
            }}>
              Frame Rate
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[24, 30, 60].map(f => (
                <button key={f} onClick={() => setFps(f)}
                  style={{
                    flex: 1, background: fps === f ? brandDim : bgSecondary,
                    border: `1px solid ${fps === f ? brand : borderSoft}`,
                    borderRadius: '8px', padding: '10px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: fps === f ? brand : textPrimary, fontFamily: fonts.display }}>
                    {f}
                  </div>
                  <div style={{ fontSize: '10px', color: textDim }}>fps</div>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {exportStatus && (
            <div style={{
              padding: '12px', borderRadius: '8px', marginBottom: '16px',
              background: exportStatus.includes('success') ? brandDim :
                         exportStatus.includes('fail') || exportStatus.includes('Error') ? 'rgba(239,68,68,0.1)' :
                         bgSecondary,
              border: `1px solid ${
                exportStatus.includes('success') ? brandBorder :
                exportStatus.includes('fail') || exportStatus.includes('Error') ? 'rgba(239,68,68,0.2)' :
                borderSoft
              }`,
              fontSize: '12px', color: exportStatus.includes('success') ? brand :
                                     exportStatus.includes('fail') || exportStatus.includes('Error') ? '#ef4444' :
                                     textSecondary,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>{exportStatus.includes('success')
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9B44A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : exportStatus.includes('fail') || exportStatus.includes('Error')
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
              }</span>
              <span>{exportStatus}</span>
            </div>
          )}

          {/* Export URL */}
          {exportUrl && (
            <div style={{ marginBottom: '16px' }}>
              <a href={exportUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: brand, fontSize: '12px', textDecoration: 'underline' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download clip
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${borderSoft}`,
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button onClick={() => setShowExportModal(false)}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: `1px solid ${borderSoft}`,
              background: 'transparent', color: textSecondary, cursor: 'pointer',
              fontSize: '12px', fontFamily: fonts.body,
            }}>
            Cancel
          </button>
          <button onClick={() => setShowExportModal(false)} disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: brandGrad, color: '#000', fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer', fontSize: '12px',
              fontFamily: fonts.body, opacity: saving ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            {saving
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            } {saving ? 'Exporting...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
