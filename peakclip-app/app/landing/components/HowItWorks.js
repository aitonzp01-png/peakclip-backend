'use client'

import { useEffect, useRef } from 'react'
import LazyShort from './LazyShort'

const gradients = [
  'linear-gradient(160deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  'linear-gradient(160deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(160deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(160deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(160deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(160deg, #fa709a 0%, #fee140 100%)',
]

const row1Clips = [
  { id: 'dQw4w9WgXcQ', name: 'Alex R.', category: 'PODCAST', views: '2.6M', initial: 'A', avatarColor: '#ff9a9e', title: 'This podcast clip broke the internet', duration: '0:32' },
  { id: '9bZkp7q19f0', name: 'Sara M.', category: 'FITNESS', views: '1.2M', initial: 'S', avatarColor: '#a18cd1', title: 'Nobody expected this workout result', duration: '0:45' },
  { id: 'M7lc1UVf-VE', name: 'Juan Pro', category: 'GAMING', views: '4.8M', initial: 'J', avatarColor: '#84fab0', title: 'The moment that broke the internet', duration: '0:28' },
  { id: 'V-_O7nl0Ii0', name: 'Tech Talk', category: 'TECH', views: '890k', initial: 'T', avatarColor: '#fccb90', title: 'Wait for the reaction', duration: '0:19' },
  { id: 'LXb3EKWsInQ', name: 'Marta G.', category: 'VLOGS', views: '3.1M', initial: 'M', avatarColor: '#43e97b', title: 'This is why I use PeakClip', duration: '0:36' },
  { id: 'jfKfPfyJRdk', name: 'Fin Libre', category: 'FINANCE', views: '540k', initial: 'F', avatarColor: '#fa709a', title: 'One tip that changed everything', duration: '0:41' },
]

const row2Clips = [
  { id: 'kJQP7kiw5Fk', name: 'Carlos V.', category: 'MUSIC', views: '2.2M', initial: 'C', avatarColor: '#ff9a9e', title: 'This song went viral overnight', duration: '0:29' },
  { id: '60ItHLz5WEA', name: 'Ana B.', category: 'LIFESTYLE', views: '780k', initial: 'A', avatarColor: '#a18cd1', title: 'Day in the life that blew up', duration: '0:33' },
  { id: 'Rbm6GXllBiw', name: 'Mike D.', category: 'COMEDY', views: '5.1M', initial: 'M', avatarColor: '#84fab0', title: 'The punchline nobody saw coming', duration: '0:24' },
  { id: '0e3GPea1Tyg', name: 'Luna R.', category: 'BEAUTY', views: '1.9M', initial: 'L', avatarColor: '#fccb90', title: 'This transformation is insane', duration: '0:38' },
  { id: 'NIUqjLJ_2XY', name: 'Pro Clips', category: 'SPORTS', views: '3.4M', initial: 'P', avatarColor: '#43e97b', title: 'He did WHAT in the final second', duration: '0:27' },
  { id: 'tAGnKpE4NCI', name: 'Dev Talk', category: 'TECH', views: '670k', initial: 'D', avatarColor: '#fa709a', title: 'Code that will blow your mind', duration: '0:35' },
]

function ClipCard({ clip, index }) {
  return (
    <div className="resultados-card" style={{
      width: 180, height: 320, flexShrink: 0,
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: '#ffffff', border: '1px solid #e8e8e2',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* Short video */}
      <div style={{ height: 224, position: 'relative' }}>
        <LazyShort
          videoId={clip.id}
          title={clip.title}
          channel={clip.name}
          initial={clip.initial}
          avatarColor={clip.avatarColor}
          views={clip.views}
          duration={clip.duration}
          gradient={gradients[index % gradients.length]}
          style={{ width: '100%', height: '100%', borderRadius: 0, boxShadow: 'none' }}
        />
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
        <ClipCard key={`${clip.name}-${i}`} clip={clip} index={i % clips.length} />
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
          RESULTS
        </span>
        <h2 style={{
          fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900,
          letterSpacing: -2, lineHeight: 0.97, color: '#0f0f0f',
          marginBottom: 16,
        }}>
          Content that<br />
          actually{' '}
          <span style={{
            fontStyle: 'italic', color: '#0f0f0f',
            background: '#c4ff3d', padding: '0 8px',
            borderRadius: 8,
          }}>
            works.
          </span>
        </h2>
        <p style={{
          fontSize: 16, color: '#6b6b72', maxWidth: 420,
          margin: '0 auto',
        }}>
          Real clips generated by PeakClip with millions of views.
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
          Want your videos to reach millions of people?
        </span>
        <a href="/register"
          className="resultados-cta"
          style={{
            background: '#c4ff3d', color: '#0f0f0f',
            fontWeight: 700, fontSize: 15,
            padding: '16px 32px', borderRadius: 100,
            border: 'none', cursor: 'pointer',
            textDecoration: 'none', display: 'inline-block',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}>
          Start free →
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
        @media (prefers-reduced-motion: reduce) {
          .carousel-row {
            animation-play-state: paused !important;
          }
          .resultados-title, .resultados-card, .resultados-cta {
            transition: none !important;
            transform: none !important;
          }
          .resultados-title {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        }
      `}</style>
    </section>
  )
}
