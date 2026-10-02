import type { KanjiData } from '../types/kanji';
import { kataToHira, kunForm, primaryStem, usedReadings } from './reading';

/**
 * 読む ターン (docs/design/08 §6.4): between the writes, the opponent throws a
 * kanji and the player picks its reading from four. A rest for the hand and
 * a reading drill — for a learner who cannot write a kanji yet, proof that
 * they can already read it. New-route fights only.
 *
 * The answer is the reading the game shows above the kanji everywhere
 * (kanjiRuby's furigana), so the quiz asks for what the learner has seen.
 */

/** Writes between two reading turns. */
export const WRITES_PER_READ = 2;

/**
 * Whether the n-th turn of a fight (0-based) is a reading turn: write,
 * write, read, write, write, read… The first is always a write, and two
 * reading turns never follow each other.
 */
export const isReadTurn = (turn: number): boolean => turn > 0 && (turn + 1) % (WRITES_PER_READ + 1) === 0;

/** Every reading of a kanji as a bare hiragana stem: 日 → ひ, にち, じつ, か. */
const stemsOf = (k: KanjiData): Set<string> =>
  new Set(usedReadings(k).map((r) => kataToHira(kunForm(r).stem)));

/** A small seeded shuffle, so the same seed puts the answer in the same place. */
const shuffle = <T>(items: readonly T[], seed: number): T[] => {
  const out = [...items];
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** The reading the player has to pick for a thrown kanji. */
export const readAnswer = (k: KanjiData): string => primaryStem(k);

/**
 * Four readings for a thrown kanji, shuffled: its answer and three others,
 * taken from the fight's kanji first and then from `fallback`. A distractor
 * is never another reading of the thrown kanji (火 is ひ too, but so is 日 —
 * ひ cannot be a wrong answer for 日), and no two choices are the same.
 */
export const readChoices = (
  thrown: KanjiData,
  pool: readonly KanjiData[],
  fallback: readonly KanjiData[],
  seed: number,
): string[] => {
  const answer = readAnswer(thrown);
  const taken = stemsOf(thrown);
  const wrong: string[] = [];
  for (const k of shuffle([...pool, ...fallback], seed)) {
    if (k.id === thrown.id || wrong.length === 3) continue;
    const r = readAnswer(k);
    if (!r || taken.has(r) || wrong.includes(r)) continue;
    wrong.push(r);
  }
  return shuffle([answer, ...wrong], seed + 1);
};

/**
 * The kanji to throw: one the player owns (★1, seen and written) when there
 * is one, never the one thrown last when there is a choice.
 */
export const pickThrown = (
  pool: readonly KanjiData[],
  repsOf: (id: string) => number,
  lastId: string | null,
  seed: number,
  ownReps = 3,
): KanjiData | undefined => {
  const owned = pool.filter((k) => repsOf(k.id) >= ownReps);
  const from = owned.length ? owned : pool;
  const candidates = from.length > 1 ? from.filter((k) => k.id !== lastId) : from;
  return shuffle(candidates, seed)[0];
};
