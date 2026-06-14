'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong } from '../../lib/tokens'

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
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    if (p === 'creator' || p === 'pro') setActiveTab('upgrade')

    const getUser = async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data } = await getSupabaseClient().from('users').select('*').eq('id', user.id).single()
      if (data) { setCredits(data.credits); setPlan(data.plan) }
      loadClips(user.id)
    }
    getUser()
  }, [])

  const loadClips = async (userId) => {
    const { data } = await getSupabaseClient().from('clips').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setClips(data)
  }

  const pollClipStatus = async (clipId, userId) => {
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      const { data } = await getSupabaseClient().from('clips').select('*').eq('id', clipId).single()
      if (data?.video_url || attempts > 30) {
        clearInterval(poll)
        loadClips(userId)
      }
    }, 3000)
  }

  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut()
    window.location.href = '/login'
  }

  const handleSubmit = async () => {
    if (!url || !user) return
    if (credits <= 0 && plan !== 'pro') { setStatus('No credits remaining. Upgrade your plan.'); return }
    setLoading(true)
    setStatus('Processing video with AI...')

    const { data: { session } } = await getSupabaseClient().auth.getSession()

    try {
      const response = await fetch(`${BACKEND_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ url })
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
    const { data: { session } } = await getSupabaseClient().auth.getSession()
    try {
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          price_id: priceId,
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
      cta: 'Current plan', disabled: true
    },
    {
      name: 'Creator', price: '$26.99', clips: '200 clips/month',
      features: ['200 credits', 'Animated subtitles', 'Gameplay overlay', 'HD export'],
      cta: 'Start Creator', popular: true,
      price_id: 'price_creator'
    },
    {
      name: 'Pro', price: '$69.99', clips: 'Unlimited',
      features: ['Unlimited credits', 'Advanced editor', 'Auto-publish', 'Viral Score AI', 'Priority support'],
      cta: 'Start Pro',
      price_id: 'price_pro'
    },
  ]

  const tabs = [
    { id: 'generate', label: 'Generate Clips' },
    { id: 'clips', label: 'My Clips' },
    { id: 'upgrade', label: 'Upgrade' },
  ]

  const closeSidebar = () => setSidebarOpen(false)

  const displayName = user?.email?.split('@')[0] || 'there'

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
        <div className="dash-header">
          <div className="dash-welcome">
            <div className="dash-welcome-greeting">
              {greeting}, <span className="dash-welcome-name">{displayName}</span>
            </div>
            <div className="dash-welcome-sub">
              {activeTab === 'generate' && 'Paste a link to create your next viral clip'}
              {activeTab === 'clips' && `You have ${clips.length} clip${clips.length !== 1 ? 's' : ''}`}
              {activeTab === 'upgrade' && 'Unlock more power with a premium plan'}
            </div>
          </div>
          <div className="dash-header-actions">
            <div className="dash-credits-badge">
              <span className="dash-credits-icon">◆</span>
              <span className="dash-credits-count">{plan === 'pro' ? '∞' : credits}</span>
              <span style={{ opacity: 0.6 }}>credits</span>
            </div>
            {activeTab === 'clips' && (
              <button onClick={() => setActiveTab('generate')} className="dash-quick-action">
                + New Clip
              </button>
            )}
          </div>
        </div>

        {activeTab === 'generate' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
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

            {clips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px',
                  letterSpacing: '1px', marginBottom: '16px', color: '#fff',
                  borderBottom: '1px solid var(--border-soft)', paddingBottom: '12px',
                }}>
                  Recent Clips
                </h3>
                <div className="dash-clip-grid">
                  {clips.slice(0, 3).map(clip => renderClipCard(clip))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'clips' && (
          <motion.div
            key="clips"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {clips.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">🎬</div>
                <div className="dash-empty-title">No Clips Yet</div>
                <p className="dash-empty-text">
                  Paste a YouTube or Twitch link and PeakClip will automatically find the best moments and create viral-ready shorts.
                </p>
                <button onClick={() => setActiveTab('generate')} className="dash-empty-btn">
                  Generate Your First Clip
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '16px', borderBottom: '1px solid var(--border-soft)',
                  paddingBottom: '12px',
                }}>
                  <h3 style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px',
                    letterSpacing: '1px', color: '#fff', margin: 0,
                  }}>
                    Your Clips
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Poppins', sans-serif" }}>
                    {clips.length} total
                  </span>
                </div>
                <div className="dash-clip-grid">
                  {clips.map((clip, i) => (
                    <div key={clip.id} style={{ animationDelay: `${i * 0.05}s` }}>
                      {renderClipCard(clip)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'upgrade' && (
          <motion.div
            key="upgrade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="plans-grid">
              {plans.map((p, i) => (
                <div key={i} className={`plan-card${p.popular ? ' popular' : ''}`}>
                  {p.popular && <div className="plan-popular-badge">MOST POPULAR</div>}
                  <div className="plan-name" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                    {p.name.toUpperCase()}
                  </div>
                  <div className="plan-price" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
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
          </motion.div>
        )}
      </main>
    </div>
  )

  function renderClipCard(clip) {
    return (
      <motion.div
        key={clip.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="dash-clip-card"
      >
        <div className="dash-clip-thumb">
          {clip.thumbnail_url ? (
            <img src={clip.thumbnail_url} alt="" onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="dash-clip-thumb-placeholder">
              <div className="dash-clip-thumb-icon">🎬</div>
              <span className="dash-clip-thumb-label">{clip.status === 'processing' ? 'Processing...' : 'No preview'}</span>
            </div>
          )}
          <div className="dash-clip-thumb-overlay" />
          <span className={`dash-clip-status-badge ${clip.status === 'done' ? 'done' : clip.status === 'processing' ? 'processing' : 'error'}`}>
            {clip.status === 'done' ? 'Ready' : clip.status === 'processing' ? 'Processing' : 'Failed'}
          </span>
        </div>
        <div className="dash-clip-info">
          <div className="dash-clip-title">{clip.title?.slice(0, 60) || 'Untitled Clip'}</div>
          <div className="dash-clip-meta">
            {clip.duration && (
              <span className="dash-clip-duration">◆ {clip.duration}s</span>
            )}
            <span className="dash-clip-date">
              {new Date(clip.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              })}
            </span>
          </div>
          <div className="dash-clip-actions">
            {clip.status === 'done' && (
              <>
                <button
                  onClick={() => window.location.href = `/editor?id=${clip.id}`}
                  className="dash-clip-action-btn primary"
                >
                  Edit
                </button>
                {clip.video_url && (
                  <a href={clip.video_url} target="_blank" rel="noopener noreferrer" className="dash-clip-action-btn secondary">
                    View
                  </a>
                )}
              </>
            )}
            {clip.status === 'processing' && (
              <button className="dash-clip-action-btn primary" disabled style={{ opacity: 0.6 }}>
                Processing...
              </button>
            )}
            {clip.status === 'failed' && (
              <button className="dash-clip-action-btn secondary" disabled>
                Failed
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }
}
