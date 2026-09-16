import { describe, it, expect } from 'vitest';
import {
  computeDamage,
  counterDamage,
  accuracyMultiplier,
  isFailedWrite,
  starsFor,
  PLAYER_MAX_HP,
} from './battle';
import { forgeWeapon } from './forge/weapon';
import { Element } from './forge/elements';
import { getKanjiByChar } from './kanjiDb';
import { getIndividual } from '../data/individuals';

const k = (c: string) => getKanjiByChar(c)!;
const fireSword = forgeWeapon([k('火'), k('山')])!;

describe('accuracyMultiplier', () => {
  it('rewards a flawless write above everything else', () => {
    expect(accuracyMultiplier(0)).toBeGreaterThan(accuracyMultiplier(1));
    expect(accuracyMultiplier(1)).toBeGreaterThan(accuracyMultiplier(2));
    expect(accuracyMultiplier(2)).toBeGreaterThan(accuracyMultiplier(5));
  });
});

describe('computeDamage', () => {
  it('makes writing accuracy the dominant term', () => {
    const clean = computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.MU, mistakes: 0 });
    const messy = computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.MU, mistakes: 4 });
    expect(clean.damage).toBeGreaterThan(messy.damage * 4);
  });

  it('applies the elemental cycle', () => {
    const strong = computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.KIN, mistakes: 0 });
    const weak = computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.SUI, mistakes: 0 });
    expect(strong.elementMultiplier).toBe(2);
    expect(weak.elementMultiplier).toBe(0.5);
    expect(strong.damage).toBeGreaterThan(weak.damage);
  });

  it('rewards pairing an individual with the weapon they favour', () => {
    // 火山 forges a sword; まじめ favours swords.
    const matched = getIndividual('ISTJ')!;
    const withBonus = computeDamage({
      weapon: fireSword,
      individual: matched,
      defenderElement: Element.MU,
      mistakes: 0,
    });
    const without = computeDamage({
      weapon: fireSword,
      individual: null,
      defenderElement: Element.MU,
      mistakes: 0,
    });
    expect(withBonus.favoured).toBe(true);
    expect(withBonus.damage).toBeGreaterThan(without.damage);
  });

  it('still lets a player with no weapon do something', () => {
    const bare = computeDamage({ weapon: null, individual: null, defenderElement: Element.MU, mistakes: 0 });
    expect(bare.damage).toBeGreaterThan(0);
    expect(bare.damage).toBeLessThan(
      computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.MU, mistakes: 0 }).damage,
    );
  });

  it('weakens a rusted weapon without making it useless', () => {
    const fresh = computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.MU, mistakes: 0, rust: 0 });
    const rusted = computeDamage({ weapon: fireSword, individual: null, defenderElement: Element.MU, mistakes: 0, rust: 1 });
    expect(rusted.damage).toBeLessThan(fresh.damage);
    expect(rusted.damage).toBeGreaterThan(fresh.damage * 0.5);
  });

  it('never deals less than one', () => {
    const d = computeDamage({ weapon: null, individual: null, defenderElement: Element.MU, mistakes: 99, rust: 1 });
    expect(d.damage).toBeGreaterThanOrEqual(1);
  });
});

describe('counterDamage', () => {
  it('halves damage from an element the individual resists', () => {
    const resistsFire = getIndividual('ESFP')!; // resists KA
    expect(counterDamage(20, resistsFire, Element.KA)).toBeLessThan(counterDamage(20, resistsFire, Element.SUI));
  });
});

describe('isFailedWrite', () => {
  it('only counts three or more slips as a failure', () => {
    expect(isFailedWrite(0)).toBe(false);
    expect(isFailedWrite(2)).toBe(false);
    expect(isFailedWrite(3)).toBe(true);
  });
});

describe('starsFor', () => {
  it('reserves three stars for an untouched, flawless clear', () => {
    expect(starsFor(0, PLAYER_MAX_HP)).toBe(3);
    expect(starsFor(0, PLAYER_MAX_HP - 1)).toBe(2);
    expect(starsFor(9, 10)).toBe(1);
  });
});
