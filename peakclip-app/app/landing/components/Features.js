'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const features = [
  {
    icon: '/icons/link.svg',
    title: 'Auto Detection',
    desc: 'Paste any link — AI finds the best moments instantly.',
  },
  {
    icon: '/icons/captions.svg',
    title: 'Smart Captions',
    desc: 'Auto-synced animated subtitles in one click.',
  },
  {
    icon: '/icons/crop.svg',
    title: 'Face Tracking',
    desc: 'Auto-crop horizontal to vertical with face tracking.',
  },
  {
    icon: '/icons/music.svg',
    title: 'Multi-track Audio',
    desc: 'Add music, adjust levels, remove noise.',
  },
  {
    icon: '/icons/sparkles.svg',
    title: 'Viral Scoring',
    desc: 'AI scores every moment by engagement potential.',
  },
  {
    icon: '/icons/download.svg',
    title: 'One-click Export',
    desc: 'Export 1080p vertical clips ready to post.',
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
        <div className="section-label">WHAT YOU GET</div>
        <h2 className="section-title">Everything you need to clip faster</h2>
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
            <div className="feature-icon" aria-hidden="true">
              <Image src={feat.icon} width={22} height={22} alt="" />
            </div>
            <h3 className="feature-card-title">{feat.title}</h3>
            <p className="feature-card-desc">{feat.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
