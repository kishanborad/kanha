// frontend/src/stores/__tests__/toastStore.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, addToast } from '../toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toastStore', () => {
  it('adds a toast with default type and duration', () => {
    useToastStore.getState().addToast('Hello world');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello world');
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].duration).toBe(5000);
  });

  it('adds a toast with custom type and duration', () => {
    useToastStore.getState().addToast('Error occurred', 'error', 8000);
    const { toasts } = useToastStore.getState();
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].duration).toBe(8000);
  });

  it('removes a toast by id', () => {
    useToastStore.getState().addToast('Msg A');
    useToastStore.getState().addToast('Msg B');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(2);
    const idA = toasts[0].id;
    useToastStore.getState().removeToast(idA);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Msg B');
  });

  it('enforces max 5 toasts, dropping oldest', () => {
    for (let i = 1; i <= 6; i++) {
      useToastStore.getState().addToast(`Toast ${i}`);
    }
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(5);
    // Oldest (Toast 1) should be gone; newest (Toast 6) should be present
    expect(toasts.find((t) => t.message === 'Toast 1')).toBeUndefined();
    expect(toasts[toasts.length - 1].message).toBe('Toast 6');
  });

  it('generates unique ids for each toast', () => {
    useToastStore.getState().addToast('A');
    useToastStore.getState().addToast('B');
    const { toasts } = useToastStore.getState();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('convenience addToast function works', () => {
    addToast('Quick message', 'success', 3000);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
  });

  it('removes a non-existent id silently', () => {
    useToastStore.getState().addToast('Msg');
    useToastStore.getState().removeToast('non-existent-id');
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
