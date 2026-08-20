// frontend/src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import { useMemoryStore } from './stores/memoryStore';
import BootSequence from './components/desktop/BootSequence';
import Desktop from './components/desktop/Desktop';
import WindowManager from './components/window/WindowManager';
import { APP_REGISTRY, DOCK_APPS } from './registry/apps';

export default function App() {
  const { settings, loaded, load, markBooted } = useSettingsStore();
  const loadProfile = useMemoryStore((s) => s.loadProfile);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    load();
    loadProfile();
  }, [load, loadProfile]);

  const handleBootComplete = useCallback(() => {
    markBooted();
    setBooting(false);
  }, [markBooted]);

  if (!loaded) return null;

  // Skip boot if already booted this session
  const showBoot = booting && !settings.hasBooted;

  return (
    <>
      {showBoot && <BootSequence onComplete={handleBootComplete} />}
      <Desktop apps={DOCK_APPS}>
        <WindowManager registry={APP_REGISTRY} />
      </Desktop>
    </>
  );
}
