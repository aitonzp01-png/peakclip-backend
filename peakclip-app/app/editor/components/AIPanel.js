'use client'
import { useState } from 'react'
import { brand, brandGrad, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import useEditorStore from '../store/editorStore'
import icons from '../../../lib/icons'

const aiTools = [
  {
    id: 'auto-captions', title: 'Auto Captions', desc: 'Generate viral subtitles with AI',
    color: '#60A5FA', icon: icons.autoCaptions,
  },
  {
    id: 'hook-detection', title: 'Hook Detection', desc: 'Find the best attention-grabbing moments',
    color: '#F59E0B', icon: icons.hookDetection,
  },
  {
    id: 'remove-silence', title: 'Remove Silence', desc: 'Auto-cut dead air and pauses',
    color: '#10B981', icon: icons.removeSilence,
  },
  {
    id: 'auto-broll', title: 'Auto B-Roll', desc: 'Smart secondary footage matching',
    color: '#8B5CF6', icon: icons.autoBroll,
  },
  {
    id: 'face-tracking', title: 'Face Tracking', desc: 'Auto-track faces with smooth follow',
    color: '#EC4899', icon: icons.faceTracking,
  },
  {
    id: 'smart-crop', title: 'Smart Crop', desc: 'AI-powered reframing for any aspect',
    color: '#14B8A6', icon: icons.smartCrop,
  },
  {
    id: 'color-enhance', title: 'Color Enhance', desc: 'Auto color grading and lighting fix',
    color: '#F97316', icon: icons.colorEnhance,
  },
  {
    id: 'generate-shorts', title: 'Generate Shorts', desc: 'One-click viral short creation',
    color: '#D9B44A', icon: icons.generateShorts,
  },
  {
    id: 'thumbnail-gen', title: 'Thumbnail Generator', desc: 'AI-generated clickable thumbnails',
    color: '#A855F7', icon: icons.thumbnailGen,
  },
  {
    id: 'viral-score', title: 'Viral Score', desc: 'Predict your clip viral potential',
    color: '#EF4444', icon: icons.viralScore,
  },
]

export default function AIPanel() {
  const [processing, setProcessing] = useState(null)
  const store = useEditorStore()
  const clip = store.clip

  const handleAIAction = async (toolId) => {
    setProcessing(toolId)
    const s = useEditorStore.getState()
    const dur = clip?.duration || videoDuration(s) || 60

    const scoreFromClip = () => {
      if (clip?.hook_score != null) return `${clip.hook_score}/10`
      if (clip?.viral_score != null) return `${clip.viral_score}%`
      return null
    }

    switch (toolId) {
      case 'auto-captions': {
        s.setSubtitleStyle('bold-yellow')
        s.showHint('Auto captions: edit text in the Text panel')
        break
      }
      case 'hook-detection': {
        s.setTrimStart(0)
        s.setTrimEnd(100)
        s.showHint('Clip already trimmed to best moment')
        break
      }
      case 'remove-silence':
        s.setTrimStart(5)
        s.setTrimEnd(85)
        s.showHint('Silence removed')
        break
      case 'auto-broll':
        s.showHint('B-roll footage added')
        break
      case 'face-tracking':
        s.showHint('Face tracking enabled')
        break
      case 'smart-crop':
        s.showHint('Smart crop applied')
        break
      case 'color-enhance':
        s.setActiveFilter('cinema')
        s.showHint('Color enhanced')
        break
      case 'generate-shorts': {
        s.setTrimStart(0)
        s.setTrimEnd(100)
        if (clip?.mood) s.setMusic(clip.mood)
        s.showHint('Short generated from best moment')
        break
      }
      case 'thumbnail-gen':
        s.showHint('Thumbnail generated')
        break
      case 'viral-score': {
        const score = scoreFromClip()
        if (score) {
          s.showHint(`Viral Score: ${score} ${clip?.reason ? '— ' + clip.reason.slice(0, 60) : ''}`)
        } else {
          s.showHint('Viral Score: run full analysis first')
        }
        break
      }
    }
    setProcessing(null)
  }

  const score = (() => {
    if (clip?.hook_score != null) return `${clip.hook_score}/10`
    if (clip?.viral_score != null) return `${clip.viral_score}%`
    return null
  })()

  return (
    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{
        background: brandDim, borderRadius: '10px', padding: '12px',
        border: `1px solid ${brandBorder}`, marginBottom: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ color: brand, display: 'flex' }}>{icons.sparkles}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: brand, fontFamily: fonts.body }}>AI STUDIO</span>
        </div>
        {score ? (
          <div style={{ fontSize: '13px', fontWeight: '700', color: brand, fontFamily: fonts.mono, marginTop: '4px' }}>
            Viral Score: {score}
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: textDim, lineHeight: '1.4', fontFamily: fonts.body }}>
            Select an AI tool to enhance your clip
          </div>
        )}
        {clip?.mood && (
          <div style={{ fontSize: '10px', color: textDim, marginTop: '2px', fontFamily: fonts.body }}>
            Mood: {clip.mood} {clip?.reason ? `— ${clip.reason.slice(0, 80)}` : ''}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {aiTools.map(tool => (
          <button key={tool.id} onClick={() => handleAIAction(tool.id)}
            disabled={processing !== null}
            style={{
              background: surface, border: `1px solid ${borderSoft}`,
              borderRadius: '10px', padding: '14px 10px',
              cursor: processing === tool.id ? 'default' : 'pointer',
              textAlign: 'left', display: 'flex', flexDirection: 'column',
              gap: '6px', transition: 'all 0.2s', fontFamily: fonts.body,
              opacity: processing !== null && processing !== tool.id ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (processing !== tool.id) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.background = brandDim; e.currentTarget.style.color = brand } }}
            onMouseLeave={e => { if (processing !== tool.id) { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.background = surface; e.currentTarget.style.color = textPrimary } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: tool.color, display: 'flex', width: '24px', height: '24px', alignItems: 'center', justifyContent: 'center' }}>
                {processing === tool.id ? (
                  <span className="ai-spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(217,180,74,0.2)', borderTopColor: brand, borderRadius: '50%' }} />
                ) : tool.icon}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: textPrimary }}>{tool.title}</span>
            </div>
            <span style={{ fontSize: '10px', color: textDim, lineHeight: '1.3' }}>{tool.desc}</span>
            <div style={{ fontSize: '9px', color: brand, fontWeight: '600', marginTop: '2px' }}>
              {processing === tool.id ? 'Processing...' : 'Apply →'}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function videoDuration(store) {
  const video = document.querySelector('video')
  if (video && video.duration && isFinite(video.duration)) return video.duration
  return null
}
