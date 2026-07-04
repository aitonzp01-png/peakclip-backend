'use client'
import { brand, brandDim, bgSecondary, textPrimary, textSecondary, textDim, borderSoft, hoverBg, fonts } from '../../../lib/editor-tokens'
import useEditorStore from '../store/editorStore'
import icons from '../../../lib/icons'

const tools = [
  { id: 'cursor', icon: icons.cursor, label: 'Select' },
  { id: 'media', icon: icons.media, label: 'Media' },
  { id: 'ai', icon: icons.ai, label: 'AI Tools' },
  { id: 'text', icon: icons.text, label: 'Text' },
  { id: 'subtitles', icon: icons.captions, label: 'Captions' },
  { id: 'transitions', icon: icons.transitions, label: 'Transitions' },
  { id: 'effects', icon: icons.effects, label: 'Effects' },
  { id: 'music', icon: icons.audio, label: 'Audio' },
  { id: 'overlays', icon: icons.overlays, label: 'Overlays' },
  { id: 'templates', icon: icons.templates, label: 'Templates' },
  { id: 'projects', icon: icons.projects, label: 'Projects' },
]

export default function EditorSidebar() {
  const { activeTool, setActiveTool, setSidebarExpanded, sidebarExpanded } = useEditorStore()

  return (
    <div className="editor-sidebar" style={{
      width: sidebarExpanded ? '200px' : '64px',
      background: bgSecondary, borderRight: `1px solid ${borderSoft}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      transition: 'width 0.2s cubic-bezier(0.16,1,0.3,1)',
      overflow: 'hidden', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', zIndex: 50,
    }}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}>
      <div style={{
        padding: '14px 0', textAlign: 'center', borderBottom: `1px solid ${borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <span style={{ color: brand, display: 'flex' }}>{icons.sparkles}</span>
        {sidebarExpanded && (
          <span style={{ fontSize: '10px', color: brand, fontWeight: '600', fontFamily: fonts.body, letterSpacing: '1px' }}>AI-POWERED</span>
        )}
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '8px 0', gap: '1px', overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {tools.map(t => (
          <button key={t.id} onClick={() => setActiveTool(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: sidebarExpanded ? '10px 16px' : '10px 0',
              justifyContent: sidebarExpanded ? 'flex-start' : 'center',
              border: 'none', background: activeTool === t.id ? brandDim : 'transparent',
              color: activeTool === t.id ? brand : textDim,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: fonts.body, fontSize: '12px',
              borderLeft: `2px solid ${activeTool === t.id ? brand : 'transparent'}`,
              position: 'relative',
              minHeight: '42px',
            }}
            onMouseEnter={e => { if (activeTool !== t.id) { e.currentTarget.style.background = brandDim; e.currentTarget.style.color = brand; e.currentTarget.style.borderLeftColor = brand } }}
            onMouseLeave={e => { if (activeTool !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textDim; e.currentTarget.style.borderLeftColor = 'transparent' } }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
              {t.icon}
            </span>
            {sidebarExpanded && <span>{t.label}</span>}
          </button>
        ))}
      </div>

      <div style={{
        padding: '12px 0', borderTop: `1px solid ${borderSoft}`,
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          fontSize: '10px', color: textDim, fontFamily: fonts.mono,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: brand }} />
          {sidebarExpanded && <span>v2.0 BETA</span>}
        </div>
      </div>
    </div>
  )
}
