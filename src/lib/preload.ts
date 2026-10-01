import { assetPath } from './assetPath';

/**
 * Pictures of the screens a player is likely to open next, fetched while the
 * app is idle — so the doors between screens (App.tsx) open on a finished
 * screen, not one whose pictures are still popping in. The service worker
 * keeps them (CacheFirst), so this costs the network once.
 *
 * Only the orientation-matched background is fetched: the screens pick theirs
 * with the same (orientation: landscape) test.
 */

const landscape = () => typeof window !== 'undefined' && window.matchMedia?.('(orientation: landscape)').matches;

const SCREEN_ART: Record<string, () => string[]> = {
  forge: () => [
    landscape() ? 'img/kanjiyasan/bg_wide.webp' : 'img/kanjiyasan/bg_tall.webp',
    'img/kanjiyasan/nexmax_smith.webp',
    'img/kanjiyasan/card_frame.webp',
    'img/kanjiyasan/kanji_frame.webp',
    'img/kanjiyasan/btn_back.webp',
    'img/kanjiyasan/btn_make.webp',
  ],
};

const requested = new Set<string>();

/** Fetch these pictures (asset paths) when the app is idle; each only once. */
export const preloadImages = (paths: string[]) => {
  const run = () => {
    for (const path of paths) {
      const url = assetPath(path);
      if (requested.has(url)) continue;
      requested.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
};

export const preloadScreens = (screens: (keyof typeof SCREEN_ART)[]) => preloadImages(screens.flatMap((s) => SCREEN_ART[s]()));
