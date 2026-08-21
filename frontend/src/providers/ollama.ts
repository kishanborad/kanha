import type { LLMProvider, Message, ChatOptions } from './types';
import { parseSSEStream } from './types';

const PROXY_BASE = 'http://localhost:3001';

// Ollama requires no API key — local-only provider routed through proxy
export function createOllamaProvider(_apiKey: string): LLMProvider {
  return {
    id: 'ollama',
    name: 'Ollama',
    requiresKey: false,
    requiresProxy: true,
    // Default model list; /api/models endpoint returns installed models at runtime
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', contextWindow: 128000 },
      { id: 'mistral', name: 'Mistral 7B', contextWindow: 32768 },
      { id: 'gemma3', name: 'Gemma 3', contextWindow: 128000 },
      { id: 'phi4', name: 'Phi-4', contextWindow: 16384 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const response = await fetch(`${PROXY_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ollama',
          model: options.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      yield* parseSSEStream(response.body!.getReader());
    },

    async validate(_key: string): Promise<boolean> {
      try {
        const r = await fetch(`${PROXY_BASE}/api/health`);
        if (!r.ok) return false;
        const data = (await r.json()) as { ollama?: boolean };
        return data.ollama === true;
      } catch { return false; }
    },
  };
}
