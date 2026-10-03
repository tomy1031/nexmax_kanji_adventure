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

/**
 * How strong the CPU is, chosen before the match: やさしい for a learner just
 * starting, ふつう (the default, as it always was), つよい for a quick hand.
 * Each is its own なかま, so the three feel like three opponents.
 */
export const CPU_LEVELS = [
  { name: 'やさしい', avatar: 'INFP', pace: 1.35, odds: [0.45, 0.75, 0.9] },
  { name: 'ふつう', avatar: 'ENTJ', pace: 1, odds: [0.55, 0.85, 0.95] },
  { name: 'つよい', avatar: 'ESTJ', pace: 0.75, odds: [0.7, 0.9, 0.97] },
] as const;
export type CpuLevel = 0 | 1 | 2;

/** One character of the CPU: how long it takes, its slips (by the level's odds) and what it lands. */
export const cpuTurn = (rating: number, rnd: () => number = Math.random, level: CpuLevel = 1): CpuTurn => {
  const { pace, odds } = CPU_LEVELS[level];
  const ms = Math.round(cpuPace(rating) * pace * 1000 * (0.75 + rnd() * 0.5));
  const r = rnd();
  const mistakes = r < odds[0] ? 0 : r < odds[1] ? 1 : r < odds[2] ? 2 : SLIPS_TO_SELF_HIT;
  return { ms, mistakes, damage: mistakes >= SLIPS_TO_SELF_HIT ? 0 : writeDamage(mistakes, false, 1) };
};
