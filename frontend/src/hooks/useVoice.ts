// frontend/src/hooks/useVoice.ts
import { useRef, useCallback, useEffect } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { useSettingsStore } from '../stores/settingsStore';
import { checkVoiceSupport, createRecognition, speakText, splitSentences } from '../services/voice';

export function useVoice() {
  const { setStatus, setInterimText, setSupported } = useVoiceStore();
  const voiceConfig = useSettingsStore((s) => s.settings.voice);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const { stt, tts } = checkVoiceSupport();
    setSupported(stt && tts);
  }, [setSupported]);

  const startListening = useCallback(
    (onResult: (transcript: string) => void) => {
      const recognition = createRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      setStatus('listening');
      setInterimText('');

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        // O(n) — single pass over results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        setInterimText(interim);
        if (final) {
          setInterimText('');
          setStatus('processing');
          onResult(final.trim());
        }
      };

      recognition.onerror = () => {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      };

      recognition.onend = () => {
        if (useVoiceStore.getState().status === 'listening') {
          recognition.start(); // restart if still in listening mode
        }
      };

      recognition.start();
    },
    [setStatus, setInterimText],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus('idle');
    setInterimText('');
  }, [setStatus, setInterimText]);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      setStatus('speaking');
      // Chunk by sentences for natural pacing
      const sentences = splitSentences(text);
      let index = 0;

      const speakNext = () => {
        if (index >= sentences.length) {
          setStatus('idle');
          onDone?.();
          return;
        }
        speakText(sentences[index++], voiceConfig, speakNext);
      };

      speakNext();
    },
    [voiceConfig, setStatus],
  );

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus('idle');
  }, [setStatus]);

  return { startListening, stopListening, speak, cancelSpeech };
}
