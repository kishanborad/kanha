import { describe, it, expect } from 'vitest';
import { createOpenAIProvider } from '../openai';

describe('createOpenAIProvider', () => {
  it('returns a provider with correct id and name', () => {
    const provider = createOpenAIProvider('sk-test');
    expect(provider.id).toBe('openai');
    expect(provider.name).toBe('OpenAI');
  });

  it('requires an API key', () => {
    const provider = createOpenAIProvider('sk-test');
    expect(provider.requiresKey).toBe(true);
  });

  it('does not require a proxy', () => {
    const provider = createOpenAIProvider('sk-test');
    expect(provider.requiresProxy).toBe(false);
  });

  it('exposes at least one model', () => {
    const provider = createOpenAIProvider('sk-test');
    expect(provider.models.length).toBeGreaterThan(0);
  });

  it('model entries have required fields', () => {
    const provider = createOpenAIProvider('sk-test');
    for (const model of provider.models) {
      expect(typeof model.id).toBe('string');
      expect(typeof model.name).toBe('string');
      expect(typeof model.contextWindow).toBe('number');
      expect(model.contextWindow).toBeGreaterThan(0);
    }
  });

  it('exposes chat and validate methods', () => {
    const provider = createOpenAIProvider('sk-test');
    expect(typeof provider.chat).toBe('function');
    expect(typeof provider.validate).toBe('function');
  });
});
