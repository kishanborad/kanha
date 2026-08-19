import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ZarvisDB } from '../db';

let db: ZarvisDB;

beforeEach(async () => {
  db = new ZarvisDB();
  await db.delete();
  db = new ZarvisDB();
});

describe('ZarvisDB', () => {
  it('stores and retrieves a conversation', async () => {
    const convo = {
      id: 'c1',
      title: 'Test',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };
    await db.conversations.add(convo);
    const result = await db.conversations.get('c1');
    expect(result?.title).toBe('Test');
  });

  it('stores and retrieves knowledge entries by tag', async () => {
    await db.knowledge.add({
      id: 'k1',
      content: 'Server IP is 192.168.1.50',
      category: 'fact',
      tags: ['server', 'network'],
      createdAt: Date.now(),
      source: 'user',
    });
    const results = await db.knowledge.where('tags').equals('server').toArray();
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('192.168');
  });

  it('stores and retrieves user profile', async () => {
    await db.profile.put({
      id: 'default',
      name: 'Kishan',
      preferences: { tone: 'formal' },
      topics: ['coding'],
      lastUpdated: Date.now(),
    });
    const profile = await db.profile.get('default');
    expect(profile?.name).toBe('Kishan');
  });

  it('stores settings with nested objects', async () => {
    const settings = {
      id: 'default',
      activeProvider: 'openai',
      providers: { openai: { id: 'openai', enabled: true } },
      voice: { rate: 1, pitch: 1, volume: 1, wakeWordEnabled: false },
      theme: { accentColor: '#00F0FF', wallpaper: 'particles', dockPosition: 'bottom' as const },
      cleanupDays: 90 as const,
      hasBooted: false,
    };
    await db.settings.put(settings);
    const result = await db.settings.get('default');
    expect(result?.activeProvider).toBe('openai');
  });
});
