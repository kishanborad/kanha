import type { LLMProvider, Message, ChatOptions } from './types';
import { parseSSEStream } from './types';

export function createOpenAIProvider(apiKey: string): LLMProvider {
  return {
    id: 'openai',
    name: 'OpenAI',
    requiresKey: true,
    requiresProxy: false,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        throw new Error(err.error?.message ?? `OpenAI API error: ${response.status}`);
      }

      yield* parseSSEStream(response.body!.getReader());
    },

    async validate(key: string): Promise<boolean> {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      return response.ok;
    },
  };
}
