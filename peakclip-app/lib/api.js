'use client'
import { getSupabaseClient } from './supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL && typeof window !== 'undefined') {
  console.error('NEXT_PUBLIC_BACKEND_URL is not set — API calls will fail')
}

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

export async function createClip(userId, clipData) {
  if (!userId) return null
  const { data, error } = await getSupabaseClient().from('clips').insert({
    user_id: userId,
    title: clipData.title || 'Untitled Clip',
    video_url: clipData.video_url || '',
    thumbnail_url: clipData.thumbnail_url || '',
    duration: clipData.duration || 0,
    status: clipData.status || 'done',
  }).select('id').single()
  if (error) { console.error('createClip error:', error); return null }
  return data
}

export async function updateClip(clipId, updates) {
  if (!clipId) return null
  const { error } = await getSupabaseClient().from('clips').update(updates).eq('id', clipId)
  if (error) { console.error('updateClip error:', error); return null }
  return true
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

export async function saveSubtitles(clipId, srtContent) {
  const token = await getSessionToken()
  const response = await fetch(`${BACKEND_URL}/save-subtitles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ clip_id: clipId, srt_content: srtContent }),
  })
  return response
}

export async function burnSubtitles(style) {
  const token = await getSessionToken()
  const response = await fetch(`${BACKEND_URL}/burn-subtitles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(style),
  })
  return response
}

export async function analyzeFaces(videoUrl) {
  const token = await getSessionToken()
  const response = await fetch(`${BACKEND_URL}/analyze-faces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ video_url: videoUrl }),
  })
  return response
}
