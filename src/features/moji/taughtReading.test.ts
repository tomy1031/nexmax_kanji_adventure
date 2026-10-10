import { describe, expect, it } from 'vitest';
import { taughtForm, taughtRuby } from './taughtReading';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { readQuestion, readAloud } from '../../lib/readTurn';
import { kataToHira, kunForm, primaryForm } from '../../lib/reading';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { SCENES } from '../picturebook/scenes';
import type { KanjiData } from '../../types/kanji';

const k = (c: string) => getKanjiByChar(c) as KanjiData;
const form = (c: string) => {
  const f = taughtForm(k(c));
  return f.okuri ? `${f.stem}(${f.okuri})` : f.stem;
};

describe('the reading an episode teaches a kanji with (2026-10-10「これも こたえられない」)', () => {
  it('is the story’s, okurigana and all: 書 か(く), 大 おお(きい), 新 あたら(しい), 子 こ, 水 すい', () => {
    expect([form('書'), form('大'), form('新'), form('子'), form('水')]).toEqual(['か(く)', 'おお(きい)', 'あたら(しい)', 'こ', 'すい']);
    expect(taughtRuby(k('書'))).toBe('書(か)');
  });

  it('is said alone as a learner says it: 七 なな, not ななつ', () => {
    expect(form('七')).toBe('なな');
  });

  it('keeps the usual reading where the story’s is a sound inside a word or not the kanji’s own', () => {
    expect(form('達')).toBe(primaryForm(k('達')).stem);
    expect(form('国')).toBe(primaryForm(k('国')).stem);
    expect(form('入')).toBe('はい(る)');
  });

  it('is one of the kanji’s own readings, for every kanji of the route', () => {
    const bad: string[] = [];
    for (const ep of MOJI_EPISODES)
      for (const c of ep.kanji) {
        const x = k(c);
        const stem = taughtForm(x).stem;
        const own = [...x.on, ...x.kun].map((r) => kataToHira(kunForm(r).stem));
        if (!own.includes(stem) && stem !== primaryForm(x).stem) bad.push(`${ep.id} ${c} ${stem}`);
        // When the sign says it plainly, that is what is taught.
        const sign = SCENES[ep.bg]?.signs?.spots.find((s) => s.char === c)?.reading;
        if (sign && own.includes(sign) && stem !== sign) bad.push(`${ep.id} ${c}: sign ${sign}, taught ${stem}`);
      }
    expect(bad).toEqual([]);
  });

  it('is what the fight asks: 2章7話 asks 書 as かく, not しょ', () => {
    const fight = [...'書聞読見話'].map(k);
    const asked = new Set<string>();
    for (let seed = 1; seed < 60; seed++) {
      const q = readQuestion(fight, () => 10, null, seed, undefined, taughtForm)!;
      if (q.kanji.char === '書') {
        expect(readAloud(q.answer)).toBe('かく');
        expect(q.choices).toContain('か(く)');
        expect(q.choices).not.toContain('しょ');
      }
      asked.add(q.kanji.char);
    }
    expect(asked.has('書')).toBe(true);
  });
});
