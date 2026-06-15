'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5v1h-4v-1c0-2-2-3-2-5a4 4 0 014-4z"/><path d="M8 16h8"/><path d="M10 19h4"/><path d="M12 22v-3"/></svg>,
    title: 'AI Viral Detection',
    desc: 'ML models identify high-engagement moments based on audio, visual cues, and audience retention patterns.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/><circle cx="9" cy="14" r="2"/></svg>,
    title: 'Auto Captions',
    desc: 'Animated subtitles in 6 styles, synced automatically with your video. Customize fonts, colors, and positions.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
    title: 'Smart Trim',
    desc: 'Intelligent scene detection removes dead air, filler words, and awkward pauses automatically.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    title: '9:16 Format',
    desc: 'Auto-crop horizontal to vertical with face tracking. Perfect framing for TikTok, Reels, and Shorts.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    title: 'Multi-track Audio',
    desc: 'Add music, adjust levels, remove background noise — full audio control for professional sound.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
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
