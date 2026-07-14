'use client'
import { useEffect } from 'react'

export default function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return
      const ctrl = e.ctrlKey || e.metaKey
      if (e.key === ' ') { e.preventDefault(); handlers.togglePlay?.() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handlers.seekTo?.(Math.max(0, (handlers.currentTime || 0) - 5)) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handlers.seekTo?.(Math.min((handlers.duration || 9999), (handlers.currentTime || 0) + 5)) }
      else if (ctrl && (e.key === 'z' || e.key === 'Z') && e.shiftKey) { e.preventDefault(); handlers.redo?.() }
      else if (ctrl && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); handlers.undo?.() }
      else if (!ctrl && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); handlers.deleteSelected?.() }
      else if (ctrl && (e.key === 's' || e.key === 'S')) { e.preventDefault(); handlers.save?.() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })
}
