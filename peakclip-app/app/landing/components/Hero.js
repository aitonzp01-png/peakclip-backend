'use client'

import { motion } from 'framer-motion'
import Pipeline from './Pipeline'

const stagger = 0.12

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
})

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div>
          <motion.div {...fadeUp(0)}>
            <span className="hero-badge">AI-POWERED VIRAL ENGINE</span>
          </motion.div>

          <motion.h1 className="hero-title" {...fadeUp(0.12)}>
            TURN LONG VIDEOS{' '}
            <span className="hero-title-em">INTO VIRAL SHORTS</span>
          </motion.h1>

          <motion.p className="hero-sub" {...fadeUp(0.24)}>
            Extract high-scoring clips, generate animated captions, and
            auto-crop horizontal videos into high-impact vertical format
            in one click.
          </motion.p>

          <motion.div className="hero-actions" {...fadeUp(0.36)}>
            <a href="/login?signup=true" className="hero-cta">
              Start Clipping Free
            </a>
            <a href="#how-it-works" className="hero-cta-secondary">
              See How It Works
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Pipeline />
        </motion.div>
      </div>
    </section>
  )
}
