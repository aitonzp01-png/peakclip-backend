'use client'

import { useEffect, useRef, useState } from 'react'

export default function LazyShort({
  videoId,
  title,
  channel,
  initial,
  avatarColor,
  views,
  duration,
  gradient,
  active = false,
  style = {},
  className = '',
}) {
  const ref = useRef(null)
  const [load, setLoad] = useState(active)
  const [playing, setPlaying] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e) => setPrefersReducedMotion(e.matches)
    mql.addEventListener?.('change', handler)
    return () => mql.removeEventListener?.('change', handler)
  }, [])

  useEffect(() => {
    if (active || prefersReducedMotion) return
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setLoad(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [active, prefersReducedMotion])

  const onClick = () => {
    if (!load) setLoad(true)
    setPlaying(true)
  }

  return (
    <div
      ref={ref}
      className={`lazy-short ${className}`}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        cursor: 'pointer',
        background: '#111',
        ...style,
      }}
    >
      {(load || playing) && !prefersReducedMotion && (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Thumbnail facade */}
      <div
        className="lazy-short-thumb"
        style={{
          position: 'absolute',
          inset: 0,
          background: gradient,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 12,
          zIndex: load && !prefersReducedMotion ? 0 : 2,
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: '#0f0f0f',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(0,0,0,0.75)',
                textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 78,
              }}
            >
              {channel}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.7)',
              background: 'rgba(255,255,255,0.55)',
              borderRadius: 4,
              padding: '2px 5px',
            }}
          >
            {duration}
          </span>
        </div>

        {/* Center play */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.22)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* Bottom title + stats */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: '#0f0f0f',
              lineHeight: 1.15,
              marginBottom: 8,
              textShadow: '0 1px 0 rgba(255,255,255,0.35)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.45)',
              borderRadius: 8,
              padding: '5px 8px',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {views} views
          </div>
        </div>
      </div>
    </div>
  )
}
