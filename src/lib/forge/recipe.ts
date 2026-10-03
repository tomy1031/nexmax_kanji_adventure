import { getKanjiById } from '../kanjiDb';
import { weaponOf, type Weapon, type WeaponClass } from './weapon';

/**
 * A saved recipe → the weapon as it fights (docs/design/11 §6).
 *
 * One function for every place that turns a recipe into a weapon — the fight,
 * もちもの, 図鑑 and Hard's opponent (lib/difficulty.ts loadoutFromSave) — so
 * 強化 counts the same everywhere and Hard keeps up with it.
 */

/** 強化 points (one per clean write of the weapon's kanji, 05 §2.2) at which each level is reached. */
export const FORGE_LEVEL_STEPS = [3, 7, 12, 18, 25] as const;
export const FORGE_MAX = FORGE_LEVEL_STEPS.length;
/** Attack per 強化 level. */
export const FORGE_ATTACK_STEP = 0.06;

export const forgeLevel = (points = 0): number => FORGE_LEVEL_STEPS.filter((t) => points >= t).length;

/** Points still to go to the next level, or null at the top. */
export const pointsToNext = (points = 0): number | null => {
  const next = FORGE_LEVEL_STEPS.find((t) => points < t);
  return next == null ? null : next - points;
};

export interface RecipeLike {
  kanjiIds: readonly string[];
  /** 強化 points so far. */
  points?: number;
}

export const weaponFromRecipe = (recipe: RecipeLike): Weapon | null => {
  const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
  if (kanji.length !== recipe.kanjiIds.length) return null;
  const w = weaponOf(kanji);
  if (!w) return null;
  const level = forgeLevel(recipe.points);
  return { ...w, level, attack: level ? Math.round(w.attack * (1 + FORGE_ATTACK_STEP * level)) : w.attack };
};

/** The word it was forged from, in furigana notation: "火山(かざん)" (the name up to its reading). */
export const weaponWord = (w: Pick<Weapon, 'name'>): string => w.name.slice(0, w.name.indexOf(')') + 1);

/** The weapon's picture, mounted on Nexmax: one per shape, gold at ★5. */
export const weaponArt = (cls: WeaponClass, rarity: number): string =>
  `img/weapons/${cls.toLowerCase()}${rarity >= 5 ? '_gold' : ''}.webp`;
