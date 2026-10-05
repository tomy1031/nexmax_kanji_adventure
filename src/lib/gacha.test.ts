import { describe, it, expect } from 'vitest';
import {
  BANNERS,
  BOND_REFUND,
  MULTI_COST,
  MULTI_COUNT,
  PULL_COST,
  STAR5_CEILING,
  cardRates,
  daysToNextPickup,
  isMet,
  pickupOf,
  pityAfter,
  pull,
  pullMany,
  weekOf,
} from './gacha';
import { CARDS } from '../data/individuals';

// Rewritten for the ★3〜5 cards and three gachas (docs/design/11 §5), with
// the user's OK to change this test (2026-10-04「書き換えてよい」).

/** Deterministic sequence so a "run" is reproducible. */
const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

describe('price', () => {
  it('costs nine pulls for ten, and less on the town gacha', () => {
    expect(MULTI_COUNT).toBe(10);
    expect(MULTI_COST).toBe(PULL_COST * 9);
    expect(BANNERS.town.single).toBeLessThan(BANNERS.standard.single);
    expect(BANNERS.town.multi).toBe(BANNERS.town.single * 9);
  });
});

describe('odds', () => {
  it('adds every gacha’s rates up to one', () => {
    for (const b of Object.values(BANNERS)) expect(b.rates[3] + b.rates[4] + b.rates[5], b.id).toBeCloseTo(1);
  });

  it('gives ★5 about 3% and ★4 about 17% on いつもの', () => {
    const rnd = seeded(42);
    const n = 20000;
    const count = { 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < n; i++) count[pull('standard', [], 0, 0, rnd).card.rarity]++;
    expect(count[5] / n).toBeGreaterThan(0.02);
    expect(count[5] / n).toBeLessThan(0.04);
    expect(count[4] / n).toBeGreaterThan(0.15);
    expect(count[4] / n).toBeLessThan(0.19);
  });

  it('can give every card from some gacha', () => {
    const from = new Set<string>();
    for (const b of Object.values(BANNERS)) for (const c of CARDS) if (b.has(c)) from.add(c.id);
    expect(CARDS.filter((c) => !from.has(c.id)).map((c) => c.id)).toEqual([]);
  });
});

describe('the ★5 ceiling', () => {
  it('makes the pull a ★5 once the ceiling is reached', () => {
    const r = pull('standard', [], STAR5_CEILING - 1, 0, seeded(1));
    expect(r.card.rarity).toBe(5);
    expect(r.guaranteed).toBe(true);
  });

  it('starts counting again after a ★5, and the town gacha does not move it', () => {
    const five = pull('standard', [], STAR5_CEILING - 1, 0, seeded(1));
    expect(pityAfter('standard', 12, five)).toBe(0);
    const three = { ...five, card: CARDS.find((c) => c.rarity === 3)! };
    expect(pityAfter('standard', 12, three)).toBe(13);
    expect(pityAfter('town', 12, three)).toBe(12);
  });
});

describe('ten-pull', () => {
  it('returns ten results', () => {
    expect(pullMany('standard', [], 0, 0, seeded(3)).results).toHaveLength(10);
  });

  it('always holds a ★4 or better, whatever the rolls', () => {
    // The promise printed on the screen, checked across many seeds: a
    // guarantee that holds "usually" is not a guarantee.
    for (const id of ['standard', 'pickup', 'town'] as const) {
      for (let seed = 1; seed <= 200; seed++) {
        const { results } = pullMany(id, [], 0, 0, seeded(seed));
        expect(results.some((r) => r.card.rarity >= 4), `${id} seed ${seed}`).toBe(true);
      }
    }
  });

  it('keeps the counter honest: it counts the pulls after the last ★5', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { results, pityAfter: p } = pullMany('standard', [], 5, 0, seeded(seed));
      const last5 = results.map((r) => r.card.rarity).lastIndexOf(5);
      expect(p, `seed ${seed}`).toBe(last5 < 0 ? 5 + results.length : results.length - 1 - last5);
    }
  });

  it('prefers cards the player does not have yet', () => {
    const { results } = pullMany('standard', [], 0, 0, seeded(5));
    expect(new Set(results.map((r) => r.card.id)).size).toBeGreaterThanOrEqual(9);
  });

  it('marks duplicates once everything is owned', () => {
    const everyone = CARDS.map((c) => c.id);
    const { results } = pullMany('standard', everyone, 0, 0, seeded(9));
    expect(results.every((r) => r.duplicate)).toBe(true);
  });

  it('keeps the same odds as ten single pulls — no hidden bulk penalty', () => {
    let good = 0;
    let total = 0;
    // ★4+ is 20% a pull; the promise adds about 1.3% on top.
    const rnd = seeded(2026);
    for (let run = 0; run < 2000; run++) {
      const { results } = pullMany('standard', [], 0, 0, rnd);
      good += results.filter((r) => r.card.rarity >= 4).length;
      total += results.length;
    }
    expect(good / total).toBeGreaterThan(0.2);
  });
});

describe('町の ガチャ', () => {
  it('gives only the town’s people, never a ★5', () => {
    const rnd = seeded(8);
    for (let i = 0; i < 2000; i++) {
      const { card } = pull('town', [], 0, 0, rnd);
      expect(card.kind).toBe('town');
      expect(card.rarity).toBeLessThan(5);
    }
  });
});

