'use client'

import { useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ComoFunciona from './components/ComoFunciona'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'

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

function usePlayheadProgress() {
  const [progress, setProgress] = useState('0%')
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)

    const onChange = (e) => setReducedMotion(e.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    let ticking = false

    const updateProgress = () => {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop || 0
      const scrollHeight = doc.scrollHeight - doc.clientHeight
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress(`${pct}%`)
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateProgress()

    return () => window.removeEventListener('scroll', onScroll)
  }, [reducedMotion])

  return { progress, reducedMotion }
}

export default function Landing() {
  useScrollReveal()
  const { progress, reducedMotion } = usePlayheadProgress()

  return (
    <div
      className="landing-bg"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f6f6f2',
      }}
    >
      <div
        className="playhead"
        aria-hidden="true"
        style={{ '--playhead-top': progress }}
      >
        <div className="playhead-line" />
        <div className="playhead-triangle" />
      </div>

      <Navbar />

      <Hero />

      <div className="reveal">
        <ComoFunciona />
      </div>

      <div className="reveal">
        <HowItWorks />
      </div>

      <Testimonials />

      <Pricing />

      <FAQ />

      <CTA />

      <Footer />

      <style>{`
        .playhead {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 24px;
          width: 1px;
          z-index: 9999;
          pointer-events: none;
        }

        .playhead-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          background: rgba(0, 0, 0, 0.08);
          transform: translateX(-50%);
        }

        .playhead-triangle {
          position: absolute;
          top: var(--playhead-top, 0%);
          left: 50%;
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 8px solid #ff1f1f;
          transform: translate(-100%, -50%);
          transition: top 0.1s linear;
        }

        @media (max-width: 768px) {
          .playhead {
            left: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }

          .playhead-triangle {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
