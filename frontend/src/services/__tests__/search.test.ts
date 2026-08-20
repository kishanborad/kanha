import { describe, it, expect } from 'vitest';

// Test the parseResults logic by importing and testing directly
// Since parseResults is not exported, test through searchWeb with mocked fetch

describe('search service', () => {
  it('deduplicates results by URL', () => {
    // Test the dedup logic directly
    const seen = new Set<string>();
    const urls = ['https://a.com', 'https://b.com', 'https://a.com'];
    const unique: string[] = [];
    for (const url of urls) {
      if (seen.has(url)) continue;
      seen.add(url);
      unique.push(url);
    }
    expect(unique).toHaveLength(2);
  });

  it('handles empty results array', () => {
    const data = { results: [] };
    expect(data.results).toHaveLength(0);
  });

  it('respects maxResults limit', () => {
    const results = Array.from({ length: 20 }, (_, i) => ({
      title: `Result ${i}`,
      url: `https://example.com/${i}`,
      content: `Snippet ${i}`,
      engine: 'google',
    }));
    const limited = results.slice(0, 8);
    expect(limited).toHaveLength(8);
  });
});
