import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { getCompounds, loadMoreCompounds } from '../../data/compounds';
import { getGear } from '../../data/equipment';
import { getKanjiByChar } from '../kanjiDb';
import { statsFromGear } from '../battle';
import { Element } from './elements';
import { TARGET_BY_REMAINDER, forgeGear, forgeTargetOf, forgedGearArt, forgedGearId, gearFromId, parseForgedGearId, strokeTotal, totalsFor, type ForgedSlot } from './gear';

const k = (c: string) => getKanjiByChar(c)!;
const make = (slot: ForgedSlot, word: string) => forgeGear(slot, [...word].map(k))!;

const EPISODES = MOJI_EPISODES.filter((e) => e.kanji.length > 0);

beforeAll(() => loadMoreCompounds());

describe('たて・からだの 合成 (docs/design/19 §2)', () => {
  it('makes a shield or a body piece from the same two or three kanji a weapon takes', () => {
    expect(forgeGear('shield', [k('火')])).toBeNull();
    const shield = make('shield', '火山');
    expect(shield.compound?.word).toBe('火山');
    expect(shield.name).toBe('火山(かざん)の 盾(たて)');
    expect(shield.defense).toBeGreaterThan(0);
    expect(shield.hp).toBeUndefined();
    const body = make('body', '火山');
    expect(body.hp).toBeGreaterThan(0);
    expect(body.defense).toBeUndefined();
    expect(body.name).toBe('火山(かざん)の よろい');
    // 水 is a cape: it streams out behind him.
    expect(make('body', '水車').name).toBe('水車(すいしゃ)の マント');
  });

  it('keeps a real word above a non-word, as the weapon does', () => {
    for (const slot of ['shield', 'body'] as const) {
      const word = make(slot, '火山');
      const not = make(slot, '山火');
      expect(not.compound).toBeNull();
      expect(word.rarity).toBeGreaterThan(not.rarity);
      const stat = (p: typeof word) => p.defense ?? p.hp ?? 0;
      expect(stat(word), slot).toBeGreaterThan(stat(not));
    }
  });

  it('carries its recipe in its id, so the save needs nothing else', () => {
    const p = make('shield', '日本');
    expect(p.id).toBe(forgedGearId('shield', [k('日').id, k('本').id]));
    expect(parseForgedGearId(p.id)).toEqual({ slot: 'shield', kanjiIds: [k('日').id, k('本').id] });
    expect(gearFromId(p.id)).toEqual(p);
    expect(parseForgedGearId('shield-oo')).toBeNull();
    expect(gearFromId('body:nope+nada')).toBeNull();
  });

  it('is worn like a table item: getGear reads it, and the fight adds it up', () => {
    const shield = make('shield', '火山');
    const body = make('body', '日本');
    const g = getGear(shield.id)!;
    expect(g.slot).toBe('shield');
    expect(g.forged?.id).toBe(shield.id);
    expect(getGear('shield-oo')?.forged).toBeUndefined();
    const stats = statsFromGear([g, getGear(body.id)!]);
    expect(stats.defense).toBe(shield.defense);
    expect(stats.maxHp).toBe(100 + body.hp!);
  });

  it('has a picture for every slot and element', () => {
    for (const slot of ['shield', 'body'] as const) {
      for (const el of Object.values(Element)) expect(existsSync(`public/${forgedGearArt(slot, el)}`), `${slot} ${el}`).toBe(true);
    }
  });
});

describe('たて・からだの つよさ — against each episode\'s own opponent', () => {
  /** The real words first made at episode i, as shields and as body pieces. */
  const madeAt = (i: number, slot: ForgedSlot) => {
    const have = new Set(EPISODES.slice(0, i + 1).flatMap((e) => e.kanji));
    return getCompounds()
      .filter((w) => w.word.length <= 3 && [...w.word].every((c) => have.has(c)) && [...w.word].some((c) => EPISODES[i].kanji.includes(c)))
      .map((w) => make(slot, w.word));
  };

  it('lets the best shield of an episode take a good bite off its strike, but never most of it', () => {
    EPISODES.forEach((e, i) => {
      const shields = madeAt(i, 'shield');
      if (!shields.length) return;
      const best = Math.max(...shields.map((s) => s.defense!));
      // The best (a かくし word, ★5): from a fifth up to under half of the opponent's attack.
      expect(best, e.id).toBeLessThan(e.boss.attack * 0.45);
      expect(best, e.id).toBeGreaterThanOrEqual(e.boss.attack * 0.2);
    });
  });

  it('keeps a body piece to about one strike of the episode\'s opponent, a かくし word to under two', () => {
    EPISODES.forEach((e, i) => {
      const bodies = madeAt(i, 'body');
      if (!bodies.length) return;
      const hp = (b: (typeof bodies)[number]) => b.hp!;
      const best = Math.max(...bodies.map(hp));
      const bestPlain = Math.max(...bodies.filter((b) => !b.hidden).map(hp));
      // Worth wearing: the best word lets Nexmax take about one more failed write…
      expect(bestPlain, e.id).toBeGreaterThanOrEqual(e.boss.attack * 0.8);
      expect(bestPlain, e.id).toBeLessThan(e.boss.attack * 1.6);
      // …and not even the episode's かくし word gives two.
      expect(best, e.id).toBeLessThan(e.boss.attack * 2);
    });
  });

  it('never lets a non-word shield block more than a sliver', () => {
    const not = make('shield', '山火');
    expect(not.defense).toBeLessThanOrEqual(3);
  });
});

describe('何が できるか — the kanji decide, by their stroke total (2026-10-08)', () => {
  const target = (w: string) => forgeTargetOf([...w].map(k));

  it('makes 1・4・7 … strokes a weapon, 2・5・8 … a shield, 3・6・9 … a body piece', () => {
    expect(target('火山')).toBe('weapon'); // 4 + 3 = 7: はじめての 武器 stays a weapon
    expect(target('山火')).toBe('weapon'); // order does not change the sum
    expect(target('月日')).toBe('shield'); // 4 + 4 = 8
    expect(target('山川')).toBe('body'); // 3 + 3 = 6
    expect(target('火')).toBe('weapon'); // one kanji: 0話's 太刀
    expect(totalsFor('weapon')).toEqual([1, 4, 7]);
    expect(totalsFor('shield')).toEqual([2, 5, 8]);
    expect(totalsFor('body')).toEqual([3, 6, 9]);
    for (const w of ['日本', '学生', '電車', '三日月']) expect(target(w)).toBe(TARGET_BY_REMAINDER[strokeTotal([...w].map(k)) % 3]);
  });

  it('gives every episode from 漢字やさん on real words of all three kinds', () => {
    // 漢字やさん opens after 1章 2話.
    EPISODES.slice(1).forEach((e, i) => {
      const have = new Set(EPISODES.slice(0, i + 2).flatMap((x) => x.kanji));
      const kinds = new Set(
        getCompounds()
          // Core and common words (tiers 0–1): the forge's own table, not the newspaper's long tail.
          .filter((w) => w.word.length <= 3 && (w.tier ?? 0) <= 1 && [...w.word].every((c) => have.has(c)))
          .map((w) => target(w.word)),
      );
      expect([...kinds].sort(), e.id).toEqual(['body', 'shield', 'weapon']);
    });
  });
});
