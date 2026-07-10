// app/editor/layout.jsx
import '../editor/editor.css'; // import the cream palette styles

export default function EditorLayout({ children }) {
  // This layout is applied only to /editor routes.
  // The page itself renders .editor-layout (desktop) and .editor-mobile-layout,
  // so this wrapper must stay neutral to avoid hiding children on mobile.
  return <>{children}</>;
}
