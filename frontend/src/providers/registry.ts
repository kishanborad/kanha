import type { LLMProvider } from './types';
import { createOpenAIProvider } from './openai';
import { createGroqProvider } from './groq';
import { createOpenRouterProvider } from './openrouter';
import { createGoogleProvider } from './google';

type ProviderFactory = (apiKey: string) => LLMProvider;

// O(1) lookup
const FACTORIES = new Map<string, ProviderFactory>([
  ['openai', createOpenAIProvider],
  ['groq', createGroqProvider],
  ['openrouter', createOpenRouterProvider],
  ['google', createGoogleProvider],
]);

export function getProvider(id: string, apiKey: string): LLMProvider | null {
  const factory = FACTORIES.get(id);
  return factory ? factory(apiKey) : null;
}

export function getAvailableProviders(): Array<{ id: string; name: string; requiresProxy: boolean }> {
  return [
    { id: 'openai', name: 'OpenAI', requiresProxy: false },
    { id: 'google', name: 'Google', requiresProxy: false },
    { id: 'groq', name: 'Groq', requiresProxy: false },
    { id: 'openrouter', name: 'OpenRouter', requiresProxy: false },
    { id: 'anthropic', name: 'Anthropic', requiresProxy: true },
    { id: 'ollama', name: 'Ollama', requiresProxy: true },
    { id: 'huggingface', name: 'HuggingFace', requiresProxy: true },
  ];
}

export function registerProvider(id: string, factory: ProviderFactory) {
  FACTORIES.set(id, factory);
}
