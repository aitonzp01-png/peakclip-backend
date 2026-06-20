'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '../../lib/supabase'
import { brand, brandDim, brandBorder, bgPrimary, brandGrad, brandHover, brandGlow, textSecondary, textDim, borderSoft, surface } from '../../lib/tokens'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [planParam, setPlanParam] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    if (p === 'creator' || p === 'pro') setPlanParam(p)
  }, [])

  const dashboardUrl = () => planParam ? `/dashboard?plan=${planParam}` : '/dashboard'

  const handleGoogleLogin = async () => {
    setLoading(true)
    const callbackUrl = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(dashboardUrl())}`
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    if (isSignUp) {
      const { data, error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${dashboardUrl()}` },
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
        setLoading(false)
        return
      }

      if (data?.user?.id) {
        try {
          await fetch('/api/auth/auto-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id }),
          })
        } catch {}
      }

      const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({ email, password })
      if (signInError) {
        setMessage({ type: 'success', text: 'Account created! Check your email to confirm, then sign in.' })
      } else {
        window.location.href = dashboardUrl()
      }
    } else {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        window.location.href = dashboardUrl()
      }
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Enter your email address first' })
      return
    }
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) setMessage({ type: 'error', text: error.message })
    else setMessage({ type: 'success', text: 'Check your email for the reset link' })
  }

  return (
    <div style={{
      minHeight: '100vh', background: bgPrimary, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(217,180,74,0.06), transparent 70%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: '420px', background: surface,
          borderRadius: '24px', border: `1px solid ${borderSoft}`,
          padding: '40px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px',
            letterSpacing: '3px', color: brand, marginBottom: '8px',
          }}>
            PEAKCLIP
          </div>
          <div style={{
            display: 'inline-block', background: brandDim,
            border: `1px solid ${brandBorder}`, borderRadius: '999px',
            padding: '4px 16px', fontSize: '10px', color: brand,
            letterSpacing: '2px', fontFamily: "'Poppins', sans-serif", fontWeight: 500,
          }}>
            AI-POWERED CLIPPING PLATFORM
          </div>
        </div>

        <h2 style={{
          fontSize: '22px', fontWeight: '700', margin: '0 0 4px',
          fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px',
        }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{
          fontSize: '13px', color: textDim, margin: '0 0 28px',
          fontFamily: "'Poppins', sans-serif",
        }}>
          {isSignUp ? 'Start creating viral clips in seconds' : 'Sign in to your account'}
        </p>

        {/* Email field */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', color: textDim, display: 'block',
            marginBottom: '6px', fontFamily: "'Poppins', sans-serif", fontWeight: 500,
          }} htmlFor="email">Email</label>
          <input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px',
              border: `1px solid ${borderSoft}`, background: bgPrimary,
              color: '#fff', fontSize: '14px', outline: 'none',
              fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = brand}
            onBlur={e => e.currentTarget.style.borderColor = borderSoft}
            autoComplete="email" />
        </div>

        {/* Password field */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            fontSize: '11px', color: textDim, display: 'block',
            marginBottom: '6px', fontFamily: "'Poppins', sans-serif", fontWeight: 500,
          }} htmlFor="password">Password</label>
          <input
            id="password" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px',
              border: `1px solid ${borderSoft}`, background: bgPrimary,
              color: '#fff', fontSize: '14px', outline: 'none',
              fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = brand}
            onBlur={e => e.currentTarget.style.borderColor = borderSoft}
            autoComplete={isSignUp ? 'new-password' : 'current-password'} />
        </div>

        {/* Forgot password */}
        {!isSignUp && (
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button onClick={handleForgotPassword}
              style={{
                background: 'none', border: 'none', color: textDim,
                cursor: 'pointer', fontSize: '12px', fontFamily: "'Poppins', sans-serif",
                padding: 0, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = brand}
              onMouseLeave={e => e.currentTarget.style.color = textDim}>
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit button */}
        <button onClick={handleEmailAuth} disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            border: 'none', background: brandGrad, color: '#000',
            fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontFamily: "'Poppins', sans-serif",
            opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
            marginBottom: '16px',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = `0 0 24px ${brandGlow}` }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = 'none' }}>
          {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px',
        }}>
          <div style={{ flex: 1, height: '1px', background: borderSoft }} />
          <span style={{ fontSize: '11px', color: textDim, fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: '1px', background: borderSoft }} />
        </div>

        {/* Google button */}
        <button onClick={handleGoogleLogin} disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            border: `1px solid ${borderSoft}`, background: bgPrimary,
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontFamily: "'Poppins', sans-serif", fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px', transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = brandBorder }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.borderColor = borderSoft }}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.8C9.7 39.8 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {/* Message */}
        {message.text && (
          <div style={{
            marginTop: '20px', padding: '10px 14px', borderRadius: '8px',
            fontSize: '12px', fontFamily: "'Poppins', sans-serif",
            background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : brandDim,
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.2)' : brandBorder}`,
            color: message.type === 'error' ? '#ef4444' : brand,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>{message.type === 'error'
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9B44A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            }</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Switch sign up / sign in */}
        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '12px', color: textDim, fontFamily: "'Poppins', sans-serif",
        }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignUp(!isSignUp); setMessage({ type: '', text: '' }) }}
            style={{
              background: 'none', border: 'none', color: brand, cursor: 'pointer',
              fontWeight: '600', fontSize: '12px', fontFamily: "'Poppins', sans-serif",
              padding: 0, transition: 'color 0.15s',
            }}>
            {isSignUp ? 'Sign in' : 'Sign up free'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
