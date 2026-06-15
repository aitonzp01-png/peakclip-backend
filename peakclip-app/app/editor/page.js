'use client'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabase'
import ErrorBoundary from '../../lib/error-boundary'
import VideoEditor from './VideoEditor'

export default function EditorPage() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setChecking(false)
    }).catch(() => {
      // Allow offline/demo use
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div style={{
        height: '100vh', background: '#050505', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(245,197,24,0.15)', borderTopColor: '#F5C518', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <VideoEditor />
    </ErrorBoundary>
  )
}
