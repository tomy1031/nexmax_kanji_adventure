import { useState } from 'react';
import type { Weapon } from './weapon';

/**
 * 武器の ならべかた (2026-10-04「強さ順に 並べたり 武器の ソートも 欲しい」).
 * One order for every weapon list (もちもの, 図鑑), remembered on this device.
 */
export type WeaponSort = 'strong' | 'rarity' | 'new' | 'stage';

export const WEAPON_SORTS: readonly { id: WeaponSort; label: string }[] = [
  { id: 'strong', label: 'つよい 順(じゅん)' },
  { id: 'rarity', label: '★の 順(じゅん)' },
  { id: 'new', label: 'あたらしい 順(じゅん)' },
  { id: 'stage', label: 'ステージ 順(じゅん)' },
];

/**
 * The weapons in the chosen order. Ties fall back to attack, then to the
 * order they were made, so a list never shuffles between visits.
 * `madeAt` is each weapon's craftedAt, by weapon id.
 */
export const sortWeapons = <W extends Weapon>(list: readonly W[], by: WeaponSort, madeAt: ReadonlyMap<string, number> = new Map()): W[] => {
  const made = (w: W) => madeAt.get(w.id) ?? 0;
  const key: Record<WeaponSort, (a: W, b: W) => number> = {
    strong: (a, b) => b.attack - a.attack,
    rarity: (a, b) => b.rarity - a.rarity || b.attack - a.attack,
    new: (a, b) => made(b) - made(a),
    stage: (a, b) => (b.stage ?? 0) - (a.stage ?? 0) || b.attack - a.attack,
  };
  return [...list].sort((a, b) => key[by](a, b) || b.attack - a.attack || made(a) - made(b));
};

const KEY = 'nexmax.weaponSort';

const read = (): WeaponSort => {
  try {
    const v = localStorage.getItem(KEY);
    return WEAPON_SORTS.some((s) => s.id === v) ? (v as WeaponSort) : 'strong';
  } catch {
    return 'strong';
  }
};

/** The chosen order, kept on this device (a convenience, not part of the save). */
export const useWeaponSort = (): [WeaponSort, (s: WeaponSort) => void] => {
  const [sort, setSort] = useState<WeaponSort>(read);
  const choose = (s: WeaponSort) => {
    setSort(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      // private mode: the order lasts for this visit only
    }
  };
  return [sort, choose];
};
