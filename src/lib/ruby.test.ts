import { describe, it, expect } from 'vitest';
import { parseRuby, stripRuby, toKana, kanjiIn, unreadKanji } from './ruby';

describe('parseRuby', () => {
  it('splits annotated words from plain text', () => {
    expect(parseRuby('村(むら)の 人(ひと)')).toEqual([
      { text: '村', reading: 'むら' },
      { text: 'の ' },
      { text: '人', reading: 'ひと' },
    ]);
  });

  it('accepts full-width parentheses', () => {
    expect(parseRuby('生命草（せいめいそう）')).toEqual([{ text: '生命草', reading: 'せいめいそう' }]);
  });

  it('keeps unannotated text as one segment', () => {
    expect(parseRuby('ネクマックス')).toEqual([{ text: 'ネクマックス' }]);
  });

  it('leaves kana before and after intact', () => {
    expect(parseRuby('お土産(みやげ)です')).toEqual([
      { text: 'お' },
      { text: '土産', reading: 'みやげ' },
      { text: 'です' },
    ]);
  });
});

describe('stripRuby / toKana', () => {
  it('removes the readings', () => {
    expect(stripRuby('高(たか)い 木(き)')).toBe('高い 木');
  });

  it('renders the line as it is read aloud', () => {
    expect(toKana('高(たか)い 木(き)')).toBe('たかい き');
  });
});

describe('kanjiIn / unreadKanji', () => {
  it('lists every kanji used', () => {
    expect(kanjiIn('村(むら)の 人(ひと)と 村(むら)')).toEqual(['村', '人']);
  });

  it('reports only kanji that reach the learner without a reading', () => {
    expect(unreadKanji('村(むら)の 人')).toEqual(['人']);
    expect(unreadKanji('村(むら)の 人(ひと)')).toEqual([]);
  });
});

describe('digits with a reading', () => {
  it('puts the reading over the digits only', () => {
    expect(parseRuby('2(ふた)つ')).toEqual([{ text: '2', reading: 'ふた' }, { text: 'つ' }]);
    expect(parseRuby('10回(かい)')).toEqual([{ text: '10' }, { text: '回', reading: 'かい' }]);
  });
});
