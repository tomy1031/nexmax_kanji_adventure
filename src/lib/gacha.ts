import { INDIVIDUALS, Rank, type Individual } from '../data/individuals';

/**
 * The gem shop.
 *
 * Deliberately dull odds and a short hard ceiling. This is a study app for
 * teenagers: the gacha exists to give the daily habit a payoff, not to teach
 * anyone that pulling is exciting. So:
 *   - no paid currency, ever;
 *   - the ceiling is ten pulls, not three hundred;
 *   - a duplicate converts into gems instead of being a loss;
 *   - and the pull animation is short and does not fake a near-miss.
 */

export const PULL_COST = 100;
/**
 * Ten pulls for the price of nine, with a guarantee.
 *
 * At ~110 gems a day from the daily tasks, a single pull is an everyday thing
 * and a ten-pull is a weekly event worth saving for. That rhythm is the point:
 * the big moment should arrive about as often as a week of study does.
 */
export const MULTI_COUNT = 10;
export const MULTI_COST = PULL_COST * 9;
/** Guaranteed SPECIAL on this pull if none has landed yet. */
export const PITY_LIMIT = 10;
/** Gems returned when the pull is someone already owned. */
export const DUPLICATE_REFUND = 40;

const SPECIAL_RATE = 0.08;

export interface PullResult {
  individual: Individual;
  duplicate: boolean;
  /** Gems handed back for a duplicate. */
  refund: number;
  /** True when the pity ceiling forced this result. */
  guaranteed: boolean;
}

const pool = (rank: Rank) => INDIVIDUALS.filter((i) => i.rank === rank);

/**
 * One pull. `random` is injected so the result is testable.
 */
export const pull = (
  owned: string[],
  pityCount: number,
  random: () => number = Math.random,
): PullResult => {
  const guaranteed = pityCount + 1 >= PITY_LIMIT;
  const wantSpecial = guaranteed || random() < SPECIAL_RATE;

  const candidates = wantSpecial ? pool(Rank.SPECIAL) : pool(Rank.STANDARD);
  // Prefer someone the player does not have yet: a collection that fills up is
  // the point, and a wall of duplicates reads as the game wasting their time.
  const fresh = candidates.filter((i) => !owned.includes(i.id));
  const from = fresh.length > 0 ? fresh : candidates;

  const individual = from[Math.floor(random() * from.length) % from.length];
  const duplicate = owned.includes(individual.id);

  return {
    individual,
    duplicate,
    refund: duplicate ? DUPLICATE_REFUND : 0,
    guaranteed: guaranteed && wantSpecial,
  };
};

/** Pulls remaining before the ceiling forces a SPECIAL. */
export const pullsUntilGuaranteed = (pityCount: number): number =>
  Math.max(0, PITY_LIMIT - pityCount);

/**
 * A ten-pull.
 *
 * Resolved as ten ordinary pulls so the odds are exactly the single-pull odds
 * — nothing is quietly worse in bulk. The guarantee is that **at least one of
 * the ten is a SPECIAL**: if the first nine did not produce one, the tenth is
 * forced. That is stated on the screen rather than buried.
 *
 * `owned` is threaded through each pull so the run prefers characters the
 * player does not have yet, and duplicates inside one run are not double-
 * counted as new.
 */
export const pullMany = (
  owned: string[],
  pityCount: number,
  random: () => number = Math.random,
): { results: PullResult[]; pityAfter: number } => {
  const results: PullResult[] = [];
  const seen = [...owned];
  let pity = pityCount;

  for (let i = 0; i < MULTI_COUNT; i++) {
    const isLast = i === MULTI_COUNT - 1;
    const noSpecialYet = !results.some((r) => r.individual.rank === Rank.SPECIAL);
    // The ten-pull's own promise, on top of the running pity counter.
    const forced = isLast && noSpecialYet;

    const result = forced
      ? { ...pull(seen, PITY_LIMIT - 1, random), guaranteed: true }
      : pull(seen, pity, random);

    results.push(result);
    if (!seen.includes(result.individual.id)) seen.push(result.individual.id);
    pity = result.individual.rank === Rank.SPECIAL ? 0 : pity + 1;
  }

  return { results, pityAfter: pity };
};
