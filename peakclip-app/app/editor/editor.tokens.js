// editor.tokens.js – export of CSS custom properties for the cream‑palette editor
// These variables are imported by editor.css and can be used by any component.
export const editorPalette = {
  // Core colors
  '--cream-bg': '#f5f5f0',                     // General page background
  '--cream-panel': '#ffffff',                  // Side panels background
  '--cream-panel-border': '#e8e8e2',          // Side panels border
  '--cream-surface': '#f8f8f4',               // Secondary surfaces (e.g., subtitle panel)
  '--cream-surface-border': '#e0e0da',        // Surface border
  '--cream-hover': '#f0f0ea',                 // Hover background for buttons/panels

  // Text colors
  '--cream-text-primary': '#0f0f0f',          // Main/primary text
  '--cream-text-secondary': '#6b6b72',        // Secondary text
  '--cream-placeholder': '#9a9aa3',          // Input placeholders

  // Accent & interactive colors
  '--cream-accent': '#c4ff3d',                // Highlights, selections, playhead, waveform, active border
  '--cream-primary-btn-bg': '#0f0f0f',        // Primary button background
  '--cream-primary-btn-color': '#f5f5f0',     // Primary button text color
  '--cream-accent-btn-bg': '#c4ff3d',        // Accent button (Export / Save) background
  '--cream-accent-btn-color': '#0f0f0f',     // Accent button text color
  '--cream-focus-border': '#0f0f0f',        // Focus/selected border
  '--cream-focus-detail': '#c4ff3d',         // Detail color for selected state (e.g., left icon bar active)

  // Status colors
  '--cream-success': '#22c55e',
  '--cream-error': '#ef4444',

  // Timeline specific
  '--cream-tl-bg': '#eeeee8',               // Timeline background
  '--cream-tl-border': '#e8e8e2',           // Timeline top border
  '--cream-waveform': 'rgba(196,255,61,0.7)', // Waveform color with opacity
  '--cream-playhead': '#c4ff3d',            // Playhead line & handle

  // Bounding box (face tracking)
  '--cream-bbox': '#c4ff3d'
};

// Helper to inject the variables into :root when needed
export const injectEditorPalette = () => {
  const root = document.documentElement;
  Object.entries(editorPalette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
