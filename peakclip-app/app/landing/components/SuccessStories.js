'use client'

import { motion } from 'framer-motion'

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

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function SuccessStories() {
  return (
    <section className="stories-section" id="success">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">SUCCESS STORIES</div>
        <h2 className="section-title">De cero a creador</h2>
        <p className="section-desc">
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
        {stories.map((s, i) => (
          <motion.div key={s.name} className="story-card" variants={item}>
            <div className="story-header">
              <div className="story-avatar">{s.avatar}</div>
              <div>
                <div className="story-name">{s.name}</div>
                <div className="story-username">{s.username}</div>
              </div>
            </div>
            <div className="story-stat">{s.stat}</div>
            <p className="story-quote">&ldquo;{s.quote}&rdquo;</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
