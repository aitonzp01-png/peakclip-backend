// editor.tokens.js – export of CSS custom properties for the cream‑palette editor
// These variables are imported by editor.css and can be used by any component.
export const editorPalette = {
  '--cream-bg': '#f0f0eb',
  '--cream-panel': '#ffffff',
  '--cream-panel-border': '#e5e5e0',
  '--cream-surface': '#f8f8f5',
  '--cream-surface-border': '#e5e5e0',
  '--cream-hover': '#f0f0f0',
  '--cream-text-primary': '#0a0a0a',
  '--cream-text-secondary': '#666666',
  '--cream-placeholder': '#999999',
  '--cream-accent': '#c8ff00',
  '--cream-primary-btn-bg': '#0a0a0a',
  '--cream-primary-btn-color': '#ffffff',
  '--cream-accent-btn-bg': '#c8ff00',
  '--cream-accent-btn-color': '#0a0a0a',
  '--cream-focus-border': '#0a0a0a',
  '--cream-focus-detail': '#c8ff00',
  '--cream-success': '#22c55e',
  '--cream-error': '#ef4444',
  '--cream-tl-bg': '#f8f8f5',
  '--cream-tl-border': '#e5e5e0',
  '--cream-waveform': 'rgba(200,255,0,0.7)',
  '--cream-playhead': '#c8ff00',
  '--cream-bbox': '#c8ff00'
};

// Helper to inject the variables into :root when needed
export const injectEditorPalette = () => {
  const root = document.documentElement;
  Object.entries(editorPalette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
