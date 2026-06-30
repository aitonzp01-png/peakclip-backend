'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'

const clips = [
  { views: '633.2K', likes: '2.2K', creator: 'YoSoyPlex', duration: '0:32', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { views: '241.2K', likes: '1.4K', creator: 'FlexCidine', duration: '0:45', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { views: '191.2K', likes: '884', creator: 'TheWillyrex', duration: '0:28', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { views: '88.4K', likes: '1.2K', creator: 'Greinher', duration: '0:51', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { views: '415.8K', likes: '3.1K', creator: 'Xocas', duration: '1:02', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { views: '156.3K', likes: '956', creator: 'Marc Baso', duration: '0:38', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { views: '312.5K', likes: '2.8K', creator: 'LolaIndigo', duration: '0:44', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { views: '89.1K', likes: '723', creator: 'DjMariio', duration: '0:55', video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
]

export default function Showcase() {
  const scrollRef = useRef(null)

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

      <div className="showcase-carousel-wrap">
        <div className="showcase-carousel" ref={scrollRef}>
          <div className="showcase-track">
            {[...clips, ...clips].map((clip, i) => (
              <motion.div
                key={`${clip.creator}-${i}`}
                className="showcase-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % clips.length) * 0.05 }}
              >
                <div className="showcase-thumb">
                  <video
                    src={clip.video}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="showcase-video"
                  />
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
          </div>
        </div>
        <div className="showcase-fade-left" />
        <div className="showcase-fade-right" />
      </div>
    </section>
  )
}
