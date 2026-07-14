'use client'
import { useCallback } from 'react'

export default function useVideoPlayback(videoRef) {
  const togglePlay = useCallback(() => {
    const v = videoRef?.current
    if (!v) return
    if (v.paused) v.play().catch(() => {}) else v.pause()
  }, [videoRef])

  const seekTo = useCallback((t) => {
    const v = videoRef?.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, t))
  }, [videoRef])

  const skipBack = useCallback(() => {
    const v = videoRef?.current
    if (!v) return
    v.currentTime = Math.max(0, v.currentTime - 5)
  }, [videoRef])

  const skipForward = useCallback(() => {
    const v = videoRef?.current
    if (!v) return
    v.currentTime = Math.min(v.duration || 0, v.currentTime + 5)
  }, [videoRef])

  const setVolume = useCallback((vol) => {
    const v = videoRef?.current
    if (v) v.volume = Math.max(0, Math.min(1, vol / 100))
  }, [videoRef])

  const setPlaybackRate = useCallback((rate) => {
    const v = videoRef?.current
    if (v) v.playbackRate = rate
  }, [videoRef])

  const toggleMute = useCallback(() => {
    const v = videoRef?.current
    if (v) v.muted = !v.muted
  }, [videoRef])

  const toggleFullscreen = useCallback(() => {
    const el = videoRef?.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }, [videoRef])

  return { togglePlay, seekTo, skipBack, skipForward, setVolume, setPlaybackRate, toggleMute, toggleFullscreen }
}
