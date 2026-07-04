'use client'

import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="cta-section">
      <motion.div
        className="cta-box"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="cta-title">Try it</h2>
        <p className="cta-desc">
          Paste a link. Get a clip. See what works.
        </p>
        <a href="/login?signup=true" className="cta-btn">
          Start for free
        </a>
      </motion.div>
    </section>
  )
}
