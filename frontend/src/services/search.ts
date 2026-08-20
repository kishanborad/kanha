import type { SearchResult } from '../types';

const SEARXNG_INSTANCES = [
  'https://search.sapti.me',
  'https://searx.be',
  'https://search.bus-hit.me',
  'https://searx.tiekoetter.com',
  'https://search.ononoki.org',
];

let instanceIndex = 0;

interface SearchOptions {
  maxResults?: number;
  timeout?: number;
  categories?: string;
}

// O(n) where n = number of results
function parseResults(data: { results?: Array<{ title: string; url: string; content: string; engine: string }> }): SearchResult[] {
  if (!data.results) return [];
  const results: SearchResult[] = [];
  const seen = new Set<string>(); // O(1) dedup lookup

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    results.push({
      title: r.title,
      url: r.url,
      snippet: r.content,
      engine: r.engine,
      position: results.length + 1,
    });
  }
  return results;
}

async function fetchInstance(instance: string, query: string, options: SearchOptions): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    categories: options.categories ?? 'general',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 5000);

  try {
    const response = await fetch(`${instance}/search?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return parseResults(data).slice(0, options.maxResults ?? 8);
  } catch {
    clearTimeout(timeout);
    throw new Error(`Instance ${instance} failed`);
  }
}

export async function searchWeb(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  // Try instances with rotation — O(k) where k = number of instances tried
  for (let attempt = 0; attempt < SEARXNG_INSTANCES.length; attempt++) {
    const index = (instanceIndex + attempt) % SEARXNG_INSTANCES.length;
    try {
      const results = await fetchInstance(SEARXNG_INSTANCES[index], query, options);
      instanceIndex = (index + 1) % SEARXNG_INSTANCES.length; // rotate for next call
      return results;
    } catch {
      continue;
    }
  }

  // Fallback: DuckDuckGo Instant Answers
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`,
    );
    const data = await response.json();
    if (data.AbstractText) {
      return [{
        title: data.Heading ?? query,
        url: data.AbstractURL ?? '',
        snippet: data.AbstractText,
        engine: 'duckduckgo',
        position: 1,
      }];
    }
  } catch {
    // fall through
  }

  return [];
}
