// frontend/src/components/apps/settings/VoiceConfig.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-z-dimmed w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-z-primary h-1"
      />
      <span className="text-[11px] text-z-text w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export default function VoiceConfig() {
  const { settings, updateVoice } = useSettingsStore();
  const voice = settings.voice;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load browser voices — may need delay for async voice list population
  useEffect(() => {
    function loadVoices() {
      const list = window.speechSynthesis?.getVoices() ?? [];
      if (list.length > 0) setVoices(list);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const handleTest = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('Hello, I am Kanha, your AI assistant.');
    if (voice.voiceURI) {
      const match = voices.find(v => v.voiceURI === voice.voiceURI);
      if (match) utt.voice = match;
    }
    utt.rate = voice.rate;
    utt.pitch = voice.pitch;
    utt.volume = voice.volume;
    window.speechSynthesis.speak(utt);
  }, [voice, voices]);

  return (
    <div className="space-y-5">
      {/* Voice selector */}
      <div>
        <label className="block text-[11px] text-z-dimmed mb-1.5">Voice</label>
        {voices.length === 0 ? (
          <p className="text-[11px] text-z-dimmed italic">No voices available in this browser.</p>
        ) : (
          <select
            value={voice.voiceURI ?? ''}
            onChange={e => updateVoice({ voiceURI: e.target.value || undefined })}
            className="w-full text-[11px] bg-black/30 border border-z-border rounded px-2 py-1.5 text-z-text outline-none focus:border-z-primary/40"
          >
            <option value="">System default</option>
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <Slider
          label="Rate"
          min={0.5}
          max={2}
          step={0.1}
          value={voice.rate}
          onChange={v => updateVoice({ rate: v })}
        />
        <Slider
          label="Pitch"
          min={0.5}
          max={2}
          step={0.1}
          value={voice.pitch}
          onChange={v => updateVoice({ pitch: v })}
        />
        <Slider
          label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={voice.volume}
          onChange={v => updateVoice({ volume: v })}
        />
      </div>

      {/* Wake word toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-z-text">Wake Word</p>
          <p className="text-[10px] text-z-dimmed">"Hey Kanha" to activate voice input</p>
        </div>
        <button
          onClick={() => updateVoice({ wakeWordEnabled: !voice.wakeWordEnabled })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            voice.wakeWordEnabled ? 'bg-z-primary' : 'bg-z-border'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              voice.wakeWordEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Test button */}
      <button
        onClick={handleTest}
        className="w-full py-2 text-[11px] font-medium rounded border border-z-primary/30 text-z-primary hover:bg-z-primary/10 transition-colors"
      >
        Test Voice
      </button>
    </div>
  );
}
