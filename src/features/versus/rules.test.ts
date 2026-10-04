import { describe, expect, it } from 'vitest';
import { SELF_HIT, VS_MAX_HP, versusComboBonus, writeDamage } from './rules';
import { WARD_ALL, throughWard, versusSkill, versusSkillSays } from './versusSkill';
import { unreadKanji } from '../../lib/ruby';

describe('versus rules — skill over gems', () => {
  it('pays clean writing more than any weapon can', () => {
    const cleanBare = writeDamage(0, false, 1);
    const sloppyBest = writeDamage(2, false, 1.2);
    expect(cleanBare).toBeGreaterThan(sloppyBest);
  });

  it('counts a hint like two slips', () => {
    expect(writeDamage(0, true, 1)).toBe(writeDamage(2, false, 1));
  });

  it('ends a match in a handful of clean writes, never in one', () => {
    const writes = Math.ceil(VS_MAX_HP / writeDamage(0, false, 1.2));
    expect(writes).toBeGreaterThanOrEqual(5);
    expect(writes).toBeLessThanOrEqual(8);
    expect(SELF_HIT).toBeLessThan(writeDamage(0, false, 1));
  });
});

describe('たいせんで 効く もの (docs/design/11 §7)', () => {
  it('counts the COMBO: +5% a write in a row, up to +25%', () => {
    expect(versusComboBonus(0)).toBe(0);
    expect(versusComboBonus(1)).toBe(0);
    expect(versusComboBonus(2)).toBeCloseTo(0.05);
    expect(versusComboBonus(50)).toBeCloseTo(0.25);
    expect(writeDamage(0, false, 1, 6)).toBeGreaterThan(writeDamage(0, false, 1, 0));
  });

  it('still takes several writes to win, with the best weapon, the longest COMBO and a ちから', () => {
    const best = writeDamage(0, false, 1.2, 99, versusSkill('power', 5).power);
    expect(Math.ceil(VS_MAX_HP / best)).toBeGreaterThanOrEqual(3);
  });

  it('keeps gacha and gems to a small edge: weapon × rarity stays within 1.35×', () => {
    const rare = versusSkill('power', 5).power! / versusSkill('power', 3).power!;
    expect(1.2 * rare).toBeLessThanOrEqual(1.35);
  });

  it('gives every わざ something to do in a match', () => {
    for (const k of ['heal', 'guard', 'calm', 'hint', 'power', 'combo'] as const) {
      expect(Object.keys(versusSkill(k)).length, k).toBeGreaterThan(0);
      expect(unreadKanji(versusSkillSays(versusSkill(k))), k).toEqual([]);
    }
  });

  it('lets a ward take part or all of the next hit, and says how much', () => {
    expect(throughWard(18, 15)).toEqual({ damage: 3, warded: 15 });
    expect(throughWard(18, WARD_ALL)).toEqual({ damage: 0, warded: 18 });
    expect(throughWard(18, 0)).toEqual({ damage: 18, warded: 0 });
  });
});
