'use client'

import { useEffect, useRef } from 'react'

const links = [
  { label: 'Cómo funciona', href: '#how-it-works' },
  { label: 'Resultados', href: '#showcase' },
  { label: 'Precios', href: '#pricing' },
]

export default function Navbar() {
  const navRef = useRef(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.style.background = 'rgba(245,245,240,0.96)'
        nav.style.boxShadow = '0 1px 16px rgba(0,0,0,0.07)'
      } else {
        nav.style.background = 'rgba(245,245,240,0.72)'
        nav.style.boxShadow = 'none'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 64, zIndex: 100,
        background: 'rgba(245,245,240,0.72)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fade-in-nav 0.5s ease forwards',
      }}
    >
      <style>{`
        @keyframes fade-in-nav {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Logo */}
      <a href="/" style={{
        fontWeight: 900, fontSize: 19, letterSpacing: '-1px',
        textTransform: 'uppercase', color: '#0f0f0f',
        textDecoration: 'none', position: 'relative',
        display: 'inline-block',
      }}>
        PEAK<span style={{ position: 'relative' }}>
          CLIP
          <span style={{
            content: "''", position: 'absolute', bottom: -2, left: 0, right: 0,
            height: 3, background: '#c4ff3d', borderRadius: 2,
            transform: 'scaleX(0)', transformOrigin: 'left',
            animation: 'underline-in 0.6s 0.4s ease forwards',
          }} />
        </span>
      </a>

      {/* Center links - hidden on mobile */}
      <div className="navbar-center-links" style={{
        display: 'flex', gap: 0,
      }}>
        {links.map((link) => (
          <a key={link.label} href={link.href}
            style={{
              padding: '8px 18px', fontSize: 14, color: '#6b6b72',
              fontWeight: 500, textDecoration: 'none',
              position: 'relative', transition: 'color 0.2s',
            }}
            className="navbar-link-item"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA Button */}
      <a href="/login?signup=true"
        className="navbar-cta-btn"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0f0f0f', color: '#f5f5f0',
          padding: '10px 22px', borderRadius: 100, fontSize: 14,
          fontWeight: 700, textDecoration: 'none',
          position: 'relative', overflow: 'hidden',
          border: 'none', cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        <span className="cta-sweep" style={{
          position: 'absolute', inset: 0, background: '#c4ff3d',
          transform: 'translateX(-101%)',
          transition: 'transform 0.32s ease', zIndex: 0,
        }} />
        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          Empezar gratis
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </a>

      <style>{`
        .navbar-link-item::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 18px;
          right: 18px;
          height: 2px;
          background: #c4ff3d;
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s ease;
        }
        .navbar-link-item:hover { color: #0f0f0f !important; }
        .navbar-link-item:hover::after { transform: scaleX(1); }
        .navbar-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(0,0,0,0.15);
        }
        .navbar-cta-btn:hover .cta-sweep { transform: translateX(0); }
        .navbar-cta-btn:hover .cta-sweep + span { color: #0f0f0f; }
        @media (max-width: 768px) {
          .navbar-center-links { display: none !important; }
          nav { padding: 0 20px !important; }
        }
      `}</style>
    </nav>
  )
}
