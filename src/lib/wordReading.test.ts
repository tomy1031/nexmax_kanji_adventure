import { describe, expect, it } from 'vitest';
import { charRubyIn, readingInText, readingsInWord, slotReadings, splitWord } from './wordReading';
import { GEAR } from '../data/equipment';

describe('how each kanji of a word is read in it (2026-10-10)', () => {
  it('splits a word into its kanji’s readings, voiced and cut short as the word says them', () => {
    expect(readingsInWord('友人', 'ゆうじん')).toEqual(['ゆう', 'じん']);
    expect(readingsInWord('学校', 'がっこう')).toEqual(['がっ', 'こう']);
    expect(readingsInWord('手紙', 'てがみ')).toEqual(['て', 'がみ']);
    expect(readingsInWord('一本', 'いっぽん')).toEqual(['いっ', 'ぽん']);
    expect(readingsInWord('切手', 'きって')).toEqual(['きっ', 'て']);
    expect(readingsInWord('三日月', 'みかづき')).toEqual(['み', 'か', 'づき']);
  });

  it('reads the noun form of a kanji’s verb: 入口 いり・ぐち, 買物 かい・もの', () => {
    expect(readingsInWord('入口', 'いりぐち')).toEqual(['いり', 'ぐち']);
    expect(readingsInWord('買物', 'かいもの')).toEqual(['かい', 'もの']);
  });

  it('does not split a word read as a whole', () => {
    for (const [w, r] of [['大人', 'おとな'], ['今日', 'きょう'], ['一人', 'ひとり'], ['上手', 'じょうず']]) expect(readingsInWord(w, r), w).toBeNull();
  });

  it('knows the on (音) reading from the kun', () => {
    expect(splitWord('友人', 'ゆうじん')?.map((p) => p.on)).toEqual([true, true]);
    expect(splitWord('手紙', 'てがみ')?.map((p) => p.on)).toEqual([false, false]);
  });
});

describe('readings over kanji set side by side (漢字やさん)', () => {
  it('reads each kanji as it is read in the word they make, and as usual when they make none', () => {
    expect(slotReadings(['友', '人'], { word: '友人', reading: 'ゆうじん' })).toEqual(['ゆう', 'じん']);
    expect(slotReadings(['友', '人'])).toEqual(['とも', 'ひと']);
  });

  it('leaves the kanji of a word read as a whole without readings of their own', () => {
    expect(slotReadings(['大', '人'], { word: '大人', reading: 'おとな' })).toEqual([undefined, undefined]);
  });
});

describe('a kanji read as a text beside it reads it', () => {
  it('takes the reading from the text: 時(とき)の おまもり, 月夜(つきよ)', () => {
    expect(charRubyIn('時(とき)の おまもり', '時')).toBe('時(とき)');
    expect(readingInText('月夜(つきよ)の ころも', '月')).toBe('つき');
    expect(charRubyIn('大(おお)きな 盾(たて)', '大')).toBe('大(おお)');
  });

  it('shows a kanji bare inside a word read as a whole, and as usual when the text does not have it', () => {
    expect(charRubyIn('大人(おとな)の 盾(たて)', '大')).toBe('大');
    expect(charRubyIn('山(やま)の 盾(たて)', '社')).toBe('社(しゃ)');
  });

  it('gives every piece of gear’s kanji, under its name, a reading the name agrees with', () => {
    const bare = GEAR.flatMap((g) => g.kanji.filter((c) => readingInText(g.name, c) === null).map((c) => `${g.id} ${c} in ${g.name}`));
    expect(bare).toEqual([]);
  });
});
