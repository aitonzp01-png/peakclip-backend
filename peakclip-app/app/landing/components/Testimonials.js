'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Mary Chen',
    initials: 'MC',
    role: '@marychen',
    quote: 'PeakClip cut my editing time from 2 hours to 5 minutes. The AI actually understands what makes a clip worth watching.',
    stars: 5,
  },
  {
    name: 'Jake Torres',
    initials: 'JT',
    role: '@jaketorres',
    quote: 'The AI actually picks good moments. I don\'t have to watch the whole video to find the highlights anymore.',
    stars: 5,
  },
  {
    name: 'Sarah Kim',
    initials: 'SK',
    role: '@sarahkim',
    quote: 'I grew my channel by 14K subs in a month using PeakClip clips. It\'s become an essential part of my workflow.',
    stars: 5,
  },
  {
    name: 'David Park',
    initials: 'DP',
    role: '@davidpark',
    quote: 'Finally, a tool that understands short-form content. The auto-captions and vertical export save me hours every day.',
    stars: 5,
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

function Stars() {
  return (
    <div className="testimonial-stars" aria-label="5 out of 5 stars">
      {'★★★★★'}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="testimonials-section" id="showcase">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">CREATOR LOVE</div>
        <h2 className="section-title">Trusted by Growing Creators</h2>
        <p className="section-desc">
          See why thousands of creators use PeakClip to turn long-form content
          into viral shorts.
        </p>
      </motion.div>

      <motion.div
        className="testimonials-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {testimonials.map((t) => (
          <motion.div key={t.name} className="testimonial-card" variants={item}>
            <div className="testimonial-header">
              <div className="testimonial-avatar" aria-hidden="true">
                {t.initials}
              </div>
              <div className="testimonial-author-info">
                <div className="testimonial-author">{t.name}</div>
                <div className="testimonial-role">{t.role}</div>
              </div>
            </div>
            <Stars />
            <p className="testimonial-text">{t.quote}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
