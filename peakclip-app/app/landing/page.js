'use client'

import { useEffect, useRef } from 'react'
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

export default function Landing() {
  useScrollReveal()

  return (
    <div className="landing-bg" style={{ position: 'relative', overflow: 'hidden' }}>
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
    </div>
  )
}
