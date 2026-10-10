import { beforeAll, describe, expect, it } from 'vitest';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { getCompounds, loadMoreCompounds } from '../../data/compounds';
import { HIDDEN_WEAPONS } from '../../data/hiddenWeapons';
import { getKanjiByChar } from '../kanjiDb';
import { forgeWeapon } from './weapon';
import { episodeOfStep, stageGrowth, stageOfKanji, stageOfWord } from './stage';

const EPISODES = MOJI_EPISODES.filter((e) => e.kanji.length > 0);
const forge = (word: string) => forgeWeapon([...word].map((c) => getKanjiByChar(c)!))!;
/** The real words that can first be made at episode i (0-based). */
const newWordsAt = (i: number) => {
  const have = new Set(EPISODES.slice(0, i + 1).flatMap((e) => e.kanji));
  return getCompounds().filter((w) => [...w.word].every((c) => have.has(c)) && [...w.word].some((c) => EPISODES[i].kanji.includes(c)));
};

beforeAll(() => loadMoreCompounds());

describe('武器の 段 — weapons grow with the route', () => {
  it('puts each 1章 kanji at its episode, and later kanji after them', () => {
    EPISODES.forEach((e, i) => e.kanji.forEach((c) => expect(stageOfKanji(c), c).toBe(i + 1)));
    expect(stageOfKanji('週')).toBe(10);
    expect(stageOfKanji('試')).toBeGreaterThan(EPISODES.length); // past the written chapters (6章)
    expect(stageOfWord([...'日本'])).toBe(stageOfKanji('本'));
  });

  it('rises an episode at a time, from ×1 at 1話, and never runs away', () => {
    expect(stageGrowth(1)).toBe(1);
    expect(stageGrowth(11)).toBeCloseTo(1.8);
    for (let s = 1; s < 120; s++) expect(stageGrowth(s + 1)).toBeGreaterThanOrEqual(stageGrowth(s));
    expect(stageGrowth(1000)).toBe(3);
  });

  it('turns at the end of 1章: +8% an episode there, +2% after, whatever chapters follow', () => {
    expect(stageGrowth(12)).toBeCloseTo(1.82);
    expect(stageGrowth(21)).toBeCloseTo(2.0);
  });

  it('names a step by its chapter and episode, and nothing past the written ones', () => {
    expect(episodeOfStep(3)).toEqual({ chapter: 1, episode: 3 });
    expect(episodeOfStep(11)).toEqual({ chapter: 1, episode: 11 });
    expect(episodeOfStep(0)).toBeNull();
    expect(episodeOfStep(500)).toBeNull();
  });

  it('makes the words of a later episode stronger than those of an early one, on average', () => {
    const avg = (i: number) => {
      const ws = newWordsAt(i).map((w) => forge(w.word)).filter((w) => !w.hidden);
      return ws.reduce((n, w) => n + w.attack, 0) / ws.length;
    };
    expect(avg(EPISODES.length - 1)).toBeGreaterThan(avg(0) * 1.3);
    expect(avg(5)).toBeGreaterThan(avg(1));
  });
});

describe('かくし武器 (data/hiddenWeapons.ts)', () => {
  it('has one in every episode', () => {
    expect(new Set(Object.values(HIDDEN_WEAPONS))).toEqual(new Set(EPISODES.map((e) => e.id)));
  });

  it('is a real word that can first be made in its episode', () => {
    for (const [word, id] of Object.entries(HIDDEN_WEAPONS)) {
      const i = EPISODES.findIndex((e) => e.id === id);
      expect(newWordsAt(i).map((w) => w.word), `${word} @ ${id}`).toContain(word);
    }
  });

  it('is ★5 and beats every other weapon that can be made by then', () => {
    for (const [word, id] of Object.entries(HIDDEN_WEAPONS)) {
      const i = EPISODES.findIndex((e) => e.id === id);
      const hidden = forge(word);
      expect(hidden.hidden, word).toBe(true);
      expect(hidden.rarity, word).toBe(5);
      const have = new Set(EPISODES.slice(0, i + 1).flatMap((e) => e.kanji));
      const best = Math.max(...getCompounds().filter((w) => [...w.word].every((c) => have.has(c)) && !(w.word in HIDDEN_WEAPONS)).map((w) => forge(w.word).attack));
      expect(hidden.attack, `${word} vs ${best}`).toBeGreaterThan(best);
    }
  });

  it('is never hidden when it is not a real word', () => {
    expect(forge('語読').hidden).toBe(false);
  });
});
