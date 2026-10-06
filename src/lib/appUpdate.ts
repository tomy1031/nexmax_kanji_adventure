/**
 * あたらしい 版に きりかえる (2026-10-06「切り替わる仕組みはつくってほしい」).
 *
 * The app keeps its last version on the device so it opens offline; a new
 * one is fetched quietly in the background (components/UpdateWatcher.tsx).
 * It is switched to by reloading — but never in the middle of something:
 * only on a screen where nothing is lost by it, so a fight, a drill, a story
 * or a gacha in progress is never cut short.
 */

/** Screens where reloading loses nothing: the title, the maps, the settings. */
export const isSafeToReload = (path: string): boolean => path === '/' || path === '/map' || path.startsWith('/map/') || path === '/settings';

/** How often an open app asks whether there is a new version. */
export const UPDATE_CHECK_MS = 30 * 60 * 1000;

/** When this build was made, for the settings screen: 「10/06 18:05」. */
export const buildLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(d.getMonth() + 1)}/${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
};
