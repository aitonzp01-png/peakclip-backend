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
      background: '#f6f6f2', padding: '0 80px 100px',
      position: 'relative',
    }}>
      <div className="cta-final-card" style={{
        maxWidth: 860, margin: '0 auto', borderRadius: 28,
        overflow: 'hidden', position: 'relative',
        background: '#0f0f0f',
        padding: '72px 64px', textAlign: 'center',
        opacity: 0, transform: 'translateY(20px) scale(0.97)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* Red glow */}
        <div style={{
          position: 'absolute', top: '-40%', left: '50%',
          transform: 'translateX(-50%)',
          width: '80%', height: '120%',
          background: 'radial-gradient(ellipse at center, rgba(255,31,31,0.14) 0%, rgba(15,15,15,0) 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,31,31,0.12)',
            border: '1px solid rgba(255,31,31,0.25)',
            color: '#ff1f1f', fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-body), Inter, sans-serif',
            padding: '6px 16px', borderRadius: 100,
            marginBottom: 20, letterSpacing: 1,
          }}>
            START FREE TODAY
          </span>

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
            fontSize: 'clamp(48px, 6vw, 80px)',
            fontWeight: 400,
            color: '#ffffff', marginBottom: 28, lineHeight: 1.0,
            letterSpacing: '-0.5px', textTransform: 'uppercase',
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
            fontFamily: 'var(--font-body), Inter, sans-serif',
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
          background: #ffffff;
          border: none;
          padding: 16px 22px;
          font-size: 14px;
          color: #0f0f0f;
          outline: none;
          font-family: var(--font-body), Inter, sans-serif;
        }
        .cta-form-input::placeholder {
          color: #8a8a8a;
        }
        .cta-form-btn {
          background: #ff1f1f;
          color: #ffffff;
          border: none;
          padding: 16px 28px;
          font-weight: 700;
          font-size: 14px;
          font-family: var(--font-body), Inter, sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        }
        .cta-form-btn:hover {
          background: #d90000;
        }
        @media (max-width: 768px) {
          section {
            padding: 0 20px 60px !important;
          }
          .cta-final-card {
            padding: 48px 24px !important;
          }
          .cta-form {
            flex-direction: column;
            border-radius: 20px;
            gap: 12px;
            padding: 12px;
            background: rgba(255,255,255,0.08);
          }
          .cta-form-input {
            width: 100%;
            box-sizing: border-box;
            text-align: center;
            padding: 14px 18px;
            border-radius: 12px;
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
