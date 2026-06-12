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
        <h2 className="cta-title">Ready to Go Viral?</h2>
        <p className="cta-desc">
          Start your free trial and create your first clip in under 60 seconds.
          No credit card required.
        </p>
        <a href="/login?signup=true" className="cta-btn">
          Start Clipping Free
        </a>
      </motion.div>
    </section>
  )
}
