'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Paste a link',
    tagline: 'YouTube, Twitch, TikTok — any public video.',
  },
  {
    number: '02',
    title: 'AI finds the gold',
    tagline: 'Scoring, captions, face tracking — done in seconds.',
  },
  {
    number: '03',
    title: 'Export & post',
    tagline: 'Vertical 9:16 clip with captions, ready to upload.',
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
        <h2 className="section-title">3 steps to a viral clip</h2>
      </motion.div>

      <div className="how-grid">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            className="how-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="how-number">{step.number}</div>
            <h3 className="how-card-title">{step.title}</h3>
            <p className="how-card-desc">{step.tagline}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
