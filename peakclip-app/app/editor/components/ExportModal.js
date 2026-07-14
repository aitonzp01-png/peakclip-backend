'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { brand, brandGrad, brandDim, brandBorder, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, fonts } from '../../../lib/editor-tokens'
import useEditorStore from '../store/editorStore'
import { getSupabaseClient } from '../../../lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

const resolutions = [
  { id: '720p', label: '720p', res: '720x1280', desc: 'Fast export, good quality' },
  { id: '1080p', label: '1080p', res: '1080x1920', desc: 'Standard HD quality' },
  { id: '4k', label: '4K', res: '2160x3840', desc: 'Maximum quality' },
]

const formats = [
  { id: 'mp4', label: 'MP4', desc: 'Best compatibility' },
  { id: 'mov', label: 'MOV', desc: 'High quality' },
  { id: 'webm', label: 'WEBM', desc: 'Web optimized' },
]

export default function ExportModal() {
  const { showExportModal, setShowExportModal, clip, user } = useEditorStore()
  const [resolution, setResolution] = useState('1080p')
  const [format, setFormat] = useState('mp4')
  const [fps, setFps] = useState(30)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const abortRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(function cleanup() {
    return function () {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!showExportModal) return null

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return m + ':' + sec.toString().padStart(2, '0')
  }

  const handleExport = useCallback(async function handleExportFn() {
    const store = useEditorStore.getState()
    const {
      transcript, subtitleStyle, trimStart, trimEnd,
      musicTrack, musicVolume, activeFilter,
    } = store

    const subtitleWords = transcript
      .filter(function (w) { return !w.deleted && w.word })
      .map(function (w) {
        return { word: w.word, start: w.startTime, end: w.endTime, id: w.id }
      })

    setExporting(true)
    setProgress(0)
    setStatusText('Initializing export...')
    setResultUrl('')
    setElapsed(0)

    timerRef.current = setInterval(function () {
      setElapsed(function (prev) { return prev + 1 })
    }, 1000)

    var sessionResult = await getSupabaseClient().auth.getSession()
    if (!sessionResult.data?.session) {
      setStatusText('Not authenticated')
      setExporting(false)
      clearInterval(timerRef.current)
      return
    }

    var controller = new AbortController()
    abortRef.current = controller

    var progressInterval = setInterval(function () {
      setProgress(function (prev) { return Math.min(85, prev + Math.random() * 3) })
    }, 2000)

    try {
      setStatusText('Sending video to server...')
      var response = await fetch(BACKEND_URL + '/export', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionResult.data.session.access_token,
        },
        body: JSON.stringify({
          clip_id: clip.id,
          video_url: clip.video_url || '',
          trim_start: Math.max(0, Math.min(100, trimStart || 0)),
          trim_end: Math.max(0, Math.min(100, trimEnd || 100)),
          subtitle_text: subtitleWords.map(function (w) { return w.word }).join(' '),
          subtitle_style: 'custom',
          subtitle_position: subtitleStyle.positionY < 40 ? 'top' : subtitleStyle.positionY > 60 ? 'bottom' : 'bottom',
          subtitle_style_obj: subtitleStyle,
          subtitle_words: subtitleWords,
          font_size: subtitleStyle.fontSize || 28,
          watermark_text: '',
          watermark_position: 'top-right',
          music_track: musicTrack || 'none',
          music_volume: musicVolume || 30,
          filter_style: activeFilter || 'none',
          resolution: resolution,
          format: format,
          fps: fps,
        }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        var errText = await response.text().catch(function () { return 'Export failed' })
        setStatusText('Export failed: ' + errText.slice(0, 150))
        setProgress(0)
        setExporting(false)
        clearInterval(timerRef.current)
        return
      }

      setProgress(90)
      setStatusText('Processing complete, preparing download...')

      var data = await response.json()
      setProgress(100)
      setStatusText('Export complete!')

      var downloadUrl = data.video_url
      setResultUrl(downloadUrl)

      setTimeout(function () {
        if (downloadUrl) {
          var a = document.createElement('a')
          a.href = downloadUrl
          a.download = 'video_editado.mp4'
          a.target = '_blank'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }, 500)
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatusText('Export cancelled')
      } else {
        setStatusText('Error: ' + (err.message || 'Export failed').slice(0, 100))
      }
      setProgress(0)
    } finally {
      setExporting(false)
      clearInterval(progressInterval)
      clearInterval(timerRef.current)
      abortRef.current = null
    }
  }, [clip, resolution, format, fps])

  const handleCancel = function handleCancelFn() {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setExporting(false)
    setProgress(0)
    setStatusText('Cancelled')
    clearInterval(timerRef.current)
  }

  var estimatedTotal = format === 'mp4' ? 30 : format === 'mov' ? 45 : 60
  var remaining = Math.max(0, estimatedTotal - elapsed)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }} onClick={function () { if (!exporting && !resultUrl) setShowExportModal(false) }}>
      <div onClick={function (e) { e.stopPropagation() }} style={{
        background: '#ffffff', border: '1px solid ' + borderSoft,
        borderRadius: '20px', width: '420px', maxWidth: '90vw',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px', borderBottom: '1px solid ' + borderSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: fonts.display, letterSpacing: '1px' }}>
              Export Clip
            </div>
            <div style={{ fontSize: '11px', color: textDim, marginTop: '2px' }}>
              {resultUrl ? 'Your video is ready' : exporting ? 'Processing your video...' : 'Choose your export settings'}
            </div>
          </div>
          <button onClick={function () { if (!exporting) setShowExportModal(false) }}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid ' + borderSoft, background: 'transparent',
              color: textDim, cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {resultUrl ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', color: brand }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: textPrimary, marginBottom: '8px' }}>Export Complete!</div>
              <a href={resultUrl} download="video_editado.mp4"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px', borderRadius: '8px',
                  background: brandGrad, color: '#000', fontWeight: '700',
                  textDecoration: 'none', fontSize: '13px',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download video_editado.mp4
              </a>
            </div>
          ) : exporting ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  border: '3px solid ' + borderSoft,
                  borderTopColor: brand,
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ fontSize: '13px', color: textSecondary, fontWeight: '600' }}>{statusText}</div>
              </div>
              <div style={{
                width: '100%', height: '6px', background: borderSoft,
                borderRadius: '3px', overflow: 'hidden', marginBottom: '8px',
              }}>
                <div style={{
                  width: progress + '%', height: '100%',
                  background: 'linear-gradient(90deg, ' + brand + ', #a4df2d)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '10px', color: textDim, fontFamily: fonts.mono,
              }}>
                <span>{Math.round(progress)}%</span>
                <span>~{formatTime(remaining)} remaining</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button onClick={handleCancel}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.05)',
                    color: '#ef4444', cursor: 'pointer', fontSize: '11px',
                    fontFamily: fonts.body, fontWeight: '600',
                  }}>
                  Cancel Export
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono }}>
                  Resolution
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {resolutions.map(function (r) {
                    return (
                      <button key={r.id} onClick={function () { setResolution(r.id) }}
                        style={{
                          flex: 1, background: resolution === r.id ? brandDim : bgSecondary,
                          border: '1px solid ' + (resolution === r.id ? brand : borderSoft),
                          borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                          textAlign: 'center', transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: resolution === r.id ? brand : textPrimary, fontFamily: fonts.display }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '10px', color: textDim, marginTop: '2px' }}>{r.res}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono }}>
                  Format
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {formats.map(function (f) {
                    return (
                      <button key={f.id} onClick={function () { setFormat(f.id) }}
                        style={{
                          flex: 1, background: format === f.id ? brandDim : bgSecondary,
                          border: '1px solid ' + (format === f.id ? brand : borderSoft),
                          borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                          textAlign: 'center', transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: format === f.id ? brand : textPrimary, fontFamily: fonts.display }}>
                          {f.label}
                        </div>
                        <div style={{ fontSize: '10px', color: textDim, marginTop: '2px' }}>{f.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: fonts.mono }}>
                  Frame Rate
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[24, 30, 60].map(function (f) {
                    return (
                      <button key={f} onClick={function () { setFps(f) }}
                        style={{
                          flex: 1, background: fps === f ? brandDim : bgSecondary,
                          border: '1px solid ' + (fps === f ? brand : borderSoft),
                          borderRadius: '8px', padding: '10px', cursor: 'pointer',
                          textAlign: 'center', transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: fps === f ? brand : textPrimary, fontFamily: fonts.display }}>
                          {f}
                        </div>
                        <div style={{ fontSize: '10px', color: textDim }}>fps</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {statusText && (
                <div style={{
                  padding: '12px', borderRadius: '8px', marginBottom: '16px',
                  background: statusText.toLowerCase().indexOf('fail') !== -1 || statusText.toLowerCase().indexOf('error') !== -1 ? 'rgba(239,68,68,0.1)' : bgSecondary,
                  border: '1px solid ' + (statusText.toLowerCase().indexOf('fail') !== -1 || statusText.toLowerCase().indexOf('error') !== -1 ? 'rgba(239,68,68,0.2)' : borderSoft),
                  fontSize: '12px', color: statusText.toLowerCase().indexOf('fail') !== -1 || statusText.toLowerCase().indexOf('error') !== -1 ? '#ef4444' : textSecondary,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>{statusText}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid ' + borderSoft,
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button onClick={function () { setShowExportModal(false) }}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid ' + borderSoft,
              background: 'transparent', color: textSecondary, cursor: 'pointer',
              fontSize: '12px', fontFamily: fonts.body,
            }}>
            {resultUrl ? 'Done' : exporting ? 'Close' : 'Cancel'}
          </button>
          {!resultUrl && !exporting && (
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
