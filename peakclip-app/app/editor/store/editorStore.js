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
  videoError: null,
  videoLoading: true,
  videoLoaded: false,

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

  // Undo/Redo history
  _history: [],
  _historyIndex: -1,
  _maxHistory: 50,

  _pushHistory: () => {
    const state = get()
    const snapshot = {
      trimStart: state.trimStart,
      trimEnd: state.trimEnd,
      subtitleText: state.subtitleText,
      subtitleStyle: state.subtitleStyle,
      subtitlePosition: state.subtitlePosition,
      fontSize: state.fontSize,
      watermark: state.watermark,
      watermarkPosition: state.watermarkPosition,
      music: state.music,
      musicVolume: state.musicVolume,
      activeFilter: state.activeFilter,
      selectedTransition: state.selectedTransition,
      tracks: JSON.parse(JSON.stringify(state.tracks)),
    }
    const newHistory = state._history.slice(0, state._historyIndex + 1)
    newHistory.push(snapshot)
    if (newHistory.length > state._maxHistory) newHistory.shift()
    set({ _history: newHistory, _historyIndex: newHistory.length - 1 })
  },

  undo: () => {
    const state = get()
    if (state._historyIndex <= 0) {
      set({ keyboardHint: 'Nothing to undo' })
      setTimeout(() => set({ keyboardHint: '' }), 1500)
      return
    }
    const newIndex = state._historyIndex - 1
    const snap = state._history[newIndex]
    set({
      _historyIndex: newIndex,
      trimStart: snap.trimStart, trimEnd: snap.trimEnd,
      subtitleText: snap.subtitleText, subtitleStyle: snap.subtitleStyle,
      subtitlePosition: snap.subtitlePosition, fontSize: snap.fontSize,
      watermark: snap.watermark, watermarkPosition: snap.watermarkPosition,
      music: snap.music, musicVolume: snap.musicVolume,
      activeFilter: snap.activeFilter, selectedTransition: snap.selectedTransition,
      tracks: JSON.parse(JSON.stringify(snap.tracks)),
    })
  },

  redo: () => {
    const state = get()
    if (state._historyIndex >= state._history.length - 1) {
      set({ keyboardHint: 'Nothing to redo' })
      setTimeout(() => set({ keyboardHint: '' }), 1500)
      return
    }
    const newIndex = state._historyIndex + 1
    const snap = state._history[newIndex]
    set({
      _historyIndex: newIndex,
      trimStart: snap.trimStart, trimEnd: snap.trimEnd,
      subtitleText: snap.subtitleText, subtitleStyle: snap.subtitleStyle,
      subtitlePosition: snap.subtitlePosition, fontSize: snap.fontSize,
      watermark: snap.watermark, watermarkPosition: snap.watermarkPosition,
      music: snap.music, musicVolume: snap.musicVolume,
      activeFilter: snap.activeFilter, selectedTransition: snap.selectedTransition,
      tracks: JSON.parse(JSON.stringify(snap.tracks)),
    })
  },

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
  setVideoError: (videoError) => set({ videoError, videoLoading: false, videoLoaded: false }),
  setVideoLoading: (videoLoading) => set({ videoLoading }),
  setVideoLoaded: (videoLoaded) => set({ videoLoaded, videoLoading: false, videoError: null }),

  setTrimStart: (trimStart) => {
    get()._pushHistory()
    set({ trimStart })
  },
  setTrimEnd: (trimEnd) => {
    get()._pushHistory()
    set({ trimEnd })
  },
  setSubtitleText: (subtitleText) => {
    get()._pushHistory()
    set((state) => {
      const tracks = state.tracks.map(t => t.id === 'text' ? {
        ...t, items: subtitleText ? [{ id: 'txt1', start: 0, end: 100, label: subtitleText.slice(0, 20) }] : []
      } : t)
      return { subtitleText, tracks }
    })
  },
  setSubtitleStyle: (subtitleStyle) => {
    get()._pushHistory()
    set({ subtitleStyle })
  },
  setSubtitlePosition: (subtitlePosition) => set({ subtitlePosition }),
  setFontSize: (fontSize) => {
    get()._pushHistory()
    set({ fontSize })
  },
  setWatermark: (watermark) => set({ watermark }),
  setWatermarkPosition: (watermarkPosition) => set({ watermarkPosition }),
  setMusic: (music) => {
    get()._pushHistory()
    set((state) => {
      const tracks = state.tracks.map(t => t.id === 'music' ? {
        ...t, items: music !== 'none' ? [{ id: 'm1', start: 0, end: 100, label: music }] : []
      } : t)
      return { music, tracks }
    })
  },
  setMusicVolume: (musicVolume) => {
    get()._pushHistory()
    set({ musicVolume })
  },
  setActiveFilter: (activeFilter) => {
    get()._pushHistory()
    set({ activeFilter })
  },
  setSelectedTransition: (selectedTransition) => {
    get()._pushHistory()
    set({ selectedTransition })
  },
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
    currentTime: 0, duration: 0, videoError: null, videoLoading: true, videoLoaded: false,
    trimStart: 0, trimEnd: 100,
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
