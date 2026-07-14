'use client'
import { useEffect, useRef, useCallback } from 'react'

export default function useAutoSave({ clipId, saveFn, interval = 30000 }) {
  const timerRef = useRef(null)
  const dirtyRef = useRef(false)

  const markDirty = useCallback(() => { dirtyRef.current = true }, [])

  useEffect(() => {
    if (!clipId) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(async () => {
      if (dirtyRef.current) {
        dirtyRef.current = false
        try { await saveFn() } catch (err) { console.warn('Auto-save failed:', err) }
      }
    }, interval)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [clipId, saveFn, interval])

  return markDirty
}
