import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { getProvider } from '../providers/registry';
import type { LLMProvider } from '../types';

export function useProvider(): LLMProvider | null {
  const settings = useSettingsStore((s) => s.settings);
  const { activeProvider, providers } = settings;

  return useMemo(() => {
    const config = providers[activeProvider];
    if (!config?.apiKey) return null;
    return getProvider(activeProvider, config.apiKey);
  }, [activeProvider, providers]);
}
