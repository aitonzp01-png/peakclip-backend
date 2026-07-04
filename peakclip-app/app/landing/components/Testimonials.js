'use client'

import { useEffect, useRef } from 'react'

const testimonials = [
  {
    name: 'Carlos M.',
    initial: 'C',
    role: 'Content Creator · YouTube',
    quote: 'In two weeks my clips reached 2 million people. PeakClip found moments I never even considered viral.',
    badge: '+2.1M views',
  },
  {
    name: 'Laura G.',
    initial: 'L',
    role: 'Podcaster · Spotify & YouTube',
    quote: 'I uploaded a 1-hour episode and PeakClip gave me 8 clips ready to publish. My channel grew 340% in 3 months.',
    badge: '340% growth',
  },
  {
    name: 'Andrés R.',
    initial: 'A',
    role: 'Streamer · Twitch',
    quote: 'My streams run 4 hours. I used to spend days editing. Now PeakClip does it while I\'m still live.',
    badge: '×4 faster',
  },
  {
    name: 'Sofía P.',
    initial: 'S',
    role: 'Business Coach · Instagram',
    quote: 'My reels went from 3,000 to 800,000 views in the first month. The AI knows exactly what moments hook people.',
    badge: '+800k views',
  },
  {
    name: 'Miguel T.',
    initial: 'M',
    role: 'Tech Creator · TikTok',
    quote: 'What surprises me most is that captions come out perfect and reframing is automatic. It feels like magic.',
    badge: '3× reach',
  },
  {
    name: 'Elena V.',
    initial: 'E',
    role: 'Fitness Creator · Reels',
    quote: 'I publish daily with zero effort. PeakClip schedules the clips and I just focus on recording the original content.',
    badge: '7 clips/day',
  },
  {
    name: 'Diego H.',
    initial: 'D',
    role: 'Musician · TikTok',
    quote: 'My songs now go viral within a week. PeakClip helps me reach new audiences all the time.',
    badge: '+500k plays',
  },
  {
    name: 'Valeria N.',
    initial: 'V',
    role: 'Food Creator · Reels',
    quote: 'I upload a 20-minute recipe and get 5 clips ready. My followers grew from 5k to 45k in two months.',
    badge: '9× followers',
  },
  {
    name: 'Pablo G.',
    initial: 'P',
    role: 'Educator · YouTube',
    quote: 'My recorded lectures turned into clips that my students share. Organic reach multiplied by 6.',
    badge: '6× reach',
  },
  {
    name: 'Camila R.',
    initial: 'C',
    role: 'Traveler · Instagram',
    quote: 'Editing 20 minutes of video used to take me 3 hours. PeakClip does it in seconds — and better than I can.',
    badge: '95% faster',
  },
  {
    name: 'Jorge L.',
    initial: 'J',
    role: 'Comedian · YouTube Shorts',
    quote: 'My long sketches now generate shorts that go viral. I went from 2k to 62k subscribers in 45 days.',
    badge: '62k subs',
  },
  {
    name: 'Ana F.',
    initial: 'A',
    role: 'Fashion Creator · TikTok',
    quote: 'The AI picks the best outfits and moments. My videos went from 500 views to 50k on average.',
    badge: '×100 views',
  },
]

