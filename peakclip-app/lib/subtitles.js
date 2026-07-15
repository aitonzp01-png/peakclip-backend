'use client'

/**
 * Subtitle segment model:
 * {
 *   id: string,
 *   start: number, // seconds
 *   end: number,   // seconds
 *   text: string,
 *   style?: { color?, background?, outline?, bold?, fontSize?, position? }
 * }
 */

export function parseSRT(srtContent) {
  if (!srtContent || typeof srtContent !== 'string') return []
  const segments = []
  const blocks = srtContent.trim().split(/\n\s*\n/)
  let idx = 1
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue
    // Skip optional index line (1, 2, 3...)
    let timeLineIdx = 0
    if (/^\d+$/.test(lines[0].trim())) {
      timeLineIdx = 1
    }
    const timeLine = lines[timeLineIdx]
    if (!timeLine || !timeLine.includes('-->')) continue
    const textLines = lines.slice(timeLineIdx + 1).map(l => l.trim()).filter(l => l)
    if (textLines.length === 0) continue
    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim())
    const start = parseSRTTime(startStr)
    const end = parseSRTTime(endStr)
    if (isNaN(start) || isNaN(end) || end <= start) continue
    segments.push({
      id: `sub-${idx}`,
      start,
      end,
      text: textLines.join(' '),
      style: {},
    })
    idx++
  }
  return segments
}

export function generateSRT(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return ''
  const lines = []
  segments.forEach((seg, i) => {
    const start = formatSRTTime(seg.start)
    const end = formatSRTTime(seg.end)
    lines.push(String(i + 1))
    lines.push(`${start} --> ${end}`)
    lines.push(seg.text || '')
    lines.push('')
  })
  return lines.join('\n')
}

function parseSRTTime(timeStr) {
  const cleaned = timeStr.trim().replace(',', '.')
  const parts = cleaned.split(':')
  if (parts.length === 3) {
    const h = parseFloat(parts[0]) || 0
    const m = parseFloat(parts[1]) || 0
    const s = parseFloat(parts[2]) || 0
    return h * 3600 + m * 60 + s
  }
  if (parts.length === 2) {
    const m = parseFloat(parts[0]) || 0
    const s = parseFloat(parts[1]) || 0
    return m * 60 + s
  }
  return parseFloat(cleaned) || 0
}

function formatSRTTime(seconds) {
  let s = Math.max(0, seconds)
  let h = Math.floor(s / 3600); s -= h * 3600
  let m = Math.floor(s / 60); s -= m * 60
  let ms = Math.round((s - Math.floor(s)) * 1000)
  s = Math.floor(s)
  if (ms >= 1000) { ms -= 1000; s += 1 }
  if (s >= 60) { s -= 60; m += 1 }
  if (m >= 60) { m -= 60; h += 1 }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

export function getActiveSegment(segments, currentTime) {
  if (!Array.isArray(segments)) return null
  return segments.find(s => currentTime >= s.start && currentTime <= s.end) || null
}

export function segmentsToTrackItems(segments, duration = 0) {
  if (!duration || duration <= 0) {
    return segments.map(s => ({
      id: s.id,
      start: 0,
      end: 100,
      label: s.text.slice(0, 30),
      segment: s,
    }))
  }
  return segments.map(s => ({
    id: s.id,
    start: Math.max(0, Math.min(100, (s.start / duration) * 100)),
    end: Math.max(0, Math.min(100, (s.end / duration) * 100)),
    label: s.text.slice(0, 30),
    segment: s,
  }))
}

export function trackItemsToSegments(trackItems, duration = 0) {
  if (!duration || duration <= 0) return []
  return trackItems.map(item => ({
    ...(item.segment || {}),
    id: item.id,
    start: (item.start / 100) * duration,
    end: (item.end / 100) * duration,
    text: item.label || item.segment?.text || '',
  }))
}
