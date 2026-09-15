import type { KanjiProgress } from '../types/kanji';

/**
 * Review scheduling — a trimmed SM-2.
 *
 * Quality is derived from how a rep went, not asked of the learner:
 *   clean rep            -> 5
 *   one or two slips     -> 3
 *   three or more slips  -> 1
 *
 * Anything below 3 sends the kanji back to a one-day interval. Ported from
 * kanji_go and given a fixed entry point so the drill and the forge agree on
 * what "due" means.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const EASE_FACTOR = 2.5;

export const qualityFromMistakes = (mistakes: number): number => {
  if (mistakes === 0) return 5;
  if (mistakes <= 2) return 3;
  return 1;
};

export interface ReviewOutcome {
  intervalDays: number;
  nextReview: number;
  streak: number;
}

export const calculateNextReview = (
  quality: number,
  previousIntervalDays: number,
  previousStreak: number,
  now: number = Date.now(),
): ReviewOutcome => {
  if (quality < 3) {
    return { intervalDays: 1, nextReview: now + DAY_MS, streak: 0 };
  }

  const streak = previousStreak + 1;
  let intervalDays: number;
  if (streak === 1) intervalDays = 1;
  else if (streak === 2) intervalDays = 3;
  else intervalDays = Math.ceil(previousIntervalDays * EASE_FACTOR);

  return { intervalDays, nextReview: now + intervalDays * DAY_MS, streak };
};

/** Ids whose review is due. Drives the daily task and the rust mechanic. */
export const getDueKanjiIds = (
  progress: Record<string, KanjiProgress>,
  now: number = Date.now(),
): string[] =>
  Object.entries(progress)
    .filter(([, p]) => p.obtainedAt != null && p.nextReview <= now)
    .sort((a, b) => a[1].nextReview - b[1].nextReview)
    .map(([id]) => id);

/**
 * How overdue a kanji is, 0..1. The forge uses this to rust a weapon: a
 * weapon made from kanji the learner is forgetting loses power until the
 * kanji is reviewed. Fully rusted after two review intervals overdue.
 */
export const rustLevel = (p: KanjiProgress | undefined, now: number = Date.now()): number => {
  if (!p || p.obtainedAt == null) return 0;
  const overdueMs = now - p.nextReview;
  if (overdueMs <= 0) return 0;
  const windowMs = Math.max(1, p.intervalDays) * DAY_MS * 2;
  return Math.min(1, overdueMs / windowMs);
};
