// app/editor/layout.jsx
import '../editor/editor.css'; // import the cream palette styles

export default function EditorLayout({ children }) {
  // This layout is applied only to /editor routes.
  // It adds the .editor-layout class to the root container.
  return (
    <div className="editor-layout">
      {children}
    </div>
  );
}
