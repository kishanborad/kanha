import { describe, it, expect } from 'vitest';
import { buildContextMessages, extractKeywords } from '../memory';
import type { Message, UserProfile, KnowledgeEntry } from '../../types';

describe('buildContextMessages', () => {
  it('always includes system prompt as first message', () => {
    const result = buildContextMessages(null, [], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('system');
    expect(result[0].content).toContain('Kanha');
  });

  it('includes user profile in system message', () => {
    const profile: UserProfile = {
      id: 'default',
      name: 'Kishan',
      preferences: { language: 'TypeScript' },
      topics: ['coding'],
      lastUpdated: Date.now(),
    };
    const result = buildContextMessages(profile, [], [], []);
    expect(result[0].content).toContain('Kishan');
    expect(result[0].content).toContain('TypeScript');
  });

  it('includes knowledge entries', () => {
    const knowledge: KnowledgeEntry[] = [{
      id: 'k1',
      content: 'Server IP is 192.168.1.50',
      category: 'fact',
      tags: ['server'],
      createdAt: Date.now(),
      source: 'user',
    }];
    const result = buildContextMessages(null, knowledge, [], []);
    expect(result[0].content).toContain('192.168.1.50');
  });

  it('appends current messages after system', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
    ];
    const result = buildContextMessages(null, [], [], messages);
    expect(result).toHaveLength(2);
    expect(result[1].content).toBe('Hello');
  });

  it('includes recent summaries', () => {
    const result = buildContextMessages(null, [], ['Discussed React hooks'], []);
    expect(result[0].content).toContain('Discussed React hooks');
  });
});

describe('extractKeywords', () => {
  it('extracts meaningful words', () => {
    const keywords = extractKeywords('What is the weather in San Francisco?');
    expect(keywords).toContain('weather');
    expect(keywords).toContain('san');
    expect(keywords).toContain('francisco');
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('is');
  });

  it('deduplicates words', () => {
    const keywords = extractKeywords('test test test again');
    expect(keywords.filter((k) => k === 'test')).toHaveLength(1);
  });

  it('handles empty string', () => {
    expect(extractKeywords('')).toEqual([]);
  });
});
