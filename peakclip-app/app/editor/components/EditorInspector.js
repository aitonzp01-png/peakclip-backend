'use client'
import { useState } from 'react'
import { brand, brandDim, brandBorder, brandGlow, bgSecondary, surface, textPrimary, textSecondary, textDim, borderSoft, borderStrong, fonts } from '../../../lib/tokens'
import { subtitleStyles, musicTracks, filters, transitions } from '../../../lib/utils'
import { generateSRT } from '../../../lib/subtitles'
import { saveSubtitles, burnSubtitles } from '../../../lib/api'
import icons from '../../../lib/icons'
import useEditorStore from '../store/editorStore'
import AIPanel from './AIPanel'

const tabs = [
  { id: 'edit', label: 'Edit', icon: 'pencil' },
  { id: 'animation', label: 'Animate', icon: 'loading' },
  { id: 'audio', label: 'Audio', icon: 'musicNote' },
  { id: 'ai', label: 'AI', icon: 'brain' },
]

export default function EditorInspector({ videoRef }) {
  const {
    activeTool, activeInspectorTab, setActiveInspectorTab,
    trimStart, trimEnd, setTrimStart, setTrimEnd,
    clip, subtitles, selectedSubtitleId, setSelectedSubtitleId,
    updateSubtitle, addSubtitle, deleteSubtitle, setSubtitleText,
    subtitleStyle, setSubtitleStyle,
    subtitlePosition, setSubtitlePosition, fontSize, setFontSize,
    watermark, setWatermark, watermarkPosition, setWatermarkPosition,
    music, setMusic, musicVolume, setMusicVolume,
    activeFilter, setActiveFilter, selectedTransition, setSelectedTransition,
    playbackSpeed, setPlaybackSpeed, tracks, duration,
  } = useEditorStore()

  const clipDurationSecs = () => {
    const dur = duration || 60
    return Math.round(((trimEnd - trimStart) / 100) * dur)
  }

  const renderEditPanel = () => {
    switch (activeTool) {
      case 'cursor': return renderTrimPanel()
      case 'text': case 'subtitles': return renderTextPanel()
      case 'media': return renderMediaPanel()
      case 'transitions': return renderTransitionsPanel()
      case 'effects': return renderFiltersPanel()
      case 'music': case 'audio': return renderAudioPanel()
      case 'overlays': return renderOverlayPanel()
      default: return renderAIPanel()
    }
  }

  const renderAIPanel = () => <AIPanel videoRef={videoRef} />

  const renderTrimPanel = () => (
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
          Duration: <span style={{ color: brand, fontWeight: '700' }}>{clipDurationSecs()}s</span>
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
                borderRadius: '6px', padding: '8px', cursor: 'pointer',
                color: textPrimary, fontSize: '11px', fontFamily: fonts.body,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.color = brand }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft; e.currentTarget.style.color = textPrimary }}>
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

  const [saveState, setSaveState] = useState('idle')
  const [burnState, setBurnState] = useState('idle')

  const selectedSub = subtitles.find(s => s.id === selectedSubtitleId) || subtitles[0] || null
  const subText = selectedSub?.text || ''

  const handleSaveSubtitles = async () => {
    if (!clip?.id) return
    setSaveState('saving')
    try {
      const srt = generateSRT(subtitles)
      const res = await saveSubtitles(clip.id, srt)
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      useEditorStore.setState(state => ({ clip: { ...state.clip, ...data } }))
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (e) {
      console.error(e)
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2000)
    }
  }

  const handleBurnSubtitles = async () => {
    if (!clip?.video_url || !clip?.srt_url) return
    setBurnState('burning')
    try {
      const style = {
        clip_id: clip.id,
        video_url: clip.video_url,
        srt_url: clip.srt_url,
        font_size: fontSize,
        font_color: 'white',
        background: true,
        background_opacity: 0.6,
        position: subtitlePosition,
        bold: true,
        outline: 2,
        font_name: 'DejaVu Sans',
      }
      const res = await burnSubtitles(style)
      if (!res.ok) throw new Error('Burn failed')
      const data = await res.json()
      if (data.video_url) {
        useEditorStore.setState(state => ({ clip: { ...state.clip, video_url: data.video_url } }))
      }
      setBurnState('done')
      setTimeout(() => setBurnState('idle'), 2000)
    } catch (e) {
      console.error(e)
      setBurnState('error')
      setTimeout(() => setBurnState('idle'), 2000)
    }
  }

  const renderTextPanel = () => (
    <>
      <Section label="Selected Caption">
        <textarea placeholder="Enter caption text..."
          value={subText}
          onChange={e => selectedSub && setSubtitleText(e.target.value)}
          disabled={!selectedSub}
          className="editor-input"
          style={{ minHeight: '60px', resize: 'vertical' }} />
      </Section>

      <Section label="Captions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflow: 'auto' }}>
          {subtitles.length === 0 && (
            <div style={{ fontSize: '11px', color: textDim, textAlign: 'center', padding: '12px' }}>
              No captions yet
            </div>
          )}
          {subtitles.map((s, idx) => (
            <div key={s.id}
              onClick={() => setSelectedSubtitleId(s.id)}
              style={{
                background: selectedSubtitleId === s.id ? brandDim : bgSecondary,
                border: `1px solid ${selectedSubtitleId === s.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '8px 10px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: selectedSubtitleId === s.id ? brand : textDim, fontFamily: fonts.mono }}>
                  #{idx + 1}
                </span>
                <button onClick={(e) => { e.stopPropagation(); deleteSubtitle(s.id) }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}>
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '12px', color: textPrimary, lineHeight: '1.3' }}>
                {s.text || <span style={{ color: textDim, fontStyle: 'italic' }}>Empty caption</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <TimeInput value={s.start} onChange={v => updateSubtitle(s.id, { start: v })} />
                <TimeInput value={s.end} onChange={v => updateSubtitle(s.id, { end: v })} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => {
          const dur = duration || 5
          const start = subtitles.length ? subtitles[subtitles.length - 1].end : 0
          const end = Math.min(dur, start + 3)
          addSubtitle(start, end)
        }}
          style={{
            width: '100%', marginTop: '10px', padding: '8px',
            background: bgSecondary, border: `1px dashed ${borderSoft}`,
            borderRadius: '6px', color: textDim, cursor: 'pointer', fontSize: '11px',
          }}>
          + Add Caption
        </button>
      </Section>

      <Section label="Style">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {subtitleStyles.map(s => (
            <button key={s.id} onClick={() => setSubtitleStyle(s.id)}
              className={`editor-option${subtitleStyle === s.id ? ' active' : ''}`}
              style={{
                background: bgSecondary, border: `1px solid ${subtitleStyle === s.id ? brand : borderSoft}`,
                borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.15s', color: textPrimary,
              }}
              onMouseEnter={e => { if (subtitleStyle !== s.id) e.currentTarget.style.borderColor = brandDim }}
              onMouseLeave={e => { if (subtitleStyle !== s.id) e.currentTarget.style.borderColor = borderSoft }}>
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
                borderRadius: '6px', padding: '8px', cursor: 'pointer',
                textAlign: 'center', color: subtitlePosition === p.id ? brand : textSecondary,
                fontSize: '11px', transition: 'all 0.15s',
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

      <Section label="Actions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={handleSaveSubtitles} disabled={saveState === 'saving'}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
              background: brand, color: '#000', fontWeight: '700', cursor: saveState === 'saving' ? 'wait' : 'pointer',
              fontSize: '12px',
            }}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : saveState === 'error' ? 'Error' : 'Save Captions'}
          </button>
          <button onClick={handleBurnSubtitles} disabled={burnState === 'burning'}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${brand}`,
              background: 'transparent', color: brand, fontWeight: '600', cursor: burnState === 'burning' ? 'wait' : 'pointer',
              fontSize: '12px',
            }}>
            {burnState === 'burning' ? 'Burning…' : burnState === 'done' ? 'Re-burned!' : burnState === 'error' ? 'Error' : 'Re-burn Subtitles'}
          </button>
        </div>
      </Section>
    </>
  )

  const renderMediaPanel = () => (
    <div style={{ padding: '12px 0' }}>
      <div style={{
        border: `1px dashed ${borderSoft}`, borderRadius: '10px',
        padding: '28px 16px', textAlign: 'center',
        background: bgSecondary, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = brandDim }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = borderSoft }}>
        <div style={{ marginBottom: '8px', opacity: '0.3' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </div>
        <div style={{ fontSize: '12px', color: textDim }}>Drop files</div>
        <div style={{ fontSize: '10px', color: textDim, marginTop: '2px' }}>MP4, MOV, WEBM, MP3, WAV</div>
      </div>
    </div>
  )

  const renderTransitionsPanel = () => (
    <Section label="Transition">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {transitions.map(t => (
          <button key={t.id} onClick={() => setSelectedTransition(t.id)}
            className={`editor-option${selectedTransition === t.id ? ' active' : ''}`}
            style={{
              background: bgSecondary, border: `1px solid ${selectedTransition === t.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '14px 8px', cursor: 'pointer',
              textAlign: 'center', color: textPrimary, transition: 'all 0.15s',
            }}>
            <div style={{ marginBottom: '6px', color: selectedTransition === t.id ? brand : textDim }}>
              {t.id === 'fade'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="3" opacity="0.5"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                : t.id === 'slide'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                : t.id === 'zoom'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l18 18"/><path d="M3 7l14 14"/><path d="M3 11l10 10"/><path d="M3 15l6 6"/></svg>
              }
            </div>
            <div style={{ fontSize: '10px', color: selectedTransition === t.id ? brand : textDim }}>
              {t.label}
            </div>
          </button>
        ))}
      </div>
    </Section>
  )

  const renderFiltersPanel = () => (
    <Section label="Filters">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)}
            className={`editor-option${activeFilter === f.id ? ' active' : ''}`}
            style={{
              background: bgSecondary, border: `1px solid ${activeFilter === f.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '8px', cursor: 'pointer', textAlign: 'center',
              color: textPrimary, transition: 'all 0.15s',
            }}>
            <div style={{
              height: '40px', borderRadius: '6px', marginBottom: '4px',
              background: `linear-gradient(135deg, #1a1a2e, #0f3460)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...f.style, fontSize: '14px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            </div>
            <div style={{ fontSize: '9px', color: activeFilter === f.id ? brand : textDim }}>
              {f.label}
            </div>
          </button>
        ))}
      </div>
    </Section>
  )

  const renderAudioPanel = () => (
    <Section label="Music">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {musicTracks.map(t => (
          <button key={t.id} onClick={() => setMusic(t.id)}
            className={`editor-music-item${music === t.id ? ' active' : ''}`}
            style={{
              background: bgSecondary, border: `1px solid ${music === t.id ? brand : borderSoft}`,
              borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: music === t.id ? brand : textSecondary, fontSize: '12px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (music !== t.id) e.currentTarget.style.borderColor = brandDim }}
            onMouseLeave={e => { if (music !== t.id) e.currentTarget.style.borderColor = borderSoft }}>
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

  const renderOverlayPanel = () => (
    <Section label="Watermark">
      <input type="text" placeholder="@your_handle"
        value={watermark}
        onChange={e => setWatermark(e.target.value)}
        className="editor-input" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
        {[
          { id: 'top-left', label: 'TL' },
          { id: 'top-right', label: 'TR' },
          { id: 'bottom-left', label: 'BL' },
          { id: 'bottom-right', label: 'BR' },
        ].map(p => (
          <button key={p.id} onClick={() => setWatermarkPosition(p.id)}
            style={{
              background: bgSecondary, border: `1px solid ${watermarkPosition === p.id ? brand : borderSoft}`,
              borderRadius: '6px', padding: '8px', cursor: 'pointer', textAlign: 'center',
              color: watermarkPosition === p.id ? brand : textSecondary, fontSize: '11px',
              transition: 'all 0.15s',
            }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {p.id === 'top-left'
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="17" x2="7" y2="7"/><polyline points="17 7 7 7 7 17"/></svg>
                : p.id === 'top-right'
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                : p.id === 'bottom-left'
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="7 17 17 17 17 7"/></svg>
              }
              {p.label}
            </span>
          </button>
        ))}
      </div>
    </Section>
  )

  return (
    <div className="editor-inspector" style={{
      width: '280px', background: surface, borderLeft: `1px solid ${borderSoft}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${borderSoft}`,
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveInspectorTab(tab.id)}
            style={{
              flex: 1, padding: '10px 0', border: 'none',
              background: 'transparent',
              color: activeInspectorTab === tab.id ? brand : textDim,
              cursor: 'pointer', fontSize: '10px', fontFamily: fonts.body,
              fontWeight: activeInspectorTab === tab.id ? '600' : '400',
              borderBottom: `2px solid ${activeInspectorTab === tab.id ? brand : 'transparent'}`,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px',
            }}>
            <span style={{ display: 'flex', width: '14px', height: '14px', alignItems: 'center', justifyContent: 'center' }}>
              {icons[tab.icon]}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px',
        scrollbarWidth: 'thin', scrollbarColor: `${borderStrong} transparent`,
      }}>
        {activeInspectorTab === 'edit' && renderEditPanel()}
        {activeInspectorTab === 'animation' && (
          <Section label="Keyframes">
            <div style={{ textAlign: 'center', padding: '24px 0', color: textDim, fontSize: '11px' }}>
              Select a clip to animate
            </div>
          </Section>
        )}
        {activeInspectorTab === 'audio' && renderAudioPanel()}
        {activeInspectorTab === 'ai' && <AIPanel videoRef={videoRef} />}
      </div>
    </div>
  )
}

function TimeInput({ value, onChange }) {
  const fmt = (v) => {
    const m = Math.floor(v / 60)
    const s = Math.floor(v % 60)
    const ms = Math.round((v - Math.floor(v)) * 1000)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
  }
  return (
    <input type="text" value={fmt(value)}
      onChange={(e) => {
        const parts = e.target.value.split(/[:.]/)
        const m = parseFloat(parts[0]) || 0
        const s = parseFloat(parts[1]) || 0
        const ms = parseFloat(parts[2]) || 0
        onChange(m * 60 + s + ms / 1000)
      }}
      style={{
        flex: 1, background: '#0B0B0B', border: `1px solid ${borderSoft}`,
        borderRadius: '4px', color: textDim, fontSize: '10px', padding: '4px 6px',
        fontFamily: fonts.mono,
      }} />
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
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
