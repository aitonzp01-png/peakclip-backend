'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [msg, setMsg] = useState('Authenticating...')

  useEffect(() => {
    const handle = async () => {
      try {
        const supabase = getSupabaseClient()
        const params = new URLSearchParams(window.location.search)

        // Check PKCE code flow
        const code = params.get('code')
        if (code) {
          setMsg('Exchanging code...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            const redirectTo = params.get('redirect_to') || '/dashboard'
            router.push(redirectTo)
            return
          }
        }

        // Check URL hash tokens (implicit flow)
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          setMsg('Setting session from hash...')
          const h = new URLSearchParams(hash.substring(1))
          const { error } = await supabase.auth.setSession({
            access_token: h.get('access_token'),
            refresh_token: h.get('refresh_token'),
          })
          if (!error) {
            const redirectTo = params.get('redirect_to') || '/dashboard'
            router.push(redirectTo)
            return
          }
        }

        // Try session detection (auto-detect from hash)
        setMsg('Checking session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (session) {
          const redirectTo = params.get('redirect_to') || '/dashboard'
          router.push(redirectTo)
          return
        }

        console.error('No session found. Hash:', hash, 'Code:', code, 'Error:', sessionError)
        router.push('/login?error=auth_callback_error')
      } catch (err) {
        console.error('Auth callback exception:', err)
        router.push('/login?error=auth_callback_error')
      }
    }
    handle()
  }, [router])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505', color: '#D9B44A' }}>
      <div>{msg}</div>
    </div>
  )
}
