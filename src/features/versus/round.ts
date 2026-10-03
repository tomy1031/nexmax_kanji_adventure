/**
 * The characters of a versus round, chosen by the host once it knows what the
 * guest has learned (the PROFILE each side sends).
 *
 * Fair first: the kanji both players have (★1 on the new route), then the ones
 * either has, then the basic list — so two players who know different things
 * still get a full round, and nobody is asked a kanji neither has met while a
 * shared one is left out.
 */
export const ROUND_KANJI = 12;

const shuffled = <T>(list: readonly T[], rnd: () => number): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const pickRound = (
  mine: readonly string[],
  theirs: readonly string[],
  basic: readonly string[],
  n: number = ROUND_KANJI,
  rnd: () => number = Math.random,
): string[] => {
  const theirSet = new Set(theirs);
  const both = mine.filter((c) => theirSet.has(c));
  const either = [...new Set([...mine, ...theirs])].filter((c) => !both.includes(c));
  const rest = basic.filter((c) => !both.includes(c) && !either.includes(c));
  return [...shuffled(both, rnd), ...shuffled(either, rnd), ...rest].slice(0, n);
};
