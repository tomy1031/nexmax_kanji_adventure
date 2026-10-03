import { describe, it, expect } from 'vitest';
import { clearBefore, clearThrough, DAY_MS, parseSave, toggleIn, withMistakes, withReps, withRust } from './debugEdit';
import { rustLevel } from '../../lib/srs';
import type { KanjiProgress } from '../../types/kanji';

const NOW = 1_800_000_000_000;

describe('withReps', () => {
  it('starts the review schedule on reaching ten, like a real write', () => {
    const p = withReps(undefined, 10, NOW);
    expect(p.reps).toBe(10);
    expect(p.obtainedAt).toBe(NOW);
    expect(p.nextReview).toBe(NOW + DAY_MS);
    expect(rustLevel(p, NOW)).toBe(0);
  });

  it('keeps an owned kanji’s schedule when it is set to ten again', () => {
    const owned: KanjiProgress = { reps: 10, mistakes: 2, streak: 3, nextReview: NOW - 5, intervalDays: 6, obtainedAt: 42 };
    expect(withReps(owned, 10, NOW)).toEqual(owned);
  });

  it('takes the kanji back below ten', () => {
    const owned: KanjiProgress = { reps: 10, mistakes: 2, streak: 5, nextReview: NOW, intervalDays: 6, obtainedAt: 42 };
    const p = withReps(owned, 3, NOW);
    expect(p).toEqual({ reps: 3, mistakes: 2, streak: 3, nextReview: 0, intervalDays: 0 });
    expect('obtainedAt' in p).toBe(false);
  });

  it('stays within 0..10', () => {
    expect(withReps(undefined, -4, NOW).reps).toBe(0);
    expect(withReps(undefined, 99, NOW).reps).toBe(10);
  });
});

describe('withMistakes', () => {
  it('sets the slip count and never goes negative', () => {
    expect(withMistakes(undefined, 4).mistakes).toBe(4);
    expect(withMistakes({ reps: 3, mistakes: 9, streak: 0, nextReview: 0, intervalDays: 0 }, -1).mistakes).toBe(0);
  });
});

describe('withRust', () => {
  const owned: KanjiProgress = { reps: 10, mistakes: 0, streak: 1, nextReview: NOW + DAY_MS, intervalDays: 3, obtainedAt: 1 };

  it('gives the rust level asked for', () => {
    for (const level of [0, 0.5, 1]) {
      expect(rustLevel(withRust(owned, level, NOW), NOW)).toBeCloseTo(level);
    }
  });

  it('leaves a kanji that is not owned alone — it cannot rust', () => {
    const learning: KanjiProgress = { reps: 5, mistakes: 0, streak: 0, nextReview: 0, intervalDays: 0 };
    expect(withRust(learning, 1, NOW)).toBe(learning);
    expect(withRust(undefined, 1, NOW)).toBeUndefined();
  });
});

describe('clearThrough', () => {
  const route = ['moji-1-1', 'moji-1-2', 'moji-1-3', 'moji-1-boss'];

  it('clears the route up to the stage and un-clears the rest of it', () => {
    expect(clearThrough(['moji-1-1', 'moji-1-boss', 'kana-2'], route, 'moji-1-2')).toEqual(['kana-2', 'moji-1-1', 'moji-1-2']);
  });

  it('leaves the save as it is for a stage outside the route', () => {
    expect(clearThrough(['kana-1'], route, 'mukashi-1')).toEqual(['kana-1']);
  });
});

describe('clearBefore', () => {
  const route = ['moji-1-1', 'moji-1-2', 'moji-1-3'];

  it('stops just short of the stage, so its clear can be played', () => {
    expect(clearBefore(['moji-1-3', 'kana-2'], route, 'moji-1-3')).toEqual(['kana-2', 'moji-1-1', 'moji-1-2']);
    expect(clearBefore(['moji-1-1'], route, 'moji-1-1')).toEqual([]);
  });
});

describe('toggleIn', () => {
  it('adds once and removes', () => {
    expect(toggleIn(['a'], 'a', true)).toEqual(['a']);
    expect(toggleIn(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(toggleIn(['a', 'b'], 'a', false)).toEqual(['b']);
  });
});

describe('parseSave', () => {
  const known = ['progress', 'clearedStages', 'gems'];

  it('takes the state itself or what localStorage holds', () => {
    const state = { progress: {}, clearedStages: ['moji-1-1'], gems: 5 };
    expect(parseSave(JSON.stringify(state), known)).toEqual(state);
    expect(parseSave(JSON.stringify({ state, version: 1 }), known)).toEqual(state);
  });

  it('drops keys the game does not know', () => {
    expect(parseSave(JSON.stringify({ progress: {}, clearedStages: [], junk: 1 }), known)).toEqual({ progress: {}, clearedStages: [] });
  });

  it('refuses what is not a save', () => {
    expect(parseSave('not json', known)).toBeNull();
    expect(parseSave('[]', known)).toBeNull();
    expect(parseSave(JSON.stringify({ gems: 5 }), known)).toBeNull();
  });
});
