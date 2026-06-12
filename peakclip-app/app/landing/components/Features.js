'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '🧠',
    title: 'AI Viral Detection',
    desc: 'ML models identify high-engagement moments based on audio, visual cues, and audience retention patterns.',
  },
  {
    icon: '📝',
    title: 'Auto Captions',
    desc: 'Animated subtitles in 6 styles, synced automatically with your video. Customize fonts, colors, and positions.',
  },
  {
    icon: '✂️',
    title: 'Smart Trim',
    desc: 'Intelligent scene detection removes dead air, filler words, and awkward pauses automatically.',
  },
  {
    icon: '📱',
    title: '9:16 Format',
    desc: 'Auto-crop horizontal to vertical with face tracking. Perfect framing for TikTok, Reels, and Shorts.',
  },
  {
    icon: '🎵',
    title: 'Multi-track Audio',
    desc: 'Add music, adjust levels, remove background noise — full audio control for professional sound.',
  },
  {
    icon: '⚡',
    title: 'One-click Export',
    desc: 'Export in 1080p/4K, share directly to TikTok/Reels, or download for any platform.',
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function Features() {
  return (
    <section className="features-section" id="features">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">EVERYTHING YOU NEED</div>
        <h2 className="section-title">Built for Creators Who Want to Move Fast</h2>
        <p className="section-desc">
          From AI-powered detection to polished exports — PeakClip handles
          the pipeline so you can focus on content.
        </p>
      </motion.div>

      <motion.div
        className="features-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {features.map((feat) => (
          <motion.div key={feat.title} className="feature-card" variants={item}>
            <div className="feature-icon" aria-hidden="true">{feat.icon}</div>
            <h3 className="feature-card-title">{feat.title}</h3>
            <p className="feature-card-desc">{feat.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
