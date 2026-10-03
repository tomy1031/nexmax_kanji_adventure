import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  MOJI_FINALES,
  finaleNumber,
  finaleOrder,
  finalePool,
  getMojiFinale,
  isChapterTaught,
  isFinaleOpen,
  isFinaleReady,
  lastEpisodeOf,
} from './mojiFinale';
import { MOJI_EPISODES, type MojiEpisode } from './mojiEpisodes';
import { MOJI_CHAPTERS } from './mojiRoute';
import { ROUTE_ORDER, afterEpisode, continuePath, continuePathWithFinale, episodePath, nextUp, nextUpWithFinale } from './mojiFlow';
import { SCENES } from '../features/picturebook/scenes';
import { unreadKanji } from '../lib/ruby';
import { computeDamage } from '../lib/battle';
import { masteryMultiplier, pickWeakest } from '../lib/mastery';
import { getKanjiByChar } from '../lib/kanjiDb';

const FINALE = getMojiFinale('moji-1-boss')!;
const CH1 = MOJI_CHAPTERS.find((c) => c.id === 'moji-1')!;
const id = (c: string) => getKanjiByChar(c)!.id;

/** 1章 cut into episodes of `size` kanji, as if they were all written. */
const fakeEpisodes = (kanji: readonly string[], size: number): MojiEpisode[] =>
  Array.from({ length: Math.ceil(kanji.length / size) }, (_, i) => ({
    ...MOJI_EPISODES[0],
    id: `moji-1-${i + 1}`,
    order: i + 1,
    kanji: kanji.slice(i * size, (i + 1) * size),
  }));

describe('まとめの ボス: data (10 §3)', () => {
  it('stands apart from the episodes, with a real chapter, scene and picture', () => {
    for (const f of MOJI_FINALES) {
      expect(MOJI_EPISODES.some((e) => e.id === f.id), f.id).toBe(false);
      expect(ROUTE_ORDER, f.id).not.toContain(f.id);
      expect(MOJI_CHAPTERS.some((c) => c.id === f.chapter), f.id).toBe(true);
      expect(SCENES[f.bg], f.id).toBeDefined();
      if (f.boss.img) expect(existsSync(resolve('public', f.boss.img)), f.boss.img).toBe(true);
      expect([...unreadKanji(f.title), ...unreadKanji(f.boss.name)], f.id).toEqual([]);
    }
    expect(FINALE.asks).toBe(10);
  });

  it('is about two clean ★1 writes a kanji long, and half that at ★3 (as an episode)', () => {
    const hit = (stars: 0 | 1 | 2 | 3) =>
      computeDamage({ weapon: null, individual: null, defenderElement: FINALE.boss.element, mistakes: 0, mastery: masteryMultiplier(stars, true) }).damage;
    for (const f of MOJI_FINALES) {
      const writes = (stars: 0 | 1 | 2 | 3) => Math.ceil(f.boss.hp / hit(stars));
      expect(writes(1), f.id).toBeGreaterThanOrEqual(f.asks * 1.5);
      expect(writes(1), f.id).toBeLessThanOrEqual(f.asks * 2.5);
      expect(writes(3), f.id).toBeLessThanOrEqual(writes(1) / 2);
    }
  });
});

describe('まとめの ボス: when it opens', () => {
  const all = fakeEpisodes(CH1.kanji, 6);
  const ids = all.map((e) => e.id);

  it('opens once every kanji of the chapter is taught and the last episode is cleared', () => {
    expect(isChapterTaught(CH1, all)).toBe(true);
    expect(isFinaleOpen(FINALE, ids, all)).toBe(true);
    expect(lastEpisodeOf('moji-1', all)?.id).toBe(ids.at(-1));
    expect(finaleNumber(FINALE, all)).toBe(all.length + 1);
  });

  it('stays closed before the last episode is cleared', () => {
    expect(isFinaleOpen(FINALE, ids.slice(0, -1), all)).toBe(false);
    expect(isFinaleOpen(FINALE, [ids[3]], all)).toBe(false);
  });

  it('stays closed while a kanji of the chapter is not taught yet', () => {
    const missing = fakeEpisodes(CH1.kanji.slice(0, -1), 6);
    expect(isChapterTaught(CH1, missing)).toBe(false);
    expect(isFinaleOpen(FINALE, missing.map((e) => e.id), missing)).toBe(false);
  });

  it('is closed with 1章 1〜5話 alone (24 kanji), and open exactly when the chapter is complete', () => {
    const firstFive = MOJI_EPISODES.filter((e) => e.chapter === 'moji-1' && e.order <= 5);
    const cleared = MOJI_EPISODES.map((e) => e.id);
    expect(isFinaleReady(FINALE, firstFive)).toBe(false);
    expect(isFinaleOpen(FINALE, cleared, firstFive)).toBe(false);
    // Whatever episodes exist when this runs: open only for a complete chapter.
    expect(isFinaleOpen(FINALE, cleared)).toBe(isChapterTaught(CH1));
  });
});

