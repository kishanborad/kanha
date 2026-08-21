// frontend/src/components/apps/settings/ProviderConfig.tsx
import { useState, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { getAvailableProviders, getProvider } from '../../../providers/registry';

const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string }>> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  google: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma2 9B' },
  ],
  openrouter: [
    { id: 'openai/gpt-4o', name: 'GPT-4o (via OR)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (free)' },
  ],
};

interface ProviderRowProps {
  providerId: string;
  name: string;
  requiresProxy: boolean;
  isActive: boolean;
  onSetActive: (id: string) => void;
}

function ProviderRow({ providerId, name, requiresProxy, isActive, onSetActive }: ProviderRowProps) {
  const { settings, updateProvider } = useSettingsStore();
  const provConfig = settings.providers[providerId];
  const [keyInput, setKeyInput] = useState(provConfig?.apiKey ?? '');
  const [validating, setValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  const models = PROVIDER_MODELS[providerId] ?? [];
  const activeModel = provConfig?.activeModel ?? models[0]?.id ?? '';

  const handleSaveKey = useCallback(() => {
    updateProvider(providerId, { apiKey: keyInput.trim(), enabled: true });
    setValidationMsg('Key saved.');
    setTimeout(() => setValidationMsg(''), 2000);
  }, [providerId, keyInput, updateProvider]);

  const handleRemoveKey = useCallback(() => {
    setKeyInput('');
    updateProvider(providerId, { apiKey: undefined, enabled: false });
    setValidationMsg('Key removed.');
    setTimeout(() => setValidationMsg(''), 2000);
  }, [providerId, updateProvider]);

  const handleValidate = useCallback(async () => {
    if (!keyInput.trim()) {
      setValidationMsg('Enter a key first.');
      return;
    }
    setValidating(true);
    setValidationMsg('Validating…');
    try {
      const provider = getProvider(providerId, keyInput.trim());
      if (!provider) {
        setValidationMsg('Provider not supported for direct validation.');
        return;
      }
      const ok = await provider.validate(keyInput.trim());
      setValidationMsg(ok ? '✓ Valid' : '✗ Invalid key');
    } catch {
      setValidationMsg('✗ Validation failed');
    } finally {
      setValidating(false);
      setTimeout(() => setValidationMsg(''), 3000);
    }
  }, [providerId, keyInput]);

  const handleModelChange = useCallback((modelId: string) => {
    updateProvider(providerId, { activeModel: modelId });
  }, [providerId, updateProvider]);

  return (
    <div
      className={`rounded-lg p-3 border transition-colors ${
        isActive
          ? 'border-z-primary/40 bg-z-primary/5'
          : 'border-z-border bg-z-glass'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-z-text">{name}</span>
          {requiresProxy && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-z-warning/10 text-z-warning border border-z-warning/20">
              proxy
            </span>
          )}
          {isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-z-primary/10 text-z-primary border border-z-primary/20">
              active
            </span>
          )}
        </div>
        {!isActive && (
          <button
            onClick={() => onSetActive(providerId)}
            className="text-[10px] px-2 py-1 rounded border border-z-border text-z-dimmed hover:text-z-primary hover:border-z-primary/30 transition-colors"
          >
            Set active
          </button>
        )}
      </div>

      {/* API Key row */}
      {!requiresProxy && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="API key…"
            className="flex-1 bg-black/30 border border-z-border rounded px-2 py-1 text-[11px] font-mono text-z-text placeholder:text-z-dimmed outline-none focus:border-z-primary/40"
          />
          <button
            onClick={handleSaveKey}
            className="text-[10px] px-2 py-1 rounded border border-z-border text-z-dimmed hover:text-z-success hover:border-z-success/30 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleValidate}
            disabled={validating}
            className="text-[10px] px-2 py-1 rounded border border-z-border text-z-dimmed hover:text-z-primary hover:border-z-primary/30 transition-colors disabled:opacity-50"
          >
            Test
          </button>
          <button
            onClick={handleRemoveKey}
            className="text-[10px] px-2 py-1 rounded border border-z-border text-z-dimmed hover:text-z-error hover:border-z-error/30 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {requiresProxy && (
        <p className="text-[10px] text-z-dimmed mb-2">
          Requires a local proxy. Set up with the proxy server (Task 14).
        </p>
      )}

      {/* Model selector */}
      {models.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-z-dimmed">Model:</span>
          <select
            value={activeModel}
            onChange={e => handleModelChange(e.target.value)}
            className="text-[10px] bg-black/30 border border-z-border rounded px-2 py-0.5 text-z-text outline-none focus:border-z-primary/40"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Validation message */}
      {validationMsg && (
        <p className={`text-[10px] mt-1.5 ${validationMsg.startsWith('✓') ? 'text-z-success' : validationMsg.startsWith('✗') ? 'text-z-error' : 'text-z-dimmed'}`}>
          {validationMsg}
        </p>
      )}
    </div>
  );
}

export default function ProviderConfig() {
  const { settings, setActiveProvider } = useSettingsStore();
  const providers = getAvailableProviders();

  return (
    <div className="space-y-2 overflow-y-auto">
      <p className="text-[10px] text-z-dimmed mb-3">
        Add API keys to enable providers. Keys are stored in IndexedDB on your device only.
      </p>
      {providers.map(p => (
        <ProviderRow
          key={p.id}
          providerId={p.id}
          name={p.name}
          requiresProxy={p.requiresProxy}
          isActive={settings.activeProvider === p.id}
          onSetActive={setActiveProvider}
        />
      ))}
    </div>
  );
}
