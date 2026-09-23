import { describe, it, expect } from 'vitest';
import { ALL_KANJI } from '../data/kanji.generated';
import { kanjiRuby, primaryReading } from './reading';
import { unreadKanji } from './ruby';

describe('primaryReading', () => {
  it('reads numbers with on-yomi and nature words with kun-yomi', () => {
    const by = (c: string) => ALL_KANJI.find((k) => k.char === c)!;
    expect(primaryReading(by('一'))).toBe('いち');
    expect(primaryReading(by('山'))).toBe('やま');
  });

  it('gives every kanji in the game a reading, so none reaches the screen bare', () => {
    const bare = ALL_KANJI.filter((k) => unreadKanji(kanjiRuby(k)).length > 0).map((k) => k.char);
    expect(bare).toEqual([]);
  });
});
