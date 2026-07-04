'use client'

const cards = [
  { id: 'dQw4w9WgXcQ', views: '2.6M', comments: '12k', r: -9, y: 20, w: 148, h: 264 },
  { id: 'RlPNh_PBZb4', views: '1.2M', comments: '8.4k', r: -3.5, y: -4, w: 148, h: 264 },
  { id: '9bZkp7q19f0', views: '4.8M', comments: '31k', r: 0, y: -8, w: 164, h: 292 },
  { id: 'V-_O7nl0Ii0', views: '890k', comments: '3.1k', r: 7, y: -3, w: 148, h: 264 },
  { id: 'M7lc1UVf-VE', views: '1.8M', comments: '9.7k', r: 12, y: 16, w: 148, h: 264 },
]

export default function Hero() {
  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
      padding: '100px 24px 60px', textAlign: 'center',
      overflow: 'hidden', background: '#f5f5f0',
    }}>
      {/* SVG blob background */}
      <svg width="820" height="820" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute', top: -260, left: '50%',
          transform: 'translateX(-50%)', opacity: 0.22,
          filter: 'blur(50px)', zIndex: 0,
          animation: 'drift 14s ease-in-out infinite',
        }}
      >
        <defs>
          <radialGradient id="heroBlob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4ff3d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f5f5f0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#heroBlob)" />
      </svg>

      {/* Eyebrow badge */}
      <div style={{
        zIndex: 2,
        animation: 'fade-up 0.5s 0.2s ease both',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#ffffff', border: '1px solid #e2e2de',
        borderRadius: 100, padding: '6px 16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        fontSize: 13, color: '#6b6b72', marginBottom: 26,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22c55e',
          animation: 'pulse-dot 1.8s ease-in-out infinite',
        }} />
        +2,400 clips creados esta semana
      </div>

      {/* H1 */}
      <h1 style={{
        zIndex: 2,
        animation: 'fade-up 0.55s 0.3s ease both',
        fontSize: 'clamp(42px, 7vw, 88px)',
        fontWeight: 900, letterSpacing: '-3px',
        lineHeight: 0.97, maxWidth: 860,
        color: '#0f0f0f', margin: 0,
      }}>
        Convierte tus videos en{' '}
        <span style={{
          fontStyle: 'italic',
          background: '#c4ff3d',
          color: '#0f0f0f',
          padding: '2px 10px',
          borderRadius: 8,
          display: 'inline-block',
        }}>
          clips virales
        </span>
      </h1>

      {/* Subtitle */}
      <p style={{
        zIndex: 2,
        animation: 'fade-up 0.55s 0.4s ease both',
        marginTop: 20, fontSize: 17,
        color: '#6b6b72', maxWidth: 440,
        lineHeight: 1.5, margin: '20px 0 0',
      }}>
        Sube tu contenido largo — nosotros lo convertimos en clips listos para TikTok, Reels y Shorts.
      </p>

      {/* Buttons */}
      <div style={{
        zIndex: 2,
        animation: 'fade-up 0.55s 0.5s ease both',
        display: 'flex', gap: 12, marginTop: 32,
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <a href="/login?signup=true"
          className="hero-primary-btn"
          style={{
            background: '#0f0f0f', color: '#f5f5f0',
            padding: '15px 28px', borderRadius: 100,
            fontWeight: 700, fontSize: 15,
            border: 'none', cursor: 'pointer',
            textDecoration: 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
          Crear mi primer clip
        </a>
        <a href="#showcase"
          className="hero-secondary-btn"
          style={{
            background: 'transparent', color: '#0f0f0f',
            padding: '15px 24px', borderRadius: 100,
            fontWeight: 600, fontSize: 15,
            border: '1px solid #cececa', cursor: 'pointer',
            textDecoration: 'none',
            transition: 'border-color 0.2s',
          }}>
          Ver ejemplos
        </a>
      </div>

      {/* Mosaic of 5 YouTube clips */}
      <div className="hero-mosaic" style={{
        zIndex: 2,
        animation: 'fade-up 0.6s 0.65s ease both',
        display: 'flex', gap: 14, marginTop: 60,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {cards.map((card, i) => (
          <div key={card.id}
            className="hero-card"
            onClick={(e) => {
              e.currentTarget.classList.toggle('active')
              const iframe = e.currentTarget.querySelector('iframe')
              if (e.currentTarget.classList.contains('active')) {
                iframe.style.pointerEvents = 'all'
              } else {
                iframe.style.pointerEvents = 'none'
              }
            }}
            style={{
              width: card.w, height: card.h, flexShrink: 0,
              borderRadius: 20, overflow: 'hidden',
              background: '#111',
              boxShadow: '0 10px 36px rgba(0,0,0,0.13)',
              transform: `rotate(${card.r}deg) translateY(${card.y}px)`,
              cursor: 'pointer', position: 'relative',
              transition: 'transform 0.4s cubic-bezier(.22,.68,0,1.2), box-shadow 0.4s',
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${card.id}?autoplay=1&mute=1&loop=1&playlist=${card.id}&controls=0&modestbranding=1&rel=0&playsinline=1`}
              style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: '100%', height: '100%',
                border: 'none', pointerEvents: 'none',
              }}
              title="Video preview"
            />

            {/* Overlay */}
            <div className="hero-card-overlay" style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
              transition: 'opacity 0.3s',
            }}>
              {/* Play button */}
              <div className="hero-card-play" style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-55%)',
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.3s, transform 0.3s',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              {/* Stats */}
              <div className="hero-card-stats" style={{
                position: 'absolute', bottom: 10, left: 8, right: 8,
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(5px)', borderRadius: 9,
                padding: '5px 9px',
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {card.views}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {card.comments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust text */}
      <p style={{
        zIndex: 2,
        animation: 'fade-up 0.55s 0.75s ease both',
        marginTop: 36, fontSize: 13, color: '#6b6b72',
        textAlign: 'center',
      }}>
        Usado por creadores en YouTube, Twitch e Instagram
      </p>

      <style>{`
        /* Card hover */
        .hero-card:hover {
          transform: rotate(0deg) translateY(-12px) scale(1.05) !important;
          box-shadow: 0 20px 48px rgba(0,0,0,0.22) !important;
          z-index: 10;
        }
        .hero-card:hover .hero-card-play {
          background: rgba(255,255,255,0.32);
          transform: translate(-50%,-55%) scale(1.1);
        }
        /* Active state (clicked to unmute) */
        .hero-card.active .hero-card-overlay {
          opacity: 0;
          pointer-events: none;
        }
        /* Primary button hover */
        .hero-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        /* Secondary button hover */
        .hero-secondary-btn:hover {
          border-color: #0f0f0f;
        }
        /* Mobile responsive */
        @media (max-width: 768px) {
          .hero-mosaic {
            overflow-x: auto !important;
            scroll-behavior: smooth !important;
            padding-bottom: 12px !important;
            justify-content: flex-start !important;
          }
          section { padding: 90px 16px 48px !important; }
          h1 { letter-spacing: -1.5px !important; }
        }
        @media (min-width: 768px) and (max-width: 1024px) {
          .hero-card {
            width: 130px !important;
            height: 232px !important;
          }
          .hero-card:nth-child(3) {
            width: 144px !important;
            height: 258px !important;
          }
          h1 { letter-spacing: -2px !important; }
        }
      `}</style>
    </section>
  )
}
