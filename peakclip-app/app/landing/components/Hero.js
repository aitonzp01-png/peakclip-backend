'use client'

import { useState } from 'react'

const cards = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'This trick went viral 😱',
    channel: 'PeakClips',
    initial: 'P',
    avatarColor: '#c4ff3d',
    views: '2.6M',
    duration: '0:32',
    gradient: 'linear-gradient(160deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    r: -9, y: 20, w: 148, h: 264,
  },
  {
    id: 'RlPNh_PBZb4',
    title: 'Nobody expected this ending',
    channel: 'Viral Cut',
    initial: 'V',
    avatarColor: '#60a5fa',
    views: '1.2M',
    duration: '0:45',
    gradient: 'linear-gradient(160deg, #a18cd1 0%, #fbc2eb 100%)',
    r: -3.5, y: -4, w: 148, h: 264,
  },
  {
    id: '9bZkp7q19f0',
    title: 'The moment that broke the internet',
    channel: 'Short Kings',
    initial: 'S',
    avatarColor: '#f87171',
    views: '4.8M',
    duration: '0:28',
    gradient: 'linear-gradient(160deg, #84fab0 0%, #8fd3f4 100%)',
    r: 0, y: -8, w: 164, h: 292,
  },
  {
    id: 'V-_O7nl0Ii0',
    title: 'Wait for the reaction 🔥',
    channel: 'ClipLab',
    initial: 'C',
    avatarColor: '#fbbf24',
    views: '890k',
    duration: '0:19',
    gradient: 'linear-gradient(160deg, #fccb90 0%, #d57eeb 100%)',
    r: 7, y: -3, w: 148, h: 264,
  },
  {
    id: 'M7lc1UVf-VE',
    title: 'This is why I use PeakClip',
    channel: 'Creator Pro',
    initial: 'C',
    avatarColor: '#34d399',
    views: '1.8M',
    duration: '0:36',
    gradient: 'linear-gradient(160deg, #43e97b 0%, #38f9d7 100%)',
    r: 12, y: 16, w: 148, h: 264,
  },
]

function ShortCard({ card }) {
  const [active, setActive] = useState(false)

  return (
    <div
      className="hero-card"
      onClick={() => setActive(true)}
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
      {active && (
        <iframe
          src={`https://www.youtube.com/embed/${card.id}?autoplay=1&mute=1&loop=1&playlist=${card.id}&controls=0&modestbranding=1&rel=0&playsinline=1`}
          style={{
            position: 'absolute', top: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: '100%', height: '100%',
            border: 'none', zIndex: 3,
          }}
          title={card.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {/* Thumbnail facade */}
      <div className="hero-card-thumb" style={{
        position: 'absolute', inset: 0,
        background: card.gradient,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: 12,
        zIndex: active ? 0 : 2,
      }}>
        {/* Top row: avatar + channel, duration */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: card.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#0f0f0f',
              flexShrink: 0,
            }}>
              {card.initial}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.75)',
              textShadow: '0 1px 2px rgba(255,255,255,0.4)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 78,
            }}>
              {card.channel}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.7)',
            background: 'rgba(255,255,255,0.55)', borderRadius: 4,
            padding: '2px 5px',
          }}>
            {card.duration}
          </span>
        </div>

        {/* Center play */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -55%)',
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(0,0,0,0.22)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* Bottom title + stats */}
        <div>
          <div style={{
            fontSize: 13, fontWeight: 900, color: '#0f0f0f',
            lineHeight: 1.15, marginBottom: 8,
            textShadow: '0 1px 0 rgba(255,255,255,0.35)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {card.title}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.45)', borderRadius: 8,
            padding: '5px 8px', color: 'white', fontSize: 11, fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {card.views} views
          </div>
        </div>
      </div>
    </div>
  )
}

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
        +2,400 clips created this week
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
        Turn your videos into{' '}
        <span style={{
          fontStyle: 'italic',
          background: '#c4ff3d',
          color: '#0f0f0f',
          padding: '2px 10px',
          borderRadius: 8,
          display: 'inline-block',
        }}>
          viral clips
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
        Upload your long content — we turn it into clips ready for TikTok, Reels and Shorts.
      </p>

      {/* Buttons */}
      <div style={{
        zIndex: 2,
        animation: 'fade-up 0.55s 0.5s ease both',
        display: 'flex', gap: 12, marginTop: 32,
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <a href="/register"
          className="hero-primary-btn"
          style={{
            background: '#0f0f0f', color: '#f5f5f0',
            padding: '15px 28px', borderRadius: 100,
            fontWeight: 700, fontSize: 15,
            border: 'none', cursor: 'pointer',
            textDecoration: 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
          Create my first clip
        </a>
        <a href="#como-funciona"
          className="hero-secondary-btn"
          style={{
            background: 'transparent', color: '#0f0f0f',
            padding: '15px 24px', borderRadius: 100,
            fontWeight: 600, fontSize: 15,
            border: '1px solid #cececa', cursor: 'pointer',
            textDecoration: 'none',
            transition: 'border-color 0.2s',
          }}>
          See how it works
        </a>
      </div>

      {/* Mosaic of 5 short clips */}
      <div className="hero-mosaic" style={{
        zIndex: 2,
        animation: 'fade-up 0.6s 0.65s ease both',
        display: 'flex', gap: 14, marginTop: 60,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {cards.map((card) => (
          <ShortCard key={card.id} card={card} />
        ))}
      </div>

      {/* Trust text */}
      <p style={{
        zIndex: 2,
        animation: 'fade-up 0.55s 0.75s ease both',
        marginTop: 36, fontSize: 13, color: '#6b6b72',
        textAlign: 'center',
      }}>
        Used by creators on YouTube, Twitch and Instagram
      </p>

      <style>{`
        .hero-card:hover {
          transform: rotate(0deg) translateY(-12px) scale(1.05) !important;
          box-shadow: 0 20px 48px rgba(0,0,0,0.22) !important;
          z-index: 10;
        }
        .hero-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .hero-secondary-btn:hover {
          border-color: #0f0f0f;
        }
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
        @media (prefers-reduced-motion: reduce) {
          section *, section *::before, section *::after {
            animation: none !important;
            transition: none !important;
          }
          section > svg {
            opacity: 0.22 !important;
            transform: translateX(-50%) !important;
          }
          .hero-mosaic, .hero-card, h1, p, .hero-primary-btn, .hero-secondary-btn, div[style*="animation: fade-up"] {
            opacity: 1 !important;
            transform: none !important;
          }
          .hero-card {
            transform: rotate(0deg) translateY(0) !important;
          }
        }
      `}</style>
    </section>
  )
}
