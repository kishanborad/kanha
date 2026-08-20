// frontend/src/components/apps/files/FilesApp.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMemoryStore } from '../../../stores/memoryStore';
import { useConversationStore } from '../../../stores/conversationStore';
import type { KnowledgeEntry, Conversation } from '../../../types';

type Category = KnowledgeEntry['category'] | 'all';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'note', label: 'Notes' },
  { id: 'fact', label: 'Facts' },
  { id: 'reminder', label: 'Reminders' },
  { id: 'bookmark', label: 'Bookmarks' },
];

const CATEGORY_COLOR: Record<KnowledgeEntry['category'], string> = {
  note: 'text-z-primary bg-z-primary/10 border-z-primary/20',
  fact: 'text-z-secondary bg-z-secondary/10 border-z-secondary/20',
  reminder: 'text-z-warning bg-z-warning/10 border-z-warning/20',
  bookmark: 'text-z-success bg-z-success/10 border-z-success/20',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatConvDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FilesApp() {
  const { deleteKnowledge, getKnowledgeByCategory } = useMemoryStore();
  const { conversations, load: loadConversations, loaded: convoLoaded, deleteConversation } = useConversationStore();

  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<'knowledge' | 'conversations'>('knowledge');
  const [loadingKnowledge, setLoadingKnowledge] = useState(true);

  // Load knowledge entries
  useEffect(() => {
    async function loadAll() {
      setLoadingKnowledge(true);
      const cats: KnowledgeEntry['category'][] = ['note', 'fact', 'reminder', 'bookmark'];
      const arrays = await Promise.all(cats.map(c => getKnowledgeByCategory(c)));
      // Merge and sort by newest first — O(n log n)
      const all = ([] as KnowledgeEntry[]).concat(...arrays).sort((a, b) => b.createdAt - a.createdAt);
      setEntries(all);
      setLoadingKnowledge(false);
    }
    loadAll();
  }, [getKnowledgeByCategory]);

  // Load conversations
  useEffect(() => {
    if (!convoLoaded) loadConversations();
  }, [convoLoaded, loadConversations]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteKnowledge(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, [deleteKnowledge]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
  }, [deleteConversation]);

  // --- O(n) derived data ---

  // All unique tags across entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const e of entries) {
      for (const t of e.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filtered entries: category + tag + search — single O(n) pass
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return entries.filter(e => {
      if (category !== 'all' && e.category !== category) return false;
      if (activeTag && !e.tags.includes(activeTag)) return false;
      if (q && !e.content.toLowerCase().includes(q) && !e.tags.some(t => t.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [entries, category, activeTag, searchQuery]);

  const catBtnClass = (id: Category) =>
    `text-[10px] font-mono px-2.5 py-1 rounded border transition-colors ${
      category === id
        ? 'bg-z-primary/15 text-z-primary border-z-primary/30'
        : 'text-z-dimmed border-z-border hover:text-z-text hover:border-z-border/60'
    }`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-z-border space-y-2">
        {/* View toggle */}
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setView('knowledge')}
              className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-colors ${
                view === 'knowledge'
                  ? 'bg-z-primary/15 text-z-primary border-z-primary/30'
                  : 'text-z-dimmed border-z-border hover:text-z-text'
              }`}
            >
              Knowledge ({entries.length})
            </button>
            <button
              onClick={() => setView('conversations')}
              className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-colors ${
                view === 'conversations'
                  ? 'bg-z-primary/15 text-z-primary border-z-primary/30'
                  : 'text-z-dimmed border-z-border hover:text-z-text'
              }`}
            >
              Conversations ({conversations.length})
            </button>
          </div>
          {view === 'knowledge' && (
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search entries…"
              className="bg-z-glass border border-z-border rounded px-2.5 py-1 text-[10px] font-mono text-z-text placeholder:text-z-dimmed outline-none focus:border-z-primary/40 transition-colors w-40"
            />
          )}
        </div>

        {/* Category tabs (knowledge only) */}
        {view === 'knowledge' && (
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.id} className={catBtnClass(c.id)} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag cloud (knowledge only, when tags exist) */}
      {view === 'knowledge' && allTags.length > 0 && (
        <div className="shrink-0 flex gap-1.5 flex-wrap px-4 py-2 border-b border-z-border">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(prev => prev === tag ? null : tag)}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                activeTag === tag
                  ? 'bg-z-secondary/20 text-z-secondary border-z-secondary/30'
                  : 'text-z-dimmed border-z-border/60 hover:text-z-text hover:border-z-border'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">

        {/* --- Knowledge entries --- */}
        {view === 'knowledge' && (
          <>
            {loadingKnowledge && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-panel rounded-xl p-3 border border-z-border animate-pulse space-y-1.5">
                    <div className="h-2.5 bg-z-border/60 rounded w-2/3" />
                    <div className="h-2 bg-z-border/40 rounded w-full" />
                    <div className="h-2 bg-z-border/30 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}

            {!loadingKnowledge && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <p className="text-2xl">🗄</p>
                <p className="text-xs font-mono text-z-dimmed">
                  {entries.length === 0 ? 'No knowledge entries yet' : 'No entries match your filters'}
                </p>
                {(searchQuery || activeTag || category !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveTag(null); setCategory('all'); }}
                    className="text-[10px] font-mono text-z-primary hover:text-z-primary/80 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {filtered.map(entry => (
              <div
                key={entry.id}
                className="glass-panel rounded-xl p-3 border border-z-border hover:border-z-border/60 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {/* Category badge */}
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${CATEGORY_COLOR[entry.category]}`}>
                    {entry.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-z-dimmed">{formatDate(entry.createdAt)}</span>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-z-dimmed hover:text-z-error transition-all"
                      title="Delete entry"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Content preview */}
                <p className="text-xs text-z-text leading-relaxed line-clamp-3 mb-2">{entry.content}</p>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(prev => prev === tag ? null : tag)}
                        className={`text-[9px] font-mono px-1 py-0.5 rounded transition-colors ${
                          activeTag === tag
                            ? 'text-z-secondary bg-z-secondary/15'
                            : 'text-z-dimmed hover:text-z-secondary'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Source badge */}
                <div className="mt-1.5">
                  <span className="text-[9px] font-mono text-z-dimmed/60">via {entry.source}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* --- Conversations --- */}
        {view === 'conversations' && (
          <>
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <p className="text-2xl">💬</p>
                <p className="text-xs font-mono text-z-dimmed">No conversations yet</p>
              </div>
            )}
            {conversations.map((conv: Conversation) => (
              <div
                key={conv.id}
                className="glass-panel rounded-xl p-3 border border-z-border hover:border-z-border/60 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-mono text-z-text font-medium truncate flex-1">{conv.title}</p>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-z-dimmed hover:text-z-error transition-all shrink-0"
                    title="Delete conversation"
                  >
                    ×
                  </button>
                </div>
                <p className="text-[10px] font-mono text-z-dimmed mb-1">
                  {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''} · {formatConvDate(conv.updatedAt)}
                </p>
                {conv.messages.length > 0 && (
                  <p className="text-[11px] text-z-text/70 line-clamp-2 leading-relaxed">
                    {conv.messages[conv.messages.length - 1].content}
                  </p>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer summary */}
      <div className="shrink-0 px-4 py-2 border-t border-z-border">
        <p className="text-[9px] font-mono text-z-dimmed">
          {view === 'knowledge'
            ? `${filtered.length} of ${entries.length} entries${activeTag ? ` · #${activeTag}` : ''}`
            : `${conversations.length} conversation export${conversations.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}
