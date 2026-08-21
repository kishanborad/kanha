// frontend/src/components/shared/OfflineBanner.tsx
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[9998] flex items-center justify-center gap-2 px-4 py-2 bg-z-warning/20 border-b border-z-warning/40 backdrop-blur-sm"
    >
      <span className="text-z-warning text-xs font-mono">⚠</span>
      <p className="text-z-warning text-xs font-mono">
        You are offline. Some features may not be available.
      </p>
    </div>
  );
}
