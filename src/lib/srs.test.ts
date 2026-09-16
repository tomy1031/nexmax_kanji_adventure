import { describe, it, expect } from 'vitest';
import { calculateNextReview, qualityFromMistakes, getDueKanjiIds, rustLevel } from './srs';
import type { KanjiProgress } from '../types/kanji';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

const progress = (over: Partial<KanjiProgress>): KanjiProgress => ({
  reps: 10,
  mistakes: 0,
  streak: 1,
  nextReview: NOW,
  intervalDays: 1,
  obtainedAt: NOW - DAY,
  ...over,
});

describe('qualityFromMistakes', () => {
  it('grades a clean rep highest and a messy one lowest', () => {
    expect(qualityFromMistakes(0)).toBe(5);
    expect(qualityFromMistakes(2)).toBe(3);
    expect(qualityFromMistakes(3)).toBe(1);
  });
});

describe('calculateNextReview', () => {
  it('sends a failed rep back to tomorrow and clears the streak', () => {
    expect(calculateNextReview(1, 10, 4, NOW)).toEqual({
      intervalDays: 1,
      nextReview: NOW + DAY,
      streak: 0,
    });
  });

  it('walks 1 -> 3 -> x2.5 as the streak grows', () => {
    expect(calculateNextReview(5, 0, 0, NOW).intervalDays).toBe(1);
    expect(calculateNextReview(5, 1, 1, NOW).intervalDays).toBe(3);
    expect(calculateNextReview(5, 3, 2, NOW).intervalDays).toBe(8);
  });
});

describe('getDueKanjiIds', () => {
  it('returns owned, overdue kanji soonest-first', () => {
    const due = getDueKanjiIds(
      {
        late: progress({ nextReview: NOW - 5 * DAY }),
        soon: progress({ nextReview: NOW - DAY }),
        future: progress({ nextReview: NOW + DAY }),
      },
      NOW,
    );
    expect(due).toEqual(['late', 'soon']);
  });

  it('ignores kanji that are still being drilled', () => {
    const due = getDueKanjiIds({ partial: progress({ reps: 4, obtainedAt: undefined }) }, NOW);
    expect(due).toEqual([]);
  });
});

describe('rustLevel', () => {
  it('is clean until the review is due', () => {
    expect(rustLevel(progress({ nextReview: NOW + DAY }), NOW)).toBe(0);
  });

  it('reaches full rust two intervals past due', () => {
    const p = progress({ intervalDays: 4, nextReview: NOW - 8 * DAY });
    expect(rustLevel(p, NOW)).toBe(1);
    expect(rustLevel({ ...p, nextReview: NOW - 4 * DAY }, NOW)).toBeCloseTo(0.5);
  });
});
