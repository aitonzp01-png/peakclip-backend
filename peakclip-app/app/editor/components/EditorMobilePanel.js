'use client'
import { brand, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import { subtitleStyles, musicTracks } from '../../../lib/utils'
import icons from '../../../lib/icons'
import useEditorStore from '../store/editorStore'
import AIPanel from './AIPanel'

export default function EditorMobilePanel({ videoRef, activeTool, onDone }) {
  return (
    <div className="editor-mobile-edit-panel">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: `1px solid ${borderSoft}`,
        flexShrink: 0, minHeight: '40px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: textPrimary, fontFamily: fonts.body }}>
          {activeTool === 'cursor' ? 'Trim' : activeTool === 'text' ? 'Text' : activeTool === 'subtitles' ? 'Captions' : activeTool === 'music' ? 'Audio' : 'AI Studio'}
        </span>
        <button onClick={onDone}
          style={{
            padding: '6px 16px', borderRadius: '8px', border: 'none',
            background: brand, color: '#000', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600', fontFamily: fonts.body,
          }}>
          Done
        </button>
      </div>
      <div style={{
        flex: 1, overflow: 'auto', padding: '10px 12px',
      }}>
        {activeTool === 'cursor' && <TrimPanel videoRef={videoRef} />}
        {(activeTool === 'text' || activeTool === 'subtitles') && <TextPanel />}
        {activeTool === 'music' && <AudioPanel />}
        {activeTool === 'ai' && <AIPanel />}
      </div>
    </div>
  )
}

function TrimPanel({ videoRef }) {
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const setTrimStart = useEditorStore(s => s.setTrimStart)
  const setTrimEnd = useEditorStore(s => s.setTrimEnd)
  const playbackSpeed = useEditorStore(s => s.playbackSpeed)
  const setPlaybackSpeed = useEditorStore(s => s.setPlaybackSpeed)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', color: textDim, marginBottom: '4px' }}>Start</div>
          <input type="range" min="0" max={trimEnd - 5} value={trimStart}
            onChange={e => setTrimStart(Number(e.target.value))}
            className="editor-slider" />
        </div>
        <span style={{ fontSize: '10px', color: brand, fontFamily: fonts.mono, minWidth: '32px', textAlign: 'right' }}>{Math.round(trimStart)}%</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', color: textDim, marginBottom: '4px' }}>End</div>
          <input type="range" min={trimStart + 5} max="100" value={trimEnd}
            onChange={e => setTrimEnd(Number(e.target.value))}
            className="editor-slider" />
        </div>
        <span style={{ fontSize: '10px', color: brand, fontFamily: fonts.mono, minWidth: '32px', textAlign: 'right' }}>{Math.round(trimEnd)}%</span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[
          { label: '15s', start: 0, end: 33 },
          { label: '30s', start: 0, end: 67 },
          { label: '60s', start: 0, end: 100 },
        ].map(p => (
          <button key={p.label} onClick={() => { setTrimStart(p.start); setTrimEnd(p.end) }}
            style={{
              flex: 1, background: bgSecondary, border: `1px solid ${borderSoft}`,
              borderRadius: '6px', padding: '6px', cursor: 'pointer',
              color: textPrimary, fontSize: '10px', fontFamily: fonts.body,
            }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', color: textDim, marginBottom: '4px' }}>Speed</div>
          <input type="range" min="0.25" max="4" step="0.25" value={playbackSpeed}
            onChange={e => {
              const s = Number(e.target.value)
              setPlaybackSpeed(s)
              if (videoRef?.current) videoRef.current.playbackRate = s
            }}
            className="editor-slider" />
        </div>
        <span style={{ fontSize: '11px', color: brand, fontFamily: fonts.mono, fontWeight: '700', minWidth: '32px', textAlign: 'right' }}>{playbackSpeed}x</span>
      </div>
    </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input type="text" placeholder="Enter text..."
        value={subtitleText}
        onChange={e => setSubtitleText(e.target.value)}
        className="editor-input" />
      <div>
        <div style={{ fontSize: '9px', color: textDim, marginBottom: '6px' }}>Style</div>
        <div style={{ display: 'flex', gap: '4px', overflow: 'auto' }}>
          {subtitleStyles.map(s => (
            <button key={s.id} onClick={() => setSubtitleStyle(s.id)}
              style={{
                flexShrink: 0, background: bgSecondary,
                border: `1px solid ${subtitleStyle === s.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '8px 10px', cursor: 'pointer',
                textAlign: 'center', color: textPrimary,
              }}>
              <div style={{ ...s.preview, fontSize: '12px', marginBottom: '2px' }}>Aa</div>
              <div style={{ fontSize: '8px', color: subtitleStyle === s.id ? brand : textDim, whiteSpace: 'nowrap' }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>
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
              borderRadius: '6px', padding: '8px', cursor: 'pointer',
              textAlign: 'center', color: subtitlePosition === p.id ? brand : textSecondary,
              fontSize: '10px',
            }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', color: textDim, marginBottom: '4px' }}>Size</div>
          <input type="range" min="10" max="32" value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            className="editor-slider" />
        </div>
        <span style={{ fontSize: '10px', color: brand, fontFamily: fonts.mono, minWidth: '24px', textAlign: 'right' }}>{fontSize}</span>
      </div>
    </div>
  )
}

function AudioPanel() {
  const music = useEditorStore(s => s.music)
  const setMusic = useEditorStore(s => s.setMusic)
  const musicVolume = useEditorStore(s => s.musicVolume)
  const setMusicVolume = useEditorStore(s => s.setMusicVolume)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '4px', overflow: 'auto' }}>
        {musicTracks.map(t => (
          <button key={t.id} onClick={() => setMusic(t.id)}
            style={{
              flexShrink: 0, background: bgSecondary,
              border: `1px solid ${music === t.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
              color: music === t.id ? brand : textSecondary, fontSize: '11px',
              fontFamily: fonts.body, whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      {music !== 'none' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: textDim, marginBottom: '4px' }}>Volume</div>
            <input type="range" min="0" max="100" value={musicVolume}
              onChange={e => setMusicVolume(Number(e.target.value))}
              className="editor-slider" />
          </div>
          <span style={{ fontSize: '10px', color: brand, fontFamily: fonts.mono, minWidth: '24px', textAlign: 'right' }}>{musicVolume}%</span>
        </div>
      )}
    </div>
  )
}
