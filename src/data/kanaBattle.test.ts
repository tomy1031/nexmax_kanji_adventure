import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { HIRAGANA, KATAKANA, KANA_EPISODES } from './kana';
import { KANA_WORDS, kanaToWrite } from './kanaWords';
import { KANA_BOSSES, KANA_FOES, KANA_HERO, bossFight, episodeFight, nextWord, stageOf, wordDamage, wordsToOpenAll } from './kanaBattle';
import { SCENES } from '../features/picturebook/scenes';

const knownBy = (order: number) => new Set(KANA_EPISODES.filter((e) => e.order <= order).flatMap((e) => e.kana));

describe('0章の ことば (kanaWords)', () => {
  it('uses only the kana written by then, base kana only', () => {
    const bad: string[] = [];
    for (const ep of KANA_EPISODES) {
      const known = knownBy(ep.order);
      for (const w of KANA_WORDS[ep.id] ?? []) for (const k of kanaToWrite(w)) if (!known.has(k)) bad.push(`${ep.id}: ${w.kana} (${k})`);
    }
    expect(bad).toEqual([]);
  });

  it('asks every kana of each episode in its own list, with a picture and a meaning', () => {
    for (const ep of KANA_EPISODES) {
      const words = KANA_WORDS[ep.id];
      expect(words?.length, ep.id).toBeGreaterThanOrEqual(5);
      const asked = new Set(words.flatMap(kanaToWrite));
      expect(ep.kana.filter((k) => !asked.has(k)), ep.id).toEqual([]);
      for (const w of words) {
        expect(w.emoji, w.kana).toMatch(/\p{Extended_Pictographic}/u);
        expect(w.en, w.kana).toMatch(/[a-z]/i);
      }
    }
  });
});

describe('0章の たたかい (kanaBattle)', () => {
  it('has an opponent for every episode and a boss for each script, with their pictures and places', () => {
    for (const ep of KANA_EPISODES) {
      const f = KANA_FOES[ep.id];
      expect(f, ep.id).toBeDefined();
      expect(existsSync(`public/${f.img}`), f.img).toBe(true);
      expect(f.name).not.toMatch(/[一-龯A-Za-z]/);
    }
    for (const b of KANA_BOSSES) {
      expect(existsSync(`public/${b.foe.img}`), b.foe.img).toBe(true);
      expect(SCENES[b.bg], b.bg).toBeDefined();
    }
    for (const h of Object.values(KANA_HERO)) expect(existsSync(`public/${h.img}`), h.img).toBe(true);
  });

  it('pays clean writing more than slips, and a longer word more', () => {
    const clean = wordDamage([{ mistakes: 0, hinted: false }, { mistakes: 0, hinted: false }]);
    const slips = wordDamage([{ mistakes: 2, hinted: false }, { mistakes: 1, hinted: false }]);
    const hinted = wordDamage([{ mistakes: 0, hinted: true }, { mistakes: 0, hinted: true }]);
    expect(clean).toBeGreaterThan(slips);
    expect(clean).toBeGreaterThan(hinted);
    expect(wordDamage([{ mistakes: 0, hinted: false }, { mistakes: 0, hinted: false }, { mistakes: 0, hinted: false }])).toBeGreaterThan(clean);
    expect(wordDamage([{ mistakes: 0, hinted: false }], 1.3)).toBeGreaterThan(wordDamage([{ mistakes: 0, hinted: false }]));
  });

  it('asks the sealed kana first: an episode opens every seal in a handful of words', () => {
    for (const ep of KANA_EPISODES) {
      const said = wordsToOpenAll(episodeFight(ep.id));
      expect(said.length, ep.id).toBeLessThanOrEqual(Math.ceil(ep.kana.length * 0.8));
    }
  });

  it('makes each boss hold all 46 kana of its script, in three stages, opened in under 30 words', () => {
    for (const b of KANA_BOSSES) {
      const fight = bossFight(b);
      expect(fight.seals).toEqual(b.script === 'hiragana' ? HIRAGANA : KATAKANA);
      expect(fight.stages.flat()).toEqual(fight.seals);
      expect(fight.stages).toHaveLength(3);
      const said = wordsToOpenAll(fight);
      expect(said.length, b.id).toBeLessThan(30);
      // A clean writer brings it down about when the last seal opens: not long before, not long after.
      const clean = said.reduce((n, w) => n + wordDamage(kanaToWrite(w).map(() => ({ mistakes: 0, hinted: false }))), 0);
      expect(clean, b.id).toBeGreaterThanOrEqual(fight.foe.hp * 0.9);
    }
  });

  it('moves through a boss’s stages in order and never says the same word twice in a row', () => {
    const fight = bossFight(KANA_BOSSES[0]);
    const opened = new Set<string>();
    expect(stageOf(fight, opened)).toBe(0);
    for (const k of fight.stages[0]) opened.add(k);
    expect(stageOf(fight, opened)).toBe(1);
    let last = null;
    for (let i = 0; i < 20; i++) {
      const w = nextWord(fight, new Set(fight.seals), last, Math.random);
      expect(w).not.toBe(last);
      last = w;
    }
  });
});
