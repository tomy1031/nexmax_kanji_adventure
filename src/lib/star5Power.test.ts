import { describe, it, expect } from 'vitest';
import { CARDS } from '../data/individuals';
import { unreadKanji } from './ruby';
import { STAR5_POWER, star5CleanMul, star5ComboAfterBreak, star5GaugeGain, star5GaugeStart, star5PowerOf, withStar5Stats } from './star5Power';

describe('★5 だけの ちから (docs/design/18 §2)', () => {
  it('every ★5 card has one, and nothing else does', () => {
    const fives = CARDS.filter((c) => c.rarity === 5).map((c) => c.id);
    expect(Object.keys(STAR5_POWER).sort()).toEqual(fives.sort());
    for (const c of CARDS.filter((c) => c.rarity < 5)) expect(star5PowerOf(c.id), c.id).toBeUndefined();
  });

  it('each says what it does, every kanji read, and does one thing', () => {
    const seen = new Set<string>();
    for (const [id, p] of Object.entries(STAR5_POWER)) {
      expect(unreadKanji(p.name + p.says), id).toEqual([]);
      const keys = Object.keys(p.effect);
      expect(keys, id).toHaveLength(1);
      expect(seen.has(keys[0]), `${id} ${keys[0]}`).toBe(false);
      seen.add(keys[0]);
    }
  });

  it('changes the fight only where it says', () => {
    const none = undefined;
    expect(withStar5Stats({ maxHp: 100, patience: 3, attackPct: 0 }, { maxHp: 20 })).toEqual({ maxHp: 120, patience: 3, attackPct: 0 });
    expect(withStar5Stats({ maxHp: 100, patience: 3 }, { patience: 1 })).toEqual({ maxHp: 100, patience: 4 });
    expect(withStar5Stats({ maxHp: 100, patience: 3 }, none)).toEqual({ maxHp: 100, patience: 3 });
    expect(star5GaugeStart({ gaugeStartHalf: true }, 6)).toBe(3);
    expect(star5GaugeStart({ gaugeStartHalf: true }, 9)).toBe(4);
    expect(star5GaugeStart(none, 6)).toBe(0);
    expect(star5GaugeGain(2, { gaugeBonus: 1 })).toBe(3);
    expect(star5GaugeGain(0, { gaugeBonus: 1 })).toBe(0);
    expect(star5CleanMul(true, { cleanMul: 1.3 })).toBe(1.3);
    expect(star5CleanMul(false, { cleanMul: 1.3 })).toBe(1);
    expect(star5ComboAfterBreak(7, { comboKeepHalf: true })).toBe(3);
    expect(star5ComboAfterBreak(7, none)).toBe(0);
  });
});
