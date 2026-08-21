// frontend/src/components/shared/ResponsiveDisclaimer.tsx

export default function ResponsiveDisclaimer() {
  return (
    <div className="md:hidden fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-z-bg/95 backdrop-blur-xl">
      <div className="glass-panel glow-border rounded-2xl p-8 max-w-xs text-center">
        <div className="text-4xl mb-4">🖥</div>
        <h2 className="text-z-primary font-mono text-sm font-semibold mb-3 uppercase tracking-widest">
          Desktop Required
        </h2>
        <p className="text-z-text text-xs leading-relaxed">
          Kanha is designed for tablets (768px+) and desktops. Please use a larger screen for the
          best experience.
        </p>
        <div className="mt-6 h-px bg-z-border" />
        <p className="mt-4 text-z-dimmed text-[10px] font-mono">
          Minimum: 768px wide
        </p>
      </div>
    </div>
  );
}
