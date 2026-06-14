'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const steps = [
  { num: 1, label: 'Paste Video URL', desc: 'Paste any YouTube, TikTok, or file link' },
  { num: 2, label: 'AI Audio & Visual Scan', desc: 'Whisper transcription + GPT scene detection' },
  { num: 3, label: 'Peak Moments Detected', desc: 'Identify viral moments by engagement scoring' },
  { num: 4, label: 'Viral Score & Export', desc: 'Auto-crop vertical 9:16 with captions' },
]

export default function Pipeline() {
  const containerRef = useRef(null)
  const barRef = useRef(null)
  const [activeStep, setActiveStep] = useState(-1)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!barRef.current) return

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 })

    tl.to(barRef.current, {
      width: '25%',
      duration: 1.4,
      ease: 'power2.out',
      onComplete: () => { setProgress(25); setActiveStep(0) },
    })
    .to({}, { duration: 0.3 })
    .to(barRef.current, {
      width: '50%',
      duration: 1.4,
      ease: 'power2.out',
      onComplete: () => { setProgress(50); setActiveStep(1) },
    })
    .to({}, { duration: 0.3 })
    .to(barRef.current, {
      width: '75%',
      duration: 1.4,
      ease: 'power2.out',
      onComplete: () => { setProgress(75); setActiveStep(2) },
    })
    .to({}, { duration: 0.3 })
    .to(barRef.current, {
      width: '100%',
      duration: 1.4,
      ease: 'power2.out',
      onComplete: () => { setProgress(100); setActiveStep(3) },
    })
    .to(barRef.current, { width: '0%', duration: 0.01, onComplete: () => { setProgress(0); setActiveStep(-1) } })

    return () => tl.kill()
  }, [])

  return (
    <div className="pipeline-container" ref={containerRef}>
      <div className="pipeline-header">
        <div className="pipeline-dots">
          <span className="pipeline-dot primary" />
          <span className="pipeline-dot warning" />
          <span className="pipeline-dot success" />
        </div>
        <span className="pipeline-version">Peakclip Pipeline v2.6</span>
      </div>

      <div className="pipeline-steps">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`pipeline-step ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'completed' : ''}`}
          >
            <div className="pipeline-step-number">
              {i < activeStep ? '✓' : step.num}
            </div>
            <div className="pipeline-step-info">
              <div className="pipeline-step-label">{step.label}</div>
              <div className="pipeline-step-desc">{step.desc}</div>
            </div>
            <div className="pipeline-step-status">
              {i < activeStep ? 'Done' : i === activeStep ? 'Processing...' : 'Pending'}
            </div>
          </div>
        ))}
      </div>

      <div className="pipeline-progress-wrap">
        <div className="pipeline-progress-label">
          <span>{progress}% complete</span>
          <span>4 steps</span>
        </div>
        <div className="pipeline-progress-track">
          <div className="pipeline-progress-bar" ref={barRef} />
        </div>
      </div>
    </div>
  )
}
