'use client'

import { useEffect, useRef } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Pricing from './components/Pricing'

function useScrollReveal() {
  const observerRef = useRef(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => {
      observerRef.current.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])
}

export default function Landing() {
  useScrollReveal()

  return (
    <div className="landing-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      <Navbar />
      <Hero />
      <Pricing />

      <footer
        style={{
          textAlign: 'center',
          padding: '40px 24px',
          color: 'var(--text-muted)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '12px',
          borderTop: '1px solid rgba(255,255,255,.04)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        © 2026 PeakClip. All rights reserved.
      </footer>
    </div>
  )
}
