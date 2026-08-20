// frontend/src/components/apps/assistant/VoiceWaveform.tsx
import { useRef, useEffect } from 'react';
import { useVoiceStore } from '../../../stores/voiceStore';

export default function VoiceWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = useVoiceStore((s) => s.status);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const bars = 20;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const active = status === 'listening' || status === 'speaking';
      const barWidth = w / bars - 2;

      for (let i = 0; i < bars; i++) {
        const height = active
          ? (Math.sin(Date.now() / 200 + i * 0.5) + 1) * h * 0.3 + h * 0.1
          : h * 0.05;
        const x = i * (barWidth + 2);
        const y = (h - height) / 2;
        ctx.fillStyle = active ? '#00F0FF' : '#64748B';
        ctx.fillRect(x, y, barWidth, height);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  return <canvas ref={canvasRef} width={160} height={40} className="rounded" />;
}
