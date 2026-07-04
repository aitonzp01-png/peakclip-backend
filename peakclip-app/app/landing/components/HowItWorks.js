'use client'

import { useEffect, useRef } from 'react'

const row1Clips = [
  { name: 'Alex R.', category: 'PODCAST', views: '2.6M', initial: 'A' },
  { name: 'Sara M.', category: 'FITNESS', views: '1.2M', initial: 'S' },
  { name: 'Juan Pro', category: 'GAMING', views: '4.8M', initial: 'J' },
  { name: 'Tech Talk', category: 'TECH', views: '890k', initial: 'T' },
  { name: 'Marta G.', category: 'VLOGS', views: '3.1M', initial: 'M' },
  { name: 'Fin Libre', category: 'FINANZAS', views: '540k', initial: 'F' },
]

const row2Clips = [
  { name: 'Carlos V.', category: 'MÚSICA', views: '2.2M', initial: 'C' },
  { name: 'Ana B.', category: 'LIFESTYLE', views: '780k', initial: 'A' },
  { name: 'Mike D.', category: 'COMEDY', views: '5.1M', initial: 'M' },
  { name: 'Luna R.', category: 'BEAUTY', views: '1.9M', initial: 'L' },
  { name: 'Pro Clips', category: 'DEPORTES', views: '3.4M', initial: 'P' },
  { name: 'Dev Talk', category: 'TECH', views: '670k', initial: 'D' },
]

function ClipCard({ clip }) {
  return (
    <div className="resultados-card" style={{
      width: 180, height: 320, flexShrink: 0,
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: '#ffffff', border: '1px solid #e8e8e2',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* Video zone */}
      <div style={{
        height: 224, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #e8e8e2, #d4d4cc 70%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 25% 25%, rgba(196,255,61,0.3), transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Views badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          borderRadius: 20, padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>
            {clip.views}
          </span>
        </div>
      </div>

      {/* Info zone */}
      <div style={{
        height: 96, background: '#ffffff',
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#f0f0ea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#6b6b72', flexShrink: 0,
          }}>
            {clip.initial}
          </div>
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#0f0f0f',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {clip.name}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#c4ff3d',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {clip.category}
        </span>
      </div>
    </div>
  )
}

function CarouselRow({ clips, direction }) {
  const doubled = [...clips, ...clips]
  const animName = direction === 'left' ? 'scroll-left' : 'scroll-right'
  const duration = direction === 'left' ? '28s' : '22s'

  return (
    <div className="carousel-row" style={{
      display: 'flex', gap: 16, width: 'max-content',
      animation: `${animName} ${duration} linear infinite`,
    }}>
      {doubled.map((clip, i) => (
        <ClipCard key={`${clip.name}-${i}`} clip={clip} />
      ))}
    </div>
  )
}

export default function HowItWorks() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const title = el.querySelector('.resultados-title')
    if (!title) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          title.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(title)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="resultados" ref={sectionRef} style={{
      background: '#f5f5f0', padding: '100px 0',
      position: 'relative',
    }}>
      {/* Title */}
      <div className="resultados-title" style={{
        textAlign: 'center', padding: '0 24px', marginBottom: 48,
        opacity: 0, transform: 'translateY(18px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: 3,
          color: '#6b6b72', textTransform: 'uppercase',
          display: 'block', marginBottom: 16,
        }}>
          CLIPS QUE GENERAMOS
        </span>
        <h2 style={{
          fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900,
          letterSpacing: -2, lineHeight: 0.97, color: '#0f0f0f',
          marginBottom: 16,
        }}>
          Contenido que<br />
          funciona de{' '}
          <span style={{
            fontStyle: 'italic', color: '#0f0f0f',
            background: '#c4ff3d', padding: '0 8px',
            borderRadius: 8,
          }}>
            verdad.
          </span>
        </h2>
        <p style={{
          fontSize: 16, color: '#6b6b72', maxWidth: 420,
          margin: '0 auto',
        }}>
          Clips reales generados por PeakClip con millones de reproducciones.
        </p>
      </div>

      {/* Carousels */}
      <div style={{ width: '100%', overflow: 'hidden', marginTop: 40 }}>
        <div style={{ marginBottom: 16 }}>
          <CarouselRow clips={row1Clips} direction="left" />
        </div>
        <div className="resultados-row2">
          <CarouselRow clips={row2Clips} direction="right" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center', marginTop: 48, padding: '0 24px',
      }}>
        <span style={{
          fontSize: 14, color: '#6b6b72', display: 'block',
          marginBottom: 16,
        }}>
          ¿Quieres que tus videos lleguen a millones de personas?
        </span>
        <a href="/login?signup=true"
          className="resultados-cta"
          style={{
            background: '#c4ff3d', color: '#0f0f0f',
            fontWeight: 700, fontSize: 15,
            padding: '16px 32px', borderRadius: 100,
            border: 'none', cursor: 'pointer',
            textDecoration: 'none', display: 'inline-block',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}>
          Empezar gratis →
        </a>
      </div>

      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .carousel-row:hover { animation-play-state: paused; }
        .resultados-card:hover {
          transform: scale(1.04) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.14) !important;
        }
        .resultados-cta:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 24px rgba(196,255,61,0.35);
        }
        .resultados-title.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        @media (max-width: 768px) {
          .carousel-row { gap: 12px !important; }
          .resultados-card {
            width: 150px !important;
            height: 266px !important;
          }
          .resultados-card > div:first-child {
            height: 186px !important;
          }
          .resultados-card > div:last-child {
            height: 80px !important;
          }
          .resultados-row2 { display: none !important; }
          section#resultados { padding: 60px 0 !important; }
          section#resultados h2 {
            font-size: clamp(32px,8vw,48px) !important;
            letter-spacing: -1.5px !important;
          }
          .resultados-cta {
            display: block !important;
            max-width: 280px !important;
            margin: 0 auto !important;
            text-align: center !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1024px) {
          .resultados-card {
            width: 160px !important;
            height: 284px !important;
          }
          .resultados-card > div:first-child {
            height: 199px !important;
          }
          .resultados-card > div:last-child {
            height: 85px !important;
          }
        }
      `}</style>
    </section>
  )
}
