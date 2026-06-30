'use client'

import { motion } from 'framer-motion'

const clips = [
  { views: '633.2K', likes: '2.2K', creator: 'YoSoyPlex', duration: '0:32', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
  { views: '241.2K', likes: '1.4K', creator: 'FlexCidine', duration: '0:45', gradient: 'linear-gradient(135deg, #0f3460, #533483)' },
  { views: '191.2K', likes: '884', creator: 'TheWillyrex', duration: '0:28', gradient: 'linear-gradient(135deg, #e94560, #533483)' },
  { views: '88.4K', likes: '1.2K', creator: 'Greinher', duration: '0:51', gradient: 'linear-gradient(135deg, #16213e, #0f3460)' },
  { views: '415.8K', likes: '3.1K', creator: 'Xocas', duration: '1:02', gradient: 'linear-gradient(135deg, #2d1b69, #11998e)' },
  { views: '156.3K', likes: '956', creator: 'Marc Baso', duration: '0:38', gradient: 'linear-gradient(135deg, #0f3443, #34e89e)' },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function Showcase() {
  return (
    <section className="showcase-section" id="showcase">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">SHOWCASE</div>
        <h2 className="section-title">Clips that work</h2>
        <p className="section-desc">
          Real clips created with PeakClip. Paste a link, get a vertical clip ready to post.
        </p>
      </motion.div>

      <motion.div
        className="showcase-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {clips.map((clip, i) => (
          <motion.div key={`${clip.creator}-${i}`} className="showcase-card" variants={item}>
            <div className="showcase-thumb" style={{ background: clip.gradient }}>
              <div className="showcase-overlay" />
              <div className="showcase-duration">{clip.duration}</div>
              <div className="showcase-play-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div className="showcase-info">
              <div className="showcase-creator">{clip.creator}</div>
              <div className="showcase-stats">
                <span className="showcase-stat">{clip.views} views</span>
                <span className="showcase-stat-dot">·</span>
                <span className="showcase-stat">{clip.likes} likes</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
