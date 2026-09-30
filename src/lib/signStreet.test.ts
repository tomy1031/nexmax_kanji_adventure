import { describe, expect, it } from 'vitest';
import { streetOf } from './signStreet';
import { MASTERY_REPS } from './mastery';

describe('streetOf — the signs under the drill (08 §3.6)', () => {
  it('lays a kanji out as streets of 3, 3 and 4, one per star', () => {
    expect(MASTERY_REPS).toEqual([3, 6, 10]);
    const at = (reps: number) => {
      const s = streetOf(reps);
      return [s.index, s.size, s.lit, s.complete];
    };
    expect(at(0)).toEqual([0, 3, 0, false]);
    expect(at(2)).toEqual([0, 3, 2, false]);
    // The third write fills the first street, and it stays in view.
    expect(at(3)).toEqual([0, 3, 3, false]);
    expect(at(4)).toEqual([1, 3, 1, false]);
    expect(at(6)).toEqual([1, 3, 3, false]);
    expect(at(7)).toEqual([2, 4, 1, false]);
    expect(at(9)).toEqual([2, 4, 3, false]);
    expect(at(10)).toEqual([2, 4, 4, true]);
  });

  it('never goes past the last street', () => {
    expect(streetOf(12)).toEqual(streetOf(10));
    expect(streetOf(-1)).toEqual(streetOf(0));
  });

  it('gives kana one street of three', () => {
    expect(streetOf(0, [3])).toEqual({ index: 0, size: 3, lit: 0, complete: false });
    expect(streetOf(2, [3])).toEqual({ index: 0, size: 3, lit: 2, complete: false });
    expect(streetOf(3, [3])).toEqual({ index: 0, size: 3, lit: 3, complete: true });
    expect(streetOf(5, [3])).toEqual({ index: 0, size: 3, lit: 3, complete: true });
  });
});
