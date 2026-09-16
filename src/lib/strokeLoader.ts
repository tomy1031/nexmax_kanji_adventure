import { assetPath } from './assetPath';

/**
 * Session-wide cache + loader for hanzi-writer stroke data.
 *
 * Ported from kanji_go. One cache for the whole app, so the writing drill
 * (which shows the same character ten times in a row) and the novel scene's
 * inline kanji never re-fetch. preload() warms a whole stage up front.
 */

// Matches hanzi-writer's CharacterJson so it can be handed to charDataLoader
// without a cast.
export interface CharData {
  strokes: string[];
  medians: number[][][];
  [key: string]: unknown;
}

const cache = new Map<string, CharData>();
const inflight = new Map<string, Promise<CharData | null>>();

// Local bundle first (same-origin, instant and offline-safe), then CDNs.
const sourcesFor = (char: string): string[] => {
  const e = encodeURIComponent(char);
  return [
    assetPath(`kanji-data/${e}.json`),
    `https://cdn.jsdelivr.net/npm/hanzi-writer-data-jp@0.1.0/${e}.json`,
    `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${e}.json`,
  ];
};

export const getCachedCharData = (char: string): CharData | undefined => cache.get(char);

export const loadCharData = (char: string): Promise<CharData | null> => {
  const cached = cache.get(char);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(char);
  if (pending) return pending;

  const p = (async (): Promise<CharData | null> => {
    for (const url of sourcesFor(char)) {
      try {
        // Per-source timeout: a hanging network must fall through to the next
        // source instead of leaving the learner staring at a blank canvas.
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.strokes) {
          cache.set(char, data);
          return data;
        }
      } catch {
        // try next source
      }
    }
    console.warn(`No stroke data available for: ${char}`);
    return null;
  })();

  inflight.set(char, p);
  p.finally(() => inflight.delete(char));
  return p;
};

/** Warm the cache for every character in a stage, in parallel. */
export const preloadCharData = (chars: string[]): Promise<void> =>
  Promise.all([...new Set(chars)].map((c) => loadCharData(c).catch(() => null))).then(
    () => undefined,
  );
