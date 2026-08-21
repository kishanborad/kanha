// frontend/src/components/apps/settings/MemoryConfig.tsx
// Data management tab: export, import, clear, storage usage, cleanup days
import { useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useMemoryStore } from '../../../stores/memoryStore';
import { useConversationStore } from '../../../stores/conversationStore';
import { db } from '../../../services/db';

type CleanupDays = 30 | 90 | 180 | 0;

function StorageMeter() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);

  // Use storage API if available
  useState(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(est => {
        if (est.usage !== undefined && est.quota !== undefined) {
          setUsage({ used: est.usage, quota: est.quota });
        }
      });
    }
  });

  if (!usage) {
    return <p className="text-[11px] text-z-dimmed">Storage usage unavailable in this browser.</p>;
  }

  const usedMB = (usage.used / 1024 / 1024).toFixed(2);
  const quotaMB = (usage.quota / 1024 / 1024).toFixed(0);
  const pct = Math.min(100, (usage.used / usage.quota) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-z-dimmed">
        <span>Storage used</span>
        <span>{usedMB} MB / {quotaMB} MB</span>
      </div>
      <div className="h-1.5 rounded-full bg-z-border overflow-hidden">
        <div
          className="h-full rounded-full bg-z-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MemoryConfig() {
  const { settings, setCleanupDays } = useSettingsStore();
  const { profile } = useMemoryStore();
  const { conversations } = useConversationStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [msg, setMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  // Export all data
  const handleExport = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      conversations,
      profile,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanha-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg('Exported successfully.');
  }, [conversations, profile, settings]);

  // Import from JSON file
  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Import conversations (O(n))
      if (Array.isArray(data.conversations)) {
        for (const convo of data.conversations) {
          await db.conversations.put(convo);
        }
      }
      // Import profile
      if (data.profile) {
        await db.profile.put(data.profile);
      }
      // Import settings
      if (data.settings) {
        await db.settings.put(data.settings);
      }
      showMsg(`Import complete. Reload to see changes.`);
    } catch {
      showMsg('Import failed — invalid JSON file.');
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleImport(file);
    // Reset input so same file can be re-imported
    if (importRef.current) importRef.current.value = '';
  }, [handleImport]);

  // Clear all data
  const handleClearAll = useCallback(async () => {
    await Promise.all([
      db.conversations.clear(),
      db.knowledge.clear(),
    ]);
    // Reset profile to blank
    await db.profile.put({ id: 'default', preferences: {}, topics: [], lastUpdated: Date.now() });
    setConfirmClear(false);
    showMsg('All data cleared. Reload to reset stores.');
  }, []);

  const CLEANUP_OPTIONS: Array<{ value: CleanupDays; label: string }> = [
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
    { value: 0, label: 'Never' },
  ];

  return (
    <div className="space-y-5">
      {/* Storage meter */}
      <div className="rounded-lg border border-z-border p-3">
        <p className="text-[11px] font-medium text-z-text mb-2">Storage Usage</p>
        <StorageMeter />
      </div>

      {/* Cleanup days */}
      <div>
        <label className="block text-[11px] text-z-dimmed mb-1.5">Auto-delete conversations older than</label>
        <div className="flex gap-2 flex-wrap">
          {CLEANUP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCleanupDays(opt.value)}
              className={`text-[11px] px-3 py-1 rounded border transition-colors ${
                settings.cleanupDays === opt.value
                  ? 'border-z-primary/50 text-z-primary bg-z-primary/10'
                  : 'border-z-border text-z-dimmed hover:border-z-primary/30 hover:text-z-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        className="w-full py-2 text-[11px] font-medium rounded border border-z-primary/30 text-z-primary hover:bg-z-primary/10 transition-colors"
      >
        Export all data (JSON)
      </button>

      {/* Import */}
      <div>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => importRef.current?.click()}
          className="w-full py-2 text-[11px] font-medium rounded border border-z-border text-z-dimmed hover:text-z-text hover:border-z-primary/30 transition-colors"
        >
          Import from JSON
        </button>
      </div>

      {/* Clear all */}
      {!confirmClear ? (
        <button
          onClick={() => setConfirmClear(true)}
          className="w-full py-2 text-[11px] font-medium rounded border border-z-error/30 text-z-error hover:bg-z-error/10 transition-colors"
        >
          Clear all data…
        </button>
      ) : (
        <div className="rounded-lg border border-z-error/30 p-3 space-y-2">
          <p className="text-[11px] text-z-error">
            This will delete all conversations and knowledge. Settings will be reset. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              className="flex-1 py-1.5 text-[11px] rounded border border-z-error/50 text-z-error hover:bg-z-error/15 transition-colors"
            >
              Yes, clear everything
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="flex-1 py-1.5 text-[11px] rounded border border-z-border text-z-dimmed hover:text-z-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status message */}
      {msg && (
        <p className="text-[11px] text-z-success text-center">{msg}</p>
      )}
    </div>
  );
}
