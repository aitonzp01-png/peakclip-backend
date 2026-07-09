'use client'

import { useEffect, useRef } from 'react'
import LazyShort from './LazyShort'

const accent = '#ff1f1f'
const accentSoft = '#ffe5e5'

const gradients = [
  'linear-gradient(160deg, #ffe5e5 0%, #fff0f0 100%)',
  'linear-gradient(160deg, #f6f6f2 0%, #e8e8e3 100%)',
  'linear-gradient(160deg, #ffd6d6 0%, #fff5f5 100%)',
  'linear-gradient(160deg, #f0f0ea 0%, #ffffff 100%)',
  'linear-gradient(160deg, #ffcece 0%, #fffafa 100%)',
  'linear-gradient(160deg, #e8e8e3 0%, #f6f6f2 100%)',
]

const row1Clips = [
  {
    id: 'NIUqjLJ_2XY',
    name: 'MrBeast Clips',
    category: 'ENTERTAINMENT',
    views: '12M',
    initial: 'M',
    avatarColor: '#ff1f1f',
    title: 'I survived 24 hours in Antarctica',
    duration: '0:32',
  },
  {
    id: 'M7lc1UVf-VE',
    name: 'Creator Academy',
    category: 'TUTORIAL',
    views: '3.2M',
    initial: 'C',
    avatarColor: '#0f0f0f',
    title: 'How I edit viral shorts in 5 minutes',
    duration: '0:45',
  },
  {
    id: 'V-_O7nl0Ii0',
    name: 'Tech Reacts',
    category: 'REACTION',
    views: '5.8M',
    initial: 'T',
    avatarColor: '#6b6b6b',
    title: 'Reacting to the craziest phone ever',
    duration: '0:28',
  },
]

const row2Clips = [
  {
    id: '0e3GPea1Tyg',
    name: 'Viral Pets',
    category: 'ANIMALS',
    views: '8.1M',
    initial: 'V',
    avatarColor: '#d90000',
    title: 'This cat saved his owner at 3am',
    duration: '0:19',
  },
  {
    id: 'LXb3EKWsInQ',
    name: 'Travel Shorts',
    category: 'TRAVEL',
    views: '4.5M',
    initial: 'T',
    avatarColor: '#ff1f1f',
    title: 'The place that does not feel real',
    duration: '0:36',
  },
  {
    id: 'pJ8HV3HmX9U',
    name: 'Edit Pro',
    category: 'CREATOR',
    views: '2.9M',
    initial: 'E',
    avatarColor: '#0f0f0f',
    title: 'The editing trick everyone uses now',
    duration: '0:41',
  },
]

function ClipCard({ clip, index }) {
  return (
    <div className="resultados-card" style={{
      width: 180, height: 320, flexShrink: 0,
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: '#ffffff', border: '1px solid #e8e8e3',
      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
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
            background: clip.avatarColor || '#f6f6f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#ffffff', flexShrink: 0,
            border: '1px solid #e8e8e3',
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
          fontSize: 11, fontWeight: 700,
          color: accent,
          textTransform: 'uppercase', letterSpacing: '0.5px',
          background: accentSoft,
          borderRadius: 4,
          padding: '2px 6px',
          width: 'fit-content',
        }}>
          {clip.category}
        </span>
      </div>
    </div>
  )
}

function CarouselRow({ clips, direction }) {
  const doubled = [...clips, ...clips, ...clips, ...clips]
  const animName = direction === 'left' ? 'scroll-left' : 'scroll-right'
  const duration = direction === 'left' ? '32s' : '26s'

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
      background: '#f6f6f2', padding: '100px 0',
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
          color: '#6b6b6b', textTransform: 'uppercase',
          display: 'block', marginBottom: 16,
        }}>
          RESULTS
        </span>
        <h2 style={{
          fontFamily: 'Bebas Neue, Inter, sans-serif',
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 400,
          letterSpacing: '-0.5px',
          lineHeight: 1.05,
          color: '#0f0f0f',
          marginBottom: 16,
        }}>
          Content that<br />
          actually{' '}
          <span style={{
            color: '#ffffff',
            background: accent,
            padding: '0 10px',
            borderRadius: 8,
            display: 'inline-block',
          }}>
            works.
          </span>
        </h2>
        <p style={{
          fontSize: 16, color: '#6b6b6b', maxWidth: 420,
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
          fontSize: 14, color: '#6b6b6b', display: 'block',
          marginBottom: 16,
        }}>
          Want your videos to reach millions of people?
        </span>
        <a href="/register"
          className="resultados-cta"
          style={{
            background: accent, color: '#ffffff',
            fontWeight: 700, fontSize: 15,
            padding: '16px 32px', borderRadius: 100,
            border: 'none', cursor: 'pointer',
            textDecoration: 'none', display: 'inline-block',
            transition: 'transform 0.25s, box-shadow 0.25s, background 0.25s',
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
          border-color: ${accent} !important;
          box-shadow: 0 12px 32px rgba(255,31,31,0.14) !important;
        }
        .resultados-cta:hover {
          background: #d90000;
          transform: scale(1.03);
          box-shadow: 0 6px 24px rgba(255,31,31,0.30);
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
            letter-spacing: -0.5px !important;
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
