'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const plans = [
  {
    name: 'Starter',
    desc: 'Perfect for trying PeakClip',
    monthly: 19,
    features: ['30 clips per month', '720p export', 'Auto-captions', 'Basic watermark'],
  },
  {
    name: 'Creator',
    desc: 'For serious content creators',
    monthly: 49,
    popular: true,
    features: ['150 clips per month', '1080p export', 'Custom watermark', 'Multi-track audio', 'Priority support'],
  },
  {
    name: 'Pro',
    desc: 'For teams & agencies',
    monthly: 99,
    features: ['Unlimited clips', '4K export', 'Brand kits', 'API access', 'Team workspace', 'Dedicated manager'],
  },
]

function calcYearly(monthly) {
  return Math.round((monthly * 12) * 0.8)
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const [animatingPrice, setAnimatingPrice] = useState(null)

  const toggleBilling = (val) => {
    if (val === yearly) return
    setAnimatingPrice(true)
    setTimeout(() => {
      setYearly(val)
      setAnimatingPrice(false)
    }, 200)
  }

  return (
    <section className="pricing-section" id="pricing">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Choose Your Plan</h2>
        <p className="section-desc">
          Start free, upgrade when you need more. All plans include a 7-day trial.
        </p>
      </motion.div>

      <div className="pricing-toggle-wrap">
        <div className="pricing-toggle" onClick={() => toggleBilling(!yearly)}>
          <div
            className={`pricing-toggle-indicator ${yearly ? 'right' : 'left'}`}
          />
          <button
            className={`pricing-toggle-option ${!yearly ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleBilling(false) }}
          >
            Monthly
          </button>
          <button
            className={`pricing-toggle-option ${yearly ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleBilling(true) }}
          >
            Yearly
            <span className="pricing-save-badge">SAVE 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-cards">
        {plans.map((plan, i) => {
          const price = yearly ? calcYearly(plan.monthly) : plan.monthly
          const original = yearly ? plan.monthly * 12 : null
          const saved = yearly ? Math.round((plan.monthly * 12) * 0.2) : null

          return (
            <motion.div
              key={plan.name}
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {plan.popular && (
                <div className="pricing-card-popular-badge">MOST POPULAR</div>
              )}

              <div className="pricing-card-name">{plan.name}</div>
              <div className="pricing-card-desc">{plan.desc}</div>

              <div className="pricing-card-price">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={yearly ? 'yearly' : 'monthly'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: animatingPrice ? 0 : 1, y: animatingPrice ? 10 : 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    ${price}
                  </motion.span>
                </AnimatePresence>
                <span className="pricing-card-price-period">
                  {yearly ? '/year' : '/mo'}
                </span>
              </div>

              {yearly && (
                <div className="pricing-card-original">${original}/year</div>
              )}
              {yearly && (
                <div className="pricing-card-save">Save ${saved}</div>
              )}
              {!yearly && <div className="pricing-card-original" />}
              {!yearly && <div className="pricing-card-save" />}

              <div className="pricing-card-features">
                {plan.features.map((feat) => (
                  <div key={feat} className="pricing-card-feature">
                    <span className="pricing-card-feature-check">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    {feat}
                  </div>
                ))}
              </div>

              <a
                href={`/login?plan=${plan.name.toLowerCase()}&billing=${yearly ? 'yearly' : 'monthly'}`}
                className="pricing-card-cta"
              >
                {plan.popular ? 'Start Free Trial' : 'Get Started'}
              </a>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
