import './globals.css';

export const metadata = {
  title: 'Synth → Operator Translator | Ableton Sound Design Tool',
  description: 'Translate any VST synthesizer\'s parameters into step-by-step Ableton Operator settings. Supports Serum, Massive, Vital, Sylenth1, and all installed VST plugins.',
  keywords: 'Ableton Operator, synthesizer translation, Serum to Operator, FM synthesis, sound design, VST',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
