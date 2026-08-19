// frontend/src/components/window/WindowManager.tsx
import { useWindowStore } from '../../stores/windowStore';
import Window from './Window';
import type { AppDefinition } from '../../types';

interface WindowManagerProps {
  registry: Map<string, AppDefinition>;
}

export default function WindowManager({ registry }: WindowManagerProps) {
  const windows = useWindowStore((s) => s.windows);

  return (
    <>
      {Array.from(windows.values()).map((win) => {
        const app = registry.get(win.appId);
        if (!app) return null;
        const AppComponent = app.component;
        return (
          <Window key={win.id} state={win}>
            <AppComponent />
          </Window>
        );
      })}
    </>
  );
}
