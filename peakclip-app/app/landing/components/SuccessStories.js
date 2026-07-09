'use client'

import { motion, useReducedMotion } from 'framer-motion'

const stories = [
  {
    name: 'Carlos M.',
    username: '@carlosclip',
    avatar: 'CM',
    stat: '+45K seguidores',
    quote: 'Empecé sin experiencia y en mi primer mes ya estaba ganando dinero. PeakClip me ahorra horas de edición.',
  },
  {
    name: 'Ana R.',
    username: '@anareels',
    avatar: 'AR',
    stat: '3.2M visualizaciones',
    quote: 'Los subtítulos automáticos y el face tracking me cambiaron la vida. Ahora subo 3 clips al día en lugar de 1 a la semana.',
  },
  {
    name: 'Miguel T.',
    username: '@mikeclips',
    avatar: 'MT',
    stat: '€2,400/mes',
    quote: 'De hobby a negocio. PeakClip me permite producir clips de calidad sin saber de edición. Lo recomiendo a todos mis colegas.',
  },
  {
    name: 'Sofía L.',
    username: '@soficreator',
    avatar: 'SL',
    stat: '127K likes',
    quote: 'La detección de momentos virales es increíble. Encuentra cosas que yo ni siquiera había notado en mis propios videos.',
  },
]

export default function SuccessStories() {
  const reduceMotion = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.12 },
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
    <section className="stories-section" id="success" style={{ background: '#f6f6f2' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '100px 24px' }}>
        <motion.div
          className="section-heading"
          variants={headingVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div className="section-label" style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 3,
            color: '#6b6b6b', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            SUCCESS STORIES
          </div>
          <h2 className="section-title" style={{
            fontFamily: 'var(--font-display), "Bebas Neue", sans-serif',
            fontSize: 'clamp(44px,6vw,80px)',
            fontWeight: 400,
            letterSpacing: '-0.5px',
            lineHeight: 1.05,
            color: '#0f0f0f',
            margin: '0 0 16px',
          }}>
            De cero a{' '}
            <span style={{
              background: '#ff1f1f', color: '#ffffff',
              padding: '0 10px', borderRadius: 6,
            }}>
              creador
            </span>
          </h2>
          <p className="section-desc" style={{
            fontSize: 16, color: '#6b6b6b', maxWidth: 460,
            margin: '0 auto', lineHeight: 1.6,
          }}>
            Personas reales que convirtieron el clipping en su fuente de ingresos.
          </p>
        </motion.div>

        <motion.div
          className="stories-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
          }}
        >
          {stories.map((s) => (
            <motion.div
              key={s.name}
              className="story-card"
              variants={item}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8e3',
                borderRadius: 20,
                padding: 28,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <div className="story-header" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 18,
              }}>
                <div className="story-avatar" style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#ffe5e5', color: '#ff1f1f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16,
                }}>
                  {s.avatar}
                </div>
                <div>
                  <div className="story-name" style={{
                    fontSize: 15, fontWeight: 700, color: '#0f0f0f',
                  }}>
                    {s.name}
                  </div>
                  <div className="story-username" style={{
                    fontSize: 13, color: '#8a8a8a',
                  }}>
                    {s.username}
                  </div>
                </div>
              </div>
              <div
                className="story-stat"
                style={{
                  display: 'inline-block',
                  fontSize: 13, fontWeight: 700,
                  color: '#ff1f1f',
                  background: '#ffe5e5',
                  border: '1px solid #ffe5e5',
                  borderRadius: 100,
                  padding: '6px 12px',
                  marginBottom: 16,
                }}
              >
                {s.stat}
              </div>
              <p className="story-quote" style={{
                fontSize: 15, color: '#6b6b6b',
                lineHeight: 1.6, margin: 0,
              }}>
                &ldquo;{s.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        .story-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .stories-section > div {
            padding: 60px 16px !important;
          }
          .stories-grid {
            grid-template-columns: 1fr !important;
          }
          .section-heading {
            margin-bottom: 36px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .stories-section .story-card {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
