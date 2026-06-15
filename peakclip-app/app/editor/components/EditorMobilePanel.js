'use client'
import { brand, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import { subtitleStyles, musicTracks } from '../../../lib/utils'
import icons from '../../../lib/icons'
import useEditorStore from '../store/editorStore'
import AIPanel from './AIPanel'

export default function EditorMobilePanel({ videoRef, open, onClose }) {
  if (!open) return null

  return (
    <>
      <div className="mobile-panel-backdrop" onClick={onClose} />
      <div className="mobile-panel">
        <MobilePanelHeader onClose={onClose} />
        <div className="mobile-panel-body">
          <MobilePanelContent videoRef={videoRef} />
        </div>
      </div>
    </>
  )
}

function MobilePanelHeader({ onClose }) {
  const activeTool = useEditorStore(s => s.activeTool)
  const labels = { cursor: 'Trim', text: 'Text', subtitles: 'Captions', music: 'Audio', ai: 'AI Studio' }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: `1px solid ${borderSoft}`,
      flexShrink: 0, minHeight: '48px',
    }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: textPrimary, fontFamily: fonts.body }}>
        {labels[activeTool] || 'Edit'}
      </span>
      <button onClick={onClose}
        style={{
          width: '32px', height: '32px', borderRadius: '8px',
          border: 'none', background: bgSecondary, color: textDim,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icons.close}
      </button>
    </div>
  )
}

function MobilePanelContent({ videoRef }) {
  const activeTool = useEditorStore(s => s.activeTool)

  switch (activeTool) {
    case 'cursor': return <TrimPanel videoRef={videoRef} />
    case 'text':
    case 'subtitles': return <TextPanel />
    case 'music': return <AudioPanel />
    case 'ai': return <AIPanel />
    default: return null
  }
}

