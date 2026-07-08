'use client'

import { useEffect, useRef } from 'react'

export default function CTA() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const card = el.querySelector('.cta-final-card')
    if (!card) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{
      background: '#f5f5f0', padding: '0 80px 100px',
      position: 'relative',
    }}>
      <div className="cta-final-card" style={{
        maxWidth: 860, margin: '0 auto', borderRadius: 28,
        overflow: 'hidden', position: 'relative',
        background: 'radial-gradient(ellipse at 60% 40%, #3a2a1a 0%, #1a1218 50%, #0f0d0f 100%)',
        padding: '72px 64px', textAlign: 'center',
        opacity: 0, transform: 'translateY(20px) scale(0.97)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* Blob SVG */}
        <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', top: -80, right: -80,
            opacity: 0.08, filter: 'blur(80px)', pointerEvents: 'none',
          }}
        >
          <defs>
            <radialGradient id="ctaBlob" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c4ff3d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c4ff3d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="200" fill="url(#ctaBlob)" />
        </svg>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <span style={{
            display: 'inline-block',
            background: 'rgba(196,255,61,0.12)',
            border: '1px solid rgba(196,255,61,0.25)',
            color: '#c4ff3d', fontSize: 11, fontWeight: 700,
            padding: '6px 16px', borderRadius: 100,
            marginBottom: 20, letterSpacing: 1,
          }}>
            START FREE TODAY
          </span>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900,
            color: '#f5f5f0', marginBottom: 28, lineHeight: 1.05,
            letterSpacing: -1.5,
          }}>
            Start Using PeakClip
          </h2>

          {/* Input + Button */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="cta-form"
          >
            <input
              type="email"
              placeholder="you@email.com"
              className="cta-form-input"
            />
            <button type="submit" className="cta-form-btn">
              Start Free
            </button>
          </form>

          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}>
            No credit card · First 3 clips free
          </p>
        </div>
      </div>

      <style>{`
        .cta-final-card.visible {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
        .cta-form {
          max-width: 480px;
          margin: 0 auto 24px;
          display: flex;
          gap: 0;
          align-items: stretch;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 100px;
          overflow: hidden;
        }
        .cta-form-input {
          flex: 1;
          background: none;
          border: none;
          padding: 16px 22px;
          font-size: 14px;
          color: #f5f5f0;
          outline: none;
          font-family: inherit;
        }
        .cta-form-input::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .cta-form-btn {
          background: #f5f5f0;
          color: #0f0f0f;
          border: none;
          padding: 16px 28px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: background 0.2s;
        }
        .cta-form-btn:hover {
          background: #c4ff3d;
        }
        @media (max-width: 768px) {
          section {
            padding: 0 20px 60px !important;
          }
          .cta-final-card {
            padding: 40px 24px !important;
          }
          .cta-form {
            flex-direction: column;
            border-radius: 20px;
            gap: 12px;
            padding: 12px;
          }
          .cta-form-input {
            width: 100%;
            box-sizing: border-box;
            text-align: center;
            padding: 14px 18px;
          }
          .cta-form-btn {
            width: 100%;
            border-radius: 12px;
            padding: 14px 18px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-final-card {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .cta-form-btn {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  )
}
