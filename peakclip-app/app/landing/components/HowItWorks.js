'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: '🔗',
    title: 'Paste Your Link',
    desc: 'Drop a YouTube, Twitch, or TikTok URL. We support any public video link.',
  },
  {
    number: '02',
    icon: '🤖',
    title: 'AI Finds the Gold',
    desc: 'Our AI analyzes audio, visuals, and engagement patterns to score every moment.',
  },
  {
    number: '03',
    icon: '🚀',
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
