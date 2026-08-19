// frontend/src/stores/__tests__/windowStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../windowStore';

beforeEach(() => {
  useWindowStore.setState({ windows: new Map(), nextZIndex: 1 });
});

describe('windowStore', () => {
  it('opens a window and assigns incrementing zIndex', () => {
    const id1 = useWindowStore.getState().openWindow('assistant', { width: 800, height: 600, title: 'Assistant' });
    const id2 = useWindowStore.getState().openWindow('notes', { width: 600, height: 400, title: 'Notes' });
    const w1 = useWindowStore.getState().windows.get(id1)!;
    const w2 = useWindowStore.getState().windows.get(id2)!;
    expect(w2.zIndex).toBeGreaterThan(w1.zIndex);
  });

  it('closes a window by id in O(1)', () => {
    const id = useWindowStore.getState().openWindow('notes', { width: 600, height: 400, title: 'Notes' });
    expect(useWindowStore.getState().windows.size).toBe(1);
    useWindowStore.getState().closeWindow(id);
    expect(useWindowStore.getState().windows.size).toBe(0);
  });

  it('focuses a window by bumping zIndex', () => {
    const id1 = useWindowStore.getState().openWindow('a', { width: 100, height: 100, title: 'A' });
    useWindowStore.getState().openWindow('b', { width: 100, height: 100, title: 'B' });
    useWindowStore.getState().focusWindow(id1);
    const w = useWindowStore.getState().windows.get(id1)!;
    expect(w.zIndex).toBe(useWindowStore.getState().nextZIndex - 1);
  });

  it('minimizes and restores a window', () => {
    const id = useWindowStore.getState().openWindow('a', { width: 100, height: 100, title: 'A' });
    useWindowStore.getState().minimizeWindow(id);
    expect(useWindowStore.getState().windows.get(id)!.minimized).toBe(true);
    useWindowStore.getState().restoreWindow(id);
    expect(useWindowStore.getState().windows.get(id)!.minimized).toBe(false);
  });

  it('moves a window', () => {
    const id = useWindowStore.getState().openWindow('a', { width: 100, height: 100, title: 'A' });
    useWindowStore.getState().moveWindow(id, 500, 300);
    const w = useWindowStore.getState().windows.get(id)!;
    expect(w.x).toBe(500);
    expect(w.y).toBe(300);
  });

  it('getWindowList returns array', () => {
    useWindowStore.getState().openWindow('a', { width: 100, height: 100, title: 'A' });
    useWindowStore.getState().openWindow('b', { width: 100, height: 100, title: 'B' });
    expect(useWindowStore.getState().getWindowList()).toHaveLength(2);
  });
});
