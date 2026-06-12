'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { brand, brandGrad, brandDim, brandBorder, surface, bgPrimary } from '../../lib/tokens'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
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
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Check your email to confirm your account')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else window.location.href = dashboardUrl()
    }
  }

  const inputBorder = `1px solid ${focusedInput ? brand : 'rgba(255,255,255,0.06)'}`

  return (
    <div style={{
      minHeight: '100vh',
      background: bgPrimary,
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
      backgroundSize: '40px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(5,5,5,0.97)',
        border: `1px solid ${brandBorder}`,
        borderRadius: '24px',
        padding: '48px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 0 40px ${brandDim}, 0 20px 60px rgba(0,0,0,0.5)`
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: brand, fontSize: '32px',
            letterSpacing: '4px', marginBottom: '6px'
          }}>PEAKCLIP</h1>
          <div style={{
            display: 'inline-block', background: brandDim,
            border: `1px solid ${brandBorder}`, borderRadius: '999px',
            padding: '4px 16px', fontSize: '10px', color: brand, letterSpacing: '2px',
            fontFamily: "'Poppins', sans-serif", fontWeight: 500
          }}>AI-POWERED CLIPPING PLATFORM</div>
        </div>

        <p style={{ color: '#666', marginBottom: '28px', fontSize: '14px', fontFamily: "'Poppins', sans-serif" }}>
          {isSignUp ? 'Create your free account' : 'Welcome back'}
        </p>

        <input
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput('')}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: '14px',
            border: inputBorder,
            background: surface, color: '#fff',
            marginBottom: '12px', fontSize: '14px', outline: 'none',
            transition: 'border-color 0.2s',
            boxShadow: focusedInput ? `0 0 0 3px ${brandDim}` : 'none',
            fontFamily: "'Poppins', sans-serif"
          }}
          aria-label="Email"
        />
        <input
          type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)}
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput('')}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: '14px',
            border: inputBorder,
            background: surface, color: '#fff',
            marginBottom: '12px', fontSize: '14px', outline: 'none',
            transition: 'border-color 0.2s',
            boxShadow: focusedInput ? `0 0 0 3px ${brandDim}` : 'none',
            fontFamily: "'Poppins', sans-serif"
          }}
          aria-label="Password"
        />

        <button
          onClick={handleEmailAuth}
          style={{
            border: 'none', borderRadius: '14px', padding: '14px 32px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            width: '100%', marginBottom: '16px', marginTop: '8px',
            background: brandGrad,
            color: bgPrimary, letterSpacing: '1px',
            boxShadow: `0 4px 20px ${brandDim}`,
            transition: 'transform 0.1s',
            fontFamily: "'Poppins', sans-serif"
          }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <div style={{ color: 'rgba(255,255,255,0.06)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          <span style={{ color: '#666' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          style={{
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '13px 32px',
            fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            width: '100%', marginBottom: '8px',
            background: '#fff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: "'Poppins', sans-serif"
          }}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.8C9.7 39.8 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {message && (
          <div style={{
            background: brandDim, border: `1px solid ${brandBorder}`,
            borderRadius: '14px', padding: '10px', marginTop: '16px',
            color: brand, fontSize: '13px', fontFamily: "'Poppins', sans-serif"
          }} role="alert">{message}</div>
        )}

        <p
          style={{ color: '#666', marginTop: '24px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span style={{ color: brand }}>{isSignUp ? 'Sign in' : 'Sign up free'}</span>
        </p>
      </div>
    </div>
  )
}
