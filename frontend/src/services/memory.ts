import type { Message, UserProfile, KnowledgeEntry } from '../types';

const SYSTEM_PROMPT = `You are Kanha, a sophisticated AI assistant. You speak with formal elegance — polished, precise, occasionally dry-witted. You address the user respectfully. You are knowledgeable, efficient, and always composed. When uncertain, you say so clearly rather than guessing.

You have access to the user's memory, preferences, and conversation history. Reference these naturally when relevant.`;

// O(n) where n = total tokens in profile + knowledge + summaries
export function buildContextMessages(
  profile: UserProfile | null,
  relevantKnowledge: KnowledgeEntry[],
  recentSummaries: string[],
  currentMessages: Message[],
): Message[] {
  const contextParts: string[] = [SYSTEM_PROMPT];

  // Profile context
  if (profile) {
    const profileLines: string[] = [];
    if (profile.name) profileLines.push(`User's name: ${profile.name}`);

    const prefEntries = Object.entries(profile.preferences);
    if (prefEntries.length > 0) {
      profileLines.push('Preferences: ' + prefEntries.map(([k, v]) => `${k}: ${v}`).join(', '));
    }

    if (profile.topics.length > 0) {
      profileLines.push('Frequent topics: ' + profile.topics.join(', '));
    }

    if (profileLines.length > 0) {
      contextParts.push('\n--- User Profile ---\n' + profileLines.join('\n'));
    }
  }

  // Knowledge context — already limited to top 5 by caller
  if (relevantKnowledge.length > 0) {
    const knowledgeText = relevantKnowledge
      .map((k) => `[${k.category}] ${k.content}`)
      .join('\n');
    contextParts.push('\n--- Relevant Memory ---\n' + knowledgeText);
  }

  // Recent conversation summaries
  if (recentSummaries.length > 0) {
    contextParts.push('\n--- Recent Conversations ---\n' + recentSummaries.join('\n'));
  }

  const systemMessage: Message = {
    id: 'system',
    role: 'system',
    content: contextParts.join('\n'),
    timestamp: Date.now(),
  };

  return [systemMessage, ...currentMessages];
}

// O(n) keyword extraction — single pass
export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of',
    'in', 'for', 'on', 'with', 'at', 'by', 'from', 'it', 'this',
    'that', 'and', 'or', 'but', 'not', 'so', 'if', 'my', 'your',
    'i', 'me', 'we', 'you', 'he', 'she', 'they', 'what', 'how',
  ]);

  const words = text.toLowerCase().split(/\s+/);
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const clean = word.replace(/[^a-z0-9]/g, '');
    if (clean.length < 3 || stopWords.has(clean) || seen.has(clean)) continue;
    seen.add(clean);
    keywords.push(clean);
  }

  return keywords;
}
