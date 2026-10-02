import { describe, expect, it } from 'vitest';
import {
  MOJI_UNLOCKED_BY,
  ROUTE_ORDER,
  afterEpisode,
  canForge,
  continuePath,
  episodePath,
  isForgeOpen,
  mastersOf,
  nextUp,
  practiceTarget,
} from './mojiFlow';
import { KANA_EPISODES } from './kana';
import { MOJI_EPISODES, getMojiEpisode } from './mojiEpisodes';
import { getKanjiByChar } from '../lib/kanjiDb';

const kana = (n: number) => Array.from({ length: n }, (_, i) => `kana-${i + 1}`);

describe('mojiFlow — where the player goes next (08 §3.8)', () => {
  it('plays 0章 in order, then the town', () => {
    expect(ROUTE_ORDER.slice(0, KANA_EPISODES.length)).toEqual(kana(10));
    expect(ROUTE_ORDER).toHaveLength(KANA_EPISODES.length + MOJI_EPISODES.length);
    expect(afterEpisode('kana-3')).toBe('kana-4');
    // The end of 0章 opens the town's first episode (it used to name the chapter).
    expect(afterEpisode('kana-10')).toBe('moji-1-1');
    expect(afterEpisode('moji-1-1')).toBe('moji-1-2');
    expect(afterEpisode(ROUTE_ORDER[ROUTE_ORDER.length - 1])).toBeNull();
    expect(afterEpisode('nope')).toBeNull();
  });

  it('offers つづきから by how the player started and how far they are', () => {
    // fresh, or chose kana in the prologue
    expect(nextUp([], null)).toBe('kana-1');
    expect(nextUp([], 'kana')).toBe('kana-1');
    // chose「読める」: the town, not the chapter they skipped
    expect(nextUp([], 'town')).toBe('moji-1-1');
    // partway through kana
    expect(nextUp(kana(3), 'kana')).toBe('kana-4');
    expect(nextUp(kana(7), null)).toBe('kana-8');
    // kana done
    expect(nextUp(kana(10), 'kana')).toBe('moji-1-1');
    // in the town: the town, even with kana left
    expect(nextUp(['kana-1', 'moji-1-1'], 'kana')).toBe('moji-1-2');
    // a picture-book player already reads kana
    expect(nextUp(['mukashi-1', 'mukashi-2'], null)).toBe('moji-1-1');
    // everything written so far is done
    expect(nextUp([...kana(10), ...MOJI_EPISODES.map((e) => e.id)], 'kana')).toBeNull();
  });

  it('opens 漢字やさん at the end of 1章 2話, or on the old route', () => {
    expect(getMojiEpisode(MOJI_UNLOCKED_BY.forge)).toBeDefined();
    expect(isForgeOpen([])).toBe(false);
    expect(isForgeOpen(['moji-1-1'])).toBe(false);
    expect(isForgeOpen(['moji-1-1', 'moji-1-2'])).toBe(true);
    expect(isForgeOpen(['mukashi-1'])).toBe(true);
  });

  it('counts ★3 (ten writes) as what the forge can use', () => {
    expect(mastersOf({ a: { reps: 10 }, b: { reps: 9 }, c: { reps: 12 } })).toBe(2);
    expect(canForge({ a: { reps: 10 } })).toBe(false);
    expect(canForge({ a: { reps: 10 }, b: { reps: 10 } })).toBe(true);
  });

  it('sends an empty forge to the kanji closest to ★3, in an open episode', () => {
    const id = (c: string) => getKanjiByChar(c)!.id;
    expect(practiceTarget({}, [])).toEqual({ episode: 'moji-1-1', char: '日', left: 10 });
    const progress = { [id('月')]: { reps: 8 }, [id('日')]: { reps: 10 }, [id('山')]: { reps: 9 } };
    // 山 is in 1-2, not open yet
    expect(practiceTarget(progress, [])).toEqual({ episode: 'moji-1-1', char: '月', left: 2 });
    expect(practiceTarget(progress, ['moji-1-1'])).toEqual({ episode: 'moji-1-2', char: '山', left: 1 });
  });
});

describe('coming back to an episode', () => {
  const town = MOJI_EPISODES.map((e) => e.id);
  const reps = (n: number) =>
    Object.fromEntries(MOJI_EPISODES.flatMap((e) => e.kanji).map((ch) => [getKanjiByChar(ch)!.id, { reps: n }]));

  it('opens an episode on its story the first time, on じゅんび once cleared', () => {
    expect(episodePath('moji-1-1', [])).toBe('/moji/moji-1-1');
    expect(episodePath('moji-1-1', ['moji-1-1'])).toBe('/moji/moji-1-1?at=ready');
    // 0章 has no じゅんび: a kana episode always plays.
    expect(episodePath('kana-1', ['kana-1'])).toBe('/kana/kana-1');
  });

  it('sends つづき to the next episode while there is one', () => {
    expect(continuePath([], 'kana', {})).toBe('/kana/kana-1');
    expect(continuePath([...kana(10)], 'kana', {})).toBe('/moji/moji-1-1');
  });

  it('sends つづき, with nothing new to play, to the じゅんび where writing counts most', () => {
    const all = [...kana(10), ...town];
    const progress = { ...reps(10), [getKanjiByChar('山')!.id]: { reps: 6 } };
    expect(continuePath(all, 'kana', progress)).toBe(`/moji/${MOJI_EPISODES.find((e) => e.kanji.includes('山'))!.id}?at=ready`);
  });

  it('has nowhere to send つづき once every kanji is ★3', () => {
    expect(continuePath([...kana(10), ...town], 'kana', reps(10))).toBeNull();
  });
});
