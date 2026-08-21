// frontend/src/components/apps/settings/SettingsApp.tsx
import { useState } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import ProviderConfig from './ProviderConfig';
import VoiceConfig from './VoiceConfig';
import MemoryConfig from './MemoryConfig';

// ---------------------------------------------------------------------------
// Theme tab — inline (no separate file needed)
// ---------------------------------------------------------------------------
const ACCENT_SWATCHES = [
  { label: 'Cyan', value: '#00F0FF' },
  { label: 'Indigo', value: '#818CF8' },
  { label: 'Emerald', value: '#34D399' },
  { label: 'Rose', value: '#FB7185' },
  { label: 'Amber', value: '#FBBF24' },
];

const WALLPAPERS = [
  { id: 'particles', label: 'Particles' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'grid', label: 'Grid' },
  { id: 'solid', label: 'Solid' },
];

function ThemeConfig() {
  const { settings, updateTheme } = useSettingsStore();
  const { theme } = settings;

  return (
    <div className="space-y-5">
      {/* Accent color */}
      <div>
        <p className="text-[11px] text-z-dimmed mb-2">Accent color</p>
        <div className="flex gap-2 flex-wrap">
          {ACCENT_SWATCHES.map(s => (
            <button
              key={s.value}
              title={s.label}
              onClick={() => updateTheme({ accentColor: s.value })}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{
                background: s.value,
                borderColor: theme.accentColor === s.value ? '#fff' : 'transparent',
                boxShadow: theme.accentColor === s.value ? `0 0 8px ${s.value}80` : undefined,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-z-dimmed">Custom:</span>
          <input
            type="color"
            value={theme.accentColor}
            onChange={e => updateTheme({ accentColor: e.target.value })}
            className="w-8 h-6 rounded border border-z-border bg-transparent cursor-pointer"
          />
          <span className="text-[10px] font-mono text-z-dimmed">{theme.accentColor}</span>
        </div>
      </div>

      {/* Wallpaper */}
      <div>
        <p className="text-[11px] text-z-dimmed mb-2">Wallpaper</p>
        <div className="grid grid-cols-2 gap-2">
          {WALLPAPERS.map(w => (
            <button
              key={w.id}
              onClick={() => updateTheme({ wallpaper: w.id })}
              className={`h-16 rounded-lg border text-[11px] font-medium transition-colors ${
                theme.wallpaper === w.id
                  ? 'border-z-primary/50 text-z-primary bg-z-primary/10'
                  : 'border-z-border text-z-dimmed hover:border-z-primary/30 hover:text-z-text'
              }`}
              style={{
                background:
                  w.id === 'aurora'
                    ? 'linear-gradient(135deg, #0a0a20 0%, #0a2020 50%, #1a0a20 100%)'
                    : w.id === 'grid'
                    ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)'
                    : w.id === 'particles'
                    ? 'radial-gradient(circle at 20% 50%, #00F0FF15 0%, transparent 50%), radial-gradient(circle at 80% 50%, #818CF815 0%, transparent 50%)'
                    : '#050510',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dock position */}
      <div>
        <p className="text-[11px] text-z-dimmed mb-2">Dock position</p>
        <div className="flex gap-2">
          {(['bottom', 'left'] as const).map(pos => (
            <button
              key={pos}
              onClick={() => updateTheme({ dockPosition: pos })}
              className={`flex-1 py-2 text-[11px] rounded border transition-colors capitalize ${
                theme.dockPosition === pos
                  ? 'border-z-primary/50 text-z-primary bg-z-primary/10'
                  : 'border-z-border text-z-dimmed hover:border-z-primary/30 hover:text-z-text'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId = 'providers' | 'voice' | 'theme' | 'data';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'providers', label: 'Providers' },
  { id: 'voice', label: 'Voice' },
  { id: 'theme', label: 'Theme' },
  { id: 'data', label: 'Data' },
];

// ---------------------------------------------------------------------------
// SettingsApp
// ---------------------------------------------------------------------------
export default function SettingsApp() {
  const [activeTab, setActiveTab] = useState<TabId>('providers');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-z-border shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-z-primary text-z-primary'
                : 'border-transparent text-z-dimmed hover:text-z-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'providers' && <ProviderConfig />}
        {activeTab === 'voice' && <VoiceConfig />}
        {activeTab === 'theme' && <ThemeConfig />}
        {activeTab === 'data' && <MemoryConfig />}
      </div>
    </div>
  );
}
