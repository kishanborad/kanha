// frontend/src/stores/windowStore.ts
import { create } from 'zustand';
import type { WindowState } from '../types';

interface WindowStoreState {
  windows: Map<string, WindowState>;
  nextZIndex: number;
  openWindow: (appId: string, defaults: { width: number; height: number; title: string }) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  getWindowList: () => WindowState[];
}

let windowIdCounter = 0;

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: new Map(),
  nextZIndex: 1,

  openWindow: (appId, defaults) => {
    const id = `win-${++windowIdCounter}`;
    const state = get();
    // O(1) — Map.set
    const win: WindowState = {
      id,
      appId,
      title: defaults.title,
      x: 100 + (state.windows.size % 5) * 30,
      y: 80 + (state.windows.size % 5) * 30,
      width: defaults.width,
      height: defaults.height,
      zIndex: state.nextZIndex,
      minimized: false,
      maximized: false,
    };
    const next = new Map(state.windows);
    next.set(id, win);
    set({ windows: next, nextZIndex: state.nextZIndex + 1 });
    return id;
  },

  closeWindow: (id) => {
    // O(1) — Map.delete
    const next = new Map(get().windows);
    next.delete(id);
    set({ windows: next });
  },

  focusWindow: (id) => {
    // O(1) — single counter bump + Map.set
    const state = get();
    const win = state.windows.get(id);
    if (!win) return;
    const next = new Map(state.windows);
    next.set(id, { ...win, zIndex: state.nextZIndex, minimized: false });
    set({ windows: next, nextZIndex: state.nextZIndex + 1 });
  },

  moveWindow: (id, x, y) => {
    const win = get().windows.get(id);
    if (!win) return;
    const next = new Map(get().windows);
    next.set(id, { ...win, x, y });
    set({ windows: next });
  },

  resizeWindow: (id, width, height) => {
    const win = get().windows.get(id);
    if (!win) return;
    const next = new Map(get().windows);
    next.set(id, { ...win, width, height });
    set({ windows: next });
  },

  minimizeWindow: (id) => {
    const win = get().windows.get(id);
    if (!win) return;
    const next = new Map(get().windows);
    next.set(id, { ...win, minimized: true });
    set({ windows: next });
  },

  maximizeWindow: (id) => {
    const win = get().windows.get(id);
    if (!win) return;
    const next = new Map(get().windows);
    next.set(id, { ...win, maximized: true });
    set({ windows: next });
  },

  restoreWindow: (id) => {
    const win = get().windows.get(id);
    if (!win) return;
    const next = new Map(get().windows);
    next.set(id, { ...win, maximized: false, minimized: false });
    set({ windows: next });
  },

  getWindowList: () => Array.from(get().windows.values()),
}));
