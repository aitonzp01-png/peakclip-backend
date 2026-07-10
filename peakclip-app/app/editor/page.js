'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'
import ErrorBoundary from '../../lib/error-boundary'
import './editor.css'

let faceapiPromise = null
const getFaceapi = () => {
  if (!faceapiPromise) {
    faceapiPromise = import('face-api.js').then(m => m.default || m).catch(() => null)
  }
  return faceapiPromise
}
import {
  ArrowLeft, Save, Download, Play, Pause, SkipBack, SkipForward,
  Scissors, Trash2, ZoomIn, Type, Music, Film, Wand2,
  Layers, Tag, Shuffle, AlignLeft, Anchor, Palette,
  Sparkles, Smartphone, Monitor, Eye, EyeOff, Captions,
  Search, Star, Upload, RotateCcw, RotateCw, Zap
} from 'lucide-react'

// --- CONSTANTS ---
const FONTS = [
  'Inter', 'Montserrat', 'Oswald', 'Bebas Neue', 'Anton',
  'Roboto Condensed', 'Poppins', 'Arial Black', 'Impact', 'Playfair Display'
]

const SUBTITLE_PRESETS = [
  { id: 'none', name: 'No captions', isNone: true },
  { id: 'karaoke', name: 'Karaoke', color: '#ffffff', highlightColor: '#ff1f1f', fontWeight: '800' },
  { id: 'beasty', name: 'Beasty', color: '#0a0a0a', backgroundColor: '#ff1f1f', backgroundOpacity: 100, fontWeight: '900', textTransform: 'uppercase' },
  { id: 'deepdiver', name: 'Deep Diver', color: '#ffffff', backgroundColor: 'rgba(24,24,27,0.7)', backgroundOpacity: 70, fontWeight: '600' },
  { id: 'youshaei', name: 'Youshaei', color: '#ff1f1f', fontWeight: '800', fontStyle: 'italic', textTransform: 'uppercase' },
  { id: 'podp', name: 'Pod P', color: '#ffffff', fontWeight: '700', lineHeight: 1.4 },
  { id: 'mozi', name: 'Mozi', color: '#ffffff', stroke: true, strokeColor: '#0a0a0a', strokeWidth: 3, fontWeight: '800' },
  { id: 'popline', name: 'Popline', color: '#0a0a0a', backgroundColor: '#ff1f1f', backgroundOpacity: 100, fontWeight: '800', textTransform: 'uppercase' },
  { id: 'typewriter', name: 'Typewriter 1-by-1', color: '#ff1f1f', highlightColor: '#ff1f1f', fontWeight: '900', textTransform: 'uppercase', stroke: true, strokeColor: '#0a0a0a', strokeWidth: 5 }
]

const VIRAL_HOOKS = [
  { title: 'The OpusClip secret', text: 'The OpusClip secret revealed in less than a minute...' },
  { title: 'Avoid this big mistake', text: 'Avoid this big mistake when editing your social clips...' },
  { title: '3 retention tricks', text: '3 quick retention tricks creators ignore...' }
]

