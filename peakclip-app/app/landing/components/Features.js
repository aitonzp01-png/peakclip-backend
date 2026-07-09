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

  const headingVariant = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <section className="features-section" id="features" style={{ background: '#f6f6f2' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '100px 24px' }}>
        <motion.div
          className="features-heading"
          variants={headingVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <span style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 3,
            color: '#6b6b6b', textTransform: 'uppercase',
            display: 'block', marginBottom: 16,
          }}>
            FEATURES
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
            fontSize: 'clamp(44px,6vw,80px)',
            fontWeight: 400,
            letterSpacing: '-0.5px',
            lineHeight: 1.05,
            color: '#0f0f0f',
            margin: '0 0 16px',
          }}>
            Todo lo que necesitas para{' '}
            <span style={{
              background: '#ff1f1f', color: '#ffffff',
              padding: '0 10px', borderRadius: 6,
            }}>
              crecer
            </span>
          </h2>
          <p style={{
            fontSize: 16, color: '#6b6b6b', maxWidth: 460,
            margin: '0 auto', lineHeight: 1.6,
          }}>
            Ahorra horas de edición con herramientas pensadas para creadores.
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              className="feature-card"
              variants={item}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8e3',
                borderRadius: 20,
                padding: 28,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <div
                className="feature-icon"
                aria-hidden="true"
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: '#ffe5e5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Image src={feat.icon} width={22} height={22} alt="" style={{ filter: 'invert(21%) sepia(99%) saturate(7461%) hue-rotate(355deg) brightness(101%) contrast(107%)' }} />
              </div>
              <h3 className="feature-card-title" style={{
                fontFamily: 'var(--font-body), Inter, sans-serif',
                fontSize: 17, fontWeight: 700,
                color: '#0f0f0f', margin: '0 0 8px',
              }}>
                {feat.title}
              </h3>
              <p className="feature-card-desc" style={{
                fontSize: 14, color: '#6b6b6b',
                lineHeight: 1.6, margin: 0,
              }}>
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .features-section > div {
            padding: 60px 16px !important;
          }
          .features-heading {
            margin-bottom: 36px !important;
          }
        }
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
