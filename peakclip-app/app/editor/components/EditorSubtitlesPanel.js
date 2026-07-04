'use client'
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import { textPrimary, textSecondary, textDim, brand, bgSecondary, borderSoft, hoverBg, surface } from '../../../lib/editor-tokens'
import { subtitlePresets, fontOptions, defaultSubtitleStyle } from '../../../lib/utils'

export default function EditorSubtitlesPanel() {
  const {
    subtitleStyle, updateSubtitleStyle, setSubtitleEnabled,
    selectedSubtitlePreset, setSelectedSubtitlePreset, subtitleEnabled,
  } = useEditorStore()

  const [tab, setTab] = useState('presets')

  const tabs = [
    { id: 'presets', label: 'Preajustes' },
    { id: 'font', label: 'Fuente' },
    { id: 'effects', label: 'Efectos' },
  ]

  const applyPreset = (preset) => {
    if (preset.id === 'none') {
      setSubtitleEnabled(false)
      setSelectedSubtitlePreset('none')
      return
    }
    setSubtitleEnabled(true)
    setSelectedSubtitlePreset(preset.id)
    const { id, label, ...style } = preset
    updateSubtitleStyle(style)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${borderSoft}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? brand : 'transparent'}`,
              color: tab === t.id ? textPrimary : textDim,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {tab === 'presets' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {subtitlePresets.map(p => {
              const isSelected = p.id === selectedSubtitlePreset || (!subtitleEnabled && p.id === 'none')
              return (
                <div key={p.id} onClick={() => applyPreset(p)}
                  style={{
                    aspectRatio: '9/16',
                    background: p.id === 'none' ? surface : '#1a1a1a',
                    borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${isSelected ? brand : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', transition: 'border 0.15s',
                  }}
                >
                  {p.id === 'none' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textDim} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  ) : (
                    <span style={{
                      fontFamily: p.fontFamily || 'Inter', fontSize: 11,
                      fontWeight: p.fontWeight || 700,
                      color: p.color || '#fff', textAlign: 'center',
                      padding: 2,
                    }}>Aa</span>
                  )}
                  <span style={{
                    position: 'absolute', bottom: 4,
                    fontSize: 9, color: isSelected ? brand : textDim,
                    fontWeight: 600,
                  }}>{p.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'font' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>FUENTE</label>
              <select value={subtitleStyle.fontFamily} onChange={e => updateSubtitleStyle({ fontFamily: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: bgSecondary, border: `1px solid ${borderSoft}`, color: textPrimary, fontSize: 12 }}
              >
                {fontOptions.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>TAMA&Ntilde;O ({subtitleStyle.fontSize}px)</label>
              <input type="range" min={12} max={80} value={subtitleStyle.fontSize} onChange={e => updateSubtitleStyle({ fontSize: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>PESO</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { label: 'Regular', value: '400' },
                  { label: 'Bold', value: '700' },
                  { label: 'Black', value: '900' },
                ].map(o => (
                  <button key={o.value} onClick={() => updateSubtitleStyle({ fontWeight: o.value })}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 6,
                      background: subtitleStyle.fontWeight === o.value ? brand : 'transparent',
                      border: `1px solid ${subtitleStyle.fontWeight === o.value ? brand : borderSoft}`,
                      color: subtitleStyle.fontWeight === o.value ? '#0f0f0f' : textDim,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>COLOR</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={subtitleStyle.color} onChange={e => updateSubtitleStyle({ color: e.target.value })}
                  style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
                {['#ffffff', '#000000', '#c4ff3d', '#f97316', '#ef4444', '#3b82f6'].map(c => (
                  <button key={c} onClick={() => updateSubtitleStyle({ color: c })}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', background: c,
                      border: subtitleStyle.color === c ? '2px solid #c4ff3d' : `1px solid ${borderSoft}`,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>ALINEACI&Oacute;N</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { id: 'left', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg> },
                  { id: 'center', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="14" x2="6" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg> },
                  { id: 'right', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="7" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg> },
                ].map(o => (
                  <button key={o.id} onClick={() => updateSubtitleStyle({ textAlign: o.id })}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 6,
                      background: subtitleStyle.textAlign === o.id ? hoverBg : 'transparent',
                      border: `1px solid ${subtitleStyle.textAlign === o.id ? borderSoft : 'transparent'}`,
                      color: subtitleStyle.textAlign === o.id ? textPrimary : textDim,
                      cursor: 'pointer', display: 'flex', justifyContent: 'center',
                    }}
                  >{o.svg}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>TRANSFORMACI&Oacute;N</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { id: 'none', label: 'Aa' },
                  { id: 'uppercase', label: 'AA' },
                  { id: 'lowercase', label: 'aa' },
                ].map(o => (
                  <button key={o.id} onClick={() => updateSubtitleStyle({ textTransform: o.id })}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 6,
                      background: subtitleStyle.textTransform === o.id ? brand : 'transparent',
                      border: `1px solid ${subtitleStyle.textTransform === o.id ? brand : borderSoft}`,
                      color: subtitleStyle.textTransform === o.id ? '#0f0f0f' : textDim,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>ESPACIADO ({subtitleStyle.letterSpacing}px)</label>
              <input type="range" min={-2} max={10} step={0.5} value={subtitleStyle.letterSpacing} onChange={e => updateSubtitleStyle({ letterSpacing: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>ALTO DE L&Iacute;NEA ({subtitleStyle.lineHeight})</label>
              <input type="range" min={0.8} max={2} step={0.1} value={subtitleStyle.lineHeight} onChange={e => updateSubtitleStyle({ lineHeight: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>POSICI&Oacute;N VERTICAL ({subtitleStyle.positionY}%)</label>
              <input type="range" min={0} max={100} value={subtitleStyle.positionY} onChange={e => updateSubtitleStyle({ positionY: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div style={{ borderTop: `1px solid ${borderSoft}`, paddingTop: 8 }}>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>FONDO DEL TEXTO</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: textDim, fontSize: 11 }}>Activo</span>
                <button onClick={() => updateSubtitleStyle({ backgroundColor: subtitleStyle.backgroundColor === 'transparent' ? '#000000' : 'transparent' })}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none',
                    background: subtitleStyle.backgroundColor !== 'transparent' ? brand : borderSoft,
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, width: 16, height: 16,
                    background: '#fff', borderRadius: '50%',
                    transform: subtitleStyle.backgroundColor !== 'transparent' ? 'translateX(18px)' : 'translateX(2px)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              </div>
              {subtitleStyle.backgroundColor !== 'transparent' && (
                <>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                    <input type="color" value={subtitleStyle.backgroundColor} onChange={e => updateSubtitleStyle({ backgroundColor: e.target.value })} style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: textDim, fontSize: 9 }}>Opacidad {subtitleStyle.backgroundOpacity}%</span>
                      <input type="range" min={0} max={100} value={subtitleStyle.backgroundOpacity} onChange={e => updateSubtitleStyle({ backgroundOpacity: Number(e.target.value) })} style={{ width: '100%' }} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${borderSoft}`, paddingTop: 8 }}>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>CONTORNO (STROKE)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: textDim, fontSize: 11 }}>Activo</span>
                <button onClick={() => updateSubtitleStyle({ stroke: !subtitleStyle.stroke })}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none',
                    background: subtitleStyle.stroke ? brand : borderSoft,
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, width: 16, height: 16,
                    background: '#fff', borderRadius: '50%',
                    transform: subtitleStyle.stroke ? 'translateX(18px)' : 'translateX(2px)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              </div>
              {subtitleStyle.stroke && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <input type="color" value={subtitleStyle.strokeColor} onChange={e => updateSubtitleStyle({ strokeColor: e.target.value })} style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4 }} />
                  <span style={{ color: textDim, fontSize: 10 }}>Grosor {subtitleStyle.strokeWidth}px</span>
                  <input type="range" min={1} max={8} value={subtitleStyle.strokeWidth} onChange={e => updateSubtitleStyle({ strokeWidth: Number(e.target.value) })} style={{ flex: 1 }} />
                </div>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${borderSoft}`, paddingTop: 8 }}>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>SOMBRA</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: textDim, fontSize: 11 }}>Activo</span>
                <button onClick={() => updateSubtitleStyle({ shadow: !subtitleStyle.shadow })}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none',
                    background: subtitleStyle.shadow ? brand : borderSoft,
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, width: 16, height: 16,
                    background: '#fff', borderRadius: '50%',
                    transform: subtitleStyle.shadow ? 'translateX(18px)' : 'translateX(2px)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'effects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>ANIMACI&Oacute;N DE ENTRADA</label>
              <select value={subtitleStyle.entryAnimation} onChange={e => updateSubtitleStyle({ entryAnimation: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: bgSecondary, border: `1px solid ${borderSoft}`, color: textPrimary, fontSize: 12 }}
              >
                <option value="none">Ninguna</option>
                <option value="fade">Fade in</option>
                <option value="slide">Slide up</option>
                <option value="pop">Pop</option>
                <option value="bounce">Bounce</option>
                <option value="typewriter">Typewriter</option>
              </select>
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>DURACI&Oacute;N ({subtitleStyle.entryDuration}s)</label>
              <input type="range" min={0.1} max={0.8} step={0.05} value={subtitleStyle.entryDuration} onChange={e => updateSubtitleStyle({ entryDuration: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ color: textDim, fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>KARAOKE (PALABRA ACTIVA)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => updateSubtitleStyle({ karaokeHighlight: !subtitleStyle.karaokeHighlight })}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none',
                    background: subtitleStyle.karaokeHighlight ? brand : borderSoft,
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, width: 16, height: 16,
                    background: '#fff', borderRadius: '50%',
                    transform: subtitleStyle.karaokeHighlight ? 'translateX(18px)' : 'translateX(2px)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              </div>
              {subtitleStyle.karaokeHighlight && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ color: textDim, fontSize: 10, display: 'block', marginBottom: 4 }}>Color de highlight</label>
                  <input type="color" value={subtitleStyle.highlightColor} onChange={e => updateSubtitleStyle({ highlightColor: e.target.value })}
                    style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
