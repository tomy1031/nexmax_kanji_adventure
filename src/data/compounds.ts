import { useSyncExternalStore } from 'react';
import type { Compound } from '../types/forge';
import type { JlptLevel } from '../types/kanji';
import { CORE_PACKED } from './compounds.generated';

/**
 * The real words the forge recognises (熟語), built by scripts/build_compounds.mjs.
 *
 * The learner-level core (about 1,300 words) ships with the app. The other
 * 6,000-odd everyday words (2026-10-04「漢字の 組み合わせは 今の 5倍は ある」)
 * are their own file, fetched right after start (loadMoreCompounds, from
 * main.tsx), so the first screen does not wait for them. Anything that
 * caches the table keys its cache on compoundsVersion(), and screens that
 * show words re-render through useCompoundsVersion() when the rest arrives.
 */

const parse = (packed: string): Compound[] =>
  packed
    ? packed.split('\n').map((line) => {
        const [word, reading, gloss, level, tier] = line.split('|');
        const t = Number(tier) as 0 | 1 | 2;
        return { word, reading, gloss, level: level as JlptLevel, common: t === 0, tier: t };
      })
    : [];

let core: readonly Compound[] | null = null;
let all: readonly Compound[] | null = null;
let version = 0;
const listeners = new Set<() => void>();

/** Every word known so far: the core, and the rest once it has loaded. */
export const getCompounds = (): readonly Compound[] => {
  if (all) return all;
  if (!core) core = parse(CORE_PACKED);
  return core;
};

/** 0 with the core only, 1 once the rest is in. */
export const compoundsVersion = (): number => version;

let loading: Promise<void> | null = null;

/** Fetch the rest of the words (once). Safe to call from anywhere. */
export const loadMoreCompounds = (): Promise<void> => {
  loading ??= import('./compounds.more.generated').then((m) => {
    all = [...getCompounds(), ...parse(m.MORE_PACKED)];
    version = 1;
    listeners.forEach((l) => l());
  });
  return loading;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Re-renders when the rest of the words arrives. */
export const useCompoundsVersion = (): number => useSyncExternalStore(subscribe, compoundsVersion, compoundsVersion);
