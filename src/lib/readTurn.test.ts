import { describe, expect, it } from 'vitest';
import { READ_HIT_SHARE, isReadTurn, pickThrown, readAloud, readAnswer, readChoices, readDamage, readQuestion } from './readTurn';
import { kunForm, primaryForm } from './reading';
import { MOJI_EPISODES } from '../data/mojiEpisodes';
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

  it('asks a kun reading with its okurigana, as the word is known: 小 is ちい(さい), said ちいさい (2026-10-10)', () => {
    expect(readAnswer(k('小'))).toBe('ちい(さい)');
    expect(readAloud(readAnswer(k('小')))).toBe('ちいさい');
    // No choice is a bare stem the learner never says alone (ちい, たか, やす).
    for (const x of n5) {
      const { okuri } = primaryForm(x);
      if (okuri) expect(kunForm(readAnswer(x)).okuri, x.char).toBe(okuri);
    }
    for (const c of readChoices(k('小'), [...'高安大小新'].map(k), n5, 3)) {
      const f = kunForm(c);
      const owner = [...'高安大小新'].map(k).find((x) => primaryForm(x).stem === f.stem);
      if (owner) expect(f.okuri, c).toBe(primaryForm(owner).okuri);
    }
  });

  it('offers four different readings, the answer among them, all in hiragana', () => {
    for (let seed = 1; seed < 30; seed++) {
      const choices = readChoices(k('火'), pool, n5, seed);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(readAnswer(k('火')));
      for (const c of choices) expect(c).toMatch(/^[ぁ-ゖー]+(\([ぁ-ゖー]+\))?$/);
    }
  });

  it('never offers another reading of the thrown kanji as a wrong answer', () => {
    // 日 is にち, ひ, か (十日) … and 火's own reading is か: か must not be a wrong choice for 日.
    for (let seed = 1; seed < 30; seed++) {
      const choices = readChoices(k('日'), pool, n5, seed);
      const wrong = choices.filter((c) => c !== readAnswer(k('日')));
      expect(wrong).not.toContain('か');
      expect(wrong).not.toContain('ひ');
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

  it('takes the wrong choices from the fight first', () => {
    const fight = new Set(pool.filter((x) => x.char !== '火').map(readAnswer));
    for (let seed = 1; seed < 30; seed++) {
      const wrong = readChoices(k('火'), pool, n5, seed).filter((c) => c !== readAnswer(k('火')));
      for (const w of wrong) expect(fight, `seed ${seed}`).toContain(w);
    }
  });

  it('works for every kanji of every town episode', () => {
    for (const ep of MOJI_EPISODES) {
      const fight = ep.kanji.map(k);
      for (const t of fight) {
        const choices = readChoices(t, fight, n5, 11);
        expect(new Set(choices).size, `${ep.id} ${t.char}`).toBe(4);
        expect(choices, `${ep.id} ${t.char}`).toContain(readAnswer(t));
      }
    }
  });

  it('has a reading to ask for every N5 kanji', () => {
    expect(n5.filter((x) => !readAnswer(x)).map((x) => x.char)).toEqual([]);
  });

  it('moves the answer around between questions', () => {
    const places = new Set(Array.from({ length: 40 }, (_, i) => readChoices(k('山'), pool, n5, i + 1).indexOf('やま')));
    expect(places.size).toBeGreaterThanOrEqual(3);
  });

  it('hits for a share of a clean write: at least 1, at most half', () => {
    expect(READ_HIT_SHARE).toBeLessThanOrEqual(0.5);
    for (let x = 2; x <= 100; x++) {
      expect(readDamage(x)).toBeGreaterThanOrEqual(1);
      expect(readDamage(x)).toBeLessThanOrEqual(x / 2);
    }
  });

  it('builds a question from the fight, or none without kanji', () => {
    const q = readQuestion(pool, () => 3, null, 5);
    expect(pool).toContainEqual(q?.kanji);
    expect(q?.choices).toContain(q?.answer);
    expect(readQuestion([], () => 0, null, 5)).toBeNull();
  });
});
