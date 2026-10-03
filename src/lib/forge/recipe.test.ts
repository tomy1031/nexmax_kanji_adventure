import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { FORGE_ATTACK_STEP, FORGE_LEVEL_STEPS, forgeLevel, pointsToNext, weaponArt, weaponFromRecipe, weaponWord } from './recipe';
import { WeaponClass } from './weapon';
import { getKanjiByChar } from '../kanjiDb';

const ids = (word: string) => [...word].map((c) => getKanjiByChar(c)!.id);

describe('強化 (docs/design/11 §6)', () => {
  it('climbs a level at each step, up to five', () => {
    expect(forgeLevel(0)).toBe(0);
    expect(forgeLevel(FORGE_LEVEL_STEPS[0] - 1)).toBe(0);
    expect(forgeLevel(FORGE_LEVEL_STEPS[0])).toBe(1);
    expect(forgeLevel(999)).toBe(5);
    expect(pointsToNext(0)).toBe(FORGE_LEVEL_STEPS[0]);
    expect(pointsToNext(999)).toBeNull();
  });

  it('makes the same recipe hit harder, the same everywhere it is read', () => {
    const plain = weaponFromRecipe({ kanjiIds: ids('火山') })!;
    const worked = weaponFromRecipe({ kanjiIds: ids('火山'), points: FORGE_LEVEL_STEPS[2] })!;
    expect(plain.level).toBe(0);
    expect(worked.level).toBe(3);
    expect(worked.attack).toBe(Math.round(plain.attack * (1 + FORGE_ATTACK_STEP * 3)));
    expect(worked.id).toBe(plain.id);
  });

  it('names the word with its reading', () => {
    expect(weaponWord(weaponFromRecipe({ kanjiIds: ids('火山') })!)).toBe('火山(かざん)');
  });

  it('has a picture for every shape, plain and gold', () => {
    for (const c of Object.values(WeaponClass)) {
      for (const r of [1, 5]) expect(existsSync(`public/${weaponArt(c, r)}`), `${c} ★${r}`).toBe(true);
    }
  });
});
