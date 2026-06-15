'use client'
import { Component } from 'react'
import { brand, brandGrad, textDim, fonts } from './tokens'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || 'Unknown error'
      return (
        <div style={{
          height: '100vh', background: '#050505', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', padding: '24px',
          fontFamily: "'Poppins', sans-serif", textAlign: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>Something went wrong</div>
          <div style={{ fontSize: '13px', color: '#ff6b6b', maxWidth: '480px', lineHeight: '1.5', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-word' }}>
            {errMsg}
          </div>
          <button onClick={() => window.location.reload()}
            style={{
              background: brandGrad, color: '#000', border: 'none',
              borderRadius: '10px', padding: '12px 32px', fontWeight: '700',
              cursor: 'pointer', fontSize: '14px', marginTop: '8px',
            }}>
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
