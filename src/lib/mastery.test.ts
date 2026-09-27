import { describe, expect, it } from 'vitest';
import { REPS_TO_OBTAIN } from '../types/kanji';
import { MASTERY_REPS, MOJI_OWN_REPS, masteryMultiplier, pickWeakest, repsToNextStar, starsOf } from './mastery';

describe('mastery stars', () => {
  it('3 writes obtain, 6 is ★2, 10 is ★3', () => {
    expect(MOJI_OWN_REPS).toBe(3);
    expect([0, 2, 3, 5, 6, 9, 10].map(starsOf)).toEqual([0, 0, 1, 1, 2, 2, 3]);
  });

  it('★3 is exactly the old routes’ "obtained", so the forge rule still holds', () => {
    expect(MASTERY_REPS[2]).toBe(REPS_TO_OBTAIN);
  });

  it('counts the writes left to the next star', () => {
    expect(repsToNextStar(0)).toBe(3);
    expect(repsToNextStar(4)).toBe(2);
    expect(repsToNextStar(10)).toBe(0);
  });

  it('more stars hit harder, and only a perfect ★3 write is critical', () => {
    const m = ([0, 1, 2, 3] as const).map((s) => masteryMultiplier(s, false));
    expect(m).toEqual([...m].sort((a, b) => a - b));
    expect(masteryMultiplier(3, true)).toBeGreaterThan(masteryMultiplier(3, false));
    expect(masteryMultiplier(2, true)).toBe(masteryMultiplier(2, false));
  });
});

describe('pickWeakest', () => {
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const reps: Record<string, number> = { a: 6, b: 3, c: 3 };
  const repsOf = (id: string) => reps[id];

  it('goes for the fewest writes, then the least asked', () => {
    expect(pickWeakest(pool, repsOf, {}, null)?.id).toBe('b');
    expect(pickWeakest(pool, repsOf, { b: 1 }, null)?.id).toBe('c');
  });

  it('never repeats the last one when there is a choice', () => {
    expect(pickWeakest(pool, repsOf, {}, 'b')?.id).toBe('c');
    expect(pickWeakest([{ id: 'a' }], repsOf, {}, 'a')?.id).toBe('a');
  });
});
