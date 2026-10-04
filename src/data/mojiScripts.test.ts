import { describe, expect, it } from 'vitest';
import { MOJI_EPISODES } from './mojiEpisodes';
import { MOJI_CAST, MOJI_SCRIPTS } from './mojiScripts';
import { MOJI1_CAST } from './scripts/moji1';
import { MOJI_CHAPTERS } from './mojiRoute';

describe('新ルートの 台本の 登録 (docs/design/12 §5)', () => {
  it('has a script for every episode and an episode for every script', () => {
    expect(new Set(Object.keys(MOJI_SCRIPTS))).toEqual(new Set(MOJI_EPISODES.map((e) => e.id)));
  });

  it('lists everyone once, 1章 included', () => {
    const ids = MOJI_CAST.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of MOJI1_CAST) expect(ids, c.id).toContain(c.id);
  });

  it('keeps the episodes in chapter order, then episode order (the weapon steps count along it)', () => {
    const rank = (e: (typeof MOJI_EPISODES)[number]) => (MOJI_CHAPTERS.find((c) => c.id === e.chapter)?.order ?? 0) * 100 + e.order;
    const ranks = MOJI_EPISODES.map(rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
