import { describe, expect, it } from 'vitest';
import { nameRevealed } from './nameReveal';
import { KANA_EPISODES } from '../data/kana';

describe('nameRevealed — a name shows once its letters are back', () => {
  const none = new Set<string>();

  it('waits for every kanji of the name', () => {
    expect(nameRevealed('山(やま)田(だ)', none, new Set(['山']))).toBe(false);
    expect(nameRevealed('山(やま)田(だ)', none, new Set(['山', '田']))).toBe(true);
  });

  it('reads ネクマックス once kana-9 is written (the small ッ counts as ツ)', () => {
    const upTo = (n: number) => new Set(KANA_EPISODES.filter((e) => e.order <= n).flatMap((e) => e.kana));
    expect(nameRevealed('ネクマックス', upTo(8), none)).toBe(false);
    expect(nameRevealed('ネクマックス', upTo(9), none)).toBe(true);
  });

  it('always shows a name with nothing to wait for', () => {
    expect(nameRevealed(undefined, none, none)).toBe(true);
  });
});
