import { describe, it, expect } from 'vitest';
import { ALL_KANJI } from '../data/kanji.generated';
import { kanjiRuby, kunWords, primaryReading } from './reading';
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

describe('okurigana', () => {
  const by = (c: string) => ALL_KANJI.find((k) => k.char === c)!;

  it('shows 大 as the word 大(おお)きい, never おお alone', () => {
    expect(kanjiRuby(by('大'))).toBe('大(おお)きい');
    expect(primaryReading(by('大'))).toBe('おおきい');
  });

  it('lists every kun reading as a word', () => {
    expect(kunWords(by('上'))).toEqual(['上(うえ)', '上(あ)げる']);
  });
});
