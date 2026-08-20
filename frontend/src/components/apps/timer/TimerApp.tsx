import { useState, useEffect, useRef, useCallback } from 'react';
import Dexie, { type Table } from 'dexie';

// --- Dexie DB for reminders ---
interface Reminder {
  id?: number;
  name: string;
  durationMs: number;
  createdAt: number;
}

class TimerDB extends Dexie {
  reminders!: Table<Reminder, number>;
  constructor() {
    super('kanha-timer');
    this.version(1).stores({ reminders: '++id, createdAt' });
  }
}
const timerDB = new TimerDB();

// --- Helpers ---
function pad2(n: number) { return String(Math.floor(n)).padStart(2, '0'); }

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// Alarm via Web Audio API
function playAlarm() {
  try {
    const ctx = new AudioContext();
    const freqs = [880, 1100, 880, 1100];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {
    // AudioContext not available in test env
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

type TimerMode = 'stopwatch' | 'countdown';

export default function TimerApp() {
  const [mode, setMode] = useState<TimerMode>('stopwatch');

  // Stopwatch state
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0);
  const [swLaps, setSwLaps]       = useState<number[]>([]);
  const swStartRef = useRef<number>(0);
  const swAccumRef = useRef<number>(0);
  const swRafRef   = useRef<number>(0);

  // Countdown state
  const [cdHours, setCdHours]     = useState(0);
  const [cdMins, setCdMins]       = useState(5);
  const [cdSecs, setCdSecs]       = useState(0);
  const [cdRemaining, setCdRemaining] = useState(0);
  const [cdRunning, setCdRunning] = useState(false);
  const [cdFinished, setCdFinished] = useState(false);
  const cdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdEndRef = useRef<number>(0);

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderName, setReminderName] = useState('');
  const [reminderH, setReminderH] = useState(0);
  const [reminderM, setReminderM] = useState(1);
  const [reminderS, setReminderS] = useState(0);
  const [showReminders, setShowReminders] = useState(false);

  // Load reminders from IndexedDB
  useEffect(() => {
    timerDB.reminders.toArray().then(setReminders);
    requestNotificationPermission();
  }, []);

  // --- Stopwatch RAF loop ---
  const swTick = useCallback(() => {
    setSwElapsed(swAccumRef.current + (Date.now() - swStartRef.current));
    swRafRef.current = requestAnimationFrame(swTick);
  }, []);

  const startStopwatch = () => {
    swStartRef.current = Date.now();
    setSwRunning(true);
    swRafRef.current = requestAnimationFrame(swTick);
  };

  const stopStopwatch = () => {
    cancelAnimationFrame(swRafRef.current);
    swAccumRef.current += Date.now() - swStartRef.current;
    setSwRunning(false);
  };

  const resetStopwatch = () => {
    cancelAnimationFrame(swRafRef.current);
    swAccumRef.current = 0;
    setSwElapsed(0);
    setSwLaps([]);
    setSwRunning(false);
  };

  const recordLap = () => {
    setSwLaps(prev => [...prev, swElapsed]);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(swRafRef.current);
  }, [swTick]);

  // --- Countdown ---
  const totalCdMs = (cdHours * 3600 + cdMins * 60 + cdSecs) * 1000;

  const startCountdown = () => {
    if (totalCdMs <= 0) return;
    const end = Date.now() + (cdRemaining > 0 ? cdRemaining : totalCdMs);
    cdEndRef.current = end;
    setCdFinished(false);
    setCdRunning(true);
    cdIntervalRef.current = setInterval(() => {
      const rem = cdEndRef.current - Date.now();
      if (rem <= 0) {
        clearInterval(cdIntervalRef.current!);
        setCdRemaining(0);
        setCdRunning(false);
        setCdFinished(true);
        playAlarm();
        showNotification('Timer Complete', 'Your countdown has finished!');
      } else {
        setCdRemaining(rem);
      }
    }, 50);
  };

  const pauseCountdown = () => {
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    setCdRunning(false);
  };

  const resetCountdown = () => {
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    setCdRunning(false);
    setCdFinished(false);
    setCdRemaining(0);
  };

  useEffect(() => {
    return () => { if (cdIntervalRef.current) clearInterval(cdIntervalRef.current); };
  }, []);

  // --- Reminders ---
  const saveReminder = async () => {
    if (!reminderName.trim()) return;
    const dur = (reminderH * 3600 + reminderM * 60 + reminderS) * 1000;
    if (dur <= 0) return;
    const entry: Reminder = { name: reminderName.trim(), durationMs: dur, createdAt: Date.now() };
    const id = await timerDB.reminders.add(entry);
    setReminders(prev => [...prev, { ...entry, id }]);
    setReminderName('');
    setReminderH(0); setReminderM(1); setReminderS(0);
  };

  const deleteReminder = async (id: number) => {
    await timerDB.reminders.delete(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const loadReminder = (r: Reminder) => {
    const totalSec = Math.floor(r.durationMs / 1000);
    setCdHours(Math.floor(totalSec / 3600));
    setCdMins(Math.floor((totalSec % 3600) / 60));
    setCdSecs(totalSec % 60);
    setCdRemaining(0);
    resetCountdown();
    setMode('countdown');
    setShowReminders(false);
  };

  // Styles
  const btnBase = 'px-4 py-2 rounded-lg font-mono text-sm font-medium transition-all duration-150 active:scale-95 select-none cursor-pointer';
  const btnPrimary = `${btnBase} bg-z-primary/20 text-z-primary border border-z-primary/40 hover:bg-z-primary/30`;
  const btnDanger  = `${btnBase} bg-z-error/15 text-z-error border border-z-error/30 hover:bg-z-error/25`;
  const btnGhost   = `${btnBase} glass-panel text-z-dimmed hover:text-z-text`;

  const timeDisplay = mode === 'stopwatch'
    ? formatMs(swElapsed)
    : formatCountdown(cdRemaining > 0 ? cdRemaining : totalCdMs);

  const numInput = 'w-14 bg-transparent border border-z-border rounded-lg text-center font-mono text-xl text-z-text focus:outline-none focus:border-z-primary/50 py-1';

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">
      {/* Tab bar */}
      <div className="flex gap-1 glass-panel rounded-xl p-1">
        {(['stopwatch', 'countdown'] as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === m
                ? 'bg-z-primary/20 text-z-primary border border-z-primary/40'
                : 'text-z-dimmed hover:text-z-text'
            }`}
          >
            {m === 'stopwatch' ? 'Stopwatch' : 'Countdown'}
          </button>
        ))}
        <button
          onClick={() => setShowReminders(s => !s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            showReminders
              ? 'bg-z-secondary/20 text-z-secondary border border-z-secondary/40'
              : 'text-z-dimmed hover:text-z-text'
          }`}
        >
          Reminders
        </button>
      </div>

      {showReminders ? (
        /* Reminders panel */
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Create reminder */}
          <div className="glass-panel rounded-xl p-3 space-y-2">
            <p className="text-xs font-mono text-z-dimmed uppercase tracking-wider">New Reminder</p>
            <input
              type="text"
              value={reminderName}
              onChange={e => setReminderName(e.target.value)}
              placeholder="Reminder name..."
              className="w-full bg-transparent border border-z-border rounded-lg px-3 py-1.5 text-sm font-mono text-z-text placeholder-z-dimmed focus:outline-none focus:border-z-primary/50"
            />
            <div className="flex gap-2 items-center">
              <input type="number" min={0} max={99} value={reminderH}
                onChange={e => setReminderH(Number(e.target.value))}
                className={numInput} />
              <span className="text-z-dimmed font-mono">h</span>
              <input type="number" min={0} max={59} value={reminderM}
                onChange={e => setReminderM(Number(e.target.value))}
                className={numInput} />
              <span className="text-z-dimmed font-mono">m</span>
              <input type="number" min={0} max={59} value={reminderS}
                onChange={e => setReminderS(Number(e.target.value))}
                className={numInput} />
              <span className="text-z-dimmed font-mono">s</span>
              <button onClick={saveReminder} className={`${btnPrimary} ml-auto`}>Save</button>
            </div>
          </div>

          {/* Reminder list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {reminders.length === 0 && (
              <p className="text-xs font-mono text-z-dimmed text-center mt-4">No reminders saved</p>
            )}
            {reminders.map(r => (
              <div key={r.id} className="glass-panel rounded-xl p-3 flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-mono text-z-text">{r.name}</p>
                  <p className="text-xs font-mono text-z-dimmed">{formatCountdown(r.durationMs)}</p>
                </div>
                <button
                  onClick={() => loadReminder(r)}
                  className="text-xs font-mono px-2 py-1 rounded border border-z-primary/30 text-z-primary hover:bg-z-primary/10 transition-colors"
                >
                  Use
                </button>
                <button
                  onClick={() => r.id !== undefined && deleteReminder(r.id)}
                  className="text-xs font-mono px-2 py-1 rounded border border-z-error/30 text-z-error hover:bg-z-error/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : mode === 'stopwatch' ? (
        /* Stopwatch */
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-2 flex-1 max-h-[180px]">
            <p className={`text-4xl font-mono tracking-tight ${swRunning ? 'text-z-primary' : 'text-z-text'}`}>
              {timeDisplay}
            </p>
            {swLaps.length > 0 && (
              <p className="text-xs font-mono text-z-dimmed">Lap {swLaps.length + 1}</p>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {!swRunning ? (
              <button className={btnPrimary} onClick={startStopwatch}>
                {swElapsed > 0 ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button className={btnDanger} onClick={stopStopwatch}>Pause</button>
            )}
            {swRunning && (
              <button className={btnGhost} onClick={recordLap}>Lap</button>
            )}
            {!swRunning && swElapsed > 0 && (
              <button className={btnGhost} onClick={resetStopwatch}>Reset</button>
            )}
          </div>

          {/* Lap list */}
          {swLaps.length > 0 && (
            <div className="flex-1 overflow-y-auto glass-panel rounded-xl p-2 space-y-1">
              {[...swLaps].reverse().map((lap, i) => {
                const lapNum = swLaps.length - i;
                const prevLap = swLaps[lapNum - 2] ?? 0;
                const delta = lap - prevLap;
                return (
                  <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg hover:bg-z-glass">
                    <span className="text-xs font-mono text-z-dimmed">Lap {lapNum}</span>
                    <span className="text-sm font-mono text-z-text">{formatMs(lap)}</span>
                    <span className="text-xs font-mono text-z-primary">+{formatMs(delta)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Countdown */
        <div className="flex-1 flex flex-col gap-3">
          {/* Time display */}
          <div className={`glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-2 ${cdFinished ? 'glow-border' : ''}`}>
            <p className={`text-5xl font-mono tracking-tight transition-colors ${
              cdFinished ? 'text-z-warning' : cdRunning ? 'text-z-primary' : 'text-z-text'
            }`}>
              {timeDisplay}
            </p>
            {cdFinished && (
              <p className="text-xs font-mono text-z-warning animate-pulse">Time&apos;s up!</p>
            )}
          </div>

          {/* Set time (only when not running) */}
          {!cdRunning && !cdFinished && cdRemaining === 0 && (
            <div className="glass-panel rounded-xl p-3 flex gap-2 items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] font-mono text-z-dimmed uppercase">Hours</p>
                <input type="number" min={0} max={99} value={cdHours}
                  onChange={e => setCdHours(Number(e.target.value))}
                  className={numInput} />
              </div>
              <span className="text-2xl font-mono text-z-dimmed mt-4">:</span>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] font-mono text-z-dimmed uppercase">Minutes</p>
                <input type="number" min={0} max={59} value={cdMins}
                  onChange={e => setCdMins(Number(e.target.value))}
                  className={numInput} />
              </div>
              <span className="text-2xl font-mono text-z-dimmed mt-4">:</span>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] font-mono text-z-dimmed uppercase">Seconds</p>
                <input type="number" min={0} max={59} value={cdSecs}
                  onChange={e => setCdSecs(Number(e.target.value))}
                  className={numInput} />
              </div>
            </div>
          )}

          {/* Countdown controls */}
          <div className="flex gap-2 justify-center">
            {!cdRunning ? (
              <button className={btnPrimary} onClick={startCountdown}
                disabled={totalCdMs <= 0 && cdRemaining === 0}>
                {cdRemaining > 0 ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button className={btnDanger} onClick={pauseCountdown}>Pause</button>
            )}
            {(cdRunning || cdRemaining > 0 || cdFinished) && (
              <button className={btnGhost} onClick={resetCountdown}>Reset</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
