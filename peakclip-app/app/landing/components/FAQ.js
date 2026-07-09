'use client'

import { useState, useEffect, useRef } from 'react'

const faqs = [
  {
    q: 'Do I need video editing skills?',
    a: 'No — PeakClip automates everything. Just paste a URL and get clips in minutes.',
  },
  {
    q: 'What platforms can I import from?',
    a: 'YouTube, Twitch VODs, direct MP4. Coming soon: Spotify and Kick.',
  },
  {
    q: 'How fast are clips ready?',
    a: '3-10 minutes. One hour of video generates 8-15 clips.',
  },
  {
    q: 'Can I publish directly?',
    a: 'Yes — with Pro and Agency you can schedule to TikTok, Instagram and YouTube.',
  },
  {
    q: 'Are subtitles accurate?',
    a: 'Yes — over 95% accuracy including multiple language variants.',
  },
  {
    q: 'What if I\'m not satisfied?',
    a: '14-day money-back guarantee, no questions asked.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — no commitment or penalties.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const title = el.querySelector('.faq-title-wrap')
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

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" ref={sectionRef} style={{
      background: '#f6f6f2', padding: '100px 24px',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="faq-title-wrap" style={{
          opacity: 0, transform: 'translateY(18px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          marginBottom: 48,
        }}>
          <div className="faq-layout">
            {/* Left column - title */}
            <div style={{ flex: '0 0 280px' }}>
              <span style={{
                fontSize: 12, fontWeight: 600, letterSpacing: 3,
                color: '#6b6b6b', textTransform: 'uppercase',
                display: 'block', marginBottom: 16,
              }}>
                FAQ
              </span>
              <h2 style={{
                fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
                fontSize: 'clamp(44px,6vw,80px)',
                fontWeight: 400,
                letterSpacing: '-0.5px',
                lineHeight: 1.05,
                color: '#0f0f0f',
                marginBottom: 16,
              }}>
                Got<br />
                <span style={{
                  background: '#ff1f1f', color: '#ffffff',
                  padding: '0 10px', borderRadius: 6,
                }}>
                  questions?
                </span>
              </h2>
              <p style={{ fontSize: 14, color: '#6b6b6b', maxWidth: 250, lineHeight: 1.6, marginBottom: 24 }}>
                Quick answers to the most common questions about PeakClip.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 6 }}>
                    Can't find your answer?
                  </p>
                  <a href="/contact" className="faq-contact-link" style={{
                    fontSize: 14, fontWeight: 700, color: '#ff1f1f',
                    textDecoration: 'none', transition: 'opacity 0.2s',
                  }}>
                    Contact us →
                  </a>
                </div>
              </div>
            </div>

            {/* Right column - accordion */}
            <div style={{ flex: 1, maxWidth: 680 }}>
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i
                return (
                    <div key={i} style={{
                      borderBottom: '1px solid #e8e8e3',
                    }}>
                      <button
                        onClick={() => toggle(i)}
                        style={{
                          width: '100%', background: 'none', border: 'none',
                          padding: '20px 0', cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: 16,
                          textAlign: 'left', fontFamily: 'inherit',
                          fontSize: 15, fontWeight: 700,
                          color: isOpen ? '#ff1f1f' : '#0f0f0f',
                          transition: 'color 0.2s',
                        }}
                        className="faq-question-btn"
                      >
                      <span>{faq.q}</span>
                      <span style={{
                        flexShrink: 0, transition: 'transform 0.35s ease',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        display: 'flex', alignItems: 'center',
                        color: isOpen ? '#ff1f1f' : '#0f0f0f',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </button>
                    <div style={{
                      overflow: 'hidden',
                      transition: 'max-height 0.35s ease',
                      maxHeight: isOpen ? '200px' : '0',
                    }}>
                      <p style={{
                        fontSize: 14, color: '#6b6b6b', lineHeight: 1.7,
                        paddingBottom: 20, margin: 0,
                      }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                )
              })}

            </div>
          </div>
        </div>
      </div>

      <style>{`
        .faq-title-wrap.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .faq-question-btn:hover {
          color: #ff1f1f !important;
        }
        .faq-question-btn:hover span {
          color: #ff1f1f !important;
        }
        .faq-contact-link:hover {
          opacity: 0.7;
        }
        .faq-layout {
          display: flex;
          gap: 60px;
          align-items: flex-start;
          text-align: left;
        }
        @media (max-width: 768px) {
          section#faq { padding: 60px 16px !important; }
          .faq-layout {
            flex-direction: column !important;
            gap: 40px !important;
            align-items: center !important;
            text-align: center !important;
          }
          .faq-layout > div:first-child {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .faq-title-wrap > div {
            flex-direction: column !important;
            gap: 40px !important;
          }
          .faq-title-wrap > div > div:first-child {
            flex: none !important;
            text-align: center !important;
          }
          .faq-title-wrap > div > div:first-child p {
            max-width: 100% !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .faq-title-wrap, .faq-question-btn span, .faq-question-btn + div {
            transition: none !important;
          }
          .faq-title-wrap {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        }
      `}</style>
    </section>
  )
}
