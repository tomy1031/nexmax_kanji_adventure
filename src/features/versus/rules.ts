/**
 * The numbers of a versus fight (VersusFight). The weapon matters, but only a
 * little: writing well (clean 1.5× against two slips 0.8×, about 1.9×) always
 * outweighs the best weapon (at most 1.2×), so a learner with a thin
 * collection can still win by knowing the kanji.
 */
export const VS_MAX_HP = 100;
const BASE_DAMAGE = 12;
/** Slips on one character that turn the hit back on the writer. */
export const SLIPS_TO_SELF_HIT = 3;
/** What a write with too many slips costs the writer. */
export const SELF_HIT = Math.round(BASE_DAMAGE * 0.75);

/** COMBO in たいせん (docs/design/11 §7): +5% a clean write in a row after the first, up to +25%. */
export const VS_COMBO_STEP = 0.05;
export const VS_COMBO_MAX = 0.25;
export const versusComboBonus = (combo: number): number => Math.min(VS_COMBO_MAX, VS_COMBO_STEP * Math.max(0, combo - 1));

/**
 * Damage of a write: clean 1.5×, one slip 1.1×, two (or a hint) 0.8×, times
 * the weapon (≤ 1.2), the COMBO (≤ 1.25) and a ちから わざ (≤ 1.5, once).
 */
export const writeDamage = (mistakes: number, hinted: boolean, weaponBonus: number, combo = 0, power = 1): number => {
  const accuracy = hinted ? 0.8 : mistakes === 0 ? 1.5 : mistakes === 1 ? 1.1 : 0.8;
  return Math.max(1, Math.round(BASE_DAMAGE * accuracy * weaponBonus * (1 + versusComboBonus(combo)) * power));
};
