import { CRITICAL_MULTIPLIER, MASTERY_DAMAGE, MASTERY_REPS, repsToNextStar, starsOf, type Stars } from '../lib/mastery';

/**
 * ★の ひみつ — what each star buys, for じゅんび (lib/mastery.ts, 08 §4.2.2).
 *
 * Told in pictures and numbers first, so a learner who cannot read the line
 * still sees "more writes, more power"; the line is short Japanese, and the
 * English sits behind the EN button (constraints 2026-09-26: English only
 * there). The numbers come from mastery.ts, so this never drifts from the
 * fight.
 */
export interface StarPerk {
  stars: 1 | 2 | 3;
  /** Writes that reach it. */
  reps: number;
  /** What it does, in pictures. */
  icons: string;
  /** The same, in furigana notation. */
  text: string;
  en: string;
}

export const STAR_PERKS: StarPerk[] = [
  {
    stars: 1,
    reps: MASTERY_REPS[0],
    icons: '🏮',
    text: '町(まち)に 字(じ)が もどる',
    en: 'The letter comes back to the town.',
  },
  {
    stars: 2,
    reps: MASTERY_REPS[1],
    icons: '⚔️',
    text: `こうげき ×${MASTERY_DAMAGE[2]}`,
    en: `Your attack with it: ×${MASTERY_DAMAGE[2]}.`,
  },
  {
    stars: 3,
    reps: MASTERY_REPS[2],
    icons: '⚔️ ✨ 🔨',
    // No-break spaces: each item wraps whole, never 字の / わざ.
    text: `こうげき\u00a0×${MASTERY_DAMAGE[3]}・字(じ)の\u00a0わざ・漢字(かんじ)やさん`,
    en: `Kanji Master: attack ×${MASTERY_DAMAGE[3]}, a clean write is a special move (×${CRITICAL_MULTIPLIER}), and the kanji shop (かんじやさん) can forge it.`,
  },
];

/** The closing line: where the next star comes from. */
export const STAR_PERKS_HOW = { text: '字(じ)を タップして 書(か)くほど ★が ふえる', en: 'Tap a letter and write it: every write counts toward the next ★.' };

/** What the next star buys, in a word (the result screen's 🎯). */
export const NEXT_STAR_GAIN: Record<2 | 3, string> = { 2: 'こうげき アップ', 3: '字(じ)の わざ' };

/**
 * The next goal after a fight: of the kanji given, the one closest to its
 * next star (★1 needs no fight — it comes from the drill), ties kept in
 * order. Null when every one is ★3.
 */
export const nextStarGoal = <K extends { id: string }>(
  kanji: readonly K[],
  repsOf: (id: string) => number,
): { kanji: K; left: number; next: 2 | 3 } | null => {
  let best: { kanji: K; left: number; next: 2 | 3 } | null = null;
  for (const k of kanji) {
    const reps = repsOf(k.id);
    const stars: Stars = starsOf(reps);
    if (stars === 0 || stars === 3) continue;
    const left = repsToNextStar(reps);
    if (!best || left < best.left) best = { kanji: k, left, next: (stars + 1) as 2 | 3 };
  }
  return best;
};
