// frontend/src/components/apps/notes/FolderTree.tsx
import { useState } from 'react';
import type { NoteFolder, NoteItem } from './NotesApp';

interface FolderTreeProps {
  folders: NoteFolder[];
  notes: NoteItem[];
  selectedNoteId: string | null;
  selectedFolderId: string;
  onSelectNote: (noteId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export default function FolderTree({
  folders,
  notes,
  selectedNoteId,
  selectedFolderId,
  onSelectNote,
  onSelectFolder,
  onCreateFolder,
  onCreateNote,
  onDeleteNote,
  onDeleteFolder,
}: FolderTreeProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['default']));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
    onSelectFolder(folderId);
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    onCreateFolder(name);
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const notesInFolder = (folderId: string) =>
    notes.filter(n => n.folderId === folderId);

  return (
    <div className="h-full flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-z-border">
        <span className="text-[10px] font-mono text-z-dimmed uppercase tracking-widest">Notes</span>
        <div className="flex gap-1">
          <button
            onClick={onCreateNote}
            title="New Note"
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-z-primary/10 text-z-dimmed hover:text-z-primary transition-colors text-xs"
          >
            +
          </button>
          <button
            onClick={() => setCreatingFolder(true)}
            title="New Folder"
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-z-secondary/10 text-z-dimmed hover:text-z-secondary transition-colors text-xs"
          >
            ⊕
          </button>
        </div>
      </div>

      {/* Folder tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {folders.map(folder => {
          const folderNotes = notesInFolder(folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          const isActive = selectedFolderId === folder.id;

          return (
            <div key={folder.id}>
              {/* Folder row */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 cursor-pointer group ${
                  isActive ? 'text-z-primary' : 'text-z-text hover:text-z-primary'
                } transition-colors`}
                onClick={() => toggleFolder(folder.id)}
              >
                <span className="text-[10px] text-z-dimmed w-3 shrink-0">
                  {folderNotes.length > 0 ? (isExpanded ? '▾' : '▸') : '·'}
                </span>
                <span className="text-[11px] font-mono flex-1 truncate">
                  {folder.id === 'default' ? '📝' : '📁'} {folder.name}
                </span>
                <span className="text-[9px] text-z-dimmed">{folderNotes.length}</span>
                {folder.id !== 'default' && (
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-z-error hover:text-z-error/80 transition-opacity"
                    title="Delete folder"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Notes in folder */}
              {isExpanded && folderNotes.map(note => (
                <div
                  key={note.id}
                  className={`flex items-center gap-1.5 pl-7 pr-3 py-0.5 cursor-pointer group ${
                    selectedNoteId === note.id
                      ? 'bg-z-primary/10 text-z-primary'
                      : 'text-z-dimmed hover:text-z-text hover:bg-z-glass'
                  } transition-colors`}
                  onClick={() => onSelectNote(note.id)}
                >
                  <span className="text-[10px] shrink-0">—</span>
                  <span className="text-[11px] font-mono flex-1 truncate">{note.title || 'Untitled'}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteNote(note.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-z-error hover:text-z-error/80 transition-opacity"
                    title="Delete note"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {/* New folder input */}
        {creatingFolder && (
          <div className="px-3 py-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setCreatingFolder(false);
              }}
              onBlur={() => { if (newFolderName.trim()) handleCreateFolder(); else setCreatingFolder(false); }}
              placeholder="Folder name..."
              className="w-full bg-z-glass border border-z-primary/30 rounded px-2 py-0.5 text-[11px] font-mono text-z-text placeholder:text-z-dimmed outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
