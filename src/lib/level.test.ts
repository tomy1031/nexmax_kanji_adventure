import { describe, expect, it } from 'vitest';
import {
  applyLevel,
  cappedGain,
  expForReview,
  expForWrite,
  expToNext,
  expToReach,
  hpBonus,
  isReviewDue,
  levelCap,
  levelFromExp,
  levelInfo,
  levelOf,
  ownedCount,
  patienceBonus,
} from './level';

describe('ネクマックスの レベル', () => {
  it('needs 20 + 10n experience from Lv n to n + 1', () => {
    expect(expToNext(1)).toBe(30);
    expect(expToNext(2)).toBe(40);
    expect([1, 2, 3, 4, 5].map(expToReach)).toEqual([0, 30, 70, 120, 180]);
    for (let n = 1; n <= 50; n++) expect(expToReach(n + 1) - expToReach(n)).toBe(expToNext(n));
  });

  it('turns experience into a level, never below 1, never going down', () => {
    expect([0, 29, 30, 69, 70, 180].map(levelFromExp)).toEqual([1, 1, 2, 2, 3, 5]);
    expect(levelFromExp(-5)).toBe(1);
    expect(levelFromExp(Number.NaN)).toBe(1);
    let last = 1;
    for (let e = 0; e < 2000; e += 7) {
      expect(levelFromExp(e)).toBeGreaterThanOrEqual(last);
      last = levelFromExp(e);
    }
  });

  it('caps the level by the kanji owned: 1 + owned ÷ 3', () => {
    expect([0, 2, 3, 12].map(levelCap)).toEqual([1, 1, 2, 5]);
    expect(levelOf(1000, 0)).toBe(1);
    expect(levelOf(180, 3)).toBe(2);
    // Learning letters lifts the ceiling, and the saved experience counts at once.
    expect(levelOf(180, 12)).toBe(5);
  });

  it('counts owned kanji as ★1 (three writes)', () => {
    expect(ownedCount({ a: { reps: 0 }, b: { reps: 2 }, c: { reps: 3 }, d: { reps: 10 }, e: undefined })).toBe(2);
  });

  it('pays only for writing: 2 clean, 1 with a slip, 0 for a failed write', () => {
    expect([0, 1, 2, 3].map(expForWrite)).toEqual([2, 1, 1, 0]);
  });

  it('pays 3 for a review whose time has come, else as a write', () => {
    expect(expForReview(0, true)).toBe(3);
    expect(expForReview(2, true)).toBe(3);
    expect(expForReview(3, true)).toBe(0);
    expect(expForReview(0, false)).toBe(2);
    expect(expForReview(1, false)).toBe(1);
  });

  it('knows when a review is due', () => {
    const now = 1_000_000;
    expect(isReviewDue({ nextReview: 0 }, now)).toBe(false);
    expect(isReviewDue({ obtainedAt: 1, nextReview: now - 1 }, now)).toBe(true);
    expect(isReviewDue({ obtainedAt: 1, nextReview: now + 1 }, now)).toBe(false);
  });

  it('stops a daily allowance at its cap, never going negative', () => {
    expect(cappedGain(2, 0, 20)).toBe(2);
    expect(cappedGain(2, 19, 20)).toBe(1);
    expect(cappedGain(2, 20, 20)).toBe(0);
    expect(cappedGain(3, 25, 20)).toBe(0);
  });

  it('adds HP each level and a slip every fifth', () => {
    expect([1, 4, 5, 9, 10, 15].map(patienceBonus)).toEqual([0, 0, 1, 1, 2, 3]);
    expect(hpBonus(3)).toBe(8);
    const base = { maxHp: 100, defense: 2, patience: 0, attackPct: 5 };
    expect(applyLevel(base, 1)).toEqual(base);
    expect(applyLevel(base, 5)).toEqual({ maxHp: 116, defense: 2, patience: 1, attackPct: 5 });
  });

  it('describes the plate: level, bar, ceiling', () => {
    expect(levelInfo(45, 30)).toMatchObject({ level: 2, into: 15, need: 40, atCap: false });
    const capped = levelInfo(500, 3);
    expect(capped).toMatchObject({ level: 2, cap: 2, atCap: true, overflow: true });
    expect(capped.into).toBe(capped.need);
    expect(levelInfo(0, 4).kanjiToRaiseCap).toBe(2);
    expect(levelInfo(0, 6).kanjiToRaiseCap).toBe(3);
  });
});
