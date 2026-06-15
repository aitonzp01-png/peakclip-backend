'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    title: 'Paste Your Link',
    desc: 'Drop a YouTube, Twitch, or TikTok URL. We support any public video link.',
  },
  {
    number: '02',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/><path d="M12 8v3"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/></svg>,
    title: 'AI Finds the Gold',
    desc: 'Our AI analyzes audio, visuals, and engagement patterns to score every moment.',
  },
  {
    number: '03',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    title: 'Export & Post',
    desc: 'Get vertical 9:16 clips with animated captions, ready to post on any platform.',
  },
]

export default function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">HOW IT WORKS</div>
        <h2 className="section-title">From Video to Viral in 3 Steps</h2>
        <p className="section-desc">
          PeakClip&apos;s AI pipeline does the heavy lifting so you can create
          scroll-stopping shorts in seconds, not hours.
        </p>
      </motion.div>

      <div className="how-grid">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            className="how-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="how-number">{step.number}</div>
            <div className="how-icon" aria-hidden="true">{step.icon}</div>
            <h3 className="how-card-title">{step.title}</h3>
            <p className="how-card-desc">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
