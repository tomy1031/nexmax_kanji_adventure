import { describe, expect, it } from 'vitest';
import { cardWords, episodeOfKanji } from './kanjiCard';

describe('ずかんの 字カード', () => {
  it('finds the town episode that teaches a kanji', () => {
    expect(episodeOfKanji('日')?.id).toBe('moji-1-1');
    expect(episodeOfKanji('山')?.id).toBe('moji-1-2');
  });

  it('has no episode for a kanji whose episode is not written yet', () => {
    // 2章（ユニット6〜10）までは 話が ある。送 は 3章（ユニット11）。
    expect(episodeOfKanji('送')).toBeUndefined();
  });

  it('shows real words with the kanji, at most three', () => {
    const words = cardWords('日', new Set());
    expect(words.length).toBeGreaterThan(0);
    expect(words.length).toBeLessThanOrEqual(3);
    for (const w of words) expect(w.word).toContain('日');
  });

  it('puts the words the player can already read whole first', () => {
    const [first] = cardWords('火', new Set(['火', '山']));
    expect(first.word).toBe('火山');
  });

  it('keeps the basic words before harder ones when none can be read whole', () => {
    const words = cardWords('日', new Set());
    const order = { N5: 0, N4: 1, N3: 2 } as const;
    for (let i = 1; i < words.length; i++) expect(order[words[i].level]).toBeGreaterThanOrEqual(order[words[i - 1].level]);
  });
});
