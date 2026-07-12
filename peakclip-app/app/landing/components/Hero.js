'use client'

import LazyShort from './LazyShort'

const creators = [
  { initial: 'M', color: '#ff1f1f' },
  { initial: 'S', color: '#0f0f0f' },
  { initial: 'D', color: '#6b6b6b' },
]

export default function Hero() {
  return (
    <section className="hero-section" style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      padding: '120px 80px 80px', textAlign: 'left',
      overflow: 'hidden', background: '#f6f6f2',
    }}>
      {/* Subtle background accent */}
      <div style={{
        position: 'absolute', top: '10%', right: '-10%',
        width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,31,31,0.06) 0%, rgba(246,246,242,0) 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="hero-grid" style={{
        position: 'relative', zIndex: 2,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 64, alignItems: 'center', width: '100%', maxWidth: 1200, margin: '0 auto',
      }}>
        {/* Left column */}
        <div className="hero-left">
          {/* Eyebrow badge */}
          <div style={{
            animation: 'fade-up 0.5s 0.2s ease both',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#ffffff', border: '1px solid #e8e8e3',
            borderRadius: 100, padding: '6px 16px',
            fontSize: 13, color: '#6b6b6b', marginBottom: 26,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#ff1f1f',
              animation: 'pulse-dot 1.8s ease-in-out infinite',
            }} />
            +2,400 clips created this week
          </div>

          {/* H1 */}
          <h1 style={{
            animation: 'fade-up 0.55s 0.3s ease both',
            fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
            fontSize: 'clamp(52px, 7vw, 92px)',
            fontWeight: 400, letterSpacing: '-0.5px',
            lineHeight: 1.0, maxWidth: 640,
            color: '#0f0f0f', margin: 0, textTransform: 'uppercase',
          }}>
            Turn long videos into{' '}
            <span style={{
              background: '#ff1f1f', color: '#ffffff',
              padding: '0 14px', borderRadius: 6,
              display: 'inline-block',
            }}>
              viral clips
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            animation: 'fade-up 0.55s 0.4s ease both',
            marginTop: 24, fontSize: 17,
            fontFamily: 'var(--font-body), Inter, sans-serif',
            color: '#6b6b6b', maxWidth: 460,
            lineHeight: 1.6, margin: '24px 0 0',
          }}>
            Upload your long content — we turn it into clips ready for TikTok, Reels and Shorts.
          </p>

          {/* Buttons */}
          <div style={{
            animation: 'fade-up 0.55s 0.5s ease both',
            display: 'flex', gap: 12, marginTop: 32,
            flexWrap: 'wrap',
          }}>
            <a href="/register"
              className="hero-primary-btn"
              style={{
                background: '#ff1f1f', color: '#ffffff',
                padding: '15px 28px', borderRadius: 100,
                fontFamily: 'var(--font-body), Inter, sans-serif',
                fontWeight: 700, fontSize: 15,
                border: 'none', cursor: 'pointer',
                textDecoration: 'none',
                transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s',
              }}>
              Create my first clip
            </a>
            <a href="#como-funciona"
              className="hero-secondary-btn"
              style={{
                background: '#ffffff', color: '#0f0f0f',
                padding: '15px 24px', borderRadius: 100,
                fontFamily: 'var(--font-body), Inter, sans-serif',
                fontWeight: 600, fontSize: 15,
                border: '1px solid #ff1f1f', cursor: 'pointer',
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s, background 0.2s',
              }}>
              See how it works
            </a>
          </div>

          {/* Creator avatars */}
          <div style={{
            animation: 'fade-up 0.55s 0.6s ease both',
            display: 'flex', alignItems: 'center', gap: 14, marginTop: 40,
          }}>
            <div style={{ display: 'flex', marginLeft: 4 }}>
              {creators.map((creator, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: creator.color,
                  color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body), Inter, sans-serif',
                  fontSize: 13, fontWeight: 800,
                  border: '2px solid #f6f6f2',
                  marginLeft: -10,
                }}>
                  {creator.initial}
                </div>
              ))}
            </div>
            <p style={{
              fontSize: 14, color: '#6b6b6b',
              fontFamily: 'var(--font-body), Inter, sans-serif',
              margin: 0,
            }}>
              Used by <strong style={{ color: '#0f0f0f' }}>2,400+ creators</strong>
            </p>
          </div>
        </div>

        {/* Right column - single demo Short */}
        <div className="hero-right" style={{
          animation: 'fade-up 0.6s 0.65s ease both',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div className="hero-phone" style={{
            width: 280, height: 498,
            borderRadius: 36,
            background: '#0f0f0f',
            padding: 10,
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          }}>
            <div style={{
              width: '100%', height: '100%',
              borderRadius: 28, overflow: 'hidden',
              background: '#111',
            }}>
              <LazyShort
                videoId="DvkTX-AquQo"
                title="Impossible 0.00001% Odds!"
                channel="MrBeast"
                initial="M"
                avatarColor="#ff1f1f"
                views="15M"
                duration="0:45"
                gradient="linear-gradient(160deg, #ffcece 0%, #fff0f0 100%)"
                active
                style={{ width: '100%', height: '100%', borderRadius: 28 }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-primary-btn:hover {
          background: #d90000;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255,31,31,0.28);
        }
        .hero-secondary-btn:hover {
          background: #ffe5e5;
          color: #d90000;
        }
        @media (max-width: 900px) {
          .hero-section {
            padding: 100px 24px 60px !important;
            text-align: center !important;
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .hero-left {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          h1 {
            letter-spacing: -0.5px !important;
            max-width: 100% !important;
          }
        }
        @media (max-width: 640px) {
          .hero-phone {
            width: 240px !important;
            height: 426px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-section *, .hero-section *::before, .hero-section *::after {
            animation: none !important;
            transition: none !important;
          }
          .hero-section > div[style*="radial-gradient"] {
            opacity: 1 !important;
          }
          .hero-left > div, .hero-left > h1, .hero-left > p, .hero-right {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
