// frontend/src/components/desktop/Dock.tsx
import { useWindowStore } from '../../stores/windowStore';
import type { AppDefinition } from '../../types';

interface DockProps {
  apps: AppDefinition[];
}

export default function Dock({ apps }: DockProps) {
  const { openWindow, windows, focusWindow } = useWindowStore();

  const handleClick = (app: AppDefinition) => {
    if (app.singleton) {
      // O(n) scan but n = number of open windows, always small
      for (const [id, win] of windows) {
        if (win.appId === app.id) {
          focusWindow(id);
          return;
        }
      }
    }
    openWindow(app.id, {
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      title: app.name,
    });
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-2xl px-2 py-1.5 flex items-center gap-1">
      {apps.map((app) => {
        const Icon = app.icon;
        const isOpen = Array.from(windows.values()).some((w) => w.appId === app.id);
        return (
          <button
            key={app.id}
            onClick={() => handleClick(app)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 hover:scale-110 transition-all duration-200 cursor-pointer group"
            title={app.name}
          >
            <Icon className="w-5 h-5 text-z-text group-hover:text-z-primary transition-colors" />
            {isOpen && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-z-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
