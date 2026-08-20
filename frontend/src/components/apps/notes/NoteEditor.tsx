// frontend/src/components/apps/notes/NoteEditor.tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import type { NoteItem } from './NotesApp';

interface NoteEditorProps {
  note: NoteItem;
  onUpdate: (id: string, title: string, content: string) => void;
  onExport: (note: NoteItem) => void;
  onSummarize: (note: NoteItem) => void;
}

/**
 * Sanitize HTML to a safe allowlist before injecting into the contentEditable div.
 * Content is always user-authored (stored in local IndexedDB), but we still strip
 * script/event attributes as a defence-in-depth measure.
 */
function sanitizeHtml(raw: string): string {
  const template = document.createElement('template');
  template.innerHTML = raw;
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'P', 'UL', 'OL', 'LI', 'CODE', 'BR', 'DIV', 'SPAN']);
  const allowedAttrs = new Set(['style', 'class']);

  function clean(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (!allowed.has(el.tagName)) {
        // Replace disallowed element with its text content
        const text = document.createTextNode(el.textContent ?? '');
        el.replaceWith(text);
        return;
      }
      // Strip disallowed attributes (including on* event handlers)
      for (const attr of Array.from(el.attributes)) {
        if (!allowedAttrs.has(attr.name) || attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
      Array.from(el.childNodes).forEach(clean);
    }
  }

  Array.from(template.content.childNodes).forEach(clean);

  const out = document.createElement('div');
  out.appendChild(template.content.cloneNode(true));
  return out.innerHTML;
}

const TOOLBAR_BTN = 'px-2 py-1 rounded text-[11px] font-mono transition-colors text-z-dimmed hover:text-z-primary hover:bg-z-primary/10 border border-transparent hover:border-z-primary/20';

export default function NoteEditor({ note, onUpdate, onExport, onSummarize }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string>(note.id);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const triggerSave = useCallback(() => {
    if (!editorRef.current || !titleRef.current) return;
    setSaveStatus('saving');
    onUpdate(noteIdRef.current, titleRef.current.value, editorRef.current.innerHTML);
    setSaveStatus('saved');
  }, [onUpdate]);

  const debounceSave = useCallback(() => {
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(triggerSave, 500);
  }, [triggerSave]);

  // Sync editor content when switching notes
  useEffect(() => {
    if (!editorRef.current) return;
    noteIdRef.current = note.id;
    // Safe: sanitize before injecting into contentEditable
    editorRef.current.innerHTML = sanitizeHtml(note.content);
    setSaveStatus('saved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [note.id]); // Only re-sync on note switch, not every content update

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const execFormat = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    debounceSave();
  }, [debounceSave]);

  const insertCode = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    const selectedText = sel.toString();
    const code = document.createElement('code');
    code.style.cssText =
      'background:rgba(0,0,0,0.4);color:#00F0FF;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px';
    code.textContent = selectedText || 'code';
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(code);
      range.setStartAfter(code);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    debounceSave();
  }, [debounceSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); execFormat('bold'); break;
        case 'i': e.preventDefault(); execFormat('italic'); break;
        case 'u': e.preventDefault(); execFormat('underline'); break;
        case 's':
          e.preventDefault();
          if (debounceRef.current) clearTimeout(debounceRef.current);
          triggerSave();
          break;
      }
    }
  }, [execFormat, triggerSave]);

  return (
    <div className="h-full flex flex-col">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-z-border shrink-0">
        <input
          ref={titleRef}
          defaultValue={note.title}
          key={note.id + '-title'}
          onChange={debounceSave}
          placeholder="Note title…"
          className="flex-1 bg-transparent text-sm font-mono text-z-text placeholder:text-z-dimmed outline-none"
        />
        <span className={`text-[9px] font-mono transition-colors shrink-0 ${
          saveStatus === 'saved' ? 'text-z-success' : saveStatus === 'saving' ? 'text-z-warning' : 'text-z-dimmed'
        }`}>
          {saveStatus === 'saved' ? '✓ saved' : saveStatus === 'saving' ? '⟳ saving…' : '● unsaved'}
        </span>
        <button
          onClick={() => onSummarize(note)}
          className="text-[10px] font-mono px-2 py-0.5 rounded border border-z-secondary/30 text-z-secondary hover:bg-z-secondary/10 transition-colors shrink-0"
        >
          Summarize
        </button>
        <button
          onClick={() => onExport(note)}
          className="text-[10px] font-mono px-2 py-0.5 rounded border border-z-border text-z-dimmed hover:text-z-primary hover:border-z-primary/30 transition-colors shrink-0"
        >
          Export MD
        </button>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-z-border overflow-x-auto shrink-0">
        <button onClick={() => execFormat('bold')} className={TOOLBAR_BTN} title="Bold (Ctrl+B)"><strong>B</strong></button>
        <button onClick={() => execFormat('italic')} className={TOOLBAR_BTN} title="Italic (Ctrl+I)"><em>I</em></button>
        <button onClick={() => execFormat('underline')} className={TOOLBAR_BTN} title="Underline (Ctrl+U)"><u>U</u></button>
        <div className="w-px h-4 bg-z-border mx-1 shrink-0" />
        <button onClick={() => execFormat('formatBlock', 'h1')} className={TOOLBAR_BTN} title="Heading 1">H1</button>
        <button onClick={() => execFormat('formatBlock', 'h2')} className={TOOLBAR_BTN} title="Heading 2">H2</button>
        <button onClick={() => execFormat('formatBlock', 'h3')} className={TOOLBAR_BTN} title="Heading 3">H3</button>
        <button onClick={() => execFormat('formatBlock', 'p')} className={TOOLBAR_BTN} title="Paragraph">P</button>
        <div className="w-px h-4 bg-z-border mx-1 shrink-0" />
        <button onClick={() => execFormat('insertUnorderedList')} className={TOOLBAR_BTN} title="Bullet list">• List</button>
        <button onClick={() => execFormat('insertOrderedList')} className={TOOLBAR_BTN} title="Numbered list">1. List</button>
        <div className="w-px h-4 bg-z-border mx-1 shrink-0" />
        <button onClick={insertCode} className={TOOLBAR_BTN} title="Inline code">{'</>'}</button>
      </div>

      {/* contentEditable editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={debounceSave}
        onKeyDown={handleKeyDown}
        data-placeholder="Start writing…"
        className="flex-1 overflow-y-auto px-4 py-3 outline-none text-sm text-z-text leading-relaxed
          [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-z-primary [&>h1]:mb-2 [&>h1]:mt-3
          [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-z-secondary [&>h2]:mb-1.5 [&>h2]:mt-2
          [&>h3]:text-base [&>h3]:font-medium [&>h3]:text-z-text [&>h3]:mb-1 [&>h3]:mt-2
          [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-0.5
          [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-0.5
          [&>p]:mb-1.5
          [&_code]:bg-black/40 [&_code]:text-z-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs"
      />

      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #64748B;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
