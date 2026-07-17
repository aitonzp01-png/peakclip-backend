// editor.tokens.js – export of CSS custom properties for the red/white editor
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
  '--cream-accent': '#ff1f1f',
  '--cream-primary-btn-bg': '#0a0a0a',
  '--cream-primary-btn-color': '#ffffff',
  '--cream-accent-btn-bg': '#ff1f1f',
  '--cream-accent-btn-color': '#0a0a0a',
  '--cream-focus-border': '#0a0a0a',
  '--cream-focus-detail': '#ff1f1f',
  '--cream-success': '#22c55e',
  '--cream-error': '#ef4444',
  '--cream-tl-bg': '#ffffff',
  '--cream-tl-border': '#ff1f1f',
  '--cream-waveform': 'rgba(255,31,31,0.7)',
  '--cream-playhead': '#ff1f1f',
  '--cream-bbox': '#ff1f1f'
};

// Helper to inject the variables into :root when needed
export const injectEditorPalette = () => {
  const root = document.documentElement;
  Object.entries(editorPalette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
