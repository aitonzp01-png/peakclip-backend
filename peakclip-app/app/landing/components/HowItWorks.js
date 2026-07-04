'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Paste a link',
    tagline: 'YouTube, Twitch, TikTok — any public video.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI finds the gold',
    tagline: 'Scoring, captions, face tracking — done in seconds.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 5v1h-4v-1c0-2-2-3-2-5a4 4 0 0 1 4-4z"/>
        <path d="M8 16h8"/>
        <path d="M10 19h4"/>
        <path d="M12 22v-3"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Export & post',
    tagline: 'Vertical 9:16 clip with captions, ready to upload.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] },
  }),
}

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
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={cardVariants}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
          >
            <motion.div
              className="how-number"
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 + 0.2, ease: 'backOut(1.7)' }}
            >
              {step.number}
            </motion.div>
            <motion.div
              className="how-icon"
              aria-hidden="true"
              initial={{ rotate: -10, scale: 0 }}
              whileInView={{ rotate: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 + 0.3, ease: 'backOut(1.7)' }}
            >
              {step.icon}
            </motion.div>
            <motion.h3
              className="how-card-title"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 + 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {step.title}
            </motion.h3>
            <motion.p
              className="how-card-desc"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 + 0.55 }}
            >
              {step.tagline}
            </motion.p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
