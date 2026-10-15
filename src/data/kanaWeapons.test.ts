import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { KANA_EPISODES } from './kana';
import { FIRST_KANA_WEAPON, KANA_WEAPONS, canMakeKanaWeapon, getKanaWeapon, weaponKana } from './kanaWeapons';
import { wordDamage } from './kanaBattle';

const knownBy = (order: number) => new Set(KANA_EPISODES.filter((e) => e.order <= order).flatMap((e) => e.kana));
const orderOf = (id: string) => KANA_EPISODES.find((e) => e.id === id)!.order;

describe('かなの ぶき (docs/design/22 §5)', () => {
  it('can be made from the episode it says, and not before', () => {
    for (const w of KANA_WEAPONS) {
      const at = orderOf(w.from);
      expect(canMakeKanaWeapon(w, knownBy(at)), w.name).toBe(true);
      if (at > 1) expect(canMakeKanaWeapon(w, knownBy(at - 1)), w.name).toBe(false);
      expect(weaponKana(w).length, w.name).toBeGreaterThan(0);
    }
  });

  it('starts with かさ, makeable after かな 2話 for the tutorial', () => {
    const first = getKanaWeapon(FIRST_KANA_WEAPON)!;
    expect(first.from).toBe('kana-2');
    expect(canMakeKanaWeapon(first, knownBy(2))).toBe(true);
  });

  it('has a picture for each, and a later or longer name is a little stronger — never more than writing well', () => {
    for (const w of KANA_WEAPONS) {
      expect(existsSync(`public/${w.img}`), w.img).toBe(true);
      expect(w.power, w.name).toBeGreaterThan(1);
      expect(w.power, w.name).toBeLessThanOrEqual(1.5);
    }
    const best = Math.max(...KANA_WEAPONS.map((w) => w.power));
    // Two slips with the best weapon still hit softer than a clean write bare-handed.
    expect(wordDamage([{ mistakes: 2, hinted: false }], best)).toBeLessThan(wordDamage([{ mistakes: 0, hinted: false }]));
  });

  it('is used only in 0章の たたかい: the town’s fights and たいせん never read it', () => {
    for (const f of ['src/features/battle/BattleScene.tsx', 'src/lib/difficulty.ts', 'src/features/versus/VersusScreen.tsx', 'src/features/versus/VersusFight.tsx']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/equippedKanaWeapon|kanaWeapons/);
    }
  });
});
