// frontend/src/components/desktop/TopBar.tsx
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useVoiceStore } from '../../stores/voiceStore';

export default function TopBar() {
  const [time, setTime] = useState(new Date());
  const activeProvider = useSettingsStore((s) => s.settings.activeProvider);
  const voiceStatus = useVoiceStore((s) => s.status);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="fixed top-0 inset-x-0 z-50 h-8 glass-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-z-primary font-semibold tracking-wider">KANHA</span>
        <span className="text-[9px] font-mono text-z-dimmed">{activeProvider.toUpperCase()}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`w-1.5 h-1.5 rounded-full ${
          voiceStatus === 'listening' ? 'bg-z-primary animate-pulse' :
          voiceStatus === 'error' ? 'bg-z-error' : 'bg-z-dimmed'
        }`} />
        <span className="text-[10px] font-mono text-z-dimmed">{dateStr}</span>
        <span className="text-[10px] font-mono text-z-text">{timeStr}</span>
      </div>
    </div>
  );
}
