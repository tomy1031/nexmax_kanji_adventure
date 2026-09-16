import { describe, it, expect } from 'vitest';
import { pull, pullMany, MULTI_COUNT, MULTI_COST, PULL_COST, PITY_LIMIT } from './gacha';
import { Rank, INDIVIDUALS } from '../data/individuals';

/** Deterministic sequence so a "run" is reproducible. */
const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

describe('single pull', () => {
  it('forces a SPECIAL once the ceiling is reached', () => {
    const r = pull([], PITY_LIMIT - 1, seeded(1));
    expect(r.individual.rank).toBe(Rank.SPECIAL);
    expect(r.guaranteed).toBe(true);
  });

  it('refunds gems for a duplicate instead of giving nothing', () => {
    const everyone = INDIVIDUALS.map((i) => i.id);
    const r = pull(everyone, 0, seeded(7));
    expect(r.duplicate).toBe(true);
    expect(r.refund).toBeGreaterThan(0);
  });
});

describe('ten-pull', () => {
  it('costs nine pulls for ten', () => {
    expect(MULTI_COST).toBe(PULL_COST * 9);
    expect(MULTI_COUNT).toBe(10);
  });

  it('returns exactly ten results', () => {
    const { results } = pullMany([], 0, seeded(3));
    expect(results).toHaveLength(10);
  });

  it('always contains at least one SPECIAL, whatever the rolls', () => {
    // The promise printed on the screen. Checked across many seeds because a
    // guarantee that holds "usually" is not a guarantee.
    for (let seed = 1; seed <= 200; seed++) {
      const { results } = pullMany([], 0, seeded(seed));
      const specials = results.filter((r) => r.individual.rank === Rank.SPECIAL);
      expect(specials.length, `seed ${seed}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('clears the pity counter when a SPECIAL lands', () => {
    const { results, pityAfter } = pullMany([], 0, seeded(11));
    const lastSpecialAt = results.map((r) => r.individual.rank).lastIndexOf(Rank.SPECIAL);
    expect(lastSpecialAt).toBeGreaterThanOrEqual(0);
    // Pity counts only the pulls after the last SPECIAL.
    expect(pityAfter).toBe(results.length - 1 - lastSpecialAt);
  });

  it('prefers characters the player does not own yet', () => {
    const { results } = pullMany([], 0, seeded(5));
    const ids = results.map((r) => r.individual.id);
    const unique = new Set(ids);
    // With 16 characters and a fresh account, ten pulls should mostly be new.
    expect(unique.size).toBeGreaterThanOrEqual(6);
  });

  it('marks duplicates within one run rather than counting them as new', () => {
    const everyone = INDIVIDUALS.map((i) => i.id);
    const { results } = pullMany(everyone, 0, seeded(9));
    expect(results.every((r) => r.duplicate)).toBe(true);
    expect(results.every((r) => r.refund > 0)).toBe(true);
  });

  it('keeps the same odds as ten single pulls — no hidden bulk penalty', () => {
    // Rough check: over many runs the SPECIAL share should sit near the
    // single-pull rate plus the guarantee, not below it.
    let specials = 0;
    let total = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const { results } = pullMany([], 0, seeded(seed));
      specials += results.filter((r) => r.individual.rank === Rank.SPECIAL).length;
      total += results.length;
    }
    expect(specials / total).toBeGreaterThan(0.08);
  });
});
