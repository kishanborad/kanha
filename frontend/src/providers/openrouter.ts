import type { LLMProvider, Message, ChatOptions } from './types';
import { parseSSEStream } from './types';

export function createOpenRouterProvider(apiKey: string): LLMProvider {
  return {
    id: 'openrouter',
    name: 'OpenRouter',
    requiresKey: true,
    requiresProxy: false,
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', contextWindow: 128000 },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet (via OpenRouter)', contextWindow: 200000 },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini Flash (via OpenRouter)', contextWindow: 1000000 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: options.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `OpenRouter API error: ${response.status}`);
      }

      yield* parseSSEStream(response.body!.getReader());
    },

    async validate(key: string): Promise<boolean> {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      return response.ok;
    },
  };
}
