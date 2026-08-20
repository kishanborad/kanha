// frontend/src/services/__tests__/voice.test.ts
import { describe, it, expect } from 'vitest';
import { splitSentences } from '../voice';

describe('voice service', () => {
  describe('splitSentences', () => {
    it('splits by period', () => {
      expect(splitSentences('Hello world. How are you.')).toEqual(['Hello world.', 'How are you.']);
    });

    it('splits by question mark', () => {
      expect(splitSentences('What is this? I wonder.')).toEqual(['What is this?', 'I wonder.']);
    });

    it('splits by exclamation', () => {
      expect(splitSentences('Wow! Amazing!')).toEqual(['Wow!', 'Amazing!']);
    });

    it('handles trailing text without punctuation', () => {
      expect(splitSentences('Hello. World')).toEqual(['Hello.', 'World']);
    });

    it('handles empty string', () => {
      expect(splitSentences('')).toEqual([]);
    });

    it('handles single sentence without punctuation', () => {
      expect(splitSentences('Hello world')).toEqual(['Hello world']);
    });
  });
});
