// frontend/src/components/apps/terminal/TerminalApp.tsx
import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { useMemoryStore } from '../../../stores/memoryStore';
import { useConversationStore } from '../../../stores/conversationStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { searchWeb } from '../../../services/search';
import { getAvailableProviders } from '../../../providers/registry';
import type { SearchResult } from '../../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LineKind = 'output' | 'command' | 'error' | 'matrix';

interface OutputLine {
  id: string;
  kind: LineKind;
  text: string;
}

// ---------------------------------------------------------------------------
// Matrix rain frame generator — no eval, O(cols) per frame
// ---------------------------------------------------------------------------
const MATRIX_CHARS = 'アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロ0123456789';

function makeMatrixLine(cols: number): string {
  let line = '';
  for (let i = 0; i < cols; i++) {
    if (Math.random() > 0.7) {
      line += MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    } else {
      line += ' ';
    }
  }
  return line;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const startTime = Date.now();

function formatUptime(): string {
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

function makeLines(...texts: string[]): OutputLine[] {
  return texts.map(text => ({ id: makeId(), kind: 'output' as LineKind, text }));
}

function makeError(...texts: string[]): OutputLine[] {
  return texts.map(text => ({ id: makeId(), kind: 'error' as LineKind, text }));
}

// ---------------------------------------------------------------------------
// HELP text
// ---------------------------------------------------------------------------
const HELP_TEXT = [
  'Available commands:',
  '',
  '  help              Show this help',
  '  clear             Clear terminal',
  '  whoami            Show user profile name',
  '  memory status     Show memory statistics',
  '  providers list    List LLM providers',
  '  search <query>    Search the web',
  '  history           Show recent conversations',
  '  export            Export all data as JSON',
  '  version           Show Kanha version',
  '  date              Show current date/time',
  '  uptime            Show session uptime',
  '',
  '  sudo              (try it)',
  '  rm -rf /          (try it)',
  '  matrix            (try it)',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TerminalApp() {
  const [lines, setLines] = useState<OutputLine[]>([
    { id: makeId(), kind: 'output', text: 'Kanha Terminal v1.0.0' },
    { id: makeId(), kind: 'output', text: 'Type "help" for a list of commands.' },
    { id: makeId(), kind: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matrixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stores
  const profile = useMemoryStore(s => s.profile);
  const conversations = useConversationStore(s => s.conversations);
  const settings = useSettingsStore(s => s.settings);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup matrix timer on unmount
  useEffect(() => {
    return () => {
      if (matrixTimerRef.current) clearInterval(matrixTimerRef.current);
    };
  }, []);

  const append = useCallback((newLines: OutputLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  // ---------------------------------------------------------------------------
  // Matrix easter egg
  // ---------------------------------------------------------------------------
  const runMatrix = useCallback(() => {
    if (matrixActive) return;
    setMatrixActive(true);
    const cols = 60;
    let elapsed = 0;
    matrixTimerRef.current = setInterval(() => {
      elapsed += 150;
      setLines(prev => [
        ...prev,
        { id: makeId(), kind: 'matrix', text: makeMatrixLine(cols) },
      ]);
      if (elapsed >= 5000) {
        if (matrixTimerRef.current) clearInterval(matrixTimerRef.current);
        matrixTimerRef.current = null;
        setMatrixActive(false);
        setLines(prev => [
          ...prev,
          { id: makeId(), kind: 'output', text: '' },
          { id: makeId(), kind: 'output', text: 'Wake up, Neo…' },
          { id: makeId(), kind: 'output', text: '' },
        ]);
      }
    }, 150);
  }, [matrixActive]);

  // ---------------------------------------------------------------------------
  // Export helper
  // ---------------------------------------------------------------------------
  const triggerExport = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      conversations,
      settings,
      profile,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanha-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversations, settings, profile]);

  // ---------------------------------------------------------------------------
  // Command router — O(1) Map lookup for top-level tokens
  // ---------------------------------------------------------------------------
  const COMMANDS = useRef(new Map<string, (args: string[]) => Promise<OutputLine[]> | OutputLine[]>());

  useEffect(() => {
    // Rebuild on store updates so closures stay fresh
    const map = COMMANDS.current;
    map.clear();

    map.set('help', () => makeLines(...HELP_TEXT));

    map.set('clear', () => {
      setLines([]);
      return [];
    });

    map.set('whoami', () => {
      const name = profile?.name ?? 'anonymous';
      return makeLines(`${name}`);
    });

    map.set('memory', (args) => {
      if (args[0] === 'status') {
        const name = profile?.name ?? 'anonymous';
        const topics = profile?.topics?.length ?? 0;
        return makeLines(
          'Memory Status',
          '─────────────',
          `  User       : ${name}`,
          `  Topics     : ${topics}`,
          `  Provider   : ${settings.activeProvider}`,
        );
      }
      return makeError(`Unknown subcommand: memory ${args.join(' ')}`);
    });

    map.set('providers', (args) => {
      if (args[0] === 'list') {
        const providers = getAvailableProviders();
        const active = settings.activeProvider;
        return makeLines(
          'LLM Providers',
          '─────────────',
          ...providers.map(p =>
            `  ${p.id === active ? '▶' : ' '} ${p.name.padEnd(14)} ${p.requiresProxy ? '[proxy]' : '[direct]'}`,
          ),
        );
      }
      return makeError(`Unknown subcommand: providers ${args.join(' ')}`);
    });

    map.set('search', async (args) => {
      if (args.length === 0) return makeError('Usage: search <query>');
      const query = args.join(' ');
      const loading: OutputLine = { id: makeId(), kind: 'output', text: `Searching for "${query}"…` };
      setLines(prev => [...prev, loading]);
      try {
        const results: SearchResult[] = await searchWeb(query, { maxResults: 5 });
        if (results.length === 0) return makeLines('No results found.');
        return makeLines(
          `Results for "${query}":`,
          '',
          ...results.flatMap(r => [
            `  ${r.position}. ${r.title}`,
            `     ${r.url}`,
            `     ${r.snippet.slice(0, 120)}${r.snippet.length > 120 ? '…' : ''}`,
            '',
          ]),
        );
      } catch {
        return makeError('Search failed. Check network.');
      }
    });

    map.set('history', () => {
      if (conversations.length === 0) return makeLines('No conversations found.');
      const recent = conversations.slice(0, 10);
      return makeLines(
        'Recent Conversations',
        '────────────────────',
        ...recent.map((c, i) => {
          const d = new Date(c.updatedAt).toLocaleDateString();
          return `  ${(i + 1).toString().padStart(2)}. [${d}] ${c.title}`;
        }),
      );
    });

    map.set('export', () => {
      triggerExport();
      return makeLines('Export triggered — check your Downloads folder.');
    });

    map.set('version', () => makeLines('Kanha v1.0.0'));

    map.set('date', () => makeLines(new Date().toString()));

    map.set('uptime', () => makeLines(`Session uptime: ${formatUptime()}`));

    // Easter eggs
    map.set('sudo', () => makeLines("Nice try. Kanha doesn't need sudo."));

    map.set('rm', (args) => {
      if (args.includes('-rf') || args.includes('-r')) {
        return makeLines('I appreciate your enthusiasm, but no.');
      }
      return makeError(`rm: command not fully supported in this environment`);
    });

    map.set('matrix', () => {
      runMatrix();
      return makeLines('Initiating matrix protocol…');
    });
  }, [profile, conversations, settings, triggerExport, runMatrix]);

  // ---------------------------------------------------------------------------
  // Run command
  // ---------------------------------------------------------------------------
  const runCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Log command to output
    const cmdLine: OutputLine = { id: makeId(), kind: 'command', text: `kanha> ${trimmed}` };
    setLines(prev => [...prev, cmdLine]);

    // Update history
    setCmdHistory(prev => [trimmed, ...prev].slice(0, 100));
    setHistIdx(-1);

    const tokens = trimmed.toLowerCase().split(/\s+/);
    const verb = tokens[0];
    const args = tokens.slice(1);

    setBusy(true);
    try {
      const handler = COMMANDS.current.get(verb);
      if (!handler) {
        append(makeError(`Command not found: ${verb}. Type "help" for available commands.`));
      } else {
        const result = await handler(args);
        if (result.length > 0) {
          append(result);
        }
      }
    } finally {
      setBusy(false);
      append([{ id: makeId(), kind: 'output', text: '' }]);
    }
  }, [append]);

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!busy) {
        runCommand(input);
        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : cmdHistory[next]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }, [busy, input, runCommand, histIdx, cmdHistory]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="h-full flex flex-col overflow-hidden font-mono text-xs"
      style={{ background: '#0a0a0a', color: '#00FF41' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0 select-text">
        {lines.map(line => (
          <pre
            key={line.id}
            style={{
              color:
                line.kind === 'error'
                  ? '#FF5555'
                  : line.kind === 'command'
                  ? '#88FF88'
                  : line.kind === 'matrix'
                  ? `hsl(${Math.floor(Math.random() * 40 + 100)}, 100%, ${Math.floor(Math.random() * 30 + 50)}%)`
                  : '#00FF41',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              lineHeight: '1.5',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {line.text}
          </pre>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #00FF4120' }} />

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span style={{ color: '#00FF41', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
          kanha&gt;
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00FF41',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            caretColor: '#00FF41',
          }}
        />
        {/* Blinking cursor overlay when input is empty */}
        {input === '' && (
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '14px',
              background: '#00FF41',
              animation: 'blink 1s step-end infinite',
              marginLeft: '-8px',
            }}
          />
        )}
      </div>

      {/* Cursor blink keyframe injected once */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
