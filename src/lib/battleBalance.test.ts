import { describe, expect, it } from 'vitest';
import { MOJI_EPISODES, type MojiEpisode } from '../data/mojiEpisodes';
import { MOJI_CHAPTERS } from '../data/mojiRoute';
import { MOJI_FINALES } from '../data/mojiFinale';
import { PLAYER_MAX_HP, basePatience, continuesFor, countedSlip } from './battle';
import { hpBonus, patienceBonus } from './level';

/**
 * 「多少はミスタッチ前提でゲームバランスを作ることが大切」「何度かに一度は間違える」(2026-10-15):
 * the town's fights, played by a hand that slips now and then. A coarse model
 * of BattleScene, with the real numbers of every episode and まとめの ボス:
 *
 *  - the player owns every kanji up to the fight and is at half the level
 *    those kanji allow (1 + owned ÷ 6) — no grinding;
 *  - no shield, no なかま, no continue;
 *  - it takes two writes a kanji (the HP is sized to that, mojiEpisodes.ts);
 *  - a write's slips are drawn so their average is `mean`; the first slip of
 *    a write is free (countedSlip), the rest add up to the patience and the
 *    opponent strikes.
 *
 * It leaves out the reading turns and the hint: a check on the slips' cost,
 * not a replay.
 */

const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
/** Slips on one write, averaging `mean` (most writes clean, some one, a few more); a stroke gives way after three (forgiveAfter). */
const slips = (mean: number, rnd: () => number) => {
  const q = mean / (1 + mean);
  let m = 0;
  while (m < 6 && rnd() < q) m++;
  return m;
};

const ordered: MojiEpisode[] = [...MOJI_EPISODES].sort(
  (a, b) => MOJI_CHAPTERS.find((c) => c.id === a.chapter)!.order - MOJI_CHAPTERS.find((c) => c.id === b.chapter)!.order || a.order - b.order,
);
const ownedBy = (id: string) => {
  let n = 0;
  for (const ep of ordered) {
    n += ep.kanji.length;
    if (ep.id === id) return n;
  }
  return n;
};

/** How often a hand wins a fight of `writes` writes, with `lives` (1 + its continues). */
const winRate = (f: { hp: number; patience: number; attack: number; writes: number }, mean: number, lives = 1, runs = 400) => {
  const rnd = seeded(2026);
  let won = 0;
  for (let r = 0; r < runs; r++) {
    let hp = f.hp;
    let rage = 0;
    let left = lives;
    for (let w = 0; w < f.writes && left > 0; w++) {
      const m = slips(mean, rnd);
      for (let s = 1; s <= m && left > 0; s++) {
        if (!countedSlip(s)) continue;
        rage += 1;
        if (rage < f.patience) continue;
        rage = 0;
        hp -= f.attack;
        if (hp <= 0) {
          left -= 1;
          hp = f.hp;
        }
      }
    }
    if (left > 0) won++;
  }
  return won / runs;
};

const fightOf = (owned: number, patience: number, attack: number, writes: number) => {
  const level = 1 + Math.floor(owned / 6);
  return { hp: PLAYER_MAX_HP + hpBonus(level), patience: patience + patienceBonus(level), attack, writes };
};

describe('町の たたかい — ミスタッチ前提の バランス', () => {
  it('lets a hand that slips about once in two writes win every episode without a continue', () => {
    for (const ep of ordered) {
      const f = fightOf(ownedBy(ep.id), basePatience(ep.order), ep.boss.attack, ep.kanji.length * 2 + 1);
      expect(winRate(f, 0.5), ep.id).toBeGreaterThanOrEqual(0.97);
    }
  });

  it('lets a clumsy hand (a slip on every write, on average) win every episode most of the time, and with its continue almost always', () => {
    for (const ep of ordered) {
      const f = fightOf(ownedBy(ep.id), basePatience(ep.order), ep.boss.attack, ep.kanji.length * 2 + 1);
      expect(winRate(f, 1), ep.id).toBeGreaterThanOrEqual(0.8);
      const lives = 1 + continuesFor({ difficulty: 'normal', finale: false, tutorial: false, route: 'moji' });
      expect(winRate(f, 1, lives), ep.id).toBeGreaterThanOrEqual(0.97);
    }
  });

  it('lets a clumsy hand beat every まとめの ボス with its two continues', () => {
    for (const f of MOJI_FINALES) {
      const last = ordered.filter((e) => e.chapter === f.chapter).at(-1)!;
      const fight = fightOf(ownedBy(last.id), f.patience, f.boss.attack, f.asks * 2 + 1);
      const lives = 1 + continuesFor({ difficulty: 'normal', finale: true, tutorial: false, route: 'moji' });
      expect(winRate(fight, 1, lives), f.id).toBeGreaterThanOrEqual(0.95);
    }
  });

  it('gives no continue on Hard, in the tutorial or on the old picture-book route', () => {
    expect(continuesFor({ difficulty: 'hard', finale: true, tutorial: false, route: 'moji' })).toBe(0);
    expect(continuesFor({ difficulty: 'normal', finale: false, tutorial: true, route: 'moji' })).toBe(0);
    expect(continuesFor({ difficulty: 'normal', finale: false, tutorial: false, route: 'old' })).toBe(0);
    expect(continuesFor({ difficulty: 'easy', finale: false, tutorial: false, route: 'moji' })).toBe(1);
    expect(continuesFor({ difficulty: 'normal', finale: true, tutorial: false, route: 'moji' })).toBe(2);
  });
});