export default function Testimonials() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const title = el.querySelector('.ts-title')
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

  const doubled = [...testimonials, ...testimonials]

  return (
    <section id="testimonios" ref={sectionRef} style={{
      background: '#f5f5f0', padding: '100px 0',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Title */}
      <div className="ts-title" style={{
        textAlign: 'center', padding: '0 24px', marginBottom: 48,
        opacity: 0, transform: 'translateY(18px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: 3,
          color: '#6b6b72', textTransform: 'uppercase',
          display: 'block', marginBottom: 16,
        }}>
          REAL TESTIMONIALS
        </span>
        <h2 style={{
          fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900,
          letterSpacing: -2, lineHeight: 0.97, color: '#0f0f0f',
          marginBottom: 16,
        }}>
          What{' '}
          <span style={{
            fontStyle: 'italic', color: '#0f0f0f',
            background: '#c4ff3d', padding: '0 8px',
            borderRadius: 8,
          }}>
            creators
          </span>{' '}
          say
        </h2>
        <p style={{
          fontSize: 16, color: '#6b6b72', maxWidth: 420,
          margin: '0 auto',
        }}>
          Over 2,400 creators trust PeakClip to grow their audience.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 0,
        maxWidth: 600, margin: '0 auto 48px',
      }}>
        <div style={{ padding: '0 40px', textAlign: 'center', paddingLeft: 0 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#0f0f0f', display: 'block' }}>
            2,400+
          </span>
          <span style={{ fontSize: 13, color: '#6b6b72', display: 'block', marginTop: 4 }}>
            active creators
          </span>
        </div>
        <div style={{ width: 1, background: '#e0e0da' }} />
        <div style={{ padding: '0 40px', textAlign: 'center' }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#0f0f0f', display: 'block' }}>
            48M+
          </span>
          <span style={{ fontSize: 13, color: '#6b6b72', display: 'block', marginTop: 4 }}>
            views generated
          </span>
        </div>
        <div style={{ width: 1, background: '#e0e0da' }} />
        <div style={{ padding: '0 40px', textAlign: 'center', paddingRight: 0 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#c4ff3d', display: 'block' }}>
            4.9★
          </span>
          <span style={{ fontSize: 13, color: '#6b6b72', display: 'block', marginTop: 4 }}>
            average rating
          </span>
        </div>
      </div>

      {/* Carousel */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <div className="ts-track" style={{
          display: 'flex', gap: 20, width: 'max-content',
          animation: 'ts-scroll 50s linear infinite',
          padding: '0 40px',
        }}>
          {doubled.map((t, i) => (
            <div key={`${t.name}-${i}`} className="ts-card" style={{
              width: 'calc((100vw - 80px - 40px) / 3)',
              maxWidth: 380, minWidth: 280,
              flexShrink: 0,
              background: '#ffffff', borderRadius: 20,
              border: '1px solid #e8e8e2',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}>
              {/* Top bar with avatar */}
              <div style={{
                padding: '20px 24px 0',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8e8e2, #d4d4cc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 18, fontWeight: 800, color: '#0f0f0f',
                }}>
                  {t.initial}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f0f0f' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6b72', marginTop: 2 }}>
                    {t.role}
                  </div>
                </div>
                <span style={{
                  background: 'rgba(196,255,61,0.15)',
                  border: '1px solid rgba(196,255,61,0.35)',
                  color: '#0f0f0f',
                  borderRadius: 100, padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {t.badge}
                </span>
              </div>

              {/* Quote */}
              <div style={{ padding: '16px 24px 24px', position: 'relative' }}>
                <span style={{
                  fontSize: 40, color: '#c4ff3d',
                  lineHeight: 0.6, fontFamily: 'Georgia, serif',
                  display: 'block', marginBottom: 4, opacity: 0.6,
                }}>
                  "
                </span>
                <p style={{
                  fontSize: 14, color: '#4a4a4a', lineHeight: 1.6,
                  fontWeight: 400, margin: 0,
                }}>
                  {t.quote}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ts-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ts-track:hover {
          animation-play-state: paused;
        }
        .ts-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important;
        }
        .ts-title.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        @media (max-width: 1024px) {
          .ts-card {
            width: calc((100vw - 80px - 20px) / 2) !important;
            min-width: 240px !important;
          }
        }
        @media (max-width: 768px) {
          .ts-card {
            width: calc(100vw - 80px) !important;
            min-width: 200px !important;
          }
          section#testimonios {
            padding: 60px 0 !important;
          }
          div[style*="padding: 0 40px;"] {
            flex-direction: column !important;
            gap: 16px !important;
            max-width: 300px !important;
          }
          div[style*="padding: 0 40px;"] > div {
            padding: 0 !important;
            padding-bottom: 16px !important;
          }
          div[style*="padding: 0 40px;"] > div[style*="width: 1px"] {
            width: 100% !important;
            height: 1px !important;
          }
        }
      `}</style>
    </section>
  )
}
