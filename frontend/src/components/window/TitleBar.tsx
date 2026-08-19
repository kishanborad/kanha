// frontend/src/components/window/TitleBar.tsx
interface TitleBarProps {
  title: string;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function TitleBar({ title, onClose, onMinimize, onMaximize, onMouseDown }: TitleBarProps) {
  return (
    <div
      className="h-8 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none border-b border-z-border"
      onMouseDown={onMouseDown}
    >
      <span className="text-[11px] font-mono text-z-dimmed truncate">{title}</span>
      <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-z-warning/80 hover:bg-z-warning cursor-pointer" />
        <button onClick={onMaximize} className="w-3 h-3 rounded-full bg-z-success/80 hover:bg-z-success cursor-pointer" />
        <button onClick={onClose} className="w-3 h-3 rounded-full bg-z-error/80 hover:bg-z-error cursor-pointer" />
      </div>
    </div>
  );
}
