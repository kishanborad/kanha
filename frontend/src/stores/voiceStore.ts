// frontend/src/stores/voiceStore.ts
import { create } from 'zustand';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceState {
  status: VoiceStatus;
  interimText: string;
  supported: boolean;
  setStatus: (status: VoiceStatus) => void;
  setInterimText: (text: string) => void;
  setSupported: (supported: boolean) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  status: 'idle',
  interimText: '',
  supported: false,
  setStatus: (status) => set({ status }),
  setInterimText: (text) => set({ interimText: text }),
  setSupported: (supported) => set({ supported }),
}));
