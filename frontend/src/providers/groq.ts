import type { LLMProvider, Message, ChatOptions } from './types';
import { parseSSEStream } from './types';

export function createGroqProvider(apiKey: string): LLMProvider {
  return {
    id: 'groq',
    name: 'Groq',
    requiresKey: true,
    requiresProxy: false,
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 128000 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextWindow: 32768 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
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
        throw new Error(err.error?.message ?? `Groq API error: ${response.status}`);
      }

      yield* parseSSEStream(response.body!.getReader());
    },

    async validate(key: string): Promise<boolean> {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      return response.ok;
    },
  };
}
