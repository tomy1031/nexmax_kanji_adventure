import { MASTERY_REPS } from './mastery';

/**
 * The street of signboards under the writing drill (08 §3.6): every passing
 * write lights one sign. A kanji's writes are laid out as one street per star
 * — 3 signs, then 3 more, then 4 more (MASTERY_REPS) — and kana have a single
 * street of three.
 *
 * The street in view is the one the latest lit sign stands on: after the third
 * write the first street shows full (3 of 3), and the fourth write opens the
 * next one. So the sign that just came on always lands where it can be seen.
 */
export interface Street {
  /** Which street, from 0. For kanji it is the star it leads to, minus one. */
  index: number;
  /** Signs on this street. */
  size: number;
  /** Signs lit on it. */
  lit: number;
  /** The last street is full: ★3, or the kana is back. */
  complete: boolean;
}

/** `bounds`: the running write counts at which each street is full. */
export const streetOf = (reps: number, bounds: readonly number[] = MASTERY_REPS): Street => {
  const last = bounds[bounds.length - 1];
  const n = Math.max(0, Math.min(reps, last));
  // The first street that n does not overflow. Exactly on a boundary (and
  // not zero), that is the street just filled — shown full.
  const index = bounds.findIndex((end) => n <= end);
  const start = index > 0 ? bounds[index - 1] : 0;
  return { index, size: bounds[index] - start, lit: n - start, complete: n === last };
};
