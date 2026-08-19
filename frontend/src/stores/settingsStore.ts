// frontend/src/stores/settingsStore.ts
import { create } from 'zustand';
import { db } from '../services/db';
import type { ZarvisSettings, ProviderSettings, VoiceSettings } from '../types';

const DEFAULT_SETTINGS: ZarvisSettings = {
  id: 'default',
  activeProvider: 'openai',
  providers: {},
  voice: { rate: 1, pitch: 1, volume: 1, wakeWordEnabled: false },
  theme: { accentColor: '#00F0FF', wallpaper: 'particles', dockPosition: 'bottom' },
  cleanupDays: 90,
  hasBooted: false,
};

interface SettingsState {
  settings: ZarvisSettings;
  loaded: boolean;
  load: () => Promise<void>;
  setActiveProvider: (id: string) => void;
  updateProvider: (id: string, config: Partial<ProviderSettings>) => void;
  updateVoice: (voice: Partial<VoiceSettings>) => void;
  updateTheme: (theme: Partial<ZarvisSettings['theme']>) => void;
  setCleanupDays: (days: ZarvisSettings['cleanupDays']) => void;
  markBooted: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const stored = await db.settings.get('default');
    if (stored) {
      set({ settings: stored, loaded: true });
    } else {
      await db.settings.put(DEFAULT_SETTINGS);
      set({ loaded: true });
    }
  },

  setActiveProvider: (id) => {
    const next = { ...get().settings, activeProvider: id };
    set({ settings: next });
    db.settings.put(next);
  },

  updateProvider: (id, config) => {
    const settings = get().settings;
    const existing = settings.providers[id] ?? { id, enabled: true };
    const next = {
      ...settings,
      providers: { ...settings.providers, [id]: { ...existing, ...config } },
    };
    set({ settings: next });
    db.settings.put(next);
  },

  updateVoice: (voice) => {
    const next = { ...get().settings, voice: { ...get().settings.voice, ...voice } };
    set({ settings: next });
    db.settings.put(next);
  },

  updateTheme: (theme) => {
    const next = { ...get().settings, theme: { ...get().settings.theme, ...theme } };
    set({ settings: next });
    db.settings.put(next);
  },

  setCleanupDays: (days) => {
    const next = { ...get().settings, cleanupDays: days };
    set({ settings: next });
    db.settings.put(next);
  },

  markBooted: () => {
    const next = { ...get().settings, hasBooted: true };
    set({ settings: next });
    db.settings.put(next);
  },
}));
