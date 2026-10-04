import { beforeAll, describe, it, expect } from 'vitest';
import { MUKASHI_SCRIPTS } from './scripts/mukashi';
import { GENDAI_SCRIPTS } from './scripts/gendai';
import { TUTORIAL_AFTER_DRILL, TUTORIAL_BEFORE_BATTLE, TUTORIAL_INTRO, TUTORIAL_OUTRO } from './scripts/tutorial';
import { parseRuby } from '../lib/ruby';
import { glossFor, wordsOfLine } from './glossary';
import { loadMoreCompounds } from './compounds';
import type { NovelScript } from '../types/novel';

/**
 * ことば (docs/design/07 §3) only helps if it has an answer for every word
 * the learner might tap. Any word with furigana in a script must have one.
 */
export const everyScript = (): NovelScript[] => [
  ...MUKASHI_SCRIPTS,
  ...GENDAI_SCRIPTS,
  TUTORIAL_INTRO,
  TUTORIAL_AFTER_DRILL,
  TUTORIAL_BEFORE_BATTLE,
  TUTORIAL_OUTRO,
];

describe('ことば — the word glossary', () => {
  it('has English for every annotated word in every script', () => {
    const missing = new Set<string>();
    for (const script of everyScript()) {
      for (const line of script.lines) {
        for (const seg of parseRuby(line.text)) {
          if (seg.reading && !/^[0-9０-９]/.test(seg.text) && !glossFor(seg.text)) missing.add(`${script.stageId}: ${seg.text}`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });
});

describe('？ことば — the words of a line', () => {
  // The app loads the rest of the dictionary at start (main.tsx); 会社員 is in it.
  beforeAll(() => loadMoreCompounds());

  it('joins a word written a character at a time into the word, not its characters', () => {
    const words = wordsOfLine('わたしは 学(がく)生(せい)です。会(かい)社(しゃ)員(いん)じゃ ありません。');
    expect(words.map((w) => w.word)).toEqual(['学(がく)生(せい)', '会(かい)社(しゃ)員(いん)']);
    expect(words[0].gloss).toBe(glossFor('学生'));
    expect(words[1].gloss).toBe(glossFor('会社員'));
  });

  it('keeps characters apart when together they are not a word, and lists a word once', () => {
    const words = wordsOfLine('日(ひ)と 月(つき)と 日(ひ)');
    expect(words.map((w) => w.word)).toEqual(['日(ひ)', '月(つき)']);
  });
});
