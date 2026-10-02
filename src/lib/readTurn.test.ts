import { describe, expect, it } from 'vitest';
import { isReadTurn, pickThrown, readAnswer, readChoices } from './readTurn';
import { getKanjiByChar } from './kanjiDb';
import { ALL_KANJI } from '../data/kanji.generated';
import type { KanjiData } from '../types/kanji';

const k = (c: string) => getKanjiByChar(c) as KanjiData;
const pool = [...'日月火水木'].map(k);
const n5 = ALL_KANJI.filter((x) => x.level === 'N5');

describe('読む ターン', () => {
  it('reads after every two writes, never first and never twice in a row', () => {
    const turns = Array.from({ length: 9 }, (_, i) => isReadTurn(i));
    expect(turns).toEqual([false, false, true, false, false, true, false, false, true]);
  });

  it('asks for the reading shown above the kanji', () => {
    expect(readAnswer(k('山'))).toBe('やま');
  });

  it('offers four different readings, the answer among them, all in hiragana', () => {
    for (let seed = 1; seed < 30; seed++) {
      const choices = readChoices(k('火'), pool, n5, seed);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(readAnswer(k('火')));
      for (const c of choices) expect(c).toMatch(/^[ぁ-ゖー]+$/);
    }
  });

  it('never offers another reading of the thrown kanji as a wrong answer', () => {
    // 日 is ひ, にち, じつ … and 火 is also ひ: ひ must not be a wrong choice for 日.
    for (let seed = 1; seed < 30; seed++) {
      const choices = readChoices(k('日'), pool, n5, seed);
      const wrong = choices.filter((c) => c !== readAnswer(k('日')));
      expect(wrong).not.toContain('ひ');
      expect(wrong).not.toContain('にち');
    }
  });

  it('puts the answer in the same place for the same seed', () => {
    expect(readChoices(k('水'), pool, n5, 7)).toEqual(readChoices(k('水'), pool, n5, 7));
  });

  it('throws a kanji the player owns, and not the same one twice in a row', () => {
    const reps: Record<string, number> = { [k('日').id]: 3, [k('月').id]: 6 };
    for (let seed = 1; seed < 20; seed++) {
      const t = pickThrown(pool, (id) => reps[id] ?? 0, k('日').id, seed);
      expect(t?.char).toBe('月');
    }
  });

  it('throws from the whole fight when nothing is owned yet', () => {
    expect(pool).toContainEqual(pickThrown(pool, () => 0, null, 3));
  });
});
