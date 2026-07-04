'use client'
import { useState } from 'react'
import { brand, brandGrad, brandDim, brandBorder, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, fonts } from '../../../lib/editor-tokens'
import useEditorStore from '../store/editorStore'
import { getSupabaseClient } from '../../../lib/supabase'
import { generateSRT } from '../../../lib/subtitles'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const resolutions = [
  { id: '720p', label: '720p', res: '720×1280', desc: 'Fast export, good quality' },
  { id: '1080p', label: '1080p', res: '1080×1920', desc: 'Standard HD quality' },
  { id: '4k', label: '4K', res: '2160×3840', desc: 'Maximum quality' },
]

const formats = [
  { id: 'mp4', label: 'MP4', desc: 'Best compatibility' },
  { id: 'mov', label: 'MOV', desc: 'High quality' },
  { id: 'webm', label: 'WEBM', desc: 'Web optimized' },
]

export default function ExportModal() {
  const { showExportModal, setShowExportModal, saving, exportStatus, exportUrl, clip, user } = useEditorStore()
  const [resolution, setResolution] = useState('1080p')
  const [format, setFormat] = useState('mp4')
  const [fps, setFps] = useState(30)

  if (!showExportModal) return null

  const handleExport = async () => {
    if (!clip?.id || !user) return

    const store = useEditorStore.getState()
    store.setSaving(true)
    store.setExportStatus('Processing export...')
    store.setExportUrl('')

    const { data: { session } } = await getSupabaseClient().auth.getSession()
    if (!session) {
      store.setExportStatus('Export failed: not authenticated')
      store.setSaving(false)
      return
    }

    try {
      const srtContent = generateSRT(store.subtitles || [])
      const response = await fetch(`${BACKEND_URL}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          clip_id: clip.id,
          video_url: clip.video_url || '',
          srt_content: srtContent,
          trim_start: store.trimStart || 0,
          trim_end: store.trimEnd || 100,
          subtitle_text: '',
          subtitle_style: store.subtitleStyle || 'bold-yellow',
          subtitle_position: store.subtitlePosition || 'bottom',
          font_size: store.fontSize || 20,
          watermark_text: store.watermark || '',
          watermark_position: store.watermarkPosition || 'top-right',
          music_track: store.music || 'none',
          music_volume: store.musicVolume || 30,
          include_audio: store.includeAudio || false,
          filter_style: store.activeFilter || 'none',
          resolution: resolution,
          format: format,
          fps: fps,
          face_tracking: store.faceTracking || false,
          face_data: store.faceData || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        store.setExportStatus('Clip exported successfully!')
        store.setExportUrl(data.video_url)
      } else {
        const err = await response.text()
        store.setExportStatus(`Export failed: ${err.slice(0, 100)}`)
      }
    } catch {
      store.setExportStatus('Export server unavailable. Try again later.')
    }
    store.setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease',
    }} onClick={() => { if (!saving) setShowExportModal(false) }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#ffffff', border: `1px solid ${borderSoft}`,
        borderRadius: '20px', width: '420px', maxWidth: '90vw',
        overflow: 'hidden', animation: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
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
          <button onClick={() => { if (!saving) setShowExportModal(false) }}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: `1px solid ${borderSoft}`, background: 'transparent',
              color: textDim, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {exportUrl ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', color: brand }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: textPrimary, marginBottom: '8px' }}>Export Complete!</div>
              <a href={exportUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px', borderRadius: '8px',
                  background: brandGrad, color: '#000', fontWeight: '700',
                  textDecoration: 'none', fontSize: '13px',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Clip
              </a>
            </div>
          ) : saving ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="2" className="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
              </div>
              <div style={{ fontSize: '13px', color: textSecondary }}>Exporting your clip...</div>
              {exportStatus && <div style={{ fontSize: '11px', color: textDim, marginTop: '8px' }}>{exportStatus}</div>}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono }}>
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

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono }}>
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

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono }}>
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

              {exportStatus && (
                <div style={{
                  padding: '12px', borderRadius: '8px', marginBottom: '16px',
                  background: exportStatus.includes('fail') || exportStatus.includes('Error') || exportStatus.includes('error') ? 'rgba(239,68,68,0.1)' : bgSecondary,
                  border: `1px solid ${
                    exportStatus.includes('fail') || exportStatus.includes('Error') || exportStatus.includes('error') ? 'rgba(239,68,68,0.2)' : borderSoft
                  }`,
                  fontSize: '12px', color: exportStatus.includes('fail') || exportStatus.includes('Error') || exportStatus.includes('error') ? '#ef4444' : textSecondary,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>{exportStatus}</span>
                </div>
              )}
            </>
          )}
        </div>

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
            {saving ? 'Close' : exportUrl ? 'Done' : 'Cancel'}
          </button>
          {!exportUrl && !saving && (
            <button onClick={handleExport}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: brandGrad, color: '#000', fontWeight: '700',
                cursor: 'pointer', fontSize: '12px',
                fontFamily: fonts.body,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L8 11M8 11L4 7M8 11L12 7M2 14H14" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}