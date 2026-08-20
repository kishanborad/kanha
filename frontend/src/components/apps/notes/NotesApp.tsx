// frontend/src/components/apps/notes/NotesApp.tsx
import { useEffect, useState, useCallback } from 'react';
import Dexie, { type Table } from 'dexie';
import FolderTree from './FolderTree';
import NoteEditor from './NoteEditor';

// --- Types ---
export interface NoteFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string; // HTML string; sanitized on load in NoteEditor
  folderId: string;
  createdAt: number;
  updatedAt: number;
}

// --- Dedicated Dexie DB (kanha-notes) ---
class NotesDB extends Dexie {
  folders!: Table<NoteFolder, string>;
  notes!: Table<NoteItem, string>;

  constructor() {
    super('kanha-notes');
    this.version(1).stores({
      folders: 'id, createdAt',
      notes: 'id, folderId, updatedAt',
    });
  }
}

const notesDb = new NotesDB();

// --- HTML → Markdown converter (no eval, O(n) traversal) ---
// Uses DOMParser (parses into an inert document, never touches the live DOM)
// so no XSS surface even if `html` contains script tags.
function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function nodeToMd(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as Element;
    const children = Array.from(el.childNodes).map(nodeToMd).join('');

    switch (el.tagName) {
      case 'H1': return `\n# ${children}\n`;
      case 'H2': return `\n## ${children}\n`;
      case 'H3': return `\n### ${children}\n`;
      case 'P':
      case 'DIV': return `${children}\n`;
      case 'B':
      case 'STRONG': return `**${children}**`;
      case 'I':
      case 'EM': return `*${children}*`;
      case 'U': return `__${children}__`;
      case 'CODE': return `\`${children}\``;
      case 'LI': return `- ${children}\n`;
      case 'UL':
      case 'OL': return `\n${children}`;
      case 'BR': return '\n';
      default: return children;
    }
  }

  return Array.from(doc.body.childNodes).map(nodeToMd).join('').trim();
}

export default function NotesApp() {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState('default');
  const [toast, setToast] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    async function init() {
      // Ensure default folder exists
      const existing = await notesDb.folders.get('default');
      if (!existing) {
        await notesDb.folders.put({ id: 'default', name: 'My Notes', createdAt: Date.now() });
      }
      const [allFolders, allNotes] = await Promise.all([
        notesDb.folders.orderBy('createdAt').toArray(),
        notesDb.notes.orderBy('updatedAt').reverse().toArray(),
      ]);
      setFolders(allFolders);
      setNotes(allNotes);
      // Auto-select first note if any
      if (allNotes.length > 0) setSelectedNoteId(allNotes[0].id);
    }
    init();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCreateNote = useCallback(async () => {
    const note: NoteItem = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      content: '',
      folderId: selectedFolderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await notesDb.notes.add(note);
    setNotes(prev => [note, ...prev]);
    setSelectedNoteId(note.id);
  }, [selectedFolderId]);

  const handleCreateFolder = useCallback(async (name: string) => {
    const folder: NoteFolder = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    };
    await notesDb.folders.add(folder);
    setFolders(prev => [...prev, folder]);
  }, []);

  const handleUpdateNote = useCallback(async (id: string, title: string, content: string) => {
    const updatedAt = Date.now();
    await notesDb.notes.update(id, { title, content, updatedAt });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title, content, updatedAt } : n));
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await notesDb.notes.delete(noteId);
    setNotes(prev => {
      const next = prev.filter(n => n.id !== noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(next[0]?.id ?? null);
      }
      return next;
    });
  }, [selectedNoteId]);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    if (folderId === 'default') return;
    // Move notes in this folder to default
    await notesDb.notes.where('folderId').equals(folderId).modify({ folderId: 'default' });
    await notesDb.folders.delete(folderId);
    setNotes(prev => prev.map(n => n.folderId === folderId ? { ...n, folderId: 'default' } : n));
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (selectedFolderId === folderId) setSelectedFolderId('default');
  }, [selectedFolderId]);

  const handleExport = useCallback((note: NoteItem) => {
    const md = `# ${note.title}\n\n${htmlToMarkdown(note.content)}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported as Markdown');
  }, [showToast]);

  const handleSummarize = useCallback((_note: NoteItem) => {
    showToast('Summarize: LLM integration coming in a future update.');
  }, [showToast]);

  const selectedNote = notes.find(n => n.id === selectedNoteId) ?? null;

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* Left: folder/note tree */}
      <div className="w-48 shrink-0 border-r border-z-border overflow-hidden">
        <FolderTree
          folders={folders}
          notes={notes}
          selectedNoteId={selectedNoteId}
          selectedFolderId={selectedFolderId}
          onSelectNote={setSelectedNoteId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={handleCreateFolder}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>

      {/* Right: editor */}
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdate={handleUpdateNote}
            onExport={handleExport}
            onSummarize={handleSummarize}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <p className="text-xs font-mono text-z-dimmed">No note selected</p>
            <button
              onClick={handleCreateNote}
              className="text-[11px] font-mono px-3 py-1.5 rounded border border-z-primary/30 text-z-primary hover:bg-z-primary/10 transition-colors"
            >
              + New Note
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-lg text-xs font-mono text-z-text border border-z-border shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
