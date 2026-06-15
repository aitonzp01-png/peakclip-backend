'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Creators', href: '#creators' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className="navbar" style={{ top: scrolled ? '12px' : '20px' }}>
        <a href="/" className="navbar-brand">
          PEAKCLIP<span className="navbar-brand-dot">.</span>
        </a>

        <div className="navbar-links" style={{ display: 'flex', gap: '32px' }}>
          {links.map((link) => (
            <a key={link.label} href={link.href} className="navbar-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="navbar-actions">
          <a href="/login" className="navbar-login">
            Login
          </a>
          <a href="/login?signup=true" className="navbar-cta">
            Start Free
          </a>
        </div>

        <button
          className="mobile-menu-btn landing-mobile-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '80px',
              left: '24px',
              right: '24px',
              background: 'rgba(8,8,8,.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '24px',
              padding: '24px',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="navbar-link"
                style={{ fontSize: '16px', padding: '8px 0' }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.06)', margin: '8px 0' }} />
            <a
              href="/login"
              className="navbar-login"
              style={{ fontSize: '16px', padding: '8px 0', textAlign: 'center' }}
            >
              Login
            </a>
            <a
              href="/login?signup=true"
              className="navbar-cta"
              style={{ textAlign: 'center', padding: '14px', borderRadius: '14px' }}
            >
              Start Free
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
