'use client'

import { useState, useEffect, useRef } from 'react'

const plans = [
  {
    name: 'Free',
    price: 0,
    monthlyPrice: 0,
    features: [
      '3 clips/mo',
      'Auto captions',
      'TikTok & Reels formats',
      '1080p',
      'Web access',
    ],
    cta: 'Get started free',
    href: '/register',
    outline: true,
  },
  {
    name: 'Pro',
    monthlyPrice: 29,
    popular: true,
    features: [
      '60 clips/mo',
      'Custom captions',
      'Auto reframe',
      'AI viral detection',
      'Scheduled publishing (3 platforms)',
      'Basic analytics',
      'Priority support',
    ],
    cta: 'Start now',
    href: '/register?plan=pro',
  },
  {
    name: 'Agency',
    monthlyPrice: 89,
    features: [
      'Unlimited clips',
      'Everything in Pro',
      '5 channels',
      'Unlimited platforms',
      'API access',
      'Advanced analytics',
      'Account manager',
    ],
    cta: 'Contact sales',
    href: '/contact',
    outline: true,
  },
]

function CheckIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const [animating, setAnimating] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const title = el.querySelector('.pricing-title-wrap')
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

  const handleToggle = (val) => {
    if (val === yearly) return
    setAnimating(true)
    setTimeout(() => {
      setYearly(val)
      setTimeout(() => setAnimating(false), 50)
    }, 150)
  }

  const getYearlyPerMonth = (monthly) => Math.round(monthly * 0.8)
  const getYearlyTotal = (monthly) => monthly * 12 * 0.8

  return (
    <section id="precios" ref={sectionRef} style={{
      background: '#f6f6f2', padding: '100px 24px',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Title */}
        <div className="pricing-title-wrap" style={{
          textAlign: 'center', marginBottom: 48,
          opacity: 0, transform: 'translateY(18px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 3,
            color: '#6b6b6b', textTransform: 'uppercase',
            display: 'block', marginBottom: 16,
          }}>
            PRICING
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
            Simple,<br />
            <span style={{
              background: '#ff1f1f', color: '#ffffff',
              padding: '0 10px', borderRadius: 6,
            }}>
              no surprises.
            </span>
          </h2>
          <p style={{ fontSize: 16, color: '#6b6b6b', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Start free. Scale when you're ready.
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <div className="pricing-toggle" style={{
            display: 'inline-flex', background: '#ffffff', borderRadius: 100,
            border: '1px solid #e8e8e3', padding: 4, position: 'relative',
          }}>
            <div className="pricing-toggle-slider" style={{
              position: 'absolute', top: 4, bottom: 4,
              width: 'calc(50% - 4px)',
              background: '#0f0f0f', borderRadius: 100,
              transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              left: yearly ? 'calc(50% + 0px)' : '4px',
              zIndex: 0,
            }} />
            <button
              onClick={() => handleToggle(false)}
              style={{
                padding: '10px 32px', borderRadius: 100, border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: 'transparent',
                color: yearly ? '#6b6b6b' : '#ffffff',
                transition: 'color 0.3s ease',
                position: 'relative', zIndex: 1,
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => handleToggle(true)}
              style={{
                padding: '10px 32px', borderRadius: 100, border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: 'transparent',
                color: yearly ? '#ffffff' : '#6b6b6b',
                transition: 'color 0.3s ease',
                position: 'relative', zIndex: 1,
              }}
            >
              Yearly
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700,
                color: yearly ? '#ff1f1f' : '#6b6b6b',
                transition: 'color 0.3s ease',
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-cards-wrap" style={{
          display: 'flex', gap: 20, justifyContent: 'center',
          flexWrap: 'wrap', alignItems: 'stretch',
          marginBottom: 32,
        }}>
          {plans.map((plan) => {
            const monthly = plan.monthlyPrice || plan.price
            const yearlyPerMonth = plan.name !== 'Free' ? getYearlyPerMonth(monthly) : 0
            const yearlyTotal = plan.name !== 'Free' ? getYearlyTotal(monthly) : 0
            const displayPrice = plan.name === 'Free' ? 0 : yearly ? yearlyPerMonth : monthly
            const suffix = plan.name === 'Free' ? '/mes' : yearly ? '/mes' : '/mes'
            const showOriginal = plan.name !== 'Free' && yearly

            return (
              <div key={plan.name} className="pricing-card-item" style={{
                flex: '1 1 280px', maxWidth: 340, minWidth: 260,
                display: 'flex', flexDirection: 'column',
                background: plan.popular ? '#ffffff' : '#ffffff',
                borderRadius: 20,
                border: plan.popular ? '2px solid #ff1f1f' : '1px solid #e8e8e3',
                padding: 32,
                transform: plan.popular ? 'translateY(-12px)' : 'none',
                boxShadow: plan.popular ? '0 24px 60px rgba(255,31,31,0.12)' : '0 2px 12px rgba(0,0,0,0.04)',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}>
                {plan.popular && (
                  <span style={{
                    position: 'absolute', top: 16, right: 16,
                    background: '#ff1f1f', color: '#ffffff',
                    fontSize: 10, fontWeight: 800, letterSpacing: 1,
                    padding: '4px 12px', borderRadius: 100,
                  }}>
                    MOST POPULAR
                  </span>
                )}

                {/* Plan name */}
                <div style={{
                  fontSize: 18, fontWeight: 800,
                  color: plan.popular ? '#ff1f1f' : '#0f0f0f',
                  marginBottom: 8, letterSpacing: '-0.3px',
                }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div className="pricing-price-block" style={{
                  marginBottom: 24, position: 'relative',
                  opacity: animating ? 0 : 1,
                  transform: animating ? 'translateY(6px)' : 'translateY(0)',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                }}>
                  <div style={{
                    fontSize: 42, fontWeight: 900,
                    color: '#0f0f0f',
                    letterSpacing: -2, lineHeight: 1,
                  }}>
                    {plan.name === 'Free' ? '$0' : `$${displayPrice}`}
                    <span style={{ fontSize: 16, fontWeight: 500, color: '#6b6b6b', letterSpacing: 0 }}>{suffix}</span>
                  </div>
                  {showOriginal && (
                    <>
                      <div style={{
                        fontSize: 13, color: '#6b6b6b', marginTop: 4,
                        textDecoration: 'line-through',
                      }}>
                        ${monthly}/mes
                      </div>
                      <div style={{
                        fontSize: 11, color: '#6b6b6b', marginTop: 2,
                      }}>
                        (${Math.round(yearlyTotal)}/año)
                      </div>
                    </>
                  )}
                </div>

                {/* CTA */}
                <a
                  href={plan.href}
                  className={`pricing-cta-btn ${plan.popular ? 'popular' : ''} ${plan.outline ? 'outline' : ''}`}
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '14px 0', borderRadius: 12,
                    fontWeight: 700, fontSize: 14,
                    textDecoration: 'none', marginBottom: 28,
                    transition: 'all 0.25s',
                    ...(plan.popular
                      ? { background: '#ff1f1f', color: '#ffffff', border: 'none' }
                      : plan.outline
                        ? { background: 'transparent', color: '#0f0f0f', border: '1.5px solid #0f0f0f' }
                        : { background: '#0f0f0f', color: '#ffffff', border: 'none' }
                    ),
                  }}
                >
                  {plan.cta}
                </a>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {plan.features.map((feat) => (
                    <div key={feat} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: 13,
                      color: '#6b6b6b',
                    }}>
                      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <CheckIcon color={plan.popular ? '#ff1f1f' : '#0f0f0f'} />
                      </span>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Trial note */}
        <p style={{
          textAlign: 'center', fontSize: 13, color: '#6b6b6b', maxWidth: 480,
          margin: '0 auto', lineHeight: 1.6,
        }}>
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>

      <style>{`
        .pricing-title-wrap.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .pricing-card-item:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important;
        }
        .pricing-card-item[style*="translateY(-12px)"]:hover {
          transform: translateY(-16px) !important;
          box-shadow: 0 32px 72px rgba(255,31,31,0.18) !important;
        }
        .pricing-cta-btn.outline:hover {
          background: #0f0f0f !important;
          color: #ffffff !important;
        }
        .pricing-cta-btn.popular:hover {
          background: #d90000 !important;
          transform: scale(1.02);
        }
        .pricing-toggle button:focus-visible {
          outline: 2px solid #ff1f1f;
          outline-offset: 2px;
        }
        @media (max-width: 768px) {
          section#precios { padding: 60px 16px !important; }
          .pricing-card-item[style*="translateY(-12px)"] {
            transform: none !important;
          }
          .pricing-cards-wrap {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .pricing-card-item {
            max-width: 100% !important;
            flex: none !important;
          }
          .pricing-toggle button {
            padding: 10px 20px !important;
            font-size: 13px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pricing-title-wrap, .pricing-card-item, .pricing-price-block, .pricing-toggle-slider, .pricing-cta-btn {
            transition: none !important;
            animation: none !important;
          }
          .pricing-title-wrap {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
          .pricing-card-item:hover, .pricing-card-item[style*="translateY(-12px)"]:hover {
            transform: none !important;
          }
          .pricing-price-block {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
