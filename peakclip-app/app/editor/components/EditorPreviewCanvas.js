'use client'
import { useRef, useEffect, useCallback } from 'react'
import useEditorStore from '../store/editorStore'
import { textSecondary, textDim, brand, previewBg, borderSoft } from '../../../lib/editor-tokens'
import { groupWordsIntoLines, hexToRgba, lerp } from '../../../lib/utils'

export default function EditorPreviewCanvas({ videoRef }) {
  const canvasRef = useRef(null)
  const videoWrapRef = useRef(null)
  const cropXRef = useRef(0)
  const cropYRef = useRef(0)
  const animFrameRef = useRef(null)
  const modelsLoadingRef = useRef(false)
  const detectFaceRef = useRef(null)

  const {
    aspectRatio, setAspectRatio,
    currentTime, setCurrentTime, setPlayheadPos,
    transcript, subtitleStyle, subtitleEnabled,
    faceTrackingEnabled, faceTrackingSmoothness, faceTrackingZoom,
    modelsLoaded, setModelsLoaded,
    cropX, cropY, setCropX, setCropY,
  } = useEditorStore()

  useEffect(() => {
    if (!faceTrackingEnabled || modelsLoaded || modelsLoadingRef.current) return
    modelsLoadingRef.current = true
    let cancelled = false
    import('face-api.js').then(async (faceapi) => {
      if (cancelled) return
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ])
        setModelsLoaded(true)
      } catch (e) {
        console.warn('Face-api models not found in /models/', e)
      }
    })
    return () => { cancelled = true }
  }, [faceTrackingEnabled, modelsLoaded, setModelsLoaded])

  useEffect(() => {
    if (!faceTrackingEnabled || !modelsLoaded) return
    let running = true
    const detect = async () => {
      if (!running) return
      if (videoRef?.current) {
        try {
          const faceapi = await import('face-api.js')
          const detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          ).withFaceLandmarks()
          if (detection) {
            const { box } = detection.detection
            const targetX = box.x + box.width / 2
            const targetY = box.y + box.height / 2
            const smooth = faceTrackingSmoothness / 100
            cropXRef.current = lerp(cropXRef.current, targetX - 50, 0.08 * (1 - smooth * 0.9))
            cropYRef.current = lerp(cropYRef.current, targetY - 50, 0.06 * (1 - smooth * 0.9))
            setCropX(cropXRef.current)
            setCropY(cropYRef.current)
          }
        } catch {}
        if (running) animFrameRef.current = requestAnimationFrame(detect)
      }
    }
    animFrameRef.current = requestAnimationFrame(detect)
    return () => { running = false; if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [videoRef, faceTrackingEnabled, modelsLoaded, faceTrackingSmoothness, setCropX, setCropY])

  const renderSubtitles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !subtitleEnabled) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const activeWords = transcript.filter(w =>
      !w.deleted && currentTime >= w.startTime && currentTime <= w.endTime
    )
    if (!activeWords.length) return

    const lines = groupWordsIntoLines(activeWords, subtitleStyle.maxWidth || 90, canvas.width)
    const baseSize = subtitleStyle.fontSize * (canvas.width / 400)
    const ff = subtitleStyle.fontWeight || '800'
    ctx.font = `${subtitleStyle.fontStyle || 'normal'} ${ff} ${baseSize}px "${subtitleStyle.fontFamily}", sans-serif`
    ctx.textAlign = subtitleStyle.textAlign || 'center'

    const y = (canvas.height * (subtitleStyle.positionY || 75)) / 100

    lines.forEach((line, lineIdx) => {
      const lineY = y + lineIdx * baseSize * (subtitleStyle.lineHeight || 1.2)
      const lineText = line.map(w => {
        let t = w.word
        if (subtitleStyle.textTransform === 'uppercase') t = t.toUpperCase()
        else if (subtitleStyle.textTransform === 'lowercase') t = t.toLowerCase()
        return t
      }).join(' ')
      const textWidth = ctx.measureText(lineText).width
      const x = canvas.width / 2

      if (subtitleStyle.backgroundColor !== 'transparent' && subtitleStyle.backgroundOpacity > 0) {
        ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity / 100)
        const pad = subtitleStyle.backgroundPadding || 8
        const r = subtitleStyle.backgroundBorderRadius || 4
        const h = baseSize * 1.4
        const bx = x - textWidth / 2 - pad
        const by = lineY - baseSize * 0.9
        const bw = textWidth + pad * 2
        ctx.beginPath()
        ctx.moveTo(bx + r, by)
        ctx.lineTo(bx + bw - r, by)
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
        ctx.lineTo(bx + bw, by + h - r)
        ctx.quadraticCurveTo(bx + bw, by + h, bx + bw - r, by + h)
        ctx.lineTo(bx + r, by + h)
        ctx.quadraticCurveTo(bx, by + h, bx, by + h - r)
        ctx.lineTo(bx, by + r)
        ctx.quadraticCurveTo(bx, by, bx + r, by)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = 'transparent'
        ctx.stroke()
      }

      if (subtitleStyle.stroke) {
        ctx.strokeStyle = subtitleStyle.strokeColor || '#000000'
        ctx.lineWidth = subtitleStyle.strokeWidth || 2
        ctx.strokeText(lineText, x, lineY)
      }

      if (subtitleStyle.shadow) {
        ctx.shadowColor = subtitleStyle.shadowColor || '#000000'
        ctx.shadowOffsetX = subtitleStyle.shadowOffsetX || 2
        ctx.shadowOffsetY = subtitleStyle.shadowOffsetY || 2
        ctx.shadowBlur = subtitleStyle.shadowBlur || 4
      }

      if (subtitleStyle.karaokeHighlight) {
        line.forEach((word, wi) => {
          const isActive = currentTime >= word.startTime && currentTime <= word.endTime
          ctx.fillStyle = isActive ? (subtitleStyle.highlightColor || brand) : subtitleStyle.color
          let tw = word.word
          if (subtitleStyle.textTransform === 'uppercase') tw = tw.toUpperCase()
          else if (subtitleStyle.textTransform === 'lowercase') tw = tw.toLowerCase()
          const prevWidth = line.slice(0, wi).reduce((sum, w) => {
            let t = w.word
            if (subtitleStyle.textTransform === 'uppercase') t = t.toUpperCase()
            else if (subtitleStyle.textTransform === 'lowercase') t = t.toLowerCase()
            return sum + ctx.measureText(t + ' ').width
          }, 0)
          const wx = x - textWidth / 2 + prevWidth
          ctx.fillText(tw + ' ', wx, lineY)
        })
      } else {
        ctx.fillStyle = subtitleStyle.color || '#ffffff'
        ctx.fillText(lineText, x, lineY)
      }

      ctx.shadowColor = 'transparent'
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.shadowBlur = 0
    })
  }, [transcript, currentTime, subtitleStyle, subtitleEnabled])

  useEffect(() => {
    if (!subtitleEnabled || !transcript.length) return
    let running = true
    const loop = () => {
      if (!running) return
      renderSubtitles()
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
    return () => { running = false; if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [subtitleEnabled, transcript.length, renderSubtitles])

  const ratios = {
    '9:16': { w: 360, h: 640 },
    '16:9': { w: 640, h: 360 },
    '1:1': { w: 480, h: 480 },
    '4:5': { w: 400, h: 500 },
  }

  const ratio = ratios[aspectRatio] || ratios['9:16']
  const scale = Math.min(
    400 / ratio.w,
    (typeof window !== 'undefined' ? window.innerHeight - 236 : 400) / ratio.h
  )
  const dispW = Math.round(ratio.w * scale)
  const dispH = Math.round(ratio.h * scale)

  return (
    <div style={{
      flex: 1, background: previewBg, display: 'flex',
      flexDirection: 'column', overflow: 'hidden', minWidth: 0,
    }}>
      <div style={{
        height: 44, background: 'transparent',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 8, flexShrink: 0,
      }}>
        {Object.keys(ratios).map((r) => (
          <button key={r} onClick={() => setAspectRatio(r)}
            style={{
              padding: '4px 10px', borderRadius: 100,
              fontSize: 12, fontWeight: 600,
                  background: aspectRatio === r ? '#ffffff' : 'transparent',
              border: `1px solid ${aspectRatio === r ? borderSoft : 'transparent'}`,
              color: aspectRatio === r ? textSecondary : textDim,
              cursor: 'pointer',
            }}
          >{r}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          style={{
            padding: '4px 10px', borderRadius: 100,
            fontSize: 12, fontWeight: 500, color: textDim,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          Ajustar
        </button>
      </div>

      <div ref={videoWrapRef} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          width: dispW, height: dispH,
          position: 'relative', borderRadius: 8, overflow: 'hidden',
          background: '#000',
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%', height: '100%', objectFit: 'contain',
              ...(faceTrackingEnabled ? {
                transform: `scale(${faceTrackingZoom / 100}) translate(${-cropX}px, ${-cropY}px)`,
                objectFit: 'cover',
              } : {}),
            }}
            onTimeUpdate={() => {
              if (!videoRef?.current) return
              setCurrentTime(videoRef.current.currentTime)
              if (videoRef.current.duration) {
                setPlayheadPos((videoRef.current.currentTime / videoRef.current.duration) * 100)
              }
            }}
            onDurationChange={() => {
              if (videoRef?.current) setCurrentTime(videoRef.current.currentTime || 0)
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            width={dispW}
            height={dispH}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', pointerEvents: 'none',
            }}
          />
          {faceTrackingEnabled && modelsLoaded && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: brand, color: '#0f0f0f',
              fontSize: 9, fontWeight: 800,
              padding: '2px 8px', borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22c55e', display: 'inline-block',
              }} />
              SEGUIMIENTO ACTIVO
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
