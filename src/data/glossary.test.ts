import { describe, it, expect } from 'vitest';
import { MUKASHI_SCRIPTS } from './scripts/mukashi';
import { TUTORIAL_AFTER_DRILL, TUTORIAL_BEFORE_BATTLE, TUTORIAL_INTRO, TUTORIAL_OUTRO } from './scripts/tutorial';
import { parseRuby } from '../lib/ruby';
import { glossFor } from './glossary';
import type { NovelScript } from '../types/novel';

/**
 * ことば (docs/design/07 §3) only helps if it has an answer for every word
 * the learner might tap. Any word with furigana in a script must have one.
 */
export const everyScript = (): NovelScript[] => [
  ...MUKASHI_SCRIPTS,
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
