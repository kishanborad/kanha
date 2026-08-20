import { describe, it, expect } from 'vitest';
import { getProvider, getAvailableProviders } from '../registry';

describe('provider registry', () => {
  it('returns null for unknown provider', () => {
    expect(getProvider('nonexistent', 'key')).toBeNull();
  });

  it('creates OpenAI provider', () => {
    const provider = getProvider('openai', 'sk-test');
    expect(provider).not.toBeNull();
    expect(provider!.id).toBe('openai');
    expect(provider!.models.length).toBeGreaterThan(0);
  });

  it('creates Groq provider', () => {
    const provider = getProvider('groq', 'gsk-test');
    expect(provider!.id).toBe('groq');
  });

  it('creates Google provider', () => {
    const provider = getProvider('google', 'key');
    expect(provider!.id).toBe('google');
  });

  it('creates OpenRouter provider', () => {
    const provider = getProvider('openrouter', 'key');
    expect(provider!.id).toBe('openrouter');
  });

  it('lists all available providers', () => {
    const providers = getAvailableProviders();
    expect(providers.length).toBe(7);
    const ids = providers.map((p) => p.id);
    expect(ids).toContain('openai');
    expect(ids).toContain('ollama');
  });
});
