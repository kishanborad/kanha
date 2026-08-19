// frontend/src/components/desktop/Desktop.tsx
import TopBar from './TopBar';
import Dock from './Dock';
import Wallpaper from './Wallpaper';
import type { AppDefinition } from '../../types';

interface DesktopProps {
  apps: AppDefinition[];
  children: React.ReactNode; // WindowManager goes here
}

export default function Desktop({ apps, children }: DesktopProps) {
  return (
    <div className="h-screen w-screen bg-z-bg overflow-hidden">
      <Wallpaper />
      <TopBar />
      <div className="absolute inset-0 pt-8 pb-16 z-10">
        {children}
      </div>
      <Dock apps={apps} />
    </div>
  );
}
