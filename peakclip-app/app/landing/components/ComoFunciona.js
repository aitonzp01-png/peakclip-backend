'use client'

import { useEffect, useRef } from 'react'

const steps = [
  {
    num: '01',
    title: 'Paste your URL',
    desc: 'Copy the link from your YouTube, Twitch or Instagram video. PeakClip analyzes it instantly.',
    mockup: (
      <div style={{
        background: '#ffffff', borderRadius: 14, border: '1px solid #e8e8e2',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Browser bar */}
        <div style={{ padding: '10px 14px', background: '#f5f5f0', borderBottom: '1px solid #e8e8e2', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
          <div style={{
            flex: 1, marginLeft: 8, background: '#ffffff', borderRadius: 6, border: '1px solid #e8e8e2',
            padding: '6px 12px', fontSize: 12, color: '#6b6b72', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth="2">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <span style={{ color: '#c4ff3d', fontWeight: 600 }}>peakclip.app</span>
            <span>/procesar</span>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 18px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6b72', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Video URL</div>
          <div style={{
            display: 'flex', gap: 8,
          }}>
            <div style={{
              flex: 1, background: '#f5f5f0', border: '1px solid #e8e8e2', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, color: '#0f0f0f',
            }}>
              https://youtube.com/watch?v=...
            </div>
            <div style={{
              background: '#c4ff3d', borderRadius: 10, width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            <div style={{
              background: '#c4ff3d', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#0f0f0f',
            }}>YouTube</div>
            <div style={{
              background: '#f0f0ea', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, color: '#6b6b72',
            }}>Twitch</div>
            <div style={{
              background: '#f0f0ea', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, color: '#6b6b72',
            }}>Instagram</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: '02',
    title: 'AI edits it for you',
    desc: 'Nuestra inteligencia artificial encuentra los momentos más virales y genera clips optimizados automáticamente.',
    mockup: (
      <div style={{
        background: '#ffffff', borderRadius: 14, border: '1px solid #e8e8e2',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e8e8e2', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: '#c4ff3d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#0f0f0f">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0f0f' }}>PeakClip AI</div>
            <div style={{ fontSize: 11, color: '#6b6b72' }}>Editing video...</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#c4ff3d',
                animation: `pulse-dot 1.8s ease-in-out ${i * 0.3}s infinite`,
              }} />
            ))}
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Clip cards being generated */}
          {[
            { label: 'Best moment', duration: '0:32', score: '98%' },
            { label: 'Reaction highlight', duration: '0:45', score: '92%' },
            { label: 'Hook intro', duration: '0:18', score: '87%' },
          ].map((clip, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#f5f5f0', borderRadius: 10, padding: '10px 12px',
              border: '1px solid #e8e8e2',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: '#0f0f0f',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f0f0f' }}>{clip.label}</div>
                <div style={{ fontSize: 10, color: '#6b6b72' }}>Duration: {clip.duration}</div>
              </div>
              <div style={{
                background: '#c4ff3d', borderRadius: 6, padding: '2px 8px',
                fontSize: 10, fontWeight: 700, color: '#0f0f0f',
              }}>
                {clip.score}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e8e2', background: '#fafaf8' }}>
          <div style={{ fontSize: 11, color: '#6b6b72', textAlign: 'center' }}>
            <span style={{ fontWeight: 700, color: '#0f0f0f' }}>3 clips</span> generated automatically
          </div>
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: 'Schedule & publish',
    desc: 'Download clips or schedule them directly to TikTok, Reels and Shorts with one click.',
    mockup: (
      <div style={{
        background: '#ffffff', borderRadius: 14, border: '1px solid #e8e8e2',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e8e8e2' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6b72', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Schedule post</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { name: 'TikTok', color: '#0f0f0f', icon: '♪' },
              { name: 'Reels', color: '#E1306C', icon: '◻' },
              { name: 'Shorts', color: '#FF0000', icon: '▶' },
              { name: 'Download', color: '#6b6b72', icon: '↓' },
            ].map((platform, i) => (
              <div key={i} style={{
                background: i === 0 ? '#c4ff3d' : '#f5f5f0',
                borderRadius: 10, padding: '12px', textAlign: 'center',
                cursor: 'pointer', transition: 'transform 0.2s, background 0.2s',
                border: i === 0 ? 'none' : '1px solid #e8e8e2',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4, color: i === 0 ? '#0f0f0f' : platform.color }}>{platform.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#0f0f0f' : '#0f0f0f' }}>{platform.name}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Schedule preview */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6b72', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Upcoming posts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { day: 'Today', time: '18:00', platform: 'TikTok', clip: 'Best moment' },
              { day: 'Tomorrow', time: '12:30', platform: 'Reels', clip: 'Reaction highlight' },
            ].map((pub, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f5f5f0', borderRadius: 8, padding: '8px 10px',
                border: '1px solid #e8e8e2',
              }}>
                <div style={{ textAlign: 'center', minWidth: 40 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0f0f0f' }}>{pub.day}</div>
                  <div style={{ fontSize: 9, color: '#6b6b72' }}>{pub.time}</div>
                </div>
                <div style={{ width: 1, height: 24, background: '#e8e8e2' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0f0f0f' }}>{pub.clip}</div>
                  <div style={{ fontSize: 10, color: '#6b6b72' }}>{pub.platform}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#c4ff3d',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#0f0f0f', flexShrink: 0,
                }}>
                  ✓
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
]

export default function ComoFunciona() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const title = el.querySelector('.cf-title')
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
    <section id="como-funciona" ref={sectionRef} style={{
      background: '#f5f5f0', padding: '120px 0',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: -200, right: -200, opacity: 0.08, pointerEvents: 'none' }}
      >
        <defs>
          <radialGradient id="cfBlob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4ff3d" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f5f5f0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#cfBlob)" />
      </svg>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <div className="cf-title" style={{
          textAlign: 'center', marginBottom: 72,
          opacity: 0, transform: 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#ffffff', border: '1px solid #e8e8e2',
            borderRadius: 100, padding: '6px 16px',
            fontSize: 12, color: '#6b6b72', marginBottom: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#c4ff3d">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Simple workflow
          </div>
          <h2 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 900,
            letterSpacing: '-2.5px', lineHeight: 0.95, color: '#0f0f0f',
            marginBottom: 16,
          }}>
            Three steps, one{' '}
            <span style={{
              fontStyle: 'italic', color: '#0f0f0f',
              background: '#c4ff3d', padding: '2px 12px',
              borderRadius: 10, display: 'inline-block',
            }}>
              viral clip
            </span>
          </h2>
          <p style={{ fontSize: 16, color: '#6b6b72', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            From your original video to TikTok, Reels and Shorts in minutes. No editing required.
          </p>
        </div>

        {/* Steps */}
        <div className="cf-steps-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
          alignItems: 'start',
        }}>
          {steps.map((step, i) => (
            <div key={step.num} className="cf-step" style={{
              opacity: 0, transform: 'translateY(30px)',
              animation: `cf-step-in 0.6s ${0.15 + i * 0.12}s ease forwards`,
            }}>
              {/* Number badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: '#0f0f0f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, color: '#c4ff3d',
                  fontStyle: 'italic',
                }}>
                  {step.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f0f0f', letterSpacing: '-0.5px' }}>
                    {step.title}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: 13, color: '#6b6b72', lineHeight: 1.6,
                marginBottom: 18, paddingLeft: 2,
              }}>
                {step.desc}
              </p>

              {/* Mockup */}
              <div className="cf-card-hover" style={{
                transition: 'transform 0.35s cubic-bezier(.22,.68,0,1.2), box-shadow 0.35s',
                cursor: 'default',
              }}>
                {step.mockup}
              </div>
            </div>
          ))}
        </div>

        {/* Connector arrows (desktop) */}
        <div style={{
          position: 'absolute', top: '58%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '78%', pointerEvents: 'none', display: 'none',
        }}>
          {[0, 1].map(i => (
            <svg key={i} width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M4 12h36M32 4l12 8-12 8" stroke="#cececa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="cf-bottom-cta" style={{
          marginTop: 80, textAlign: 'center',
          opacity: 0, animation: 'cf-step-in 0.6s 0.7s ease forwards',
        }}>
          <p style={{ fontSize: 15, color: '#6b6b72', marginBottom: 20, fontWeight: 500 }}>
            Ready to turn your content into viral clips?
          </p>
          <a href="/register" className="cf-cta-btn" style={{
            background: '#0f0f0f', color: '#f5f5f0',
            fontWeight: 700, fontSize: 15,
            padding: '16px 36px', borderRadius: 100,
            border: 'none', cursor: 'pointer',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}>
            Start now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4ff3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes cf-step-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cf-title.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .cf-card-hover:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 16px 48px rgba(0,0,0,0.08);
        }
        .cf-cta-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 28px rgba(0,0,0,0.18);
        }
        .cf-cta-btn:hover svg {
          animation: cf-arrow-right 0.6s ease infinite;
        }
        @keyframes cf-arrow-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        @media (max-width: 900px) {
          .cf-steps-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
        @media (max-width: 768px) {
          section#como-funciona { padding: 72px 0 !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-title, .cf-step, .cf-bottom-cta, .cf-card-hover, .cf-cta-btn, .cf-cta-btn svg {
            animation: none !important;
            transition: none !important;
          }
          .cf-title, .cf-step, .cf-bottom-cta {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
