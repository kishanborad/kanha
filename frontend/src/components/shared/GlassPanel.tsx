// frontend/src/components/shared/GlassPanel.tsx
import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  padding?: string;
}

export default function GlassPanel({ children, className = '', glow = false, padding }: GlassPanelProps) {
  const glowClass = glow ? ' glow-border' : '';
  const paddingStyle = padding ? { padding } : undefined;

  return (
    <div
      className={`glass-panel${glowClass}${className ? ` ${className}` : ''}`}
      style={paddingStyle}
    >
      {children}
    </div>
  );
}
