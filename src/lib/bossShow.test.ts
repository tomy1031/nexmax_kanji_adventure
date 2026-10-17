import { describe, expect, it } from 'vitest';
import { beatsOfStages, beatsReached, finisherSliver, holdForFinisher } from './bossShow';

describe('ボスの 見せ場 (lib/bossShow.ts)', () => {
  it('reaches the first beat at 2/3 of its HP and the second at 1/3, once each', () => {
    expect(beatsReached(150, 120, 0)).toEqual([]);
    expect(beatsReached(150, 100, 0)).toEqual([0]);
    expect(beatsReached(150, 90, 1)).toEqual([]);
    expect(beatsReached(150, 50, 1)).toEqual([1]);
    expect(beatsReached(150, 10, 2)).toEqual([]);
  });

  it('brings both beats, in order, when one blow passes both', () => {
    expect(beatsReached(150, 40, 0)).toEqual([0, 1]);
  });

  it('goes by stage in 0章: the 2nd stage is the first beat, the 3rd the second', () => {
    expect(beatsOfStages(0, 0, 0)).toEqual([]);
    expect(beatsOfStages(0, 1, 0)).toEqual([0]);
    expect(beatsOfStages(1, 2, 1)).toEqual([1]);
    expect(beatsOfStages(0, 2, 0)).toEqual([0, 1]);
    expect(beatsOfStages(1, 2, 2)).toEqual([]);
  });

  it('never lets an ordinary blow end the fight before the finisher: it leaves a sliver and calls it', () => {
    expect(holdForFinisher(0, 160, false)).toEqual({ hp: finisherSliver(160), call: true });
    expect(finisherSliver(160)).toBe(5);
    expect(finisherSliver(10)).toBe(1);
    expect(holdForFinisher(30, 160, false)).toEqual({ hp: 30, call: false });
    // Once the finisher is written, the blow ends it.
    expect(holdForFinisher(0, 160, true)).toEqual({ hp: 0, call: false });
  });
});
