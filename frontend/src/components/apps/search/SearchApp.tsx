// frontend/src/components/apps/search/SearchApp.tsx
import { useState, useCallback, useRef } from 'react';
import { useSearch } from '../../../hooks/useSearch';
import ResultCard from './ResultCard';
import type { SearchResult } from '../../../types';

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'news', label: 'News' },
  { id: 'it', label: 'Tech' },
  { id: 'science', label: 'Science' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

const MAX_HISTORY = 10;

export default function SearchApp() {
  const { results, loading, error, search, clear } = useSearch();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId>('general');
  // In-memory history — no persistence needed per spec
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addToHistory = useCallback((q: string) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h !== q);
      return [q, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const handleSearch = useCallback((q: string, cat: CategoryId = category) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addToHistory(trimmed);
    setShowHistory(false);
    search(trimmed, cat);
  }, [search, addToHistory, category]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(query);
    if (e.key === 'Escape') {
      setShowHistory(false);
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowDown' && showHistory) e.preventDefault(); // future: keyboard nav
  };

  const handleClear = useCallback(() => {
    setQuery('');
    clear();
    inputRef.current?.focus();
  }, [clear]);

  const handleAskKanha = useCallback((result: SearchResult) => {
    // Placeholder: copy context to clipboard as fallback until window messaging is wired
    const text = `Context from search:\n\n${result.title}\n${result.url}\n\n${result.snippet}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    // Could dispatch a custom event to open assistant here in a future integration
    alert(`Copied result context to clipboard. Paste it into the Assistant for Kanha to analyse.\n\n"${result.title}"`);
  }, []);

  const catBtnClass = (id: CategoryId) =>
    `text-[10px] font-mono px-2.5 py-1 rounded border transition-colors ${
      category === id
        ? 'bg-z-primary/15 text-z-primary border-z-primary/30'
        : 'text-z-dimmed border-z-border hover:text-z-text hover:border-z-border/60'
    }`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-z-border space-y-2">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setShowHistory(e.target.value === '' && history.length > 0); }}
              onFocus={() => setShowHistory(query === '' && history.length > 0)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="Search the web…"
              className="w-full bg-z-glass border border-z-border rounded-lg pl-3 pr-8 py-2 text-sm font-mono text-z-text placeholder:text-z-dimmed outline-none focus:border-z-primary/40 transition-colors"
            />
            {query && (
              <button
                onMouseDown={e => { e.preventDefault(); handleClear(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-z-dimmed hover:text-z-text text-xs"
              >
                ×
              </button>
            )}

            {/* History dropdown */}
            {showHistory && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-lg border border-z-border shadow-lg z-10 overflow-hidden">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onMouseDown={e => { e.preventDefault(); setQuery(h); handleSearch(h); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-z-dimmed hover:text-z-text hover:bg-z-glass transition-colors flex items-center gap-2"
                  >
                    <span className="text-z-dimmed/50 text-[10px]">↻</span>
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleSearch(query)}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-lg text-xs font-mono bg-z-primary/15 text-z-primary border border-z-primary/30 hover:bg-z-primary/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={catBtnClass(c.id)}
              onClick={() => { setCategory(c.id); if (query.trim()) handleSearch(query, c.id); }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results / states */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {/* Error */}
        {error && (
          <div className="glass-panel rounded-lg p-3 border border-z-error/20 text-xs font-mono text-z-error">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-xl p-3 border border-z-border animate-pulse space-y-1.5">
                <div className="h-3 bg-z-border/60 rounded w-3/4" />
                <div className="h-2.5 bg-z-border/40 rounded w-1/2" />
                <div className="h-2 bg-z-border/30 rounded w-full" />
                <div className="h-2 bg-z-border/30 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <p className="text-[10px] font-mono text-z-dimmed">{results.length} results</p>
            {results.map((r, i) => (
              <ResultCard key={i} result={r} onAskKanha={handleAskKanha} />
            ))}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-2xl">🔍</p>
            <p className="text-xs font-mono text-z-dimmed">
              Search the web across four categories
            </p>
            {history.length > 0 && (
              <div className="mt-2 text-center">
                <p className="text-[10px] font-mono text-z-dimmed mb-1">Recent searches</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {history.slice(0, 5).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(h); handleSearch(h); }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded border border-z-border text-z-dimmed hover:text-z-primary hover:border-z-primary/30 transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
