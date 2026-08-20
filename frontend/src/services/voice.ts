// frontend/src/services/voice.ts

export function checkVoiceSupport(): { stt: boolean; tts: boolean } {
  const stt = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const tts = 'speechSynthesis' in window;
  return { stt, tts };
}

export function createRecognition(): SpeechRecognition | null {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  return recognition;
}

// O(n) sentence splitter — single pass
export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') && current.trim().length > 2) {
      sentences.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) sentences.push(current.trim());
  return sentences;
}

export function speakText(
  text: string,
  options: { voiceURI?: string; rate: number; pitch: number; volume: number },
  onEnd?: () => void,
): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate;
  utterance.pitch = options.pitch;
  utterance.volume = options.volume;

  if (options.voiceURI) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.voiceURI === options.voiceURI);
    if (voice) utterance.voice = voice;
  }

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}
