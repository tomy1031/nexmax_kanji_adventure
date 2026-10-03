import { SLIPS_TO_SELF_HIT, writeDamage } from './rules';

/**
 * The CPU of たいせん — for when nobody else is waiting (the lobby is often
 * empty). It "writes" the same round at a learner's pace: a character every
 * few seconds, mostly clean, sometimes with slips, now and then three (and
 * then its turn is lost). It speeds up a little as the player's rating rises,
 * so it stays a match, never a wall. CPU matches do not change the rating.
 */
export interface CpuTurn {
  /** How long this character takes. */
  ms: number;
  /** Slips on it; SLIPS_TO_SELF_HIT or more and it lands nothing. */
  mistakes: number;
  /** What it does to the player. */
  damage: number;
}

/** Seconds per character: 8 at 1000, down to 5.5 for strong players, never below. */
export const cpuPace = (rating: number): number => Math.min(9, Math.max(5.5, 8 - (rating - 1000) / 160));

export const cpuTurn = (rating: number, rnd: () => number = Math.random): CpuTurn => {
  const ms = Math.round(cpuPace(rating) * 1000 * (0.75 + rnd() * 0.5));
  const r = rnd();
  const mistakes = r < 0.55 ? 0 : r < 0.85 ? 1 : r < 0.95 ? 2 : SLIPS_TO_SELF_HIT;
  return { ms, mistakes, damage: mistakes >= SLIPS_TO_SELF_HIT ? 0 : writeDamage(mistakes, false, 1) };
};
