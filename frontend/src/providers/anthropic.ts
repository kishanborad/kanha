import type { LLMProvider, Message, ChatOptions } from './types';
import { parseSSEStream } from './types';

const PROXY_BASE = 'http://localhost:3001';

export function createAnthropicProvider(apiKey: string): LLMProvider {
  return {
    id: 'anthropic',
    name: 'Anthropic',
    requiresKey: true,
    requiresProxy: true,
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000 },
      { id: 'claude-haiku-4-20250414', name: 'Claude Haiku 4', contextWindow: 200000 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const response = await fetch(`${PROXY_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'anthropic',
          model: options.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          apiKey,
        }),
      });
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      yield* parseSSEStream(response.body!.getReader());
    },

    async validate(_key: string): Promise<boolean> {
      try {
        const r = await fetch(`${PROXY_BASE}/api/health`);
        return r.ok;
      } catch { return false; }
    },
  };
}