describe('ピックアップ', () => {
  it('changes every Monday and features a ★5 and two ★4', () => {
    expect(weekOf(new Date(2026, 9, 5))).toBe(weekOf(new Date(2026, 9, 11)));
    expect(weekOf(new Date(2026, 9, 12))).toBe(weekOf(new Date(2026, 9, 11)) + 1);
    expect(daysToNextPickup(new Date(2026, 9, 11))).toBe(1);
    expect(daysToNextPickup(new Date(2026, 9, 12))).toBe(7);
    const p = pickupOf(40);
    expect(p.five.rarity).toBe(5);
    expect(p.fours.map((c) => c.rarity)).toEqual([4, 4]);
    expect(pickupOf(41).five.id).not.toBe(p.five.id);
  });

  it('gives this week’s ★5 at least half the time a ★5 comes', () => {
    const rnd = seeded(77);
    let fives = 0;
    let featured = 0;
    for (let i = 0; i < 400; i++) {
      const r = pull('pickup', [], STAR5_CEILING - 1, 12, rnd);
      fives++;
      if (r.card.id === pickupOf(12).five.id) featured++;
    }
    expect(featured / fives).toBeGreaterThanOrEqual(0.5);
  });
});

describe('duplicates', () => {
  it('are worth more gems back the rarer the card (once its きずな is full)', () => {
    expect(BOND_REFUND[3]).toBeLessThan(BOND_REFUND[4]);
    expect(BOND_REFUND[4]).toBeLessThan(BOND_REFUND[5]);
  });
});

describe('町の 人は お話で 会ってから (2026-10-05)', () => {
  const ch1 = (n: number) => Array.from({ length: n }, (_, i) => `moji-1-${i + 1}`);

  it('meets each town person in the episode where they first speak', async () => {
    const { MOJI_SCRIPTS } = await import('../data/mojiScripts');
    const { MOJI_EPISODES } = await import('../data/mojiEpisodes');
    const speaks = (ep: string, who: string) => {
      const s = MOJI_SCRIPTS[ep];
      return [s.intro, s.encounter, s.outro].some((part) => part.lines.some((l) => l.speaker === who));
    };
    for (const c of CARDS.filter((x) => x.kind === 'town')) {
      expect(c.meets, c.id).toBeDefined();
      const at = MOJI_EPISODES.findIndex((e) => e.id === c.meets);
      expect(speaks(c.meets!, c.char), `${c.id} in ${c.meets}`).toBe(true);
      for (const e of MOJI_EPISODES.slice(0, at)) expect(speaks(e.id, c.char), `${c.id} already in ${e.id}`).toBe(false);
    }
  });

  it('keeps a town person out of every gacha until then', () => {
    const cleared = ch1(4); // the gacha opens on 1章 4話: only 山田さん is met
    const met = (c: (typeof CARDS)[number]) => isMet(c, cleared);
    const rnd = seeded(7);
    for (const id of ['standard', 'pickup', 'town'] as const) {
      for (let i = 0; i < 300; i++) {
        const { card } = pull(id, [], i % 29, i, rnd, false, met);
        if (card.kind === 'town') expect(card.char, `${id}: ${card.id}`).toBe('yamada');
      }
    }
    for (let w = 0; w < 60; w++) {
      const p = pickupOf(w, met);
      for (const c of [p.five, ...p.fours]) expect(met(c), `week ${w}: ${c.id}`).toBe(true);
    }
  });

  it('lets them come once their episode is cleared', () => {
    const met = (c: (typeof CARDS)[number]) => isMet(c, [...ch1(11), 'moji-1-boss', 'moji-2-1', 'moji-2-2', 'moji-2-3']);
    const seen = new Set<string>();
    const rnd = seeded(3);
    for (let i = 0; i < 400; i++) seen.add(pull('town', [], 0, 0, rnd, false, met).card.char);
    expect(seen.has('sora')).toBe(true);
    expect(seen.has('usher')).toBe(false);
  });
});

describe('くわしい かくりつ (docs/design/16 §6)', () => {
  it('adds up to one on every gacha, with each rarity at its rate', () => {
    for (const id of ['standard', 'pickup', 'town'] as const) {
      const rates = cardRates(id, [], 3);
      expect(rates.reduce((n, r) => n + r.rate, 0), id).toBeCloseTo(1, 9);
      for (const rarity of [3, 4, 5] as const) {
        const sum = rates.filter((r) => r.card.rarity === rarity).reduce((n, r) => n + r.rate, 0);
        expect(sum, `${id} ★${rarity}`).toBeCloseTo(BANNERS[id].rates[rarity], 9);
      }
    }
  });

  it('matches what the pulls give', () => {
    const rnd = seeded(11);
    const n = 40000;
    const count = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const id = pull('pickup', [], 0, 5, rnd).card.id;
      count.set(id, (count.get(id) ?? 0) + 1);
    }
    for (const { card, rate } of cardRates('pickup', [], 5).slice(0, 4)) {
      expect((count.get(card.id) ?? 0) / n, card.id).toBeCloseTo(rate, 2);
    }
  });

  it('leaves out the town people the story has not met', () => {
    const met = (c: (typeof CARDS)[number]) => isMet(c, ['moji-1-1', 'moji-1-2']);
    const chars = new Set(cardRates('town', [], 0, met).map((r) => r.card.char));
    expect([...chars]).toEqual(['yamada']);
  });
});

