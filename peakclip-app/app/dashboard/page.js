'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { brand, brandGrad } from '../../lib/tokens'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(3)
  const [plan, setPlan] = useState('free')
  const [clips, setClips] = useState([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState('generate')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    if (p === 'creator' || p === 'pro') setActiveTab('upgrade')

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) { setCredits(data.credits); setPlan(data.plan) }
      loadClips(user.id)
    }
    getUser()
  }, [])

  const loadClips = async (userId) => {
    const { data } = await supabase.from('clips').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setClips(data)
  }

  const pollClipStatus = async (clipId, userId) => {
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      const { data } = await supabase.from('clips').select('*').eq('id', clipId).single()
      if (data?.video_url || attempts > 30) {
        clearInterval(poll)
        loadClips(userId)
      }
    }, 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleSubmit = async () => {
    if (!url || !user) return
    if (credits <= 0 && plan !== 'pro') { setStatus('No credits remaining. Upgrade your plan.'); return }
    setLoading(true)
    setStatus('Processing video with AI...')

    try {
      const response = await fetch(`${BACKEND_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, user_id: user.id })
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(`${data.total} clips generated! Check "My Clips" tab.`)
        setCredits(prev => Math.max(prev - 1, 0))
      } else {
        const err = await response.text()
        if (response.status === 402) {
          setStatus('No credits remaining. Upgrade your plan.')
        } else {
          setStatus(`Error: ${err.slice(0, 100)}`)
        }
      }
    } catch {
      setStatus('Could not connect to the server.')
    }

    setUrl('')
    setLoading(false)
    loadClips(user.id)
  }

  const handleCheckout = async (priceId) => {
    if (!user) return
    setCheckoutLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          user_id: user.id,
          return_url: window.location.origin + '/dashboard'
        })
      })
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      } else {
        setStatus('Checkout error. Try again.')
      }
    } catch {
      setStatus('Could not connect to checkout.')
    }
    setCheckoutLoading(false)
  }

  const plans = [
    {
      name: 'Free', price: '$0', clips: '3 clips/month',
      features: ['3 credits', '9:16 format', 'Basic subtitles'],
      color: brand, cta: 'Current plan', disabled: true
    },
    {
      name: 'Creator', price: '$26.99', clips: '200 clips/month',
      features: ['200 credits', 'Animated subtitles', 'Gameplay overlay', 'HD export'],
      color: brand, cta: 'Start Creator', popular: true,
      price_id: 'price_creator'
    },
    {
      name: 'Pro', price: '$69.99', clips: 'Unlimited',
      features: ['Unlimited credits', 'Advanced editor', 'Auto-publish', 'Viral Score AI', 'Priority support'],
      color: brand, cta: 'Start Pro',
      price_id: 'price_pro'
    },
  ]

  const tabs = [
    { id: 'generate', icon: '⚡', label: 'Generate Clips' },
    { id: 'clips', icon: '🎬', label: 'My Clips' },
    { id: 'upgrade', icon: '👑', label: 'Upgrade' },
  ]

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '3px', fontSize: '22px' }}>PEAKCLIP</div>
          <div className="sidebar-sub">AI CLIPPING PLATFORM</div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); closeSidebar() }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(item.id); closeSidebar() } }}
              className={`sidebar-item${activeTab === item.id ? ' active' : ''}`}
              role="tab"
              aria-selected={activeTab === item.id}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={{ background: brandGrad }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="sidebar-email">{user?.email}</div>
              <div className="sidebar-plan" style={{ color: brand }}>{plan.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }}
          aria-hidden="true"
        />
      )}

      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
            {activeTab === 'generate' && 'Generate Your Viral Clip'}
            {activeTab === 'clips' && 'My Clips'}
            {activeTab === 'upgrade' && 'Choose Your Plan'}
          </h2>
          <p className="page-subtitle">
            {activeTab === 'generate' && 'Paste a YouTube or Twitch link — AI does the rest'}
            {activeTab === 'clips' && `${clips.length} clips generated so far`}
            {activeTab === 'upgrade' && 'Unlock more credits and premium features'}
          </p>
        </div>

        {activeTab === 'generate' && (
          <>
            <div className="stats-grid">
              {[
                { label: 'Credits', value: credits, sub: plan === 'pro' ? 'unlimited' : `of ${plan === 'creator' ? 200 : 3}`, color: credits > 0 ? brand : '#ef4444' },
                { label: 'Total Clips', value: clips.length, sub: 'generated', color: '#fff' },
                { label: 'Plan', value: plan.toUpperCase(), sub: plan === 'free' ? 'Click to upgrade' : 'Active', color: brand, onClick: () => setActiveTab('upgrade') },
              ].map((s, i) => (
                <div
                  key={i}
                  onClick={s.onClick}
                  className={`stat-card${s.onClick ? ' clickable' : ''}`}
                  role={s.onClick ? 'button' : undefined}
                  tabIndex={s.onClick ? 0 : undefined}
                  onKeyDown={s.onClick ? e => { if (e.key === 'Enter') { s.onClick() } } : undefined}
                >
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="process-card">
              <label className="process-label" htmlFor="video-url">VIDEO URL</label>
              <div className="process-row">
                <input
                  id="video-url"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="process-input"
                />
                <button onClick={handleSubmit} disabled={loading} className="process-btn">
                  {loading ? 'Processing...' : '⚡ Generate Clips'}
                </button>
              </div>

              {status && (
                <div className="process-status" style={{ marginTop: '20px' }}>
                  {status}
                </div>
              )}

              <div className="process-features">
                <span className="process-feature">AI viral detection</span>
                <span className="process-feature">Auto subtitles</span>
                <span className="process-feature">9:16 format</span>
                <span className="process-feature">Smart trimming</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'clips' && (
          <div>
            {clips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <p className="empty-text">No clips generated yet</p>
                <button onClick={() => setActiveTab('generate')} className="empty-btn">
                  Generate your first clip
                </button>
              </div>
            ) : (
              <div className="clips-list">
                {clips.map(clip => (
                  <div key={clip.id} className="clip-item" style={{
                    borderLeft: `3px solid ${clip.status === 'done' ? brand : clip.status === 'processing' ? '#FFBD2E' : '#555'}`
                  }}>
                    <div className="clip-left">
                      {clip.thumbnail_url ? (
                        <img
                          src={clip.thumbnail_url}
                          alt=""
                          style={{
                            width: '64px', height: '114px', borderRadius: '6px',
                            objectFit: 'cover', flexShrink: 0, background: 'var(--card)'
                          }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="clip-icon">🎬</div>
                      )}
                      <div>
                        <div className="clip-title">{clip.title?.slice(0, 60)}</div>
                        <div className="clip-date">
                          {new Date(clip.created_at).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                        {clip.duration && (
                          <div style={{ fontSize: '10px', color: brand, marginTop: '4px' }}>
                            {clip.duration}s
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="clip-actions">
                      {clip.status === 'processing' && (
                        <span className="clip-status processing">Processing...</span>
                      )}
                      {clip.status === 'done' && (
                        <>
                          <button
                            onClick={() => window.location.href = `/editor?id=${clip.id}`}
                            className="clip-action-btn"
                          >
                            Edit
                          </button>
                          {clip.video_url && (
                            <a href={clip.video_url} target="_blank" rel="noopener noreferrer" className="clip-action-btn">
                              View
                            </a>
                          )}
                        </>
                      )}
                      {clip.status === 'failed' && (
                        <span className="clip-status" style={{
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.13)'
                        }}>
                          Failed
                        </span>
                      )}
                      <span className={`clip-status ${clip.status === 'done' ? 'done' : clip.status === 'failed' ? '' : 'processing'}`}>
                        {clip.status === 'done' ? 'Ready' : clip.status === 'failed' ? 'Error' : 'Processing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upgrade' && (
          <div className="plans-grid">
            {plans.map((p, i) => (
              <div key={i} className={`plan-card${p.popular ? ' popular' : ''}`}>
                {p.popular && <div className="plan-popular-badge">MOST POPULAR</div>}
                <div className="plan-name" style={{ color: p.color, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                  {p.name.toUpperCase()}
                </div>
                <div className="plan-price" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0px' }}>
                  {p.price}<span className="plan-price-period">/month</span>
                </div>
                <div className="plan-clips">{p.clips}</div>
                <div className="plan-features">
                  {p.features.map((f, j) => (
                    <div key={j} className="plan-feature">
                      <span className="plan-feature-check" style={{ color: brand }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button
                  disabled={p.disabled || checkoutLoading}
                  onClick={() => p.price_id && handleCheckout(p.price_id)}
                  className="plan-btn"
                  style={{
                    background: p.disabled ? 'var(--card)' : p.popular ? brandGrad : `${brand}22`,
                    color: p.disabled ? 'var(--text-dim)' : p.popular ? '#000' : brand,
                    border: p.disabled ? '1px solid var(--border)' : p.popular ? 'none' : `1px solid ${brand}44`
                  }}
                >
                  {checkoutLoading ? 'Redirecting...' : p.cta}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
