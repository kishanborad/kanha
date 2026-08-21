import type { LLMProvider, Message, ChatOptions } from './types';
import { parseSSEStream } from './types';

const PROXY_BASE = 'http://localhost:3001';

export function createHuggingFaceProvider(apiKey: string): LLMProvider {
  return {
    id: 'huggingface',
    name: 'HuggingFace',
    requiresKey: true,
    requiresProxy: true,
    models: [
      { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B Instruct', contextWindow: 128000 },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct', contextWindow: 32768 },
      { id: 'microsoft/Phi-3.5-mini-instruct', name: 'Phi-3.5 Mini Instruct', contextWindow: 128000 },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B Instruct', contextWindow: 128000 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const response = await fetch(`${PROXY_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'huggingface',
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