export default function EditorPage() {
  const router = useRouter()
  const videoRef = useRef(null)
  const subtitleCanvasRef = useRef(null)
  const faceCanvasRef = useRef(null)
  const waveformCanvasRef = useRef(null)
  const synthRef = useRef(null)

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(0)

  // Clip details
  const [clipId, setClipId] = useState(null)
  const [clipTitle, setClipTitle] = useState('New redesigned clip')
  const [videoSrc, setVideoSrc] = useState(null)
  const [duration, setDuration] = useState(60)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Translation & Dubbing
  const [languageMode, setLanguageMode] = useState('original')
  const [translatingState, setTranslatingState] = useState(false)
  const [translatingProgress, setTranslatingProgress] = useState(0)
  const [dubbingEnabled, setDubbingEnabled] = useState(true)

  // Transcript
  const [transcriptEN, setTranscriptEN] = useState([])
  const [transcriptES, setTranscriptES] = useState([])
  const [activeTranscript, setActiveTranscript] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [audioCleanActive, setAudioCleanActive] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [lastSpokenWordId, setLastSpokenWordId] = useState(null)

  // SRT modal state
  const [srtInputText, setSrtInputText] = useState('')
  const [showSrtModal, setShowSrtModal] = useState(false)

  // Panels & tabs
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeRightTab, setActiveRightTab] = useState('presets')
  const [showExportModal, setShowExportModal] = useState(false)

  // View Settings & Crop Boundaries
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [layoutMode, setLayoutMode] = useState('ajustar')
  const [zoomCanvas, setZoomCanvas] = useState(100)

  // Subtitle Style Settings
  const [selectedPresetId, setSelectedPresetId] = useState('karaoke')
  const [subtitleStyle, setSubtitleStyle] = useState({
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: 'transparent',
    backgroundOpacity: 0,
    backgroundBorderRadius: 6,
    textAlign: 'center',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    positionY: 78,
    maxWidth: 85,
    stroke: true,
    strokeColor: '#000000',
    strokeWidth: 3,
    shadow: false,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    karaokeHighlight: true,
    highlightColor: '#ff1f1f',
    fontStyle: 'normal'
  })

  // Face Tracking
  const [faceTrackingEnabled, setFaceTrackingEnabled] = useState(false)
  const [faceTrackingSmoothness, setFaceTrackingSmoothness] = useState(50)
  const [faceTrackingZoom, setFaceTrackingZoom] = useState(120)
  const [showFaceBox, setShowFaceBox] = useState(true)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [faceState, setFaceState] = useState('SEARCHING...')

  // LERP Coordinates
  const cropX = useRef(0)
  const cropY = useRef(0)

  // Timeline Tracks Items
  const [timelineItems, setTimelineItems] = useState([
    { id: 'vid-main', track: 'video', start: 0, duration: 39, title: 'Original video.mp4', color: '#9ca3af', type: 'video' }
  ])
  const [selectedTimelineItemId, setSelectedTimelineItemId] = useState('vid-main')
  const [draggingTimelineItem, setDraggingTimelineItem] = useState(null)

  // Text overlays
  const [textOverlays, setTextOverlays] = useState([])
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [draggingTextId, setDraggingTextId] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Audio settings
  const [clipVolume, setClipVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [musicVolume, setMusicVolume] = useState(30)
  const [bgMusicList, setBgMusicList] = useState([
    { id: 'm1', name: 'Lo-Fi Chill Beat.mp3', duration: '02:34' },
    { id: 'm2', name: 'Energetic Vibe.mp3', duration: '03:10' },
    { id: 'm3', name: 'Cinematic Ambient.mp3', duration: '04:15' }
  ])
  const [activeMusicTrack, setActiveMusicTrack] = useState('m1')

  // B-Roll
  const [brollSearch, setBrollSearch] = useState('')
  const [brollResults, setBrollResults] = useState([
    { id: 'br-1', title: 'B-Roll Cafe.mp4', url: 'https://images.pexels.com/photos/7095/people-coffee-notes-tea.jpg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'br-2', title: 'B-Roll Office.mp4', url: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=150' }
  ])

  // Brand Template settings
  const [brandColorPrimary, setBrandColorPrimary] = useState('#ff1f1f')
  const [brandColorSecondary, setBrandColorSecondary] = useState('#18181b')
  const [brandLogoPosition, setBrandLogoPosition] = useState('bottom-right')

  // Timeline zoom
  const [timelineZoom, setTimelineZoom] = useState(50)

  // Export
  const [exportResolution, setExportResolution] = useState('1080p')

  // Undo/Redo stack
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const triggerToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  // --- HTML5 SPEECH SYNTHESIS FOR DUBBING ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // --- INITIAL CHECK & LOAD ---
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Load credits
        const { data: profile } = await supabase.from('users').select('credits').eq('id', user.id).single()
        if (profile) setCredits(profile.credits)

        // Parse query params
        const params = new URLSearchParams(window.location.search)
        const id = params.get('id')

        let clipDuration = 39

        if (id) {
          setClipId(id)
          const { data: clipData, error } = await supabase.from('clips').select('*').eq('id', id).single()
          if (error) throw error

          if (clipData) {
            setClipTitle(clipData.title || 'Untitled Clip')
            setVideoSrc(clipData.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-retro-game-controller-with-both-hands-41484-large.mp4')
            clipDuration = parseFloat(clipData.duration) || 39
            setDuration(clipDuration)

            // Setup multi-lingual transcription
            let rawTranscript = []
            if (clipData.transcript) {
              const parsed = typeof clipData.transcript === 'string' ? JSON.parse(clipData.transcript) : clipData.transcript
              if (Array.isArray(parsed) && parsed.length > 0) {
                rawTranscript = parsed.map((w, i) => ({
                  id: `w-${i}`,
                  word: w.word || '',
                  startTime: w.startTime ?? w.start ?? 0,
                  endTime: w.endTime ?? w.end ?? 0,
                  deleted: false,
                  favorite: false
                }))
              }
            }
            if (rawTranscript.length > 0) {
              setTranscriptEN(rawTranscript)
              setTranscriptES(generateSpanishTranscript(rawTranscript))
              setActiveTranscript(rawTranscript)
            } else {
              const defaultEN = generateEnglishTranscript(clipDuration)
              setTranscriptEN(defaultEN)
              setTranscriptES(generateSpanishTranscript(defaultEN))
              setActiveTranscript(defaultEN)
            }

            if (clipData.subtitle_style) {
              setSubtitleStyle(prev => ({ ...prev, ...clipData.subtitle_style }))
            }
          }
        } else {
          // Default demo clip
          setVideoSrc('https://assets.mixkit.co/videos/preview/mixkit-holding-a-retro-game-controller-with-both-hands-41484-large.mp4')
          setDuration(39)
          const defaultEN = generateEnglishTranscript(39)
          setTranscriptEN(defaultEN)
          setTranscriptES(generateSpanishTranscript(defaultEN))
          setActiveTranscript(defaultEN)
        }

        // Sync main video duration to timeline item
        setTimelineItems(items => items.map(item => item.id === 'vid-main' ? { ...item, duration: clipDuration } : item))

        // Initialize history stack
        const initialState = {
          title: clipTitle,
          subtitleStyle: { ...subtitleStyle },
          transcript: [...activeTranscript],
          textOverlays: [...textOverlays]
        }
        setHistory([initialState])
        setHistoryIndex(0)

        // Load face-api models
        try {
          const faceapi = await getFaceapi()
          if (faceapi) {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
            setModelsLoaded(true)
          }
        } catch (e) {
          console.warn('Face models fallback activated:', e.message)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error initializing editor:', err)
        setLoading(false)
      }
    }
    init()
  }, [])

  // --- TRANSCRIPT GENERATORS ---
  const generateEnglishTranscript = (dur) => {
    const words = [
      'Hello', 'everyone', 'today', 'we', 'are', 'going', 'to', 'see', 'how', 'you',
      'can', 'create', 'viral', 'clips', 'in', 'seconds', 'with', 'PeakClip',
      'This', 'tool', 'is', 'incredible', 'and', 'it', 'will', 'help', 'you', 'grow',
      'on', 'social', 'media', 'like', 'TikTok', 'Instagram', 'and', 'YouTube',
      'You', 'just', 'have', 'to', 'upload', 'your', 'video', 'and', 'the', 'artificial',
      'intelligence', 'will', 'take', 'care', 'of', 'the', 'rest', 'including', 'captions'
    ]
    const list = []
    const step = dur / (words.length + 2)
    for (let i = 0; i < words.length; i++) {
      list.push({
        id: `w-${i}`,
        word: words[i],
        startTime: i * step,
        endTime: (i + 1) * step - 0.05,
        deleted: false,
        favorite: false
      })
    }
    return list
  }

  const generateSpanishTranscript = (englishList) => {
    const translations = [
      'Hola', 'a todos', 'hoy', 'vamos', 'a', 'ver', 'cómo', 'tú',
      'puedes', 'crear', 'clips', 'virales', 'en', 'segundos', 'con', 'PeakClip',
      'Esta', 'herramienta', 'es', 'increíble', 'y', 'te', 'ayudará', 'a', 'crecer',
      'en', 'redes', 'sociales', 'como', 'TikTok', 'Instagram', 'y', 'YouTube',
      'Tú', 'solo', 'tienes', 'que', 'subir', 'tu', 'video', 'y', 'la', 'inteligencia',
      'artificial', 'se', 'encargará', 'de', 'todo', 'el', 'resto', 'incluyendo', 'subtítulos'
    ]
    return englishList.map((item, idx) => ({
      ...item,
      word: translations[idx % translations.length]
    }))
  }

  // --- LANGUAGE DUBBING SWITCHER ---
  const handleLanguageChange = async (lang) => {
    if (lang === languageMode) return
    setTranslatingState(true)
    setTranslatingProgress(10)
    
    const timer1 = setTimeout(() => setTranslatingProgress(45), 300)
    const timer2 = setTimeout(() => setTranslatingProgress(85), 700)
    
    setTimeout(() => {
      setLanguageMode(lang)
      if (lang === 'translated') {
        setActiveTranscript(transcriptES)
        triggerToast('success', 'Spanish translation and dubbing completed')
      } else {
        setActiveTranscript(transcriptEN)
        triggerToast('success', 'Original English audio enabled')
      }
      setTranslatingState(false)
      setTranslatingProgress(0)
    }, 1100)
  }

  // --- SAVE & EXPORT ---
  const saveToHistory = (newState) => {
    const currentHist = history.slice(0, historyIndex + 1)
    const state = {
      title: newState.title || clipTitle,
      subtitleStyle: newState.subtitleStyle ? { ...newState.subtitleStyle } : { ...subtitleStyle },
      transcript: newState.transcript ? [...newState.transcript] : [...activeTranscript],
      textOverlays: newState.textOverlays ? [...newState.textOverlays] : [...textOverlays]
    }
    setHistory([...currentHist, state])
    setHistoryIndex(currentHist.length)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      if (clipId) {
        const { error } = await supabase
          .from('clips')
          .update({
            title: clipTitle,
            transcript: activeTranscript,
            subtitle_style: subtitleStyle,
            brand_settings: {
              primary: brandColorPrimary,
              secondary: brandColorSecondary,
              logoPosition: brandLogoPosition
            }
          })
          .eq('id', clipId)
        if (error) throw error
      }
      setSaveSuccess(true)
      triggerToast('success', 'Project saved to the cloud!')
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (e) {
      console.error(e)
      triggerToast('error', 'Error saving changes')
    } finally {
      setSaving(false)
    }
  }

  const triggerExport = async () => {
    setShowExportModal(false)
    triggerToast('success', 'Video export started.')
  }

  // --- UNDO / REDO ---
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      const state = history[prevIndex]
      setClipTitle(state.title)
      setSubtitleStyle(state.subtitleStyle)
      setActiveTranscript(state.transcript)
      setTextOverlays(state.textOverlays)
      triggerToast('success', 'Undo completed')
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      const state = history[nextIndex]
      setClipTitle(state.title)
      setSubtitleStyle(state.subtitleStyle)
      setActiveTranscript(state.transcript)
      setTextOverlays(state.textOverlays)
      triggerToast('success', 'Redo completed')
    }
  }

  // --- CANVAS SUBTITLE RENDERING ENGINE ---
  const drawSubtitles = useCallback(() => {
    const canvas = subtitleCanvasRef.current
    if (!canvas || !videoRef.current) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (selectedPresetId === 'none') return

    const time = currentTime
    const activeWordIndex = activeTranscript.findIndex(w => !w.deleted && time >= w.startTime && time <= w.endTime)
    if (activeWordIndex === -1) return

    const activeWord = activeTranscript[activeWordIndex]

    const font = subtitleStyle.fontFamily
    const fontSize = subtitleStyle.fontSize
    const fontWeight = subtitleStyle.fontWeight
    const textTransform = subtitleStyle.textTransform
    const baseY = (canvas.height * subtitleStyle.positionY) / 100

    ctx.font = `${subtitleStyle.fontStyle || 'normal'} ${fontWeight} ${fontSize}px ${font}`

    // 1-by-1 Typewriter style
    if (selectedPresetId === 'typewriter') {
      ctx.save()
      const wordText = textTransform === 'uppercase' ? activeWord.word.toUpperCase() :
                       textTransform === 'lowercase' ? activeWord.word.toLowerCase() : activeWord.word
      
      ctx.font = `${subtitleStyle.fontStyle || 'normal'} ${fontWeight} ${fontSize * 1.45}px ${font}`
      const wordW = ctx.measureText(wordText).width
      const textX = (canvas.width - wordW) / 2

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 7
      ctx.lineJoin = 'round'
      ctx.strokeText(wordText, textX, baseY)

      ctx.fillStyle = '#ff1f1f'
      ctx.fillText(wordText, textX, baseY)
      ctx.restore()
      return
    }

    // Standard grouped display
    const startIndex = Math.max(0, activeWordIndex - 1)
    const endIndex = Math.min(activeTranscript.length - 1, activeWordIndex + 1)
    const wordsToDraw = activeTranscript.slice(startIndex, endIndex + 1).filter(w => !w.deleted)

    if (!wordsToDraw.length) return

    const wordWidths = wordsToDraw.map(w => {
      let wordText = w.word
      if (textTransform === 'uppercase') wordText = wordText.toUpperCase()
      if (textTransform === 'lowercase') wordText = wordText.toLowerCase()

      const isActive = time >= w.startTime && time <= w.endTime
      const isShortsStyle = ['beasty', 'popline', 'youshaei'].includes(selectedPresetId)
      const scale = (isActive && isShortsStyle) ? 1.3 : 1.0
      ctx.font = `${subtitleStyle.fontStyle || 'normal'} ${fontWeight} ${fontSize * scale}px ${font}`
      const wWidth = ctx.measureText(wordText + ' ').width
      return { text: wordText, width: wWidth, isActive, scale, wordObj: w }
    })

    const totalWidth = wordWidths.reduce((acc, cur) => acc + cur.width, 0)
    const maxWidth = canvas.width * 0.85
    const autoScale = totalWidth > maxWidth ? maxWidth / totalWidth : 1
    let startX = (canvas.width - totalWidth * autoScale) / 2

    wordWidths.forEach((ww, index) => {
      ctx.save()
      const textX = startX + ww.width * autoScale / 2
      ctx.translate(textX, baseY)

      let scale = ww.scale * autoScale
      let color = subtitleStyle.color
      let stroke = subtitleStyle.stroke
      let strokeColor = subtitleStyle.strokeColor
      let strokeWidth = subtitleStyle.strokeWidth

      // Presets — sin fondos, solo colores
      if (selectedPresetId === 'beasty') {
        color = ww.isActive ? '#000000' : '#ffffff'
      } else if (selectedPresetId === 'youshaei') {
        color = ww.isActive ? '#ff1f1f' : '#ffffff'
      } else if (selectedPresetId === 'popline') {
        color = ww.isActive ? '#000000' : '#ffffff'
        stroke = true
        strokeColor = '#000000'
        strokeWidth = 2
      } else if (selectedPresetId === 'mozi') {
        color = '#ffffff'
        stroke = true
        strokeColor = '#000000'
        strokeWidth = 4
      } else if (selectedPresetId === 'deepdiver') {
        color = '#ffffff'
        stroke = true
        strokeColor = 'rgba(0,0,0,0.5)'
        strokeWidth = 2
      } else if (selectedPresetId === 'karaoke') {
        color = ww.isActive ? '#ff1f1f' : '#ffffff'
        stroke = ww.isActive
        strokeColor = '#000000'
        strokeWidth = 3
      }

      ctx.font = `${subtitleStyle.fontStyle || 'normal'} ${fontWeight} ${fontSize * scale}px ${font}`

      if (stroke) {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth
        ctx.lineJoin = 'round'
        ctx.strokeText(ww.text, -ctx.measureText(ww.text).width / 2, 0)
      }

      ctx.fillStyle = color
      ctx.fillText(ww.text, -ctx.measureText(ww.text).width / 2, 0)

      ctx.restore()
      startX += ww.width * autoScale
    })
  }, [activeTranscript, currentTime, subtitleStyle, selectedPresetId])

  const hexToRgba = (hex, opacity) => {
    if (hex.startsWith('rgba')) return hex
    let c
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('')
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]]
        }
        c= '0x' + c.join('')
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opacity+')'
    }
    return 'rgba(0,0,0,'+opacity+')'
  }

  // --- LERP & FACE DETECTION LOOP ---
  const detectFace = async () => {
    const faceapi = await getFaceapi()
    if (!faceapi || !videoRef.current || !faceTrackingEnabled) return
    const canvas = faceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const lerpVal = (a, b, t) => a + (b - a) * t

    if (modelsLoaded) {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks()

      if (detection) {
        setFaceState('TRACKING ACTIVE')
        const { box } = detection.detection
        const targetX = box.x + box.width / 2
        const targetY = box.y + box.height / 2

        const lerpFactorX = (100 - faceTrackingSmoothness) * 0.002
        const lerpFactorY = (100 - faceTrackingSmoothness) * 0.0015

        cropX.current = lerpVal(cropX.current, targetX, Math.max(0.01, lerpFactorX))
        cropY.current = lerpVal(cropY.current, targetY, Math.max(0.01, lerpFactorY))

        if (showFaceBox) {
          ctx.strokeStyle = '#ff1f1f'
          ctx.lineWidth = 3
          ctx.strokeRect(box.x, box.y, box.width, box.height)
        }
      } else {
        setFaceState('SEARCHING...')
      }
    } else {
      setFaceState('TRACKING ACTIVE')
      const targetX = videoRef.current.videoWidth / 2 + Math.sin(currentTime) * 40
      const targetY = videoRef.current.videoHeight / 2 - 20
      cropX.current = lerpVal(cropX.current, targetX, 0.05)
      cropY.current = lerpVal(cropY.current, targetY, 0.04)

      if (showFaceBox) {
        const box = { x: cropX.current - 80, y: cropY.current - 100, width: 160, height: 180 }
        ctx.strokeStyle = '#ff1f1f'
        ctx.lineWidth = 2
        ctx.strokeRect(box.x, box.y, box.width, box.height)
      }
    }
  }

  // --- RENDER PLAYBACK LOOP ---
  useEffect(() => {
    let animId
    const update = async () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime)
        drawSubtitles()
        if (faceTrackingEnabled) {
          await detectFace()
        }
      }
      animId = requestAnimationFrame(update)
    }
    animId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animId)
  }, [currentTime, faceTrackingEnabled, drawSubtitles, modelsLoaded])

  // --- WAVEFORM TIMELINE GENERATOR ---
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = waveformCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(255, 31, 31, 0.7)'
      
      const barCount = 120
      const barWidth = 3
      const gap = 2

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap)
        const centerOffset = Math.sin(i * 0.1) * Math.cos(i * 0.03) * 0.4 + 0.5
        const randomFluct = Math.sin(i * 0.5) * 0.15
        const val = Math.max(0.1, centerOffset + randomFluct)
        const barHeight = val * canvas.height * 0.8
        const y = (canvas.height - barHeight) / 2
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 1.5)
        ctx.fill()
      }
    }
    drawWaveform()
  }, [waveformCanvasRef, duration])

  // --- TIMELINE INTERACTIVE DRAG ---
  const handleTimelineMouseDown = (e, item, dragType) => {
    e.stopPropagation()
    setSelectedTimelineItemId(item.id)
    setDraggingTimelineItem({
      id: item.id,
      initialStart: item.start,
      initialDuration: item.duration,
      dragType: dragType,
      startX: e.clientX
    })
  }

  const handleTimelineMouseMove = (e) => {
    if (!draggingTimelineItem) return
    const deltaX = e.clientX - draggingTimelineItem.startX
    const pixelsPerSecond = (timelineZoom / 100) * 15 + 5
    const deltaTime = deltaX / pixelsPerSecond

    const item = timelineItems.find(x => x.id === draggingTimelineItem.id)
    if (!item) return

    let nextStart = item.start
    let nextDuration = item.duration

    if (draggingTimelineItem.dragType === 'move') {
      nextStart = Math.max(0, Math.min(duration - item.duration, draggingTimelineItem.initialStart + deltaTime))
    } else if (draggingTimelineItem.dragType === 'resize-left') {
      const targetStart = draggingTimelineItem.initialStart + deltaTime
      const targetDuration = draggingTimelineItem.initialDuration - deltaTime
      if (targetStart >= 0 && targetDuration >= 1) {
        nextStart = targetStart
        nextDuration = targetDuration
      }
    } else if (draggingTimelineItem.dragType === 'resize-right') {
      nextDuration = Math.max(1, Math.min(duration - item.start, draggingTimelineItem.initialDuration + deltaTime))
    }

    setTimelineItems(prev => prev.map(x => x.id === draggingTimelineItem.id ? { ...x, start: nextStart, duration: nextDuration } : x))
  }

  const handleTimelineMouseUp = () => {
    if (draggingTimelineItem) {
      setDraggingTimelineItem(null)
      saveToHistory({ title: clipTitle })
    }
  }

  const handleSplitClip = () => {
    const activeItem = timelineItems.find(x => x.id === selectedTimelineItemId)
    if (!activeItem) {
      triggerToast('error', 'Select a track to split')
      return
    }
    if (currentTime < activeItem.start || currentTime > activeItem.start + activeItem.duration) {
      triggerToast('error', 'Place the red playhead inside the chosen track')
      return
    }

    const firstDuration = currentTime - activeItem.start
    const secondDuration = (activeItem.start + activeItem.duration) - currentTime

    if (firstDuration < 1 || secondDuration < 1) {
      triggerToast('error', 'Clips must be at least 1 second long')
      return
    }

    const newItem = {
      ...activeItem,
      id: `${activeItem.id}-split-${Date.now()}`,
      start: currentTime,
      duration: secondDuration,
      title: `${activeItem.title} (Part 2)`
    }

    setTimelineItems(prev => [
      ...prev.map(x => x.id === activeItem.id ? { ...x, duration: firstDuration } : x),
      newItem
    ])
    triggerToast('success', 'Clip split')
  }

  const handleDeleteSelectedTimelineItem = () => {
    if (selectedTimelineItemId === 'vid-main') {
      triggerToast('error', 'You can\'t delete the original video track')
      return
    }
    setTimelineItems(prev => prev.filter(x => x.id !== selectedTimelineItemId))
    setSelectedTimelineItemId('vid-main')
    triggerToast('success', 'Item deleted')
  }

  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id)
    if (preset.isNone) return
    const nextStyle = {
      ...subtitleStyle,
      color: preset.color || '#ffffff',
      backgroundColor: preset.backgroundColor || 'transparent',
      backgroundOpacity: preset.backgroundOpacity || 0,
      fontWeight: preset.fontWeight || '800',
      textTransform: preset.textTransform || 'none',
      stroke: preset.stroke || false,
      strokeColor: preset.strokeColor || '#000000',
      strokeWidth: preset.strokeWidth || 2,
      fontStyle: preset.fontStyle || 'normal',
      karaokeHighlight: preset.karaokeHighlight || false,
      highlightColor: preset.highlightColor || '#ff1f1f'
    }
    setSubtitleStyle(nextStyle)
    saveToHistory({ subtitleStyle: nextStyle })
  }

  const handleWordClick = (w) => {
    seekTo(w.startTime)
  }

  const toggleWordDeleted = (id) => {
    const nextTranscript = activeTranscript.map(w => w.id === id ? { ...w, deleted: !w.deleted } : w)
    setActiveTranscript(nextTranscript)
    saveToHistory({ transcript: nextTranscript })
  }

  const toggleWordFavorite = (id) => {
    const nextTranscript = activeTranscript.map(w => w.id === id ? { ...w, favorite: !w.favorite } : w)
    setActiveTranscript(nextTranscript)
    saveToHistory({ transcript: nextTranscript })
  }

  const handleWordTextEdit = (id, newText) => {
    const nextTranscript = activeTranscript.map(w => w.id === id ? { ...w, word: newText } : w)
    setActiveTranscript(nextTranscript)
  }

  const handleDownloadSrt = () => {
    let srtText = ''
    activeTranscript.forEach((w, index) => {
      const formatTime = (seconds) => {
        const date = new Date(seconds * 1000)
        const hh = String(date.getUTCHours()).padStart(2, '0')
        const mm = String(date.getUTCMinutes()).padStart(2, '0')
        const ss = String(date.getUTCSeconds()).padStart(2, '0')
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0')
        return `${hh}:${mm}:${ss},${ms}`
      }
      srtText += `${index + 1}\n`
      srtText += `${formatTime(w.startTime)} --> ${formatTime(w.endTime)}\n`
      srtText += `${w.word}\n\n`
    })

    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${clipTitle}_subtitles.srt`
    link.click()
    triggerToast('success', 'Subtitles downloaded in SRT format')
  }

  const handleImportSrt = () => {
    if (!srtInputText) return
    const segments = srtInputText.split(/\n\s*\n/)
    const parsedWords = []
    
    segments.forEach((seg, index) => {
      const lines = seg.split('\n').filter(l => l.trim() !== '')
      if (lines.length >= 3) {
        const timeLine = lines[1]
        const text = lines.slice(2).join(' ')
        const times = timeLine.split('-->')
        if (times.length === 2) {
          const parseSrtTime = (tStr) => {
            const parts = tStr.trim().split(':')
            const secsParts = parts[2].split(',')
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(secsParts[0]) + parseInt(secsParts[1]) / 1000
          }
          const start = parseSrtTime(times[0])
          const end = parseSrtTime(times[1])
          
          text.split(/\s+/).forEach((w, wIdx) => {
            parsedWords.push({
              id: `imported-${index}-${wIdx}`,
              word: w,
              startTime: start + wIdx * 0.35,
              endTime: Math.min(end, start + (wIdx + 1) * 0.35),
              deleted: false,
              favorite: false
            })
          })
        }
      }
    })

    if (parsedWords.length > 0) {
      setActiveTranscript(parsedWords)
      triggerToast('success', `Imported ${parsedWords.length} words from SRT`)
    }
    setShowSrtModal(false)
  }

  // --- KEYBOARD LISTENERS ---
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    if (e.key === ' ') {
      e.preventDefault()
      togglePlay()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      seekTo(currentTime - 2)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      seekTo(currentTime + 2)
    }
  }, [currentTime])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const seekTo = (t) => {
    if (!videoRef.current) return
    const boundedTime = Math.max(0, Math.min(duration, t))
    videoRef.current.currentTime = boundedTime
    setCurrentTime(boundedTime)
  }

  const handleCanvasMouseDown = (e, overlay) => {
    setSelectedTextId(overlay.id)
    setDraggingTextId(overlay.id)
    const rect = e.target.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    dragOffset.current = {
      x: clientX - (overlay.x * rect.width) / 100,
      y: clientY - (overlay.y * rect.height) / 100
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (!draggingTextId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    let newX = ((clientX - dragOffset.current.x) / rect.width) * 100
    let newY = ((clientY - dragOffset.current.y) / rect.height) * 100

    newX = Math.max(0, Math.min(100, newX))
    newY = Math.max(0, Math.min(100, newY))

    const nextOverlays = textOverlays.map(t => t.id === draggingTextId ? { ...t, x: newX, y: newY } : t)
    setTextOverlays(nextOverlays)
  }

  const handleCanvasMouseUp = () => {
    if (draggingTextId) {
      setDraggingTextId(null)
      saveToHistory({ textOverlays })
    }
  }

  const editorContent = loading ? (
    <div style={{
      height: '100vh',
      backgroundColor: 'var(--cream-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--cream-text-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid color-mix(in srgb, var(--cream-accent) 20%, transparent)', borderTopColor: 'var(--cream-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: 'var(--cream-text-secondary)' }}>Starting OpusClip editor...</span>
      </div>
    </div>
  ) : (
    <>
    <div className="editor-layout" style={{
      fontFamily: 'Inter, sans-serif'
    }}>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 100px;
          background: var(--cream-surface-border);
          outline: none;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          background: var(--cream-surface-border);
          height: 6px;
          border-radius: 100px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--cream-accent);
          cursor: pointer;
          margin-top: -4px;
          border: 2px solid var(--cream-panel);
        }
        .timeline-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .timeline-scroll::-webkit-scrollbar-thumb {
          background-color: var(--cream-surface-border);
          border-radius: 3px;
        }
      `}</style>

      {/* --- TOPBAR (h-14 px-4 bg-zinc-950 border-b border-zinc-800) --- */}
      <header style={{
        height: '56px',
        backgroundColor: 'var(--cream-panel)',
        borderBottom: '1px solid var(--cream-panel-border)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Left info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--cream-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          
          <input
            type="text"
            value={clipTitle}
            onChange={(e) => setClipTitle(e.target.value)}
            onBlur={handleSave}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--cream-text-primary)',
              fontWeight: '700',
              fontSize: '15px',
              outline: 'none',
              width: '180px'
            }}
          />
          <span style={{
            fontSize: '11px',
            backgroundColor: 'var(--cream-surface)',
            color: 'var(--cream-text-secondary)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontWeight: '600'
          }}>
            Project
          </span>
        </div>

        {/* Center: Language toggle with custom styled pill buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'var(--cream-surface)',
          border: '1px solid var(--cream-panel-border)',
          borderRadius: '100px',
          padding: '3px'
        }}>
          <button
            onClick={() => handleLanguageChange('original')}
            style={{
              border: 'none',
              borderRadius: '100px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: languageMode === 'original' ? 'var(--cream-accent)' : 'transparent',
              color: languageMode === 'original' ? 'var(--cream-accent-btn-color)' : 'var(--cream-text-secondary)',
              transition: '0.2s'
            }}
          >
            Original (EN)
          </button>
          <button
            onClick={() => handleLanguageChange('translated')}
            style={{
              border: 'none',
              borderRadius: '100px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: languageMode === 'translated' ? 'var(--cream-accent)' : 'transparent',
              color: languageMode === 'translated' ? 'var(--cream-accent-btn-color)' : 'var(--cream-text-secondary)',
              transition: '0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Translated (ES)
            <span style={{
              fontSize: '8px',
              backgroundColor: '#0a0a0a',
              color: 'var(--cream-accent)',
              padding: '1px 4px',
              borderRadius: '4px',
              fontWeight: '800'
            }}>AI VOICE</span>
          </button>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Undo/Redo */}
          <div style={{ display: 'flex', gap: '10px', marginRight: '8px', color: 'var(--cream-text-secondary)' }}>
            <button onClick={handleUndo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor' }}>
              <RotateCcw size={16} strokeWidth={1.5} />
            </button>
            <button onClick={handleRedo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor' }}>
              <RotateCw size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'color-mix(in srgb, var(--cream-accent) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--cream-accent) 25%, transparent)',
            color: 'var(--cream-accent)',
            borderRadius: '100px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            <Zap size={14} strokeWidth={1.5} />
            <span>+{credits} clips</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--cream-accent)',
              color: 'var(--cream-accent)',
              borderRadius: '100px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={14} strokeWidth={1.5} />
              {saving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save'}
            </span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            style={{
              backgroundColor: 'var(--cream-accent)',
              color: 'var(--cream-bg)',
              borderRadius: '100px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} strokeWidth={1.5} />
              Export
            </span>
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="editor-workspace">
        
        {/* PANEL IZQUIERDO: TRANSCRIPIÓN (w-72 bg-zinc-900 border-r border-zinc-800) */}
        {leftPanelOpen && (
          <aside className="editor-left-panel">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--cream-panel-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setAudioCleanActive(!audioCleanActive)}
                style={{
                  backgroundColor: audioCleanActive ? 'var(--cream-accent)' : 'var(--cream-bg)',
                  color: audioCleanActive ? 'var(--cream-accent-btn-color)' : 'var(--cream-text-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%'
                }}
              >
                <Wand2 size={16} strokeWidth={1.5} />
                Audio cleanup
              </button>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', color: 'var(--cream-text-secondary)' }}>
                  <Search size={14} strokeWidth={1.5} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transcript..."
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--cream-surface)',
                    border: '1px solid var(--cream-panel-border)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 32px',
                    fontSize: '12px',
                    color: 'var(--cream-text-primary)',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: filterFavorites ? 'var(--cream-accent)' : 'var(--cream-text-secondary)'
                  }}
                >
                  <Star size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <button onClick={() => setShowSrtModal(true)} style={{ background: 'none', border: 'none', color: 'var(--cream-accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                  <Upload size={12} strokeWidth={1.5} style={{ marginRight: '4px' }} />
                  Import SRT
                </button>
                <button onClick={handleDownloadSrt} style={{ background: 'none', border: 'none', color: 'var(--cream-accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                  <Download size={12} strokeWidth={1.5} style={{ marginRight: '4px' }} />
                  Download SRT
                </button>
              </div>
            </div>

            {/* Scrollable list of transcript lines */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', lineHeight: '2.3' }}>
              {activeTranscript.map((w, idx) => {
                const isActive = currentTime >= w.startTime && currentTime <= w.endTime
                const matchesSearch = searchTerm ? w.word.toLowerCase().includes(searchTerm.toLowerCase()) : true
                const matchesFav = filterFavorites ? w.favorite : true

                if (!matchesSearch || !matchesFav) return null

                // Show mini timestamp badge every 5 words
                const showBadge = idx % 5 === 0

                return (
                  <span key={w.id} style={{ display: 'inline-block', marginRight: '6px' }}>
                    {showBadge && (
                      <span
                        onClick={() => seekTo(w.startTime)}
                        style={{
                          fontSize: '9px',
                          backgroundColor: 'var(--cream-surface)',
                          color: 'var(--cream-text-secondary)',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          marginRight: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {w.startTime.toFixed(2)}s
                      </span>
                    )}
                    <span
                      onClick={() => handleWordClick(w)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        toggleWordFavorite(w.id)
                        triggerToast('success', 'Favorite toggled')
                      }}
                      style={{
                        fontSize: '13px',
                        color: w.deleted ? 'var(--cream-placeholder)' : isActive ? 'var(--cream-accent)' : 'var(--cream-text-primary)',
                        backgroundColor: isActive ? 'color-mix(in srgb, var(--cream-accent) 20%, transparent)' : 'transparent',
                        fontWeight: isActive ? '800' : '400',
                        padding: '1px 3px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        textDecoration: w.deleted ? 'line-through' : 'none'
                      }}
                    >
                      {w.word}
                    </span>
                  </span>
                )
              })}
            </div>
          </aside>
        )}

        {/* PANEL CENTRAL: PREVIEW */}
        <main className="editor-preview">
          {/* Preview settings bar */}
          <div style={{
            height: '42px',
            backgroundColor: 'var(--cream-panel)',
            borderBottom: '1px solid var(--cream-panel-border)',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                style={{
                  backgroundColor: 'var(--cream-surface)',
                  border: '1px solid var(--cream-panel-border)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: 'var(--cream-text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="9:16">Vertical 9:16</option>
                <option value="1:1">Square 1:1</option>
                <option value="16:9">Landscape 16:9</option>
                <option value="4:5">Portrait 4:5</option>
              </select>

              <span
                onClick={() => setLayoutMode(layoutMode === 'ajustar' ? 'rellenar' : 'ajustar')}
                style={{ fontSize: '12px', color: 'var(--cream-text-secondary)', cursor: 'pointer' }}
              >
                Layout: <span style={{ textDecoration: 'underline' }}>{layoutMode === 'ajustar' ? 'Fit' : 'Fill'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--cream-text-secondary)' }}>Face tracking:</span>
              <button
                onClick={() => setFaceTrackingEnabled(!faceTrackingEnabled)}
                style={{
                  backgroundColor: faceTrackingEnabled ? '#ff1f1f' : 'var(--cream-surface)',
                  color: faceTrackingEnabled ? '#0a0a0a' : 'var(--cream-text-secondary)',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '3px 12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {faceTrackingEnabled ? 'ON' : 'DESON'}
              </button>
            </div>
          </div>

          {/* Preview box area */}
          <div className="editor-preview-stage">
            <div
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="editor-preview-box"
              style={{
                '--preview-ratio': aspectRatio === '9:16' ? '9 / 16' : aspectRatio === '16:9' ? '16 / 9' : aspectRatio === '1:1' ? '1 / 1' : '4 / 5'
              }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                loop
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: layoutMode === 'ajustar' ? 'contain' : 'cover',
                  transform: faceTrackingEnabled ? `scale(${faceTrackingZoom / 100}) translate(${-cropX.current * 0.05}px, ${-cropY.current * 0.05}px)` : 'none'
                }}
              />

              {/* Subtitles */}
              <canvas
                ref={subtitleCanvasRef}
                width={360}
                height={640}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              />

              {/* Face Tracker */}
              <canvas
                ref={faceCanvasRef}
                width={360}
                height={640}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 9
                }}
              />

              {/* Crop visual brackets */}
              <div style={{
                position: 'absolute',
                left: '12px',
                right: '12px',
                top: '24px',
                bottom: '24px',
                pointerEvents: 'none',
                zIndex: 8
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: '16px', height: '16px', borderLeft: '3px solid var(--cream-accent)', borderTop: '3px solid var(--cream-accent)' }} />
                <div style={{ position: 'absolute', right: 0, top: 0, width: '16px', height: '16px', borderRight: '3px solid var(--cream-accent)', borderTop: '3px solid var(--cream-accent)' }} />
                <div style={{ position: 'absolute', left: 0, bottom: 0, width: '16px', height: '16px', borderLeft: '3px solid var(--cream-accent)', borderBottom: '3px solid var(--cream-accent)' }} />
                <div style={{ position: 'absolute', right: 0, bottom: 0, width: '16px', height: '16px', borderRight: '3px solid var(--cream-accent)', borderBottom: '3px solid var(--cream-accent)' }} />
              </div>

              {/* Drag elements */}
              {textOverlays.map((t) => (
                <div
                  key={t.id}
                  onMouseDown={(e) => handleCanvasMouseDown(e, t)}
                  style={{
                    position: 'absolute',
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: t.color || '#ffffff',
                    fontSize: `${t.fontSize || 22}px`,
                    fontWeight: '800',
                    cursor: 'move',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: selectedTextId === t.id ? '2px solid var(--cream-accent)' : '1px dashed rgba(255,255,255,0.4)',
                    backgroundColor: 'rgba(10,10,10,0.6)',
                    zIndex: 15,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* PANEL DERECHO: HERRAMIENTAS (sidebar 40px + contenido 280px) */}
        <aside className={`editor-right-aside ${rightPanelOpen ? 'open' : 'closed'}`}>
          {/* Sidebar vertical de 40px */}
          <div className="editor-right-bar" style={{
            borderRight: rightPanelOpen ? '1px solid var(--cream-panel-border)' : 'none'
          }}>
            {[
              { id: 'presets', label: 'Styles', icon: <Palette size={18} strokeWidth={1.5} /> },
              { id: 'subtitles', label: 'Subtitles', icon: <Captions size={18} strokeWidth={1.5} /> },
              { id: 'ai', label: 'AI Tools', icon: <Wand2 size={18} strokeWidth={1.5} /> },
              { id: 'multimedia', label: 'Media', icon: <Layers size={18} strokeWidth={1.5} /> },
              { id: 'brand', label: 'Brand', icon: <Tag size={18} strokeWidth={1.5} /> },
              { id: 'broll', label: 'B-Roll', icon: <Film size={18} strokeWidth={1.5} /> },
              { id: 'transitions', label: 'Transitions', icon: <Shuffle size={18} strokeWidth={1.5} /> },
              { id: 'text', label: 'Text', icon: <AlignLeft size={18} strokeWidth={1.5} /> },
              { id: 'audio', label: 'Audio', icon: <Music size={18} strokeWidth={1.5} /> },
              { id: 'hook', label: 'Hook', icon: <Anchor size={18} strokeWidth={1.5} /> }
            ].map(tab => {
              const isActive = rightPanelOpen && activeRightTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveRightTab(tab.id)
                    setRightPanelOpen(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isActive ? 'var(--cream-accent)' : 'var(--cream-text-secondary)',
                    backgroundColor: isActive ? 'var(--cream-surface)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--cream-accent)' : 'none'
                  }}
                  title={tab.label}
                >
                  {tab.icon}
                </button>
              )
            })}
          </div>

          {/* Panel de Contenido */}
          {rightPanelOpen && (
            <div className="editor-right-content">
              
              {/* Estilos — incluye presets, tipografía y efectos */}
              {activeRightTab === 'presets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px', color: 'var(--cream-text-primary)' }}>
                      Viral Shorts Styles
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {SUBTITLE_PRESETS.map(preset => {
                        const isSelected = selectedPresetId === preset.id
                        return (
                          <div key={preset.id} onClick={() => applyPreset(preset)} style={{ backgroundColor: 'var(--cream-surface)', borderRadius: '8px', border: isSelected ? '2px solid var(--cream-accent)' : '1px solid var(--cream-panel-border)', padding: '10px', cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ height: '50px', backgroundColor: '#0a0a0a', borderRadius: '4px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--cream-accent)', fontWeight: '900' }}>
                              {preset.isNone ? 'Ø' : 'Abc'}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '700' }}>{preset.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--cream-panel-border)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px' }}>Typography</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Font</label>
                        <select value={subtitleStyle.fontFamily} onChange={(e) => setSubtitleStyle({ ...subtitleStyle, fontFamily: e.target.value })} style={{ width: '100%', backgroundColor: 'var(--cream-surface)', border: '1px solid var(--cream-panel-border)', borderRadius: '6px', padding: '6px', fontSize: '12px', color: 'var(--cream-text-primary)' }}>
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Size ({subtitleStyle.fontSize}px)</label>
                        <input type="range" min="12" max="60" value={subtitleStyle.fontSize} onChange={(e) => setSubtitleStyle({ ...subtitleStyle, fontSize: parseInt(e.target.value) })} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Text color</label>
                        <input type="color" value={subtitleStyle.color} onChange={(e) => setSubtitleStyle({ ...subtitleStyle, color: e.target.value })} style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Vertical position ({subtitleStyle.positionY}%)</label>
                        <input type="range" min="10" max="90" value={subtitleStyle.positionY} onChange={(e) => setSubtitleStyle({ ...subtitleStyle, positionY: parseInt(e.target.value) })} style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--cream-panel-border)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px' }}>Effects</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Stroke width ({subtitleStyle.strokeWidth}px)</label>
                        <input type="range" min="0" max="8" value={subtitleStyle.strokeWidth} onChange={(e) => setSubtitleStyle({ ...subtitleStyle, strokeWidth: parseInt(e.target.value), stroke: parseInt(e.target.value) > 0 })} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Outline color</label>
                        <input type="color" value={subtitleStyle.strokeColor} onChange={(e) => setSubtitleStyle({ ...subtitleStyle, strokeColor: e.target.value })} style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtítulos */}
              {activeRightTab === 'subtitles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Subtitle editor</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                    {activeTranscript.map(w => (
                      <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--cream-surface)', padding: '6px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>{w.startTime.toFixed(1)}s</span>
                        <input
                          type="text" value={w.word}
                          onChange={(e) => handleWordTextEdit(w.id, e.target.value)}
                          style={{ flex: 1, backgroundColor: 'var(--cream-bg)', border: 'none', color: 'var(--cream-text-primary)', fontSize: '12px', padding: '3px 6px', borderRadius: '4px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IA Tools */}
              {activeRightTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Enhance with AI</h3>
                  {[
                    { label: 'Enhance audio with AI', fn: () => { setAudioCleanActive(true); triggerToast('success', 'Audio filtered') } },
                    { label: 'Translate automatically', fn: () => handleLanguageChange('translated') },
                    { label: 'Detect viral moments', fn: () => triggerToast('success', '3 viral moments identified!') },
                    { label: 'Generate hook with AI', fn: () => triggerToast('success', 'Hook created') }
                  ].map((btn, idx) => (
                    <button
                      key={idx} onClick={btn.fn}
                      style={{ backgroundColor: 'var(--cream-surface)', color: 'var(--cream-text-primary)', border: '1px solid var(--cream-panel-border)', borderRadius: '8px', padding: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Multimedia */}
              {activeRightTab === 'multimedia' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Files</h3>
                  <div style={{ padding: '20px', border: '2.5px dashed var(--cream-panel-border)', borderRadius: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--cream-text-secondary)' }}>
                    Drop your media files here
                  </div>
                </div>
              )}

              {/* Marca */}
              {activeRightTab === 'brand' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Brand Template</h3>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Primary logo color</label>
                    <input
                      type="color" value={brandColorPrimary}
                      onChange={(e) => setBrandColorPrimary(e.target.value)}
                      style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              {/* B-Roll */}
              {activeRightTab === 'broll' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>B-Roll clips</h3>
                  <input
                    type="text" placeholder="Search Pexels..."
                    value={brollSearch} onChange={(e) => setBrollSearch(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'var(--cream-surface)', border: 'none', color: 'var(--cream-text-primary)', borderRadius: '6px', padding: '8px', fontSize: '12px', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {brollResults.map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setTimelineItems([...timelineItems, {
                            id: `broll-${Date.now()}`,
                            track: 'video',
                            start: currentTime,
                            duration: 5,
                            title: r.title,
                            color: '#166534',
                            type: 'broll'
                          }])
                          triggerToast('success', 'B-Roll added to timeline')
                        }}
                        style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--cream-surface)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <img src={r.url} alt="br" style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', alignSelf: 'center' }}>{r.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transiciones */}
              {activeRightTab === 'transitions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Transition effects</h3>
                  {['Smooth zoom', 'Dissolve', 'Slide'].map(t => (
                    <button
                      key={t} onClick={() => triggerToast('success', `Transition: ${t}`)}
                      style={{ backgroundColor: 'var(--cream-surface)', color: 'var(--cream-text-primary)', border: '1px solid var(--cream-panel-border)', padding: '10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Texto */}
              {activeRightTab === 'text' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>Text layers</h3>
                  <button
                    onClick={() => {
                      const txt = prompt('Text content:')
                      if (txt) {
                        setTextOverlays([...textOverlays, { id: `text-${Date.now()}`, text: txt, x: 50, y: 50, fontSize: 24 }])
                      }
                    }}
                    style={{ width: '100%', backgroundColor: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Text
                  </button>
                </div>
              )}

              {/* Audio */}
              {activeRightTab === 'audio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Sounds</h3>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--cream-text-secondary)' }}>Background volume ({musicVolume}%)</label>
                    <input
                      type="range" min="0" max="100"
                      value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Gancho */}
              {activeRightTab === 'hook' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Viral hooks</h3>
                  {VIRAL_HOOKS.map((hook, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--cream-surface)', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{hook.title}</div>
                      <button
                        onClick={() => {
                          setTextOverlays([...textOverlays, { id: `hook-${Date.now()}`, text: hook.text, x: 50, y: 30, fontSize: 24 }])
                          triggerToast('success', 'Hook inserted')
                        }}
                        style={{ backgroundColor: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Apply at start
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </aside>
      </div>

      {/* --- TIMELINE (fluid height, bg-zinc-950 border-t border-zinc-800) --- */}
      <footer
        className="editor-timeline"
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={handleTimelineMouseUp}
        style={{
          position: 'relative',
          userSelect: 'none'
        }}
      >
        {/* Toolbar */}
        <div style={{
          height: '36px',
          backgroundColor: 'var(--cream-panel)',
          borderBottom: '1px solid var(--cream-panel-border)',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleSplitClip} style={{ background: 'var(--cream-surface)', color: 'var(--cream-text-primary)', border: '1px solid var(--cream-panel-border)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Scissors size={14} strokeWidth={1.5} />
              Split
            </button>
            <button onClick={handleDeleteSelectedTimelineItem} style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trash2 size={14} strokeWidth={1.5} />
              Delete
            </button>
          </div>

          {/* Playback */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => seekTo(currentTime - 2)} style={{ background: 'none', border: 'none', color: 'var(--cream-text-primary)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <SkipBack size={14} strokeWidth={1.5} />
            </button>
            <button onClick={togglePlay} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPlaying ? <Pause size={16} strokeWidth={1.5} fill="currentColor" /> : <Play size={16} strokeWidth={1.5} fill="currentColor" />}
            </button>
            <button onClick={() => seekTo(currentTime + 2)} style={{ background: 'none', border: 'none', color: 'var(--cream-text-primary)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <SkipForward size={14} strokeWidth={1.5} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--cream-text-primary)', fontFamily: 'monospace', background: 'var(--cream-surface)', padding: '2px 8px', borderRadius: '4px' }}>
              {new Date(currentTime * 1000).toISOString().substr(14, 5)}
              <span style={{ color: 'var(--cream-text-secondary)', fontWeight: '400' }}>
                {' / '}{new Date(duration * 1000).toISOString().substr(14, 5)}
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ZoomIn size={14} strokeWidth={1.5} style={{ color: 'var(--cream-text-secondary)' }} />
            <input type="range" min="10" max="100" value={timelineZoom} onChange={(e) => setTimelineZoom(parseInt(e.target.value))} style={{ width: '80px' }} />
          </div>
        </div>

        {/* Tracks */}
        <div className="timeline-scroll" style={{ flex: 1, overflowY: 'hidden', overflowX: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(currentTime / duration) * 85 + 10}%`, width: '2px', backgroundColor: 'var(--cream-playhead)', pointerEvents: 'none', zIndex: 100 }}>
            <div style={{ position: 'absolute', top: 0, left: '-4px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid var(--cream-playhead)' }} />
          </div>

          {['video', 'text', 'audio'].map(track => (
            <div key={track} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--cream-text-secondary)', width: '50px', textTransform: 'uppercase', textAlign: 'right' }}>{track === 'video' ? 'Video' : track === 'text' ? 'Text' : 'Audio'}</span>
              <div style={{ flex: 1, height: '36px', backgroundColor: 'var(--cream-panel)', border: '1px solid var(--cream-panel-border)', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                {timelineItems.filter(x => x.track === track).length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--cream-placeholder)' }}>
                    {track === 'video' ? 'Drag a video here' : track === 'text' ? 'Add text from the panel' : 'Add music from Audio'}
                  </div>
                )}
                {timelineItems.filter(x => x.track === track).map((item) => {
                  const isSel = selectedTimelineItemId === item.id
                  const startPct = (item.start / duration) * 100
                  const widthPct = (item.duration / duration) * 100
                  return (
                    <div key={item.id} onMouseDown={(e) => handleTimelineMouseDown(e, item, 'move')} style={{ position: 'absolute', left: `${startPct}%`, width: `${widthPct}%`, height: '100%', backgroundColor: item.color, borderRadius: '6px', border: isSel ? '2px solid var(--cream-accent)' : '1px solid var(--cream-panel-border)', cursor: 'grab', display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: '11px', fontWeight: '700', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#ffffff' }}>
                      <div onMouseDown={(e) => handleTimelineMouseDown(e, item, 'resize-left')} style={{ position: 'absolute', left: 0, top: 2, bottom: 2, width: '4px', backgroundColor: 'var(--cream-accent)', borderRadius: '2px', cursor: 'w-resize', opacity: 0.7 }} />
                      <span style={{ marginLeft: '4px' }}>{item.title}</span>
                      <div onMouseDown={(e) => handleTimelineMouseDown(e, item, 'resize-right')} style={{ position: 'absolute', right: 0, top: 2, bottom: 2, width: '4px', backgroundColor: 'var(--cream-accent)', borderRadius: '2px', cursor: 'e-resize', opacity: 0.7 }} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </footer>

      {/* --- TRANSLATION MODAL PROGRESS --- */}
      {translatingState && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10,10,10,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '4px solid color-mix(in srgb, var(--cream-accent) 20%, transparent)',
            borderTop: '4px solid var(--cream-accent)',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Syncing AI Voice Dubbing</h3>
          <p style={{ fontSize: '13px', color: 'var(--cream-text-secondary)' }}>Translating transcript: {translatingProgress}%</p>
        </div>
      )}

      {/* --- SRT IMPORT MODAL --- */}
      {showSrtModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--cream-panel)',
            border: '1px solid var(--cream-panel-border)',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '90vw',
            padding: '28px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '8px', color: 'var(--cream-text-primary)' }}>Import SRT file</h3>
            <p style={{ fontSize: '12px', color: 'var(--cream-text-secondary)', marginBottom: '14px' }}>Paste the SRT file content to load the words and timings.</p>
            <textarea
              value={srtInputText}
              onChange={(e) => setSrtInputText(e.target.value)}
              placeholder={`1\n00:00:01,000 --> 00:00:04,500\nHello everyone today we are going to see...`}
              style={{
                width: '100%',
                height: '180px',
                backgroundColor: 'var(--cream-bg)',
                border: '1px solid var(--cream-panel-border)',
                borderRadius: '8px',
                padding: '8px 10px 8px 32px',
                fontSize: '12px',
                color: 'var(--cream-text-primary)',
                outline: 'none',
                fontFamily: 'monospace',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowSrtModal(false)} style={{ flex: 1, backgroundColor: 'var(--cream-surface)', border: '1px solid var(--cream-panel-border)', color: 'var(--cream-text-primary)', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleImportSrt} style={{ flex: 1, backgroundColor: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '850', cursor: 'pointer', fontSize: '12px' }}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--cream-panel)',
            border: '1px solid var(--cream-panel-border)',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '90vw',
            padding: '32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontWeight: '900', fontSize: '20px', color: 'var(--cream-text-primary)', marginBottom: '4px' }}>Export clip</h3>
            <p style={{ fontSize: '14px', color: 'var(--cream-text-secondary)', marginBottom: '24px' }}>Choose format and quality.</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--cream-text-secondary)', display: 'block', marginBottom: '6px' }}>Quality</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['720p', '1080p', '4K'].map(res => (
                  <button
                    key={res} onClick={() => setExportResolution(res)}
                    style={{
                      padding: '8px',
                      backgroundColor: exportResolution === res ? 'var(--cream-accent)' : 'var(--cream-surface)',
                      color: exportResolution === res ? 'var(--cream-accent-btn-color)' : 'var(--cream-text-primary)',
                      border: '1px solid var(--cream-panel-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => setShowExportModal(false)} style={{ flex: 1, backgroundColor: 'var(--cream-surface)', border: '1px solid var(--cream-panel-border)', color: 'var(--cream-text-secondary)', borderRadius: '12px', padding: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={triggerExport} style={{ flex: 1, backgroundColor: 'var(--cream-accent)', color: 'var(--cream-accent-btn-color)', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: '900', cursor: 'pointer' }}>Export</button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOAST --- */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? 'var(--cream-accent)' : '#ef4444',
          color: 'var(--cream-accent-btn-color)',
          padding: '12px 24px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 500,
          fontSize: '13px',
          fontWeight: '800'
        }}>
          {toast.text}
        </div>
      )}
    </div>

    {/* --- MOBILE FALLBACK --- */}
    <div className="editor-mobile-message">
      <Monitor size={48} strokeWidth={1.5} color="var(--cream-accent)" />
      <h2>Desktop-optimized editor</h2>
      <p>PeakClip works best on large screens. Open it on a computer to edit, sync subtitles, and export clips without limits.</p>
      <button
        className="editor-mobile-btn"
        onClick={() => router.push('/dashboard')}
      >
        Back to dashboard
      </button>
    </div>
    </>
  )

  return <ErrorBoundary>{editorContent}</ErrorBoundary>
}
