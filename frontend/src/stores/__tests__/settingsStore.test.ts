// frontend/src/stores/__tests__/settingsStore.test.ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import { ZarvisDB, db } from '../../services/db';

let testDb: ZarvisDB;

beforeEach(async () => {
  testDb = new ZarvisDB();
  await testDb.delete();
  testDb = new ZarvisDB();
  // Re-open the module-level singleton so the store can use it after the delete
  await db.open();
  useSettingsStore.setState({ settings: useSettingsStore.getState().settings, loaded: false });
});

describe('settingsStore', () => {
  it('loads default settings on first run', async () => {
    await useSettingsStore.getState().load();
    expect(useSettingsStore.getState().loaded).toBe(true);
    expect(useSettingsStore.getState().settings.activeProvider).toBe('openai');
  });

  it('sets active provider', async () => {
    await useSettingsStore.getState().load();
    useSettingsStore.getState().setActiveProvider('groq');
    expect(useSettingsStore.getState().settings.activeProvider).toBe('groq');
  });

  it('updates provider config', async () => {
    await useSettingsStore.getState().load();
    useSettingsStore.getState().updateProvider('openai', { apiKey: 'sk-test', enabled: true });
    expect(useSettingsStore.getState().settings.providers.openai.apiKey).toBe('sk-test');
  });

  it('marks booted', async () => {
    await useSettingsStore.getState().load();
    useSettingsStore.getState().markBooted();
    expect(useSettingsStore.getState().settings.hasBooted).toBe(true);
  });
});
