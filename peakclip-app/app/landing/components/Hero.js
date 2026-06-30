'use client'

import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
})

const clips = [
  { views: '633.2K', likes: '2.2K', creator: 'YoSoyPlex', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { views: '241.2K', likes: '1.4K', creator: 'FlexCidine', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { views: '191.2K', likes: '884', creator: 'TheWillyrex', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { views: '88.4K', likes: '1.2K', creator: 'Greinher', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
]

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-blob">
        <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M400 100C500 50 650 120 700 250C750 380 680 520 550 600C420 680 300 650 200 550C100 450 50 300 150 180C250 60 300 150 400 100Z"
            fill="url(#blob-grad)"
            animate={{
              d: [
                "M400 100C500 50 650 120 700 250C750 380 680 520 550 600C420 680 300 650 200 550C100 450 50 300 150 180C250 60 300 150 400 100Z",
                "M400 80C520 30 680 100 730 240C780 380 670 540 540 620C410 700 280 640 180 540C80 440 30 280 140 170C250 60 280 130 400 80Z",
                "M400 120C480 70 620 130 680 260C740 390 650 530 530 590C410 650 320 620 220 530C120 440 60 310 160 200C260 90 320 170 400 120Z",
                "M400 100C500 50 650 120 700 250C750 380 680 520 550 600C420 680 300 650 200 550C100 450 50 300 150 180C250 60 300 150 400 100Z",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            opacity={0.08}
          />
          <defs>
            <radialGradient id="blob-grad">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="hero-container">
        <div className="hero-left">
          <motion.div {...fadeUp(0)}>
            <span className="hero-badge">Beta</span>
          </motion.div>

          <motion.h1 className="hero-title" {...fadeUp(0.12)}>
            From long video{' '}
            <span className="hero-title-em">to viral short,</span>
            {' '}automatically.
          </motion.h1>

          <motion.p className="hero-sub" {...fadeUp(0.24)}>
            PeakClip finds the best moments, adds captions, and exports vertical clips ready to post.
          </motion.p>

          <motion.div className="hero-actions" {...fadeUp(0.36)}>
            <a href="/login?signup=true" className="hero-cta">
              Start for free
            </a>
            <a href="#how-it-works" className="hero-cta-secondary">
              How it works
            </a>
          </motion.div>
        </div>

        <motion.div
          className="hero-right"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-clips-grid">
            {clips.map((clip, i) => (
              <motion.div
                key={clip.creator}
                className="hero-clip-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="hero-clip-thumb">
                  <video
                    src={clip.video}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="hero-clip-video"
                  />
                  <div className="hero-clip-overlay" />
                  <div className="hero-clip-metrics">
                    <span className="hero-clip-stat">{clip.views} views</span>
                    <span className="hero-clip-stat">{clip.likes} likes</span>
                  </div>
                  <div className="hero-clip-creator">{clip.creator}</div>
                  <div className="hero-clip-play">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
