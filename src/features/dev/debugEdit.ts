import type { KanjiProgress } from '../../types/kanji';
import { REPS_TO_OBTAIN } from '../../types/kanji';

/**
 * The edits the debug screen (DebugScreen.tsx) makes to a save, kept pure so
 * they can be tested. Each one leaves the record in a state the game itself
 * could have reached — a kanji at ten reps has its review schedule, one
 * below has none — so what is tested with them is what a player would see.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

const blank = (): KanjiProgress => ({ reps: 0, mistakes: 0, streak: 0, nextReview: 0, intervalDays: 0 });

/**
 * Sets how many times a kanji has been written (0..REPS_TO_OBTAIN). Reaching
 * the goal starts the review schedule the way recordRep does; going below it
 * takes the kanji back.
 */
export const withReps = (prev: KanjiProgress | undefined, reps: number, now: number): KanjiProgress => {
  const p = prev ?? blank();
  const n = Math.max(0, Math.min(REPS_TO_OBTAIN, Math.round(reps)));
  if (n >= REPS_TO_OBTAIN) {
    if (p.obtainedAt != null) return { ...p, reps: n };
    return { ...p, reps: n, obtainedAt: now, intervalDays: 1, nextReview: now + DAY_MS };
  }
  const next: KanjiProgress = { ...p, reps: n, streak: Math.min(p.streak, n), nextReview: 0, intervalDays: 0 };
  delete next.obtainedAt;
  return next;
};

/** Total slipped strokes; the まとめの ボス asks the kanji slipped on most. */
export const withMistakes = (prev: KanjiProgress | undefined, mistakes: number): KanjiProgress => ({
  ...(prev ?? blank()),
  mistakes: Math.max(0, Math.round(mistakes)),
});

/**
 * Rust (lib/srs.ts rustLevel) 0..1 on an owned kanji: moves its next review
 * into the past by that share of the rust window (two intervals). 0 puts the
 * review back a full interval ahead. A kanji not yet owned cannot rust.
 */
export const withRust = (prev: KanjiProgress | undefined, level: number, now: number): KanjiProgress | undefined => {
  if (!prev || prev.obtainedAt == null) return prev;
  const interval = Math.max(1, prev.intervalDays);
  const l = Math.max(0, Math.min(1, level));
  return { ...prev, nextReview: l === 0 ? now + interval * DAY_MS : now - l * interval * DAY_MS * 2 };
};

/**
 * Clears the stages of one route up to and including `id`, and un-clears the
 * rest of that route. Stages of other routes stay as they were.
 */
export const clearThrough = (cleared: readonly string[], route: readonly string[], id: string): string[] => {
  const at = route.indexOf(id);
  if (at < 0) return [...cleared];
  const others = cleared.filter((s) => !route.includes(s));
  return [...others, ...route.slice(0, at + 1)];
};

/**
 * Clears the route up to the stage just before `id` and un-clears the rest:
 * the moment before it is played, to see what its clear opens.
 */
export const clearBefore = (cleared: readonly string[], route: readonly string[], id: string): string[] => {
  const at = route.indexOf(id);
  if (at < 0) return [...cleared];
  const others = cleared.filter((s) => !route.includes(s));
  return [...others, ...route.slice(0, at)];
};

/** Adds or removes one id. */
export const toggleIn = (list: readonly string[], id: string, on: boolean): string[] =>
  on ? (list.includes(id) ? [...list] : [...list, id]) : list.filter((s) => s !== id);

/**
 * A save pasted into the debug screen: either the state itself or what
 * localStorage holds ({ state, version }). Only keys the game knows are
 * taken, so a typo cannot add junk to the save. Null if it is not a save.
 */
export const parseSave = (text: string, known: readonly string[]): Record<string, unknown> | null => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const state = obj.state && typeof obj.state === 'object' ? (obj.state as Record<string, unknown>) : obj;
  if (!state.progress || typeof state.progress !== 'object' || !Array.isArray(state.clearedStages)) return null;
  return Object.fromEntries(Object.entries(state).filter(([k]) => known.includes(k)));
};
