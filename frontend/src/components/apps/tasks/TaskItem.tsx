// frontend/src/components/apps/tasks/TaskItem.tsx
import type { TaskEntry } from './TasksApp';

interface TaskItemProps {
  task: TaskEntry;
  index: number;
  draggingIndex: number | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

const PRIORITY_DOT: Record<TaskEntry['priority'], string> = {
  high: 'bg-z-error',
  medium: 'bg-z-warning',
  low: 'bg-z-success',
};

const PRIORITY_LABEL: Record<TaskEntry['priority'], string> = {
  high: 'H',
  medium: 'M',
  low: 'L',
};

function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export default function TaskItem({
  task,
  index,
  draggingIndex,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TaskItemProps) {
  const overdue = !task.completed && isOverdue(task.dueDate);
  const isDragging = draggingIndex === index;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(e, index); }}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-150 group cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 border-z-primary/40 bg-z-primary/5'
          : 'border-z-border glass-panel hover:border-z-border/80'
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      {/* Drag handle */}
      <span className="text-z-dimmed/40 text-xs select-none shrink-0 group-hover:text-z-dimmed transition-colors">⠿</span>

      {/* Priority dot */}
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`}
        title={`Priority: ${task.priority}`}
      />

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-3.5 h-3.5 shrink-0 accent-[#00F0FF] cursor-pointer"
      />

      {/* Title */}
      <span className={`flex-1 text-xs font-mono min-w-0 truncate ${
        task.completed ? 'line-through text-z-dimmed' : 'text-z-text'
      }`}>
        {task.title}
      </span>

      {/* Priority badge */}
      <span className={`text-[9px] font-mono shrink-0 px-1 rounded ${
        task.priority === 'high'
          ? 'text-z-error bg-z-error/10'
          : task.priority === 'medium'
          ? 'text-z-warning bg-z-warning/10'
          : 'text-z-success bg-z-success/10'
      }`}>
        {PRIORITY_LABEL[task.priority]}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className={`text-[9px] font-mono shrink-0 ${overdue ? 'text-z-error' : 'text-z-dimmed'}`}>
          {overdue ? '⚠ ' : ''}{task.dueDate}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-z-dimmed hover:text-z-error text-xs transition-all shrink-0 ml-1"
        title="Delete task"
      >
        ×
      </button>
    </div>
  );
}
