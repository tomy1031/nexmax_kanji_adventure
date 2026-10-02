import type { PlayerStats } from './battle';
import { isFailedWrite } from './battle';
import { MOJI_OWN_REPS } from './mastery';

/**
 * ネクマックスの レベル (docs/design/09 §2, 08 §7.1): there from the start
 * (2026-10-03「最初から あって いい。直感的に 理解は できる」).
 *
 * Experience comes only from studying — writing, reviewing on time, reading
 * in a fight, beating an opponent — and the level it buys is capped by how
 * many kanji are the learner's: replaying the same episode cannot make
 * Nexmax strong, learning new letters raises the ceiling. A level adds HP,
 * and every fifth one an extra slip before the opponent strikes. New-route
 * fights only; the picture-book arcs keep their numbers.
 */

export const EXP_WRITE = 1;
export const EXP_WRITE_CLEAN = 2;
export const EXP_REVIEW_ON_TIME = 3;
export const EXP_READ = 1;
export const EXP_BOSS_FIRST = 10;
export const EXP_BOSS_REPEAT = 3;
/** Experience one kanji can give in a day, so one letter cannot be farmed. */
export const KANJI_EXP_PER_DAY = 20;
/** Experience replays of beaten opponents can give in a day. */
export const BOSS_REPEAT_EXP_PER_DAY = 15;
/** Kanji (★1) per level of ceiling. */
export const KANJI_PER_LEVEL = 3;
export const HP_PER_LEVEL = 4;
/** One more slip allowed every this many levels. */
export const PATIENCE_EVERY = 5;

/** Experience from Lv n to n + 1. */
export const expToNext = (n: number): number => 20 + 10 * n;

/** Total experience to reach Lv L from Lv 1. */
export const expToReach = (level: number): number => (level - 1) * (20 + 5 * level);

/** The level the experience alone would buy (1 or more). */
export const levelFromExp = (exp: number): number => {
  if (!Number.isFinite(exp) || exp <= 0) return 1;
  let level = 1;
  while (expToReach(level + 1) <= exp) level += 1;
  return level;
};

/** The highest level the learner's kanji allow. */
export const levelCap = (owned: number): number => 1 + Math.floor(Math.max(0, owned) / KANJI_PER_LEVEL);

/** The level in use: what the experience buys, up to the ceiling. */
export const levelOf = (exp: number, owned: number): number => Math.min(levelCap(owned), levelFromExp(exp));

/** Kanji the learner owns on the new route (★1, as useOwnedKanji counts). */
export const ownedCount = (progress: Record<string, { reps?: number } | undefined>): number =>
  Object.values(progress).filter((p) => (p?.reps ?? 0) >= MOJI_OWN_REPS).length;

/** Experience for one write: 2 clean, 1 with a slip or two, 0 for a failed one. */
export const expForWrite = (mistakes: number): number =>
  isFailedWrite(mistakes) ? 0 : mistakes === 0 ? EXP_WRITE_CLEAN : EXP_WRITE;

/** Experience for a review: 3 when it was due, else as a write. */
export const expForReview = (mistakes: number, due: boolean): number =>
  isFailedWrite(mistakes) ? 0 : due ? EXP_REVIEW_ON_TIME : expForWrite(mistakes);

/** A review whose time has come. */
export const isReviewDue = (p: { obtainedAt?: number | null; nextReview?: number } | undefined, now: number): boolean =>
  p?.obtainedAt != null && (p.nextReview ?? 0) <= now;

/** What is left of a daily allowance: never below zero. */
export const cappedGain = (want: number, used: number, cap: number): number => Math.max(0, Math.min(want, cap - used));

export const hpBonus = (level: number): number => HP_PER_LEVEL * (level - 1);

export const patienceBonus = (level: number): number => Math.floor(level / PATIENCE_EVERY);

/** The fight's stats with the level's HP and patience added. */
export const applyLevel = (stats: PlayerStats, level: number): PlayerStats =>
  level <= 1 ? stats : { ...stats, maxHp: stats.maxHp + hpBonus(level), patience: stats.patience + patienceBonus(level) };

/** Everything the level plate shows. */
export const levelInfo = (exp: number, owned: number) => {
  const rawLevel = levelFromExp(exp);
  const cap = levelCap(owned);
  const level = Math.min(cap, rawLevel);
  const atCap = rawLevel >= cap;
  const need = expToNext(level);
  const into = atCap ? Math.min(need, Math.max(0, exp - expToReach(level))) : exp - expToReach(level);
  // Kanji still to learn before the ceiling moves up one level.
  const kanjiToRaiseCap = KANJI_PER_LEVEL - (Math.max(0, owned) % KANJI_PER_LEVEL);
  return { level, cap, rawLevel, into, need, atCap, overflow: rawLevel > cap, kanjiToRaiseCap };
};
