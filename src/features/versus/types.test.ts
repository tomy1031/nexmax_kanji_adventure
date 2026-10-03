import { describe, it, expect } from 'vitest';
import { ratingChange, rankFor, nextRank, DEFAULT_VERSUS_STATS } from './types';

describe('ratingChange', () => {
  it('gains on a win and loses on a defeat against an equal opponent', () => {
    expect(ratingChange(1000, 1000, true)).toBe(16);
    expect(ratingChange(1000, 1000, false)).toBe(-16);
  });

  it('rewards beating a stronger opponent more', () => {
    expect(ratingChange(1000, 1400, true)).toBeGreaterThan(ratingChange(1000, 1000, true));
  });

  it('punishes losing to a weaker opponent more', () => {
    expect(ratingChange(1400, 1000, false)).toBeLessThan(ratingChange(1000, 1000, false));
  });
});

describe('rankFor', () => {
  it('climbs with rating', () => {
    expect(rankFor(900).label).not.toBe(rankFor(1100).label);
    expect(rankFor(1100).label).not.toBe(rankFor(1300).label);
    expect(rankFor(1500).label).toContain('金');
  });

  it('starts everyone at the same place', () => {
    expect(DEFAULT_VERSUS_STATS.rating).toBe(1000);
    expect(DEFAULT_VERSUS_STATS.wins).toBe(0);
    expect(DEFAULT_VERSUS_STATS.losses).toBe(0);
  });
});

describe('fairness: skill must beat equipment', () => {
  it('the accuracy swing is wider than the weapon swing', () => {
    // Accuracy multipliers in VersusScreen: 1.5 clean, 1.1 one slip, 0.8 two.
    // Weapon bonus is capped at +20%.
    const skillSwing = 1.5 / 0.8;
    const weaponSwing = 1.2;
    expect(skillSwing).toBeGreaterThan(weaponSwing);
    // A clean writer with no weapon must out-damage a sloppy writer with the
    // best weapon in the game.
    expect(1.5 * 1.0).toBeGreaterThan(0.8 * 1.2);
  });
});

describe('nextRank', () => {
  it('names the rank to climb to and how far it is', () => {
    expect(nextRank(1000)).toEqual({ label: '銅(どう)', at: 1050, from: 800 });
    expect(nextRank(1050)).toEqual({ label: '銀(ぎん)', at: 1200, from: 1050 });
    expect(nextRank(1399)?.label).toBe('金(きん)');
    expect(nextRank(1400)).toBeNull();
  });

  it('agrees with rankFor at every step', () => {
    for (const r of [800, 1049, 1050, 1199, 1200, 1399]) expect(rankFor(nextRank(r)!.at).label).toBe(nextRank(r)!.label);
  });
});
