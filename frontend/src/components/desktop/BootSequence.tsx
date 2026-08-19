// frontend/src/components/desktop/BootSequence.tsx
import { useState, useEffect } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

const STAGES = [
  { text: '', duration: 500 },
  { text: 'KANHA', duration: 1000 },
  { text: 'SYSTEMS INITIALIZING...', duration: 800 },
  { text: 'KANHA ONLINE', duration: 500 },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (stage < STAGES.length) {
      const timer = setTimeout(() => setStage((s) => s + 1), STAGES[stage].duration);
      return () => clearTimeout(timer);
    }
    // Fade out then complete
    const fade = setTimeout(() => setVisible(false), 300);
    const done = setTimeout(onComplete, 600);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [stage, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-z-bg flex flex-col items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {stage >= 1 && (
        <h1 className="text-4xl font-bold font-mono text-z-primary animate-pulse shadow-z-glow mb-4">
          {STAGES[1].text}
        </h1>
      )}
      {stage >= 2 && (
        <p className="text-xs font-mono text-z-dimmed tracking-widest">{STAGES[2].text}</p>
      )}
      {stage >= 3 && (
        <p className="text-sm font-mono text-z-primary mt-2 tracking-[0.3em]">{STAGES[3].text}</p>
      )}
      {/* Scan line */}
      {stage >= 1 && stage < STAGES.length && (
        <div className="absolute inset-x-0 h-px bg-z-primary/40 animate-[scan_2s_linear_infinite]" />
      )}
    </div>
  );
}
