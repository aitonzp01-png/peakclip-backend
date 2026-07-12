'use client'

import { useEffect, useRef, useState } from 'react'

const links = [
  { label: 'How it works', href: '#como-funciona' },
  { label: 'Results', href: '#resultados' },
  { label: 'Pricing', href: '#precios' },
]

export default function Navbar() {
  const navRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.style.background = 'rgba(246,246,242,0.96)'
        nav.style.boxShadow = '0 1px 16px rgba(0,0,0,0.07)'
      } else {
        nav.style.background = 'rgba(246,246,242,0.9)'
        nav.style.boxShadow = 'none'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <nav
        ref={navRef}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 64, zIndex: 100,
          background: 'rgba(246,246,242,0.9)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid #e8e8e3',
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
          fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
          fontWeight: 400, fontSize: 21, letterSpacing: '0.5px',
          textTransform: 'uppercase', color: '#0f0f0f',
          textDecoration: 'none', position: 'relative',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          PEAKCLIP
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ff1f1f', flexShrink: 0,
          }} />
        </a>

        {/* Center links - hidden on mobile */}
        <div className="navbar-center-links" style={{
          display: 'flex', gap: 0,
        }}>
          {links.map((link) => (
            <a key={link.label} href={link.href}
              style={{
                padding: '8px 18px', fontSize: 14, color: '#6b6b6b',
                fontFamily: 'var(--font-body), Inter, sans-serif',
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
        <a href="/register"
          className="navbar-cta-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#ff1f1f', color: '#ffffff',
            padding: '10px 22px', borderRadius: 100, fontSize: 14,
            fontFamily: 'var(--font-body), Inter, sans-serif',
            fontWeight: 700, textDecoration: 'none',
            position: 'relative', overflow: 'hidden',
            border: 'none', cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s',
          }}
        >
          <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            Start free
            <svg className="navbar-cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="navbar-hamburger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <style>{`
          .navbar-link-item::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 18px;
            right: 18px;
            height: 2px;
            background: #ff1f1f;
            borderRadius: 2px;
            transform: scaleX(0);
            transform-origin: center;
            transition: transform 0.25s ease;
          }
          .navbar-link-item:hover { color: #0f0f0f !important; }
          .navbar-link-item:hover::after { transform: scaleX(1); }
          .navbar-cta-btn {
            animation: cta-pulse 2.4s ease-in-out infinite;
          }
          .navbar-cta-btn:hover {
            background: #d90000;
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(255,31,31,0.32);
            animation: none;
          }
          .navbar-cta-btn,
          .navbar-cta-btn:visited,
          .navbar-cta-btn:active {
            color: #ffffff;
          }
          .navbar-cta-btn svg,
          .navbar-cta-btn:visited svg,
          .navbar-cta-btn:hover svg,
          .navbar-cta-btn:active svg {
            stroke: #ffffff;
            color: #ffffff;
          }
          .navbar-cta-btn svg {
            transition: transform 0.25s ease;
          }
          .navbar-cta-btn:hover svg {
            transform: translateX(3px);
          }
          .navbar-cta-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transform: skewX(-20deg);
            transition: left 0.5s ease;
          }
          .navbar-cta-btn:hover::before {
            left: 140%;
            transition: left 0.6s ease;
          }
          @keyframes cta-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,31,31,0.22); }
            50% { box-shadow: 0 0 0 8px rgba(255,31,31,0); }
          }
          .navbar-hamburger {
            display: none;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid #e8e8e3;
            background: #ffffff;
            color: #0f0f0f;
            cursor: pointer;
          }
          @media (max-width: 768px) {
            .navbar-center-links { display: none !important; }
            nav { padding: 0 20px !important; }
            .navbar-hamburger { display: flex !important; }
            .navbar-cta-btn span { font-size: 13px; }
            .navbar-cta-btn { padding: 9px 16px !important; }
          }
          @media (prefers-reduced-motion: reduce) {
            nav { animation: none !important; }
            .navbar-cta-btn, .navbar-link-item::after {
              transition: none !important;
            }
          }
        `}</style>
      </nav>

      {/* Mobile menu sheet */}
      <div
        className={`mobile-sheet-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <div className={`mobile-sheet ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-sheet-header">
          <span style={{
            fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
            fontWeight: 400, fontSize: 21, letterSpacing: '0.5px',
            textTransform: 'uppercase', color: '#0f0f0f',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            PEAKCLIP
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff1f1f' }} />
          </span>
          <button
            type="button"
            className="mobile-sheet-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mobile-sheet-nav">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="mobile-sheet-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/register"
            className="mobile-sheet-cta"
            onClick={() => setMenuOpen(false)}
          >
            Start free
          </a>
        </nav>
      </div>

      <style>{`
        .mobile-sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.25);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 110;
        }
        .mobile-sheet-backdrop.open {
          opacity: 1;
          pointer-events: auto;
        }
        .mobile-sheet {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(320px, 85vw);
          background: #ffffff;
          box-shadow: -8px 0 40px rgba(0,0,0,0.12);
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 120;
          display: flex;
          flex-direction: column;
          padding: 24px;
        }
        .mobile-sheet.open {
          transform: translateX(0);
        }
        .mobile-sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .mobile-sheet-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #e8e8e3;
          background: #f6f6f2;
          color: #0f0f0f;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-sheet-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mobile-sheet-link {
          font-size: 18px;
          font-weight: 600;
          font-family: var(--font-body), Inter, sans-serif;
          color: #0f0f0f;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 12px;
          transition: background 0.2s, color 0.2s;
        }
        .mobile-sheet-link:hover {
          background: #ffe5e5;
          color: #ff1f1f;
        }
        .mobile-sheet-cta {
          margin-top: 16px;
          background: #ff1f1f;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          padding: 14px 20px;
          border-radius: 100px;
          transition: transform 0.2s, background 0.2s;
        }
        .mobile-sheet-cta:hover {
          background: #d90000;
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .mobile-sheet-backdrop,
          .mobile-sheet,
          .mobile-sheet-link,
          .mobile-sheet-cta {
            transition: none !important;
          }
          .mobile-sheet.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
