'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { brand, brandDim, brandBorder, bgPrimary, brandGrad } from '../../lib/tokens'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [focusedInput, setFocusedInput] = useState('')
  const [planParam, setPlanParam] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    if (p === 'creator' || p === 'pro') setPlanParam(p)
  }, [])

  const dashboardUrl = () => planParam ? `/dashboard?plan=${planParam}` : '/dashboard'

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${dashboardUrl()}` }
    })
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
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${dashboardUrl()}` } })
      if (error) setMessage({ type: 'error', text: error.message })
      else setMessage({ type: 'success', text: 'Check your email to confirm your account' })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
      else window.location.href = dashboardUrl()
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Enter your email address first' })
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    if (error) setMessage({ type: 'error', text: error.message })
    else setMessage({ type: 'success', text: 'Check your email for the reset link' })
  }

  return (
    <div className="login-wrapper">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="login-logo">PEAK<span className="login-logo-dot">CLIP</span></h1>
          <div style={{
            display: 'inline-block', background: brandDim, border: `1px solid ${brandBorder}`,
            borderRadius: '999px', padding: '4px 16px', fontSize: '10px', color: brand,
            letterSpacing: '2px', fontFamily: "'Poppins', sans-serif", fontWeight: 500
          }}>
            AI-POWERED CLIPPING PLATFORM
          </div>
        </div>

        <h2 className="login-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="login-subtitle">
          {isSignUp ? 'Start creating viral clips in seconds' : 'Sign in to your account'}
        </p>

        <div className="login-form">
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput('')}
              className="login-input"
              aria-label="Email"
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput('')}
              className="login-input"
              aria-label="Password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {!isSignUp && (
            <div className="login-forgot">
              <button onClick={handleForgotPassword} className="login-forgot-link" type="button">
                Forgot password?
              </button>
            </div>
          )}

          <button onClick={handleEmailAuth} className="login-btn" type="button">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        <div className="login-divider">
          <span className="login-divider-line" />
          <span className="login-divider-text">or continue with</span>
          <span className="login-divider-line" />
        </div>

        <button onClick={handleGoogleLogin} className="login-google-btn" type="button">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.8C9.7 39.8 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {message.text && (
          <div
            className={message.type === 'error' ? 'login-error' : 'login-success'}
            style={{ justifyContent: 'center', marginTop: '20px', marginBottom: 0 }}
            role="alert"
          >
            {message.type === 'error' ? '⚠ ' : '✓ '}{message.text}
          </div>
        )}

        <div className="login-switch">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button className="login-switch-link" onClick={() => { setIsSignUp(!isSignUp); setMessage({ type: '', text: '' }) }} type="button">
            {isSignUp ? 'Sign in' : 'Sign up free'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
