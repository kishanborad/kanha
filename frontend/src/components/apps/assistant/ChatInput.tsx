// frontend/src/components/apps/assistant/ChatInput.tsx
import { useState, useCallback } from 'react';
import { useVoiceStore } from '../../../stores/voiceStore';
import VoiceWaveform from './VoiceWaveform';

interface ChatInputProps {
  onSend: (text: string) => void;
  onMicToggle: () => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, onMicToggle, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const voiceStatus = useVoiceStore((s) => s.status);
  const interimText = useVoiceStore((s) => s.interimText);
  const supported = useVoiceStore((s) => s.supported);
  const isListening = voiceStatus === 'listening';

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  return (
    <div className="border-t border-z-border p-3">
      {isListening && interimText && (
        <p className="text-[10px] text-z-dimmed font-mono mb-2 italic">{interimText}</p>
      )}
      <div className="flex items-center gap-2">
        {supported && (
          <button
            onClick={onMicToggle}
            disabled={disabled}
            className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isListening ? 'bg-z-primary/20 text-z-primary' : 'text-z-dimmed hover:text-z-text'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
        {isListening && <VoiceWaveform />}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder={isListening ? 'Listening...' : 'Message Kanha...'}
          disabled={disabled || isListening}
          className="flex-1 px-3 py-2 rounded-lg bg-white/3 border border-z-border text-xs text-z-text placeholder:text-z-dimmed/50 focus:outline-none focus:border-z-primary/40 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-3 py-2 rounded-lg text-xs font-mono text-z-primary border border-z-primary/30 hover:bg-z-primary/10 disabled:opacity-30 cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}