function TrimPanel({ videoRef }) {
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const setTrimStart = useEditorStore(s => s.setTrimStart)
  const setTrimEnd = useEditorStore(s => s.setTrimEnd)
  const playbackSpeed = useEditorStore(s => s.playbackSpeed)
  const setPlaybackSpeed = useEditorStore(s => s.setPlaybackSpeed)

  return (
    <>
      <Section label="Trim">
        <SliderRow label="Start" value={`${Math.round(trimStart)}%`}>
          <input type="range" min="0" max={trimEnd - 5} value={trimStart}
            onChange={e => setTrimStart(Number(e.target.value))}
            className="editor-slider" />
        </SliderRow>
        <SliderRow label="End" value={`${Math.round(trimEnd)}%`}>
          <input type="range" min={trimStart + 5} max="100" value={trimEnd}
            onChange={e => setTrimEnd(Number(e.target.value))}
            className="editor-slider" />
        </SliderRow>
        <div style={{
          background: bgSecondary, borderRadius: '8px', padding: '10px',
          fontSize: '11px', color: textDim, textAlign: 'center',
        }}>
          Duration: <span style={{ color: brand, fontWeight: '700' }}>{Math.round((trimEnd - trimStart) * 0.45)}s</span>
        </div>
      </Section>
      <Section label="Quick Presets">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {[
            { label: '15s', start: 0, end: 33 },
            { label: '30s', start: 0, end: 67 },
            { label: '60s', start: 0, end: 100 },
          ].map(p => (
            <button key={p.label} onClick={() => { setTrimStart(p.start); setTrimEnd(p.end) }}
              style={{
                background: bgSecondary, border: `1px solid ${borderSoft}`,
                borderRadius: '6px', padding: '10px', cursor: 'pointer',
                color: textPrimary, fontSize: '11px', fontFamily: fonts.body,
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </Section>
      <Section label="Speed">
        <div style={{
          fontSize: '24px', fontWeight: '700', color: brand,
          fontFamily: fonts.mono, textAlign: 'center', padding: '8px',
          background: bgSecondary, borderRadius: '8px', marginBottom: '8px',
        }}>{playbackSpeed}x</div>
        <input type="range" min="0.25" max="4" step="0.25" value={playbackSpeed}
          onChange={e => {
            const s = Number(e.target.value)
            setPlaybackSpeed(s)
            if (videoRef?.current) videoRef.current.playbackRate = s
          }}
          className="editor-slider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: textDim, marginTop: '2px' }}>
          <span>0.25x</span>
          <span>4x</span>
        </div>
      </Section>
    </>
  )
}

function TextPanel() {
  const subtitleText = useEditorStore(s => s.subtitleText)
  const setSubtitleText = useEditorStore(s => s.setSubtitleText)
  const subtitleStyle = useEditorStore(s => s.subtitleStyle)
  const setSubtitleStyle = useEditorStore(s => s.setSubtitleStyle)
  const subtitlePosition = useEditorStore(s => s.subtitlePosition)
  const setSubtitlePosition = useEditorStore(s => s.setSubtitlePosition)
  const fontSize = useEditorStore(s => s.fontSize)
  const setFontSize = useEditorStore(s => s.setFontSize)

  return (
    <>
      <Section label="Text">
        <input type="text" placeholder="Enter text..."
          value={subtitleText}
          onChange={e => setSubtitleText(e.target.value)}
          className="editor-input" />
      </Section>
      <Section label="Style">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {subtitleStyles.map(s => (
            <button key={s.id} onClick={() => setSubtitleStyle(s.id)}
              style={{
                background: bgSecondary, border: `1px solid ${subtitleStyle === s.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                textAlign: 'center', color: textPrimary,
              }}>
              <div style={{ ...s.preview, fontSize: '14px', marginBottom: '4px' }}>Aa</div>
              <div style={{ fontSize: '9px', color: subtitleStyle === s.id ? brand : textDim }}>{s.label}</div>
            </button>
          ))}
        </div>
      </Section>
      <Section label="Position">
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'top', label: 'Top' },
            { id: 'middle', label: 'Mid' },
            { id: 'bottom', label: 'Bot' },
          ].map(p => (
            <button key={p.id} onClick={() => setSubtitlePosition(p.id)}
              style={{
                flex: 1, background: bgSecondary,
                border: `1px solid ${subtitlePosition === p.id ? brand : borderSoft}`,
                borderRadius: '6px', padding: '10px', cursor: 'pointer',
                textAlign: 'center', color: subtitlePosition === p.id ? brand : textSecondary,
                fontSize: '11px',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </Section>
      <Section label="Font Size">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: textDim }}>
          <span>Small</span>
          <span>{fontSize}px</span>
          <span>Large</span>
        </div>
        <input type="range" min="10" max="32" value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          className="editor-slider" />
      </Section>
    </>
  )
}

function AudioPanel() {
  const music = useEditorStore(s => s.music)
  const setMusic = useEditorStore(s => s.setMusic)
  const musicVolume = useEditorStore(s => s.musicVolume)
  const setMusicVolume = useEditorStore(s => s.setMusicVolume)

  return (
    <Section label="Music">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {musicTracks.map(t => (
          <button key={t.id} onClick={() => setMusic(t.id)}
            style={{
              background: bgSecondary, border: `1px solid ${music === t.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '12px 14px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: music === t.id ? brand : textSecondary, fontSize: '12px',
              fontFamily: fonts.body,
            }}>
            <span>{t.label}</span>
            {music === t.id && <span style={{ color: brand, display: 'flex' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
            </span>}
          </button>
        ))}
      </div>
      {music !== 'none' && (
        <div style={{ marginTop: '14px' }}>
          <SliderRow label="Volume" value={`${musicVolume}%`}>
            <input type="range" min="0" max="100" value={musicVolume}
              onChange={e => setMusicVolume(Number(e.target.value))}
              className="editor-slider" />
          </SliderRow>
        </div>
      )}
    </Section>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '9px', color: textDim, textTransform: 'uppercase',
        letterSpacing: '1.5px', marginBottom: '8px', fontFamily: fonts.mono,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function SliderRow({ label, value, children }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '4px',
      }}>
        <span style={{ fontSize: '10px', color: textDim }}>{label}</span>
        <span style={{ fontSize: '10px', color: brand, fontFamily: fonts.mono, fontWeight: '600' }}>{value}</span>
      </div>
      {children}
    </div>
  )
}
