'use client'
import { create } from 'zustand'

const useEditorStore = create((set, get) => ({
  clip: null,
  clipId: null,
  user: null,
  isPlaying: false,
  playheadPos: 0,
  volume: 100,
  playbackSpeed: 1,
  timelineZoom: 1,
  currentTime: 0,
  duration: 0,

  trimStart: 0,
  trimEnd: 100,
  subtitleText: '',
  subtitleStyle: 'bold-yellow',
  subtitlePosition: 'bottom',
  fontSize: 14,
  watermark: '',
  watermarkPosition: 'top-right',
  music: 'none',
  musicVolume: 30,
  activeFilter: 'none',
  selectedTransition: 'fade',
  activeTool: 'ai',
  activeInspectorTab: 'edit',

  tracks: [
    { id: 'video', label: 'Video', type: 'video', items: [{ id: 'v1', start: 0, end: 100, label: 'Main Clip' }] },
    { id: 'audio', label: 'Audio', type: 'audio', items: [] },
    { id: 'text', label: 'Text', type: 'text', items: [] },
    { id: 'music', label: 'Music', type: 'music', items: [] },
  ],
  selectedTrackId: 'video',
  showKeyframes: false,
  saving: false,
  exportStatus: '',
  exportUrl: '',
  showExportModal: false,
  showAIPanel: true,
  sidebarExpanded: false,
  aspectRatio: '9:16',
  keyboardHint: '',

  setClip: (clip) => set({ clip }),
  setClipId: (clipId) => set({ clipId }),
  setUser: (user) => set({ user }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlayheadPos: (playheadPos) => set({ playheadPos }),
  setVolume: (volume) => set({ volume }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setTimelineZoom: (timelineZoom) => set({ timelineZoom }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),

  setTrimStart: (trimStart) => set({ trimStart }),
  setTrimEnd: (trimEnd) => set({ trimEnd }),
  setSubtitleText: (subtitleText) => set((state) => {
    const tracks = state.tracks.map(t => t.id === 'text' ? {
      ...t, items: subtitleText ? [{ id: 'txt1', start: 0, end: 100, label: subtitleText.slice(0, 20) }] : []
    } : t)
    return { subtitleText, tracks }
  }),
  setSubtitleStyle: (subtitleStyle) => set({ subtitleStyle }),
  setSubtitlePosition: (subtitlePosition) => set({ subtitlePosition }),
  setFontSize: (fontSize) => set({ fontSize }),
  setWatermark: (watermark) => set({ watermark }),
  setWatermarkPosition: (watermarkPosition) => set({ watermarkPosition }),
  setMusic: (music) => set((state) => {
    const tracks = state.tracks.map(t => t.id === 'music' ? {
      ...t, items: music !== 'none' ? [{ id: 'm1', start: 0, end: 100, label: music }] : []
    } : t)
    return { music, tracks }
  }),
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSelectedTransition: (selectedTransition) => set({ selectedTransition }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveInspectorTab: (activeInspectorTab) => set({ activeInspectorTab }),

  setTracks: (tracks) => set({ tracks }),
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
  setShowKeyframes: (showKeyframes) => set({ showKeyframes }),
  setSaving: (saving) => set({ saving }),
  setExportStatus: (exportStatus) => set({ exportStatus }),
  setExportUrl: (exportUrl) => set({ exportUrl }),
  setShowExportModal: (showExportModal) => set({ showExportModal }),
  setShowAIPanel: (showAIPanel) => set({ showAIPanel }),
  setSidebarExpanded: (sidebarExpanded) => set({ sidebarExpanded }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setKeyboardHint: (keyboardHint) => set({ keyboardHint }),

  addTrackItem: (trackId, item) => set((state) => ({
    tracks: state.tracks.map(t => t.id === trackId ? { ...t, items: [...t.items, item] } : t)
  })),

  removeTrackItem: (trackId, itemId) => set((state) => ({
    tracks: state.tracks.map(t => t.id === trackId ? { ...t, items: t.items.filter(i => i.id !== itemId) } : t)
  })),

  updateTrackItem: (trackId, itemId, updates) => set((state) => ({
    tracks: state.tracks.map(t => t.id === trackId ? {
      ...t, items: t.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
    } : t)
  })),

  showHint: (msg) => {
    set({ keyboardHint: msg })
    setTimeout(() => set({ keyboardHint: '' }), 2000)
  },

  resetEditor: () => set({
    clip: null, clipId: null, isPlaying: false, playheadPos: 0,
    currentTime: 0, duration: 0, trimStart: 0, trimEnd: 100,
    subtitleText: '', subtitleStyle: 'bold-yellow',
    subtitlePosition: 'bottom', fontSize: 14, watermark: '',
    watermarkPosition: 'top-right', music: 'none', musicVolume: 30,
    activeFilter: 'none', selectedTransition: 'fade', activeTool: 'cursor',
    tracks: [
      { id: 'video', label: 'Video', type: 'video', items: [{ id: 'v1', start: 0, end: 100, label: 'Main Clip' }] },
      { id: 'audio', label: 'Audio', type: 'audio', items: [] },
      { id: 'text', label: 'Text', type: 'text', items: [] },
      { id: 'music', label: 'Music', type: 'music', items: [] },
    ],
    selectedTrackId: 'video', showKeyframes: false,
    saving: false, exportStatus: '', exportUrl: '',
    showExportModal: false, showAIPanel: true,
    sidebarExpanded: false, aspectRatio: '9:16', keyboardHint: '',
  }),
}))

export default useEditorStore
