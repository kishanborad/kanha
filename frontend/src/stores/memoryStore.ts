// frontend/src/stores/memoryStore.ts
import { create } from 'zustand';
import { db } from '../services/db';
import type { UserProfile, KnowledgeEntry } from '../types';

interface MemoryState {
  profile: UserProfile | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addKnowledge: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt'>) => Promise<string>;
  searchKnowledge: (query: string, limit?: number) => Promise<KnowledgeEntry[]>;
  deleteKnowledge: (id: string) => Promise<void>;
  getKnowledgeByCategory: (category: KnowledgeEntry['category']) => Promise<KnowledgeEntry[]>;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  profile: null,

  loadProfile: async () => {
    let profile = await db.profile.get('default');
    if (!profile) {
      profile = { id: 'default', preferences: {}, topics: [], lastUpdated: Date.now() };
      await db.profile.put(profile);
    }
    set({ profile });
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...updates, lastUpdated: Date.now() };
    await db.profile.put(updated);
    set({ profile: updated });
  },

  addKnowledge: async (entry) => {
    const id = crypto.randomUUID();
    const full: KnowledgeEntry = { ...entry, id, createdAt: Date.now() };
    await db.knowledge.add(full);
    return id;
  },

  // O(n) scan with early termination via limit
  searchKnowledge: async (query, limit = 5) => {
    const lower = query.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const all = await db.knowledge.toArray();
    const scored: Array<{ entry: KnowledgeEntry; score: number }> = [];

    for (const entry of all) {
      const text = (entry.content + ' ' + entry.tags.join(' ')).toLowerCase();
      let score = 0;
      for (const word of words) {
        if (text.includes(word)) score++;
      }
      if (score > 0) scored.push({ entry, score });
    }

    // O(n log n) sort — acceptable for small knowledge base
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.entry);
  },

  deleteKnowledge: async (id) => {
    await db.knowledge.delete(id);
  },

  getKnowledgeByCategory: async (category) => {
    return db.knowledge.where('category').equals(category).toArray();
  },
}));
