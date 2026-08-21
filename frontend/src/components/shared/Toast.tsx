// frontend/src/components/shared/Toast.tsx
import { useEffect, useRef, useState } from 'react';
import { useToastStore, type Toast as ToastItem, type ToastType } from '../../stores/toastStore';

// ─── Color map for type bar + icon ───────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { bar: string; icon: string; label: string }> = {
  info: {
    bar: 'bg-z-primary',
    icon: 'ℹ',
    label: 'Info',
  },
  success: {
    bar: 'bg-z-success',
    icon: '✓',
    label: 'Success',
  },
  warning: {
    bar: 'bg-z-warning',
    icon: '⚠',
    label: 'Warning',
  },
  error: {
    bar: 'bg-z-error',
    icon: '✕',
    label: 'Error',
  },
};

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: ToastItem }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  useEffect(() => {
    // Trigger slide-in on next frame
    const raf = requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after duration
    timerRef.current = setTimeout(() => dismiss(), toast.duration);

    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = TYPE_CONFIG[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        transition: 'opacity 300ms ease, transform 300ms ease',
        opacity: exiting ? 0 : visible ? 1 : 0,
        transform: exiting
          ? 'translateX(110%)'
          : visible
          ? 'translateX(0)'
          : 'translateX(110%)',
      }}
      className="relative flex items-stretch glass-panel rounded-lg overflow-hidden min-w-[280px] max-w-[360px] shadow-z-glow-sm"
    >
      {/* Left color bar */}
      <div className={`w-1 shrink-0 ${cfg.bar}`} />

      {/* Content */}
      <div className="flex items-center gap-3 px-3 py-3 flex-1">
        <span className="text-sm font-mono leading-none" aria-hidden="true">
          {cfg.icon}
        </span>
        <span className="text-xs text-z-text leading-relaxed flex-1">{toast.message}</span>
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="shrink-0 px-3 text-z-dimmed hover:text-z-text transition-colors cursor-pointer"
      >
        <span className="text-xs font-mono">×</span>
      </button>
    </div>
  );
}

// ─── Toast stack container ────────────────────────────────────────────────────

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
