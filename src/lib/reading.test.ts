import { describe, it, expect } from 'vitest';
import { ALL_KANJI } from '../data/kanji.generated';
import { exampleWord, kanjiRuby, kunWords, onReadings, primaryReading } from './reading';
import { parseRuby, unreadKanji } from './ruby';

const by = (c: string) => ALL_KANJI.find((k) => k.char === c)!;

describe('the reading above a character', () => {
  it('is the one used in the words of this level (2026-09-24: 社 は しゃ)', () => {
    expect(kanjiRuby(by('社'))).toBe('社(しゃ)');
    expect(kanjiRuby(by('会'))).toBe('会(かい)');
    expect(kanjiRuby(by('一'))).toBe('一(いち)');
  });

  it('is the word itself when the kanji stands alone as one', () => {
    expect(kanjiRuby(by('山'))).toBe('山(やま)');
    expect(kanjiRuby(by('上'))).toBe('上(うえ)');
    expect(kanjiRuby(by('手'))).toBe('手(て)');
  });

  it('never puts okurigana in the character’s place (2026-09-24)', () => {
    const withKana = ALL_KANJI.filter((k) => !/^.\([^)]+\)$/.test(kanjiRuby(k))).map((k) => k.char);
    expect(withKana).toEqual([]);
    expect(kanjiRuby(by('大'))).toBe('大(だい)');
  });

  it('gives every kanji in the game a reading, so none reaches the screen bare', () => {
    const bare = ALL_KANJI.filter((k) => unreadKanji(kanjiRuby(k)).length > 0).map((k) => k.char);
    expect(bare).toEqual([]);
  });

  it('reads aloud with okurigana when the reading is a kun word', () => {
    expect(primaryReading(by('高'))).toBe('たかい');
  });
});

describe('the reading list (the add-on)', () => {
  it('lists every kun reading a learner meets as a word', () => {
    expect(kunWords(by('上'))).toEqual(['上(うえ)', '上(あ)げる']);
    expect(kunWords(by('大'))).toEqual(['大(おお)きい']);
  });

  it('leaves out readings no word of this level uses', () => {
    expect(kunWords(by('社'))).toEqual([]);
    expect(onReadings(by('社'))).toEqual(['シャ']);
  });
});

describe('exampleWord', () => {
  it('is a basic word that uses the reading, with furigana on every kanji', () => {
    expect(exampleWord(by('社'))).toBe('会(かい)社(しゃ)');
    const bare = ALL_KANJI.map((k) => exampleWord(k))
      .filter((w): w is string => !!w)
      .filter((w) => unreadKanji(w).length > 0);
    expect(bare).toEqual([]);
  });

  it('contains the character with the reading shown above it', () => {
    const wrong = ALL_KANJI.filter((k) => {
      const w = exampleWord(k);
      return w && !parseRuby(w).some((s) => s.text === k.char);
    }).map((k) => k.char);
    expect(wrong).toEqual([]);
  });
});
