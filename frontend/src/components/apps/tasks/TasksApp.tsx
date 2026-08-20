// frontend/src/components/apps/tasks/TasksApp.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import Dexie, { type Table } from 'dexie';
import TaskItem from './TaskItem';

// --- Types ---
export interface TaskEntry {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string; // ISO date string YYYY-MM-DD
  order: number;
  createdAt: number;
}

// --- Dedicated Dexie DB (kanha-tasks) ---
class TasksDB extends Dexie {
  tasks!: Table<TaskEntry, string>;
  constructor() {
    super('kanha-tasks');
    this.version(1).stores({ tasks: 'id, completed, order, createdAt' });
  }
}

const tasksDb = new TasksDB();

export default function TasksApp() {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskEntry['priority']>('medium');
  const [newDue, setNewDue] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragTargetRef = useRef<number | null>(null);

  // Load tasks ordered by `order` field
  useEffect(() => {
    tasksDb.tasks.orderBy('order').toArray().then(setTasks);
  }, []);

  const persistOrder = useCallback(async (ordered: TaskEntry[]) => {
    // Batch update order values — O(n)
    await tasksDb.tasks.bulkPut(ordered.map((t, i) => ({ ...t, order: i })));
  }, []);

  const handleAdd = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;
    const task: TaskEntry = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority: newPriority,
      dueDate: newDue || undefined,
      order: tasks.length,
      createdAt: Date.now(),
    };
    await tasksDb.tasks.add(task);
    setTasks(prev => [...prev, task]);
    setNewTitle('');
    setNewDue('');
  }, [newTitle, newPriority, newDue, tasks.length]);

  const handleToggle = useCallback(async (id: string) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      const updated = next.find(t => t.id === id)!;
      tasksDb.tasks.update(id, { completed: updated.completed });
      return next;
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await tasksDb.tasks.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- Drag-to-reorder via HTML5 DnD API ---
  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
    dragTargetRef.current = index;
  }, []);

  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => {
    dragTargetRef.current = index;
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
    if (draggingIndex === null || draggingIndex === dropIndex) return;
    setTasks(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggingIndex, 1);
      next.splice(dropIndex, 0, moved);
      // Async persist, don't block state update
      persistOrder(next);
      return next;
    });
  }, [draggingIndex, persistOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    dragTargetRef.current = null;
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  const filterBtn = (f: typeof filter) =>
    `text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
      filter === f
        ? 'bg-z-primary/15 text-z-primary border border-z-primary/30'
        : 'text-z-dimmed border border-z-border hover:text-z-text hover:border-z-border/60'
    }`;

  return (
    <div className="h-full flex flex-col gap-0 overflow-hidden">
      {/* Add task bar */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-z-border space-y-2">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task… (Enter to save)"
            className="flex-1 bg-z-glass border border-z-border rounded-lg px-3 py-1.5 text-xs font-mono text-z-text placeholder:text-z-dimmed outline-none focus:border-z-primary/40 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-z-primary/15 text-z-primary border border-z-primary/30 hover:bg-z-primary/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex gap-2 items-center">
          {/* Priority selector */}
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value as TaskEntry['priority'])}
            className="bg-z-glass border border-z-border rounded px-2 py-1 text-[10px] font-mono text-z-text outline-none cursor-pointer"
          >
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
          {/* Due date */}
          <input
            type="date"
            value={newDue}
            onChange={e => setNewDue(e.target.value)}
            className="bg-z-glass border border-z-border rounded px-2 py-1 text-[10px] font-mono text-z-dimmed outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 flex gap-1.5 px-3 py-2 border-b border-z-border">
        <button className={filterBtn('all')} onClick={() => setFilter('all')}>All ({tasks.length})</button>
        <button className={filterBtn('active')} onClick={() => setFilter('active')}>Active</button>
        <button className={filterBtn('completed')} onClick={() => setFilter('completed')}>Done</button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs font-mono text-z-dimmed">
              {filter === 'completed' ? 'No completed tasks yet' : 'No tasks — add one above'}
            </p>
          </div>
        )}
        {filtered.map((task, idx) => (
          <TaskItem
            key={task.id}
            task={task}
            index={idx}
            draggingIndex={draggingIndex}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Stats footer */}
      <div className="shrink-0 px-3 py-2 border-t border-z-border flex items-center justify-between">
        <span className="text-[10px] font-mono text-z-dimmed">
          {completedCount} of {tasks.length} completed
        </span>
        {completedCount > 0 && (
          <button
            onClick={async () => {
              const ids = tasks.filter(t => t.completed).map(t => t.id);
              await tasksDb.tasks.bulkDelete(ids);
              setTasks(prev => prev.filter(t => !t.completed));
            }}
            className="text-[10px] font-mono text-z-dimmed hover:text-z-error transition-colors"
          >
            Clear completed
          </button>
        )}
        {tasks.length > 0 && (
          <div
            className="h-1 w-24 bg-z-border rounded-full overflow-hidden"
            title={`${Math.round((completedCount / tasks.length) * 100)}% done`}
          >
            <div
              className="h-full bg-z-success transition-all duration-300"
              style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
