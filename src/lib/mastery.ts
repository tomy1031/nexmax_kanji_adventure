/**
 * 文字が 消えた 町 — how well a kanji is known, in stars (08 §4.2.2).
 *
 * The new route asks for three writes, not ten, before a kanji is the
 * learner's (2026-09-27「書き取りは 3回くらいが いい」). Three is not enough to
 * remember a shape, so the rest of the ten is kept as mastery:
 *
 *   ★1  3 writes — the kanji comes back into the town's text.
 *   ★2  6 writes — it hits harder in a fight.
 *   ★3 10 writes — 漢字マスター: a clean write is a 字の わざ (critical), and
 *                 the kanji can be forged (the forge still needs ten).
 *
 * The count is the same `reps` the old routes use, so the two never
 * disagree: ★3 is exactly "obtained" there.
 */

/** Writes needed for ★1, ★2, ★3. */
export const MASTERY_REPS = [3, 6, 10] as const;

/** A kanji is the learner's on the new route at ★1. */
export const MOJI_OWN_REPS = MASTERY_REPS[0];

export type Stars = 0 | 1 | 2 | 3;

export const starsOf = (reps: number): Stars => {
  let s = 0;
  for (const need of MASTERY_REPS) if (reps >= need) s += 1;
  return s as Stars;
};

/** Writes still needed for the next star, or 0 at ★3. */
export const repsToNextStar = (reps: number): number => {
  const need = MASTERY_REPS.find((n) => reps < n);
  return need == null ? 0 : need - reps;
};

/**
 * Damage by stars. A kanji written only a couple of times hits soft; the
 * one written ten times hits half again as hard as ★1. Fast learners can
 * fight at ★1 and win — just not easily.
 */
export const MASTERY_DAMAGE: Record<Stars, number> = { 0: 0.6, 1: 1, 2: 1.3, 3: 1.6 };

/** 字の わざ: a perfect write of a ★3 kanji. */
export const CRITICAL_MULTIPLIER = 1.5;

export const masteryMultiplier = (stars: Stars, perfect: boolean): number =>
  MASTERY_DAMAGE[stars] * (stars === 3 && perfect ? CRITICAL_MULTIPLIER : 1);

/**
 * The opponent goes for the kanji the learner knows least: the fewest
 * writes first, then the one it has asked for least this fight, and never
 * the same one twice in a row when there is a choice. Ties keep pool order.
 */
export const pickWeakest = <K extends { id: string }>(
  pool: readonly K[],
  repsOf: (id: string) => number,
  asked: Readonly<Record<string, number>>,
  lastId: string | null,
): K | undefined => {
  const candidates = pool.length > 1 ? pool.filter((k) => k.id !== lastId) : pool;
  let best: K | undefined;
  for (const k of candidates) {
    if (!best) {
      best = k;
      continue;
    }
    const a = [Math.min(repsOf(k.id), MASTERY_REPS[2]), asked[k.id] ?? 0];
    const b = [Math.min(repsOf(best.id), MASTERY_REPS[2]), asked[best.id] ?? 0];
    if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) best = k;
  }
  return best;
};
