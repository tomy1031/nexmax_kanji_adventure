import { describe, expect, it } from 'vitest';
import { cleanHit, hardFight, loadoutFromSave, type LoadoutSave } from './difficulty';
import { FORGE_LEVEL_STEPS, weaponFromRecipe } from './forge/recipe';
import { getMojiEpisode } from '../data/mojiEpisodes';
import { getKanjiByChar } from './kanjiDb';

// 強化 (docs/design/11 §6) makes a weapon hit harder; Hard (09 §4) must keep up
// with it, or a strengthened weapon would make Hard soft again.
const EP = getMojiEpisode('moji-1-1')!;
const id = (c: string) => getKanjiByChar(c)!.id;
const save = (points: number): LoadoutSave => ({
  weapons: [{ id: '日', kanjiIds: [id('日')], points }],
  equippedWeapon: '日',
  activeIndividual: null,
  equippedGear: { shield: null, body: null, charm: null },
  exp: 0,
  progress: Object.fromEntries(EP.kanji.map((c) => [id(c), { reps: 10 }])),
});

describe('Hard keeps up with 強化', () => {
  const top = FORGE_LEVEL_STEPS.at(-1)!;

  it('fields the weapon as the fight does, 強化 included', () => {
    for (const points of [0, FORGE_LEVEL_STEPS[0], top]) {
      expect(loadoutFromSave(save(points)).weapon?.attack, `${points} points`).toBe(
        weaponFromRecipe({ kanjiIds: [id('日')], points })?.attack,
      );
    }
  });

  it('grows with it, so the writes to win stay about the same', () => {
    const plain = hardFight(EP, save(0));
    const forged = hardFight(EP, save(top));
    expect(forged.boss.hp).toBeGreaterThan(plain.boss.hp);
    const writes = (points: number, hp: number) => Math.ceil(hp / cleanHit(loadoutFromSave(save(points)), EP.boss.element, 10));
    expect(Math.abs(writes(top, forged.boss.hp) - writes(0, plain.boss.hp))).toBeLessThanOrEqual(1);
  });
});
