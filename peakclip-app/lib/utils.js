export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function clipUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `https://${url}`
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const subtitleStyles = [
  { id: 'white-outline', label: 'White Outline', preview: { color: '#fff', fontWeight: '900', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.5)' } },
  { id: 'bold-yellow', label: 'Bold Yellow', preview: { color: '#FFD700', fontWeight: 'bold', textShadow: '2px 2px 4px #000' } },
  { id: 'neon-green', label: 'Neon', preview: { color: '#00ff88', fontWeight: 'bold', textShadow: '0 0 8px #00ff88' } },
  { id: 'red-fire', label: 'Fire', preview: { color: '#ff4444', fontWeight: 'bold', textShadow: '0 0 8px #ff0000, 0 0 16px #ff0000' } },
  { id: 'minimal-white', label: 'Minimal', preview: { color: '#fff', fontWeight: '400', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' } },
  { id: 'tiktok-style', label: 'TikTok', preview: { color: '#fff', fontWeight: '900', textShadow: '2px 2px 0 #fe2c55, -2px -2px 0 #00f2ea' } },
]

export const musicTracks = [
  { id: 'none', label: 'No music' },
  { id: 'epic', label: 'Epic Cinematic' },
  { id: 'hype', label: 'Hype Beat' },
  { id: 'chill', label: 'Chill Lofi' },
  { id: 'gaming', label: 'Gaming Energy' },
  { id: 'viral', label: 'Viral Pop' },
]

export const filters = [
  { id: 'none', label: 'Original', style: {} },
  { id: 'vivid', label: 'Vivid', style: { filter: 'saturate(1.5) contrast(1.1) brightness(1.05)' } },
  { id: 'cinema', label: 'Cinema', style: { filter: 'contrast(1.2) brightness(0.9) sepia(0.2)' } },
  { id: 'bw', label: 'B&W', style: { filter: 'grayscale(1) contrast(1.1)' } },
  { id: 'warm', label: 'Warm', style: { filter: 'sepia(0.4) saturate(1.3) hue-rotate(-10deg)' } },
  { id: 'cool', label: 'Cool', style: { filter: 'hue-rotate(30deg) saturate(0.9) brightness(1.1)' } },
]

export const transitions = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'wipe', label: 'Wipe' },
]

export const aspectRatios = [
  { id: '9:16', label: '9:16', icon: 'mobile', desc: 'TikTok / Reels / Shorts' },
]

export const resolutions = [
  { id: '720p', label: '720p', res: '1280x720' },
  { id: '1080p', label: '1080p', res: '1920x1080' },
  { id: '4k', label: '4K', res: '3840x2160' },
]
