'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

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

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m + ':' + sec.toString().padStart(2, '0')
}

export default function ExportModal({
  show,
  onClose,
  clipId,
  videoSrc,
  activeTranscript,
  subtitleStyle,
  trimStart,
  trimEnd,
  duration,
  musicTrack,
  musicVolume,
}) {
  const [resolution, setResolution] = useState('1080p')
  const [format, setFormat] = useState('mp4')
  const [fps, setFps] = useState(30)
  const [exporting, setExporting] = useState(false)
  const [stage, setStage] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const abortRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const getToken = async () => {
    const { getSupabaseClient } = await import('../../../lib/supabase')
    const { data } = await getSupabaseClient().auth.getSession()
    return data?.session?.access_token || null
  }

  const handleExport = useCallback(async () => {
    setExporting(true)
    setProgress(0)
    setDownloadProgress(0)
    setStage('uploading')
    setStatusText('Starting export...')
    setResultUrl('')
    setElapsed(0)

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)

    const controller = new AbortController()
    abortRef.current = controller

    const fakeProgress = setInterval(() => {
      setProgress((prev) => Math.min(85, prev + Math.random() * 2.5))
    }, 1800)

    try {
      const token = await getToken()
      if (!token) {
        setStatusText('Not authenticated')
        setStage('error')
        setExporting(false)
        clearInterval(timerRef.current)
        clearInterval(fakeProgress)
        return
      }

      const trimStartPct = duration ? (trimStart / duration) * 100 : 0
      const trimEndPct = duration ? (trimEnd / duration) * 100 : 100

      const subtitleWords = activeTranscript
        .filter((w) => !w.deleted && w.word)
        .map((w) => ({
          word: w.word,
          start: w.startTime,
          end: w.endTime,
          id: w.id,
        }))

      const position =
        subtitleStyle.positionY < 40
          ? 'top'
          : subtitleStyle.positionY > 60
          ? 'bottom'
          : 'bottom'

      setStatusText('Processing video on server...')

      const response = await fetch(BACKEND_URL + '/export', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          clip_id: clipId,
          video_url: videoSrc || '',
          trim_start: Math.max(0, Math.min(100, trimStartPct)),
          trim_end: Math.max(0, Math.min(100, trimEndPct)),
          subtitle_text: subtitleWords.map((w) => w.word).join(' '),
          subtitle_style: 'custom',
          subtitle_position: position,
          subtitle_style_obj: subtitleStyle,
          subtitle_words: subtitleWords,
          font_size: subtitleStyle.fontSize || 28,
          watermark_text: '',
          watermark_position: 'top-right',
          music_track: musicTrack || 'none',
          music_volume: musicVolume || 30,
          filter_style: 'none',
          resolution: resolution,
          format: format,
          fps: fps,
        }),
      })

      clearInterval(fakeProgress)

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Export failed')
        setStatusText('Server error: ' + errText.slice(0, 200))
        setStage('error')
        setProgress(0)
        setExporting(false)
        clearInterval(timerRef.current)
        return
      }

      setProgress(88)
      setStage('downloading')
      setStatusText('Processing complete, downloading video...')

      const data = await response.json()
      const downloadUrl = data.video_url || data.url
      if (!downloadUrl) {
        setStatusText('No download URL returned from server')
        setStage('error')
        setExporting(false)
        clearInterval(timerRef.current)
        return
      }

      // Download with progress tracking
      setStatusText('Downloading video...')
      const dlResponse = await fetch(downloadUrl, { signal: controller.signal })
      if (!dlResponse.ok) {
        setStatusText('Download failed: unable to fetch video')
        setStage('error')
        setExporting(false)
        clearInterval(timerRef.current)
        return
      }

      const contentLength = dlResponse.headers.get('content-length')
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0
      const reader = dlResponse.body.getReader()
      const chunks = []
      let downloadedBytes = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        downloadedBytes += value.length
        if (totalBytes > 0) {
          setDownloadProgress(Math.round((downloadedBytes / totalBytes) * 100))
        } else {
          setDownloadProgress((prev) => Math.min(99, prev + 2))
        }
        setProgress(88 + Math.round((downloadedBytes / (totalBytes || downloadedBytes * 2)) * 12))
      }

      const blob = new Blob(chunks, { type: 'video/mp4' })
      const objectUrl = URL.createObjectURL(blob)

      setResultUrl(objectUrl)
      setProgress(100)
      setDownloadProgress(100)
      setStage('done')
      setStatusText('Export complete!')

      // auto-download after brief delay
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = 'video_editado.mp4'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }, 600)
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatusText('Export cancelled')
        setStage('idle')
      } else {
        setStatusText('Error: ' + (err.message || 'Export failed').slice(0, 120))
        setStage('error')
      }
      setProgress(0)
    } finally {
      setExporting(false)
      clearInterval(fakeProgress)
      clearInterval(timerRef.current)
      abortRef.current = null
    }
  }, [clipId, videoSrc, activeTranscript, subtitleStyle, trimStart, trimEnd, duration, musicTrack, musicVolume, resolution, format, fps])

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setExporting(false)
    setProgress(0)
    setStage('idle')
    setStatusText('Cancelled')
    clearInterval(timerRef.current)
  }

  const estimatedTotal = format === 'mp4' ? 30 : format === 'mov' ? 45 : 60
  const remaining = Math.max(0, estimatedTotal - elapsed)

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => { if (!exporting && stage !== 'done') onClose() }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--cream-panel)',
          border: '1px solid var(--cream-panel-border)',
          borderRadius: '20px', width: '420px', maxWidth: '90vw',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px', borderBottom: '1px solid var(--cream-panel-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{
              fontSize: '18px', fontWeight: '700',
              letterSpacing: '1px', color: 'var(--cream-text-primary)',
            }}>
              Export Clip
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cream-text-secondary)', marginTop: '2px' }}>
              {stage === 'done'
                ? 'Your video is ready'
                : exporting
                ? statusText
                : 'Choose your export settings'}
            </div>
          </div>
          <button
            onClick={() => { if (!exporting) onClose() }}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid var(--cream-panel-border)',
              background: 'transparent',
              color: 'var(--cream-text-secondary)',
              cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {stage === 'done' && resultUrl ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', color: 'var(--cream-accent)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cream-text-primary)', marginBottom: '8px' }}>Export Complete!</div>
              <a
                href={resultUrl}
                download="video_editado.mp4"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px', borderRadius: '8px',
                  background: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)',
                  fontWeight: '700', textDecoration: 'none', fontSize: '13px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download video_editado.mp4
              </a>
            </div>
          ) : exporting ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  border: '3px solid var(--cream-panel-border)',
                  borderTopColor: 'var(--cream-accent)',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ fontSize: '13px', color: 'var(--cream-text-secondary)', fontWeight: '600' }}>{statusText}</div>
              </div>

              <div style={{
                width: '100%', height: '6px', background: 'var(--cream-panel-border)',
                borderRadius: '3px', overflow: 'hidden', marginBottom: '4px',
              }}>
                <div style={{
                  width: progress + '%', height: '100%',
                  background: 'linear-gradient(90deg, var(--cream-accent), #a4df2d)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '10px', color: 'var(--cream-text-secondary)',
              }}>
                <span>{Math.round(progress)}%</span>
                <span>~{formatTime(remaining)} remaining</span>
              </div>

              {stage === 'downloading' && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    width: '100%', height: '3px', background: 'var(--cream-panel-border)',
                    borderRadius: '2px', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: downloadProgress + '%', height: '100%',
                      background: '#22c55e',
                      borderRadius: '2px',
                      transition: 'width 0.2s ease',
                    }} />
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end',
                    fontSize: '9px', color: 'var(--cream-text-secondary)', marginTop: '2px',
                  }}>
                    Download: {downloadProgress}%
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.05)',
                    color: '#ef4444', cursor: 'pointer', fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  Cancel Export
                </button>
              </div>
            </div>
          ) : stage === 'error' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '700', marginBottom: '8px' }}>
                {statusText}
              </div>
              <button
                onClick={() => { setStage('idle'); setStatusText('') }}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  border: '1px solid var(--cream-panel-border)',
                  background: 'transparent', color: 'var(--cream-text-primary)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: 'var(--cream-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  Resolution
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {resolutions.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setResolution(r.id)}
                      style={{
                        flex: 1, background: resolution === r.id ? 'var(--cream-surface)' : 'transparent',
                        border: '1px solid ' + (resolution === r.id ? 'var(--cream-accent)' : 'var(--cream-panel-border)'),
                        borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '700', color: resolution === r.id ? 'var(--cream-accent)' : 'var(--cream-text-primary)' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--cream-text-secondary)', marginTop: '2px' }}>{r.res}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: 'var(--cream-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  Format
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      style={{
                        flex: 1, background: format === f.id ? 'var(--cream-surface)' : 'transparent',
                        border: '1px solid ' + (format === f.id ? 'var(--cream-accent)' : 'var(--cream-panel-border)'),
                        borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '700', color: format === f.id ? 'var(--cream-accent)' : 'var(--cream-text-primary)' }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--cream-text-secondary)', marginTop: '2px' }}>{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: 'var(--cream-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  Frame Rate
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[24, 30, 60].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      style={{
                        flex: 1, background: fps === f ? 'var(--cream-surface)' : 'transparent',
                        border: '1px solid ' + (fps === f ? 'var(--cream-accent)' : 'var(--cream-panel-border)'),
                        borderRadius: '8px', padding: '10px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '700', color: fps === f ? 'var(--cream-accent)' : 'var(--cream-text-primary)' }}>
                        {f}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>fps</div>
                    </button>
                  ))}
                </div>
              </div>

              {statusText && (
                <div style={{
                  padding: '12px', borderRadius: '8px', marginBottom: '16px',
                  background: stage === 'error' ? 'rgba(239,68,68,0.1)' : 'var(--cream-surface)',
                  border: '1px solid ' + (stage === 'error' ? 'rgba(239,68,68,0.2)' : 'var(--cream-panel-border)'),
                  fontSize: '12px', color: stage === 'error' ? '#ef4444' : 'var(--cream-text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>{statusText}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--cream-panel-border)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button
            onClick={() => onClose()}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--cream-panel-border)',
              background: 'transparent', color: 'var(--cream-text-secondary)', cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {stage === 'done' ? 'Done' : exporting ? 'Close' : 'Cancel'}
          </button>
          {stage !== 'done' && !exporting && (
            <button
              onClick={handleExport}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)',
                fontWeight: '700', cursor: 'pointer', fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L8 11M8 11L4 7M8 11L12 7M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

