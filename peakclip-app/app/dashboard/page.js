'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../lib/tokens'
import icons from '../../lib/icons'
import ErrorBoundary from '../../lib/error-boundary'

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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [passwordCurrent, setPasswordCurrent] = useState('')
  const [passwordNew, setPasswordNew] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [settingsStatus, setSettingsStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSidebarMenu, setShowSidebarMenu] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    if (p === 'creator' || p === 'pro') setActiveTab('upgrade')
    const t = params.get('tab')
    if (t === 'settings') setActiveTab('settings')

    const getUser = async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      setDisplayName(user.user_metadata?.name || user.email?.split('@')[0] || '')
      const { data } = await getSupabaseClient().from('users').select('*').eq('id', user.id).single()
      if (data) { setCredits(data.credits); setPlan(data.plan) }
      loadClips(user.id)
    }
    getUser()

    // Reload clips + credits when returning to dashboard
    const onFocus = async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (user) {
        loadClips(user.id)
        const { data } = await getSupabaseClient().from('users').select('*').eq('id', user.id).single()
        if (data) { setCredits(data.credits); setPlan(data.plan) }
      }
      const params = new URLSearchParams(window.location.search)
      const p = params.get('plan')
      if (p === 'creator' || p === 'pro') setActiveTab('upgrade')
      const t = params.get('tab')
      if (t === 'settings') setActiveTab('settings')
    }
    const onVisibilityChange = () => { if (!document.hidden) onFocus() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const loadClips = async (userId) => {
    const { data } = await getSupabaseClient().from('clips').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setClips(data)
  }

  const pollClipStatus = async (userId, since) => {
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      const { data } = await getSupabaseClient().from('clips').select('*').eq('user_id', userId).gte('created_at', new Date(since).toISOString()).order('created_at', { ascending: false }).limit(5)
      if (data?.length > 0 || attempts > 40) {
        clearInterval(poll)
        loadClips(userId)
        if (data?.length > 0) setStatus(`${data.length} clips ready!`)
      }
    }, 3000)
  }

  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut()
    window.location.href = '/login'
  }

  const validateUrl = (input) => {
    return input && (
      input.includes('youtube.com') || input.includes('youtu.be') ||
      input.includes('tiktok.com') || input.includes('twitch.tv') ||
      input.includes('vimeo.com') || input.includes('dailymotion.com') ||
      input.includes('.mp4') || input.includes('.webm') ||
      input.includes('.mov') || input.startsWith('http')
    )
  }

  const handleSubmit = async () => {
    if (!url?.trim() || !user) return
    if (credits <= 0 && plan !== 'pro') { setStatus('No credits remaining. Upgrade your plan.'); return }

    const trimmedUrl = url.trim()
    if (!validateUrl(trimmedUrl)) {
      setStatus('Please enter a valid video URL (YouTube, TikTok, Twitch, or direct video link)')
      return
    }

    setLoading(true)
    setStatus('Processing video with AI...')

    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const response = await fetch(`${BACKEND_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setStatus(`${data.total || 1} clips generated! Check "My Clips" tab.`)
        const { data: userData } = await getSupabaseClient().from('users').select('credits').eq('id', user.id).single()
        if (userData) setCredits(userData.credits)
        setTimeout(() => { loadClips(user.id); setActiveTab('clips') }, 2000)
      } else {
        const err = await response.text()
        if (response.status === 402) {
          setStatus('No credits remaining. Upgrade your plan.')
        } else if (response.status === 502 || response.status === 503) {
          setStatus('Server is busy. Please try again in a moment.')
        } else {
          setStatus(`Error: ${err.slice(0, 250)}`)
        }
      }
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        setStatus('The video is still processing. Polling for results...')
        pollClipStatus(user.id, Date.now())
        setTimeout(() => { setActiveTab('clips') }, 1000)
      } else {
        setStatus(`Connection error: ${err.message}`)
      }
    }

    setUrl('')
    setLoading(false)
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
    { id: 'settings', label: 'Settings' },
  ]

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) { setSettingsStatus('Name cannot be empty'); return }
    setSaving(true)
    setSettingsStatus('')
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        data: { name: displayName.trim() }
      })
      if (error) throw error
      setSettingsStatus('Profile updated successfully')
      setTimeout(() => setSettingsStatus(''), 3000)
    } catch (err) {
      setSettingsStatus(err.message || 'Update failed')
    }
    setSaving(false)
  }

  const handleUpdatePassword = async () => {
    if (!passwordNew) { setSettingsStatus('New password is required'); return }
    if (passwordNew.length < 6) { setSettingsStatus('Password must be at least 6 characters'); return }
    if (passwordNew !== passwordConfirm) { setSettingsStatus('Passwords do not match'); return }
    setSaving(true)
    setSettingsStatus('')
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password: passwordNew })
      if (error) throw error
      setSettingsStatus('Password updated successfully')
      setPasswordCurrent('')
      setPasswordNew('')
      setPasswordConfirm('')
      setTimeout(() => setSettingsStatus(''), 3000)
    } catch (err) {
      setSettingsStatus(err.message || 'Update failed')
    }
    setSaving(false)
  }

  const closeSidebar = () => setSidebarOpen(false)

  const greetingName = user?.email?.split('@')[0] || 'there'

  return (
    <ErrorBoundary>
    <div className="app-layout">


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

        <div className="sidebar-footer" style={{ position: 'relative' }}>
          <div className="sidebar-user" onClick={() => setShowSidebarMenu(!showSidebarMenu)} style={{ cursor: 'pointer' }}>
            <div className="sidebar-avatar" style={{ background: brandGrad }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="sidebar-email">{user?.email}</div>
              <div className="sidebar-plan" style={{ color: brand }}>{plan.toUpperCase()}</div>
            </div>
          </div>
          {showSidebarMenu && (
            <>
              <div onClick={() => setShowSidebarMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: '12px',
                background: surface, border: `1px solid ${borderSoft}`,
                borderRadius: '12px', padding: '6px', minWidth: '160px',
                zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <button onClick={() => { setActiveTab('settings'); setShowSidebarMenu(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', border: 'none', background: 'none',
                    color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                    fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = textPrimary }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                  <span style={{ display: 'flex', color: textDim }}>{icons.settings}</span>
                  Settings
                </button>
                <button onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', border: 'none', background: 'none',
                    color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                    fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                    borderTop: `1px solid ${borderSoft}`, marginTop: '4px', paddingTop: '10px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = '#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                  <span style={{ display: 'flex', color: textDim }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="main-content">
        <div className="dash-header">
          <div className="dash-welcome">
            <div className="dash-welcome-greeting">
              {greeting}, <span className="dash-welcome-name">{greetingName}</span>
            </div>
            <div className="dash-welcome-sub">
              {activeTab === 'generate' && 'Paste a link to create your next viral clip'}
              {activeTab === 'clips' && `You have ${clips.length} clip${clips.length !== 1 ? 's' : ''}`}
              {activeTab === 'upgrade' && 'Unlock more power with a premium plan'}
              {activeTab === 'settings' && 'Manage your account settings and subscription'}
            </div>
          </div>
          <div className="dash-header-actions">
            <div className="dash-credits-badge">
              <span className="dash-credits-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
              <span className="dash-credits-count">{plan === 'pro' ? '∞' : credits}</span>
              <span style={{ opacity: 0.6 }}>credits</span>
            </div>
            {activeTab === 'clips' && (
              <button onClick={() => setActiveTab('generate')} className="dash-quick-action">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Clip
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
            <div style={{
              textAlign: 'center', marginBottom: '32px',
            }}>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 42px)', color: textPrimary,
                lineHeight: 1.2, marginBottom: '12px',
                fontFamily: fonts.display, letterSpacing: '0.03em',
              }}>
                TURN LONG VIDEOS INTO{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #D9B44A, #E8C766)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.03em',
                }}>VIRAL SHORTS</span>
              </div>
              <div style={{
                fontFamily: fonts.body, fontSize: '10.5px', color: textSecondary,
                maxWidth: '480px', margin: '0 auto', lineHeight: 1.7,
              }}>
                Extract high-scoring clips, generate animated captions, and auto-crop horizontal videos into high-impact vertical format in one click.
              </div>
            </div>
            <div className="process-card" style={{ textAlign: 'center' }}>
              <label className="process-label" htmlFor="video-url" style={{ textAlign: 'center' }}>VIDEO URL</label>
              <div className="process-row" style={{ justifyContent: 'center', maxWidth: '680px', margin: '0 auto' }}>
                <input
                  id="video-url"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="process-input"
                />
                <button onClick={handleSubmit} disabled={loading} className="process-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  {loading ? 'Processing...' : <><span style={{ display: 'flex' }}>{icons.lightning}</span>Generate Clips</>}
                </button>
              </div>

              {status && (
                <div className="process-status" style={{ marginTop: '20px', maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span style={{ display: 'flex', color: 'inherit', opacity: 0.6 }}>{icons.sparkles}</span>
                    {status}
                  </span>
                </div>
              )}

              <div className="process-features" style={{ justifyContent: 'center', gap: '32px' }}>
                <span className="process-feature" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'flex', opacity: 0.5 }}>{icons.sparkles}</span>
                  AI viral detection
                </span>
                <span className="process-feature" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'flex', opacity: 0.5 }}>{icons.captions}</span>
                  Auto subtitles
                </span>
                <span className="process-feature" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'flex', opacity: 0.5 }}>{icons.mobile}</span>
                  9:16 format
                </span>
                <span className="process-feature" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'flex', opacity: 0.5 }}>{icons.scissors}</span>
                  Smart trimming
                </span>
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
                <div className="dash-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="2"/><path d="M22 14l-5-5-6 6-3-3-6 6"/></svg>
                </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => loadClips(user.id)} className="dash-clip-action-btn secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                      Refresh
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Poppins', sans-serif" }}>
                      {clips.length} total
                    </span>
                  </div>
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
                        <span className="plan-feature-check" style={{ color: brand, display: 'inline-flex' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span> {f}
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
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' }}>
              {/* Profile Section */}
              <div style={{
                background: surface, borderRadius: '12px',
                border: `1px solid ${borderSoft}`, padding: '20px',
              }}>
                <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '2px', color: brand, marginBottom: '16px' }}>
                  PROFILE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: textSecondary, marginBottom: '4px', fontFamily: fonts.body }}>DISPLAY NAME</label>
                    <input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        border: `1px solid ${borderSoft}`, background: bgSecondary,
                        color: textPrimary, fontSize: '14px', fontFamily: fonts.body,
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderColor = brand }}
                      onBlur={e => { e.target.style.borderColor = borderSoft }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: textSecondary, marginBottom: '4px', fontFamily: fonts.body }}>EMAIL</label>
                    <div style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: `1px solid ${borderSoft}`, background: bgSecondary,
                      color: textDim, fontSize: '14px', fontFamily: fonts.body,
                    }}>
                      {user?.email || '—'}
                    </div>
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    style={{
                      alignSelf: 'flex-start', padding: '8px 20px', borderRadius: '8px',
                      border: 'none', background: brandGrad, color: '#000',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      fontFamily: fonts.body, marginTop: '4px',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Password Section */}
              <div style={{
                background: surface, borderRadius: '12px',
                border: `1px solid ${borderSoft}`, padding: '20px',
              }}>
                <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '2px', color: brand, marginBottom: '16px' }}>
                  CHANGE PASSWORD
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: textSecondary, marginBottom: '4px', fontFamily: fonts.body }}>NEW PASSWORD</label>
                    <input
                      type="password"
                      value={passwordNew}
                      onChange={e => setPasswordNew(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        border: `1px solid ${borderSoft}`, background: bgSecondary,
                        color: textPrimary, fontSize: '14px', fontFamily: fonts.body,
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderColor = brand }}
                      onBlur={e => { e.target.style.borderColor = borderSoft }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: textSecondary, marginBottom: '4px', fontFamily: fonts.body }}>CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        border: `1px solid ${borderSoft}`, background: bgSecondary,
                        color: textPrimary, fontSize: '14px', fontFamily: fonts.body,
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderColor = brand }}
                      onBlur={e => { e.target.style.borderColor = borderSoft }}
                    />
                  </div>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={saving}
                    style={{
                      alignSelf: 'flex-start', padding: '8px 20px', borderRadius: '8px',
                      border: 'none', background: brandGrad, color: '#000',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      fontFamily: fonts.body, marginTop: '4px',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Subscription Section */}
              <div style={{
                background: surface, borderRadius: '12px',
                border: `1px solid ${borderSoft}`, padding: '20px',
              }}>
                <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '2px', color: brand, marginBottom: '16px' }}>
                  SUBSCRIPTION
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: textPrimary, fontWeight: '500', fontFamily: fonts.body }}>Current Plan</div>
                    <div style={{ fontSize: '12px', color: textSecondary, marginTop: '4px', fontFamily: fonts.body }}>
                      {credits > 0 ? `${credits} credits remaining` : 'No credits remaining'}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 14px', borderRadius: '20px',
                    background: `${brand}22`, color: brand,
                    fontSize: '12px', fontWeight: '600', fontFamily: fonts.body,
                    textTransform: 'uppercase', letterSpacing: '1px',
                  }}>
                    {plan}
                  </div>
                </div>
                <div style={{
                  marginTop: '16px', paddingTop: '16px',
                  borderTop: `1px solid ${borderSoft}`,
                  display: 'flex', gap: '8px',
                }}>
                  {plan === 'free' && (
                    <button
                      onClick={() => setActiveTab('upgrade')}
                      style={{
                        padding: '8px 16px', borderRadius: '8px',
                        border: 'none', background: brandGrad, color: '#000',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        fontFamily: fonts.body,
                      }}
                    >
                      Upgrade Plan
                    </button>
                  )}
                  <a
                    href={`${BACKEND_URL}/create-portal-session`}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      border: `1px solid ${borderSoft}`, background: 'none',
                      color: textSecondary, fontSize: '12px', fontWeight: '500',
                      cursor: 'pointer', textDecoration: 'none',
                      fontFamily: fonts.body,
                    }}
                  >
                    Manage Billing
                  </a>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{
                background: surface, borderRadius: '12px',
                border: `1px solid rgba(239,68,68,0.3)`, padding: '20px',
              }}>
                <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '2px', color: '#EF4444', marginBottom: '16px' }}>
                  DANGER ZONE
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: textPrimary, fontWeight: '500', fontFamily: fonts.body }}>Sign Out</div>
                    <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px', fontFamily: fonts.body }}>
                      Sign out of your account on this device
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
                      color: '#EF4444', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', fontFamily: fonts.body,
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Status Messages */}
              {settingsStatus && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px',
                  background: settingsStatus.includes('success') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${settingsStatus.includes('success') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: settingsStatus.includes('success') ? '#22C55E' : '#EF4444',
                  fontSize: '13px', fontFamily: fonts.body,
                }}>
                  {settingsStatus}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {tabs.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); closeSidebar() }}
            className={`mobile-bottom-nav-item${activeTab === item.id ? ' active' : ''}`}
          >
            <span className="mobile-bottom-nav-icon">
              {item.id === 'generate' ? icons.lightning :
               item.id === 'clips' ? icons.video :
               item.id === 'settings' ? icons.settings :
               icons.crown}
            </span>
            <span className="mobile-bottom-nav-label">{item.id === 'upgrade' ? 'Pro' : item.label.split(' ')[0]}</span>
          </button>
        ))}
        <div style={{ position: 'relative', flex: 1 }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`mobile-bottom-nav-item${showProfileMenu ? ' active' : ''}`}
            style={{ width: '100%', flex: 'none' }}
          >
            <span className="mobile-bottom-nav-icon">
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: brandGrad, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '10px', fontWeight: '700',
                color: '#000',
              }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </span>
            <span className="mobile-bottom-nav-label">Profile</span>
          </button>
          {showProfileMenu && (
            <>
              <div onClick={() => setShowProfileMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'fixed', bottom: '72px', right: '12px',
                background: surface, border: `1px solid ${borderSoft}`,
                borderRadius: '12px', padding: '6px', minWidth: '180px',
                zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{
                  padding: '8px 12px', borderBottom: `1px solid ${borderSoft}`,
                  marginBottom: '4px',
                }}>
                  <div style={{ fontSize: '12px', color: textPrimary, fontWeight: '600' }}>{user?.email}</div>
                  <div style={{ fontSize: '10px', color: brand, fontWeight: '500', marginTop: '2px' }}>{plan.toUpperCase()}</div>
                </div>
                <button onClick={() => { setActiveTab('settings'); setShowProfileMenu(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', border: 'none', background: 'none',
                    color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                    fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = textPrimary }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                  <span style={{ display: 'flex', color: textDim }}>{icons.settings}</span>
                  Settings
                </button>
                <button onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', border: 'none', background: 'none',
                    color: textSecondary, cursor: 'pointer', borderRadius: '8px',
                    fontSize: '13px', fontFamily: fonts.body, transition: 'all 0.1s',
                    borderTop: `1px solid ${borderSoft}`, marginTop: '4px', paddingTop: '10px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = bgSecondary; e.currentTarget.style.color = '#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}>
                  <span style={{ display: 'flex', color: textDim }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
    </ErrorBoundary>
  )

  const handleDownload = async (clip) => {
    const filename = `${clip.title?.slice(0, 40) || 'clip'}.mp4`
    try {
      const response = await fetch(`${clip.video_url}?download=${encodeURIComponent(filename)}`, { mode: 'cors' })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      const a = document.createElement('a')
      a.href = `${clip.video_url}?download=${encodeURIComponent(filename)}`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
    }
  }

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
              <div className="dash-clip-thumb-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              </div>
              <span className="dash-clip-thumb-label">{clip.status === 'processing' ? 'Processing...' : 'No preview'}</span>
            </div>
          )}
          <div className="dash-clip-thumb-overlay" />
          <span className={`dash-clip-status-badge ${clip.status === 'done' ? 'done' : clip.status === 'draft' ? 'draft' : clip.status === 'processing' ? 'processing' : 'error'}`}>
            {clip.status === 'done' ? 'Ready' : clip.status === 'draft' ? 'Draft' : clip.status === 'processing' ? 'Processing' : 'Failed'}
          </span>
        </div>
        <div className="dash-clip-info">
          <div className="dash-clip-title">{clip.title?.slice(0, 60) || 'Untitled Clip'}</div>
          <div className="dash-clip-meta">
            {clip.duration && (
              <span className="dash-clip-duration">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {clip.duration}s
              </span>
            )}
            <span className="dash-clip-date">
              {new Date(clip.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              })}
            </span>
          </div>
          <div className="dash-clip-actions">
            {(clip.status === 'done' || clip.status === 'draft') && (
              <>
                <button
                  onClick={() => window.location.href = `/editor?id=${clip.id}`}
                  className="dash-clip-action-btn primary"
                >
                  Edit
                </button>
                {clip.video_url && (
                  <>
                    <a href={clip.video_url} target="_blank" rel="noopener noreferrer" className="dash-clip-action-btn secondary">
                      View
                    </a>
                    <button onClick={() => handleDownload(clip)} className="dash-clip-action-btn secondary">
                      Download
                    </button>
                  </>
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
