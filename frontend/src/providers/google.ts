import type { LLMProvider, Message, ChatOptions } from './types';

export function createGoogleProvider(apiKey: string): LLMProvider {
  return {
    id: 'google',
    name: 'Google',
    requiresKey: true,
    requiresProxy: false,
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000 },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', contextWindow: 1000000 },
    ],

    async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<string> {
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const systemMsg = messages.find((m) => m.role === 'system');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
            generationConfig: {
              temperature: options.temperature,
              maxOutputTokens: options.maxTokens,
            },
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `Gemini API error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch {
            // skip
          }
        }
      }
    },

    async validate(key: string): Promise<boolean> {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      );
      return response.ok;
    },
  };
}
