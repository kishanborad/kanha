// frontend/src/hooks/useWindowDrag.ts
import { useRef, useCallback, useEffect } from 'react';

interface UseDragOptions {
  onMove: (x: number, y: number) => void;
  onEnd?: () => void;
}

export function useWindowDrag({ onMove, onEnd }: UseDragOptions) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - offset.current.x;
      const dy = e.clientY - offset.current.y;
      offset.current = { x: e.clientX, y: e.clientY };
      onMove(dx, dy);
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      onEnd?.();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMove, onEnd]);

  return { onMouseDown };
}
