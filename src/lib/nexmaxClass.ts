/**
 * ネクマックスの クラス (docs/design/21, 08 §7.3): ★3 から はじまり、本の 1冊ごとの
 * さいごの ボスで 1つ 上がる。
 *
 * The one condition is the finale's win, on any difficulty: the story says
 * Nexmax became ★4 however the fight was won, and the rest of 08 §7.3's
 * condition (the level, the kanji owned) is already there by then — every
 * episode has its kanji written to ★1 before its fight, and a finale opens
 * only once its chapter is taught. A clear is never taken back, so neither
 * is the class.
 *
 * Not to be mixed up with a kanji's ★1〜3 or a card's ★3〜5: the screens
 * always say クラス ★4.
 */

export type NexmaxClass = 3 | 4 | 5;

export interface ClassStep {
  star: NexmaxClass;
  /** The finale whose win brings it; null for the class he starts in. */
  stage: string | null;
  /** Its chapter, for the class card (08 §3.3). */
  chapter: number | null;
}

/** The finale that makes Nexmax ★4: the end of 初級I (5章; moji5.ts's ending shows it). */
export const STAR4_STAGE = 'moji-5-boss';

/** ★5 comes at the end of 初級II (10章, not written yet). */
export const CLASS_STEPS: readonly ClassStep[] = [
  { star: 3, stage: null, chapter: null },
  { star: 4, stage: STAR4_STAGE, chapter: 5 },
  { star: 5, stage: 'moji-10-boss', chapter: 10 },
];

/** The class the clears have reached. */
export const classOf = (cleared: readonly string[]): NexmaxClass =>
  CLASS_STEPS.reduce<NexmaxClass>((cls, s) => (s.stage && cleared.includes(s.stage) && s.star > cls ? s.star : cls), 3);

/** Accessories that can be worn at once: one more from ★4 (08 §7.3「パーツの 枠 ＋1」). */
export const charmSlots = (cls: NexmaxClass): number => (cls >= 4 ? 2 : 1);

/**
 * What is worn, as the class allows: the second accessory counts only from
 * ★4. Every place that adds up the gear (the fight, Hard, もちもの) reads it
 * through this, so a save that somehow kept one below ★4 is not stronger.
 */
export const wornAt = <T extends { charm2?: string | null }>(equipped: T, cls: NexmaxClass): T =>
  charmSlots(cls) >= 2 || !equipped.charm2 ? equipped : { ...equipped, charm2: null };
