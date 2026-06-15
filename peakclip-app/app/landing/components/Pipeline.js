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
  const stepRefs = useRef([])
  const [activeStep, setActiveStep] = useState(-1)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!barRef.current) return

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 })

    stepRefs.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, x: -16 })
    })

    tl.to(barRef.current, {
      width: '25%',
      duration: 1.6,
      ease: 'power2.inOut',
      onStart: () => { setActiveStep(0); setProgress(0) },
      onComplete: () => {
        setProgress(25)
        gsap.to(stepRefs.current[0], { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.7)' })
      },
    })
    .to({}, { duration: 0.6 })
    .to(barRef.current, {
      width: '50%',
      duration: 1.6,
      ease: 'power2.inOut',
      onStart: () => { setActiveStep(1) },
      onComplete: () => {
        setProgress(50)
        gsap.to(stepRefs.current[1], { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.7)' })
      },
    })
    .to({}, { duration: 0.6 })
    .to(barRef.current, {
      width: '75%',
      duration: 1.6,
      ease: 'power2.inOut',
      onStart: () => { setActiveStep(2) },
      onComplete: () => {
        setProgress(75)
        gsap.to(stepRefs.current[2], { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.7)' })
      },
    })
    .to({}, { duration: 0.6 })
    .to(barRef.current, {
      width: '100%',
      duration: 1.6,
      ease: 'power2.inOut',
      onStart: () => { setActiveStep(3) },
      onComplete: () => {
        setProgress(100)
        gsap.to(stepRefs.current[3], { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.7)' })
      },
    })
    .to({}, { duration: 1.5 })
    .to(barRef.current, {
      width: '0%', duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setProgress(0)
        setActiveStep(-1)
        stepRefs.current.forEach(el => {
          if (el) gsap.set(el, { opacity: 0, x: -16 })
        })
      },
    })

    return () => tl.kill()
  }, [])

  return (
    <div className="pipeline-container" ref={containerRef}>
      <div className="pipeline-header">
        <div className="pipeline-dots">
          <span className="pipeline-dot primary" style={activeStep >= 0 ? { animation: 'glowPulse 1.5s ease-in-out infinite' } : {}} />
          <span className="pipeline-dot warning" />
          <span className="pipeline-dot success" />
        </div>
        <span className="pipeline-version">Peakclip Pipeline v2.6</span>
      </div>

      <div className="pipeline-steps">
        {steps.map((step, i) => (
          <div
            key={step.num}
            ref={el => stepRefs.current[i] = el}
            className={`pipeline-step ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'completed' : ''}`}
            style={{
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
              ...(i === activeStep ? {
                background: 'rgba(217,180,74,0.06)',
                borderColor: 'rgba(217,180,74,0.3)',
                boxShadow: '0 0 24px rgba(217,180,74,0.1)',
              } : {}),
            }}
          >
            <div className="pipeline-step-number" style={{
              ...(i === activeStep ? {
                background: '#D9B44A',
                color: '#050505',
                boxShadow: '0 0 16px rgba(217,180,74,0.4)',
              } : i < activeStep ? {
                background: 'rgba(217,180,74,0.15)',
                color: '#D9B44A',
              } : {}),
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {i < activeStep
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: 'block', transform: 'scale(0.8)', animation: 'scaleIn 0.3s ease forwards' }}><polyline points="20 6 9 17 4 12"/></svg>
                : step.num
              }
            </div>
            <div className="pipeline-step-info">
              <div className="pipeline-step-label">{step.label}</div>
              <div className="pipeline-step-desc">{step.desc}</div>
            </div>
            <div className="pipeline-step-status" style={{
              ...(i === activeStep ? { color: '#D9B44A', fontWeight: '600' } : i < activeStep ? { color: 'rgba(217,180,74,0.7)' } : {}),
              transition: 'color 0.3s ease',
            }}>
              {i < activeStep ? 'Done' : i === activeStep ? 'Processing...' : 'Pending'}
            </div>
          </div>
        ))}
      </div>

      <div className="pipeline-progress-wrap">
        <div className="pipeline-progress-label">
          <span style={{ color: progress > 0 ? '#D9B44A' : 'inherit', transition: 'color 0.3s ease' }}>{progress}% complete</span>
          <span>4 steps</span>
        </div>
        <div className="pipeline-progress-track">
          <div className="pipeline-progress-bar" ref={barRef}
            style={{
              background: 'linear-gradient(90deg, #D9B44A, #E8C84A, #D9B44A)',
              backgroundSize: '200% 100%',
              boxShadow: '0 0 12px rgba(217,180,74,0.3)',
              borderRadius: '999px',
              height: '100%',
              width: '0%',
              transition: 'box-shadow 0.3s ease',
            }} />
        </div>
      </div>
    </div>
  )
}
