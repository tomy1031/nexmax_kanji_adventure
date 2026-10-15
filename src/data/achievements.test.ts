import { beforeAll, describe, expect, it } from 'vitest';
import { stripRuby, unreadKanji } from '../lib/ruby';
import { loadMoreCompounds } from './compounds';
import { wordsFor } from '../lib/forge/discovery';
import { HIRAGANA, KATAKANA } from './kana';
import { HIDDEN_WEAPONS } from './hiddenWeapons';
import { MOJI_EPISODES } from './mojiEpisodes';
import { MOJI_FINALES } from './mojiFinale';
import { levelCap } from '../lib/level';
import { ACHIEVEMENTS, FAMILIES, claimable, isTaken, reachedIds, type AchState } from './achievements';

beforeAll(() => loadMoreCompounds());

const fresh: AchState = {
  foundWords: {},
  progress: {},
  kana: {},
  clearedStages: [],
  perfectStages: [],
  hardStages: [],
  weapons: [],
  gear: [],
  individuals: [],
  streak: { count: 0, lastDate: '' },
  exp: 0,
  versus: { rating: 1000, wins: 0, losses: 0 } as AchState['versus'],
  writes: 0,
};

describe('称号 (docs/design/19 §5, 2026-10-08「多種多様な 種類の 称号」)', () => {
  it('has many kinds, each a ladder of real words with their readings and ◆', () => {
    expect(FAMILIES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(new Set(ACHIEVEMENTS.map((a) => a.word)).size).toBe(ACHIEVEMENTS.length);
    for (const f of FAMILIES) {
      expect(f.tiers.length, f.id).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < f.tiers.length; i++) expect(f.tiers[i].at, f.id).toBeGreaterThan(f.tiers[i - 1].at);
      for (const t of f.tiers) {
        expect(stripRuby(t.ruby), t.word).toBe(t.word);
        expect(unreadKanji(t.ruby), t.word).toEqual([]);
        expect(t.gems, t.word).toBeGreaterThan(0);
      }
    }
  });

  it('never names a かくし word, not even inside a title: the list shows before a title is earned', () => {
    for (const a of ACHIEVEMENTS) for (const w of Object.keys(HIDDEN_WEAPONS)) expect(a.word.includes(w), `${a.word}: ${w}`).toBe(false);
  });

  it('is named with words a beginner can read (2026-10-08「難しい 言葉の 配慮」)', () => {
    // Kanji the route teaches, or the few every screen shows with their readings.
    const readable = new Set([...MOJI_EPISODES.flatMap((e) => e.kanji), ...'漢字王神']);
    for (const a of ACHIEVEMENTS) {
      const hard = [...a.word].filter((c) => /[一-龠々]/.test(c) && !readable.has(c));
      expect(hard, a.word).toEqual([]);
      expect(a.en, a.word).not.toBe('');
    }
  });

  it('starts with nothing earned', () => {
    expect(reachedIds(fresh)).toEqual([]);
  });

  it('can reach every title on the route as it is written', () => {
    const route = MOJI_EPISODES.flatMap((e) => e.kanji);
    const top = (id: string) => FAMILIES.find((f) => f.id === id)!.tiers.at(-1)!.at;
    expect(top('words')).toBeLessThanOrEqual(wordsFor(new Set(route)).length);
    expect(top('masters')).toBeLessThanOrEqual(route.length);
    expect(top('kana')).toBeLessThanOrEqual(HIRAGANA.length + KATAKANA.length);
    expect(top('episodes')).toBeLessThanOrEqual(MOJI_EPISODES.filter((e) => e.kanji.length).length);
    expect(top('towns')).toBeLessThanOrEqual(MOJI_FINALES.length);
    expect(top('level')).toBeLessThanOrEqual(levelCap(route.length));
  });

  it('gives every chapter\'s closing boss its own town title', () => {
    expect(FAMILIES.find((f) => f.id === 'towns')!.tiers.map((x) => x.at)).toEqual([...MOJI_FINALES.keys()].map((i) => i + 1));
  });

  it('counts each family from the save, and a title once its count is reached', () => {
    const s: AchState = {
      ...fresh,
      clearedStages: ['moji-1-1', 'moji-1-2', 'moji-1-boss', 'kana-3'],
      perfectStages: ['moji-1-1'],
      streak: { count: 7, lastDate: '' },
      writes: 120,
    };
    const got = reachedIds(s);
    expect(got).toEqual(expect.arrayContaining(['episodes-1', 'towns-1', 'perfect-1', 'streak-3', 'streak-7', 'writes-100']));
    expect(got).not.toContain('episodes-5');
    // Taken by id; ことば's taken for a day by its word count as taken.
    const taken = ['episodes-1', '見習い'];
    expect(claimable(s, taken).map((a) => a.id)).not.toContain('episodes-1');
    expect(isTaken(taken, ACHIEVEMENTS.find((a) => a.id === 'words-10')!)).toBe(true);
  });
});
