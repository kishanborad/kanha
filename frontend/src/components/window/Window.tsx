// frontend/src/components/window/Window.tsx
import { useCallback, Suspense } from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import TitleBar from './TitleBar';
import ErrorBoundary from '../shared/ErrorBoundary';
import type { WindowState } from '../../types';

interface WindowProps {
  state: WindowState;
  children: React.ReactNode;
}

export default function Window({ state, children }: WindowProps) {
  const { closeWindow, focusWindow, moveWindow, minimizeWindow, maximizeWindow, restoreWindow } = useWindowStore();

  const handleMove = useCallback(
    (dx: number, dy: number) => moveWindow(state.id, state.x + dx, state.y + dy),
    [state.id, state.x, state.y, moveWindow],
  );

  const { onMouseDown } = useWindowDrag({ onMove: handleMove });

  const handleMaxToggle = () => {
    if (state.maximized) restoreWindow(state.id);
    else maximizeWindow(state.id);
  };

  if (state.minimized) return null;

  const style = state.maximized
    ? { top: 0, left: 0, width: '100%', height: '100%', zIndex: state.zIndex }
    : { top: state.y, left: state.x, width: state.width, height: state.height, zIndex: state.zIndex };

  return (
    <div
      className="absolute glass-panel rounded-xl overflow-hidden shadow-2xl flex flex-col animate-[windowOpen_200ms_ease-out]"
      style={style}
      onMouseDown={() => focusWindow(state.id)}
    >
      <TitleBar
        title={state.title}
        onClose={() => closeWindow(state.id)}
        onMinimize={() => minimizeWindow(state.id)}
        onMaximize={handleMaxToggle}
        onMouseDown={onMouseDown}
      />
      <div className="flex-1 overflow-auto">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <span className="text-xs font-mono text-z-dimmed">Loading...</span>
            </div>
          }>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
