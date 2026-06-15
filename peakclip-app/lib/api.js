'use client'
import { getSupabaseClient } from './supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function getSessionToken() {
  const { data } = await getSupabaseClient().auth.getSession()
  return data?.session?.access_token || null
}

export async function processVideo(url) {
  const token = await getSessionToken()
  const response = await fetch(`${BACKEND_URL}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ url }),
  })
  return response
}

export async function exportClip(clipId, options) {
  const token = await getSessionToken()
  const response = await fetch(`${BACKEND_URL}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ clip_id: clipId, ...options }),
  })
  return response
}

export async function loadClips(userId) {
  if (!userId) return []
  const { data } = await getSupabaseClient().from('clips').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}

export async function loadClip(clipId) {
  const { data } = await getSupabaseClient().from('clips').select('*').eq('id', clipId).single()
  return data
}

export async function getUserProfile(userId) {
  const { data } = await getSupabaseClient().from('users').select('*').eq('id', userId).single()
  return data
}

export async function createCheckoutSession(priceId, returnUrl) {
  const token = await getSessionToken()
  const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ price_id: priceId, return_url: returnUrl }),
  })
  return response
}
