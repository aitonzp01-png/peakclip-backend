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
        <a href="/register"
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
            Start free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          @keyframes underline-in {
            to { transform: scaleX(1); }
          }
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
          .navbar-hamburger {
            display: none;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid rgba(0,0,0,0.1);
            background: #ffffff;
            color: #0f0f0f;
            cursor: pointer;
          }
          @media (max-width: 768px) {
            .navbar-center-links { display: none !important; }
            nav { padding: 0 20px !important; }
            .navbar-hamburger { display: flex !important; }
          }
          @media (prefers-reduced-motion: reduce) {
            nav { animation: none !important; }
            .navbar-cta-btn, .cta-sweep, .navbar-link-item::after {
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
          <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-1px', textTransform: 'uppercase', color: '#0f0f0f' }}>
            PEAK<span style={{ color: '#c4ff3d' }}>CLIP</span>
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
          background: #f5f5f0;
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
          border: 1px solid rgba(0,0,0,0.1);
          background: #ffffff;
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
          color: #0f0f0f;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .mobile-sheet-link:hover {
          background: rgba(0,0,0,0.05);
        }
        .mobile-sheet-cta {
          margin-top: 16px;
          background: #0f0f0f;
          color: #f5f5f0;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          padding: 14px 20px;
          border-radius: 100px;
          transition: transform 0.2s, background 0.2s;
        }
        .mobile-sheet-cta:hover {
          background: #1f1f1f;
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
