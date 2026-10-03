import type { FinaleScript } from './mojiFinale';

/**
 * まとめの ボス — its story, by finale id (data/mojiFinale.ts). Written with
 * the chapter's other scripts (src/data/scripts/) and registered here; until
 * then the finale opens on じゅんび and ends on つづく without a story.
 * The rules are the episodes' (mojiFinale.test.ts).
 */
export const MOJI_FINALE_SCRIPTS: Partial<Record<string, FinaleScript>> = {};
