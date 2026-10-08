import { describe, expect, it } from 'vitest';
import { cardWords, episodeOfKanji } from './kanjiCard';

describe('ずかんの 字カード', () => {
  it('finds the town episode that teaches a kanji', () => {
    expect(episodeOfKanji('日')?.id).toBe('moji-1-1');
    expect(episodeOfKanji('山')?.id).toBe('moji-1-2');
  });

  it('has no episode for a kanji whose episode is not written yet', () => {
    // 4章（ユニット13〜15）までは 話が ある。降 は 5章（ユニット16）。
    expect(episodeOfKanji('降')).toBeUndefined();
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

  it('offers a word not in ことば図鑑 yet before one that is (docs/design/19 §4)', () => {
    const owned = new Set(['火', '山', '花']);
    const [first] = cardWords('火', owned);
    const [next] = cardWords('火', owned, 3, new Set([first.word]));
    expect(next.word).not.toBe(first.word);
    expect([...next.word].every((c) => owned.has(c))).toBe(true);
    // A word found stays on the card, after the new ones.
    expect(cardWords('火', owned, 10, new Set([first.word])).map((w) => w.word)).toContain(first.word);
  });

  it('never shows a かくし word: it is found only by trying', () => {
    // 日月 is 1章 1話's かくし word.
    expect(cardWords('月', new Set(['日', '月']), 50).map((w) => w.word)).not.toContain('日月');
  });
});
