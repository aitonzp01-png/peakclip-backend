'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

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

export default function Features() {
  const reduceMotion = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
    },
  }

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <section className="features-section" id="features" style={{ background: '#f5f5f0' }}>
      <motion.div
        className="features-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {features.map((feat) => (
          <motion.div
            key={feat.title}
            className="feature-card"
            variants={item}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e8e2',
            }}
          >
            <div
              className="feature-icon"
              aria-hidden="true"
              style={{ backgroundColor: '#f5f5f0', borderColor: '#e8e8e2' }}
            >
              <Image src={feat.icon} width={22} height={22} alt="" />
            </div>
            <h3 className="feature-card-title" style={{ color: '#0f0f0f' }}>
              {feat.title}
            </h3>
            <p className="feature-card-desc" style={{ color: '#6b6b72' }}>
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .features-section .feature-card {
            transition: none !important;
            transform: none !important;
          }
          .features-section .feature-icon {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  )
}
