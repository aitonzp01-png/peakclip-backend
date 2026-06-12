'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: 'How does PeakClip work?',
    a: 'PeakClip uses AI to analyze your video — including audio transcription, visual scene detection, and engagement pattern recognition. It identifies the most viral-worthy moments, auto-generates animated captions, and exports vertical 9:16 clips ready for TikTok, Reels, and Shorts.',
  },
  {
    q: 'What platforms do you support?',
    a: 'You can paste links from YouTube, Twitch, TikTok, and most major video platforms. We also support direct file upload so you can work with local videos, raw footage, or downloads from any source.',
  },
  {
    q: 'Can I customize subtitles?',
    a: 'Absolutely. PeakClip offers 6 animated subtitle styles with full customization — choose fonts, colors, positions, animation effects, and even edit the transcribed text manually. You have complete control over the final look.',
  },
  {
    q: 'What export formats are available?',
    a: 'Export in MP4 format with options for 9:16 vertical (TikTok/Reels/Shorts), 1:1 square (Instagram), and 16:9 landscape (YouTube). Resolutions up to 4K are supported depending on your plan.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! Start with a 7-day free trial — no credit card required. You\'ll get full access to all features so you can see exactly how PeakClip transforms your workflow before committing.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section className="faq-section" id="faq">
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-label">GOT QUESTIONS?</div>
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-desc">
          Everything you need to know about PeakClip. Still have questions?
          We&apos;re here to help.
        </p>
      </motion.div>

      <div className="faq-list" role="list">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div
              key={i}
              className={`faq-item ${isOpen ? 'open' : ''}`}
              role="listitem"
            >
              <button
                className="faq-question"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
              >
                <span>{faq.q}</span>
                <span className="faq-toggle" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <div className="faq-answer-wrap" id={`faq-answer-${i}`} role="region">
                <div className="faq-answer">
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        className="faq-answer-inner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
