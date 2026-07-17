// app/editor/layout.jsx
import '../editor/editor.css';
import { Montserrat, Poppins, Anton, Playfair_Display, Dancing_Script, Orbitron } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

export default function EditorLayout({ children }) {
  return (
    <div className={`${montserrat.variable} ${poppins.variable} ${anton.variable} ${playfairDisplay.variable} ${dancingScript.variable} ${orbitron.variable}`}>
      {children}
    </div>
  );
}
