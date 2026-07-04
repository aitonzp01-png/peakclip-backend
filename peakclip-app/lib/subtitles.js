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
    const lines = block.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length < 2) continue
    // First line may be index number
    let timeLineIdx = 0
    if (/^\d+$/.test(lines[0])) {
      timeLineIdx = 1
    }
    const timeLine = lines[timeLineIdx]
    const textLines = lines.slice(timeLineIdx + 1)
    const match = timeLine.match(/(.+)\s*-->\s*(.+)/)
    if (!match || textLines.length === 0) continue
    const start = parseSRTTime(match[1])
    const end = parseSRTTime(match[2])
    if (isNaN(start) || isNaN(end) || end <= start) continue
    segments.push({
      id: `sub-${idx}`,
      start,
      end,
      text: textLines.join('\n'),
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
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000)
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