describe('まとめの ボス: which kanji', () => {
  const NOW = Date.UTC(2026, 9, 3);
  const DAY = 86_400_000;

  it('goes for the least-written kanji, in the book’s order on a fresh save', () => {
    expect(finalePool(FINALE, {}, NOW).map((k) => k.char).join('')).toBe('日月火水木金土山川田');
    const pool = finalePool(FINALE, {}, NOW);
    expect(new Set(pool.map((k) => k.id)).size).toBe(10);
    for (const k of pool) expect(CH1.kanji).toContain(k.char);
  });

  it('counts writes up to ★3, then the rustiest, then the most slips', () => {
    const order = (progress: Parameters<typeof finaleOrder>[1]) => finaleOrder(FINALE, progress, NOW).map((k) => k.char);
    // Fewer writes first; twelve counts as ten.
    const written = Object.fromEntries(CH1.kanji.map((c) => [id(c), { reps: 10 }]));
    expect(order({ ...written, [id('円')]: { reps: 4 }, [id('日')]: { reps: 12 } })[0]).toBe('円');
    // All at ★3: the overdue one first.
    const owned = Object.fromEntries(CH1.kanji.map((c) => [id(c), { reps: 10, obtainedAt: NOW - 30 * DAY, nextReview: NOW + DAY, intervalDays: 3 }]));
    expect(order({ ...owned, [id('車')]: { reps: 10, obtainedAt: NOW - 30 * DAY, nextReview: NOW - 4 * DAY, intervalDays: 3 } })[0]).toBe('車');
    // Equal writes, no rust: the one slipped on most, then the book's order.
    const even = Object.fromEntries(CH1.kanji.map((c) => [id(c), { reps: 3, mistakes: 0 }]));
    const slipped = order({ ...even, [id('何')]: { reps: 3, mistakes: 5 } });
    expect(slipped.slice(0, 3)).toEqual(['何', '日', '月']);
  });

  it('starts the fight on the kanji じゅんび marks', () => {
    const progress = { [id('日')]: { reps: 6 }, [id('月')]: { reps: 3 } };
    const pool = finalePool(FINALE, progress, NOW);
    expect(pickWeakest(pool, (k) => progress[k]?.reps ?? 0, {}, null)?.id).toBe(pool[0].id);
  });
});

describe('まとめの ボス in the flow (as written today)', () => {
  const allCleared = [...Array.from({ length: 10 }, (_, i) => `kana-${i + 1}`), ...MOJI_EPISODES.map((e) => e.id)];

  it('leaves the plain route as it was', () => {
    for (const id of ROUTE_ORDER) {
      const i = ROUTE_ORDER.indexOf(id);
      expect(afterEpisode(id), id).toBe(ROUTE_ORDER[i + 1] ?? null);
    }
    expect(episodePath(FINALE.id, [])).toBe(`/moji/${FINALE.id}`);
    expect(episodePath(FINALE.id, [FINALE.id])).toBe(`/moji/${FINALE.id}?at=ready`);
  });

  it('adds the boss to つづき only while it is open and not beaten', () => {
    const open = isFinaleOpen(FINALE, allCleared);
    expect(nextUpWithFinale(allCleared, 'kana')).toBe(open ? FINALE.id : nextUp(allCleared, 'kana'));
    if (!open) {
      expect(continuePathWithFinale(allCleared, 'kana', {})).toBe(continuePath(allCleared, 'kana', {}));
      expect(afterEpisode(lastEpisodeOf('moji-1')!.id, allCleared)).toBe(afterEpisode(lastEpisodeOf('moji-1')!.id));
    }
    expect(nextUpWithFinale([], 'kana')).toBe(nextUp([], 'kana'));
  });
});
