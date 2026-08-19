// frontend/src/stores/conversationStore.ts
import { create } from 'zustand';
import { db } from '../services/db';
import type { Conversation, Message } from '../types';

interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  create: (title?: string) => Promise<string>;
  setActive: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  updateTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  getActive: () => Conversation | undefined;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeId: null,
  loaded: false,

  load: async () => {
    const all = await db.conversations
      .orderBy('updatedAt')
      .reverse()
      .filter(c => !c.archived)
      .toArray();
    set({ conversations: all, loaded: true });
  },

  create: async (title) => {
    const id = crypto.randomUUID();
    const convo: Conversation = {
      id,
      title: title ?? 'New conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };
    await db.conversations.add(convo);
    set((s) => ({
      conversations: [convo, ...s.conversations],
      activeId: id,
    }));
    return id;
  },

  setActive: (id) => set({ activeId: id }),

  addMessage: async (conversationId, message) => {
    const convo = get().conversations.find((c) => c.id === conversationId);
    if (!convo) return;
    const updated = {
      ...convo,
      messages: [...convo.messages, message],
      updatedAt: Date.now(),
    };
    await db.conversations.put(updated);
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === conversationId ? updated : c)),
    }));
  },

  updateTitle: async (id, title) => {
    await db.conversations.update(id, { title });
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
  },

  deleteConversation: async (id) => {
    await db.conversations.delete(id);
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
  },

  getActive: () => {
    const { conversations, activeId } = get();
    return conversations.find((c) => c.id === activeId);
  },
}));
