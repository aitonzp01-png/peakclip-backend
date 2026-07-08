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
    <section className="stories-section" id="success" style={{ background: '#f5f5f0' }}>
      <motion.div
        className="section-heading"
        variants={headingVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div className="section-label" style={{ color: '#6b6b72' }}>
          SUCCESS STORIES
        </div>
        <h2 className="section-title" style={{ color: '#0f0f0f' }}>
          De cero a creador
        </h2>
        <p className="section-desc" style={{ color: '#6b6b72' }}>
          Personas reales que convirtieron el clipping en su fuente de ingresos.
        </p>
      </motion.div>

      <motion.div
        className="stories-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {stories.map((s) => (
          <motion.div
            key={s.name}
            className="story-card"
            variants={item}
            style={{ backgroundColor: '#ffffff', border: '1px solid #e8e8e2' }}
          >
            <div className="story-header">
              <div className="story-avatar">{s.avatar}</div>
              <div>
                <div className="story-name" style={{ color: '#0f0f0f' }}>
                  {s.name}
                </div>
                <div className="story-username" style={{ color: '#6b6b72' }}>
                  {s.username}
                </div>
              </div>
            </div>
            <div
              className="story-stat"
              style={{
                color: '#0f0f0f',
                background: '#f5f5f0',
                border: '1px solid #e8e8e2',
              }}
            >
              {s.stat}
            </div>
            <p className="story-quote" style={{ color: '#4a4a4a' }}>
              &ldquo;{s.quote}&rdquo;
            </p>
          </motion.div>
        ))}
      </motion.div>

      <style>{`
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
