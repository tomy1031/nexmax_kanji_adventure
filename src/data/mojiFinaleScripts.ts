import type { FinaleScript } from './mojiFinale';
import { MOJI1_FINALE } from './scripts/moji1';
import { MOJI2_FINALE } from './scripts/moji2';

/**
 * まとめの ボス — its story, by finale id (data/mojiFinale.ts). Written with
 * the chapter's other scripts (src/data/scripts/) and registered here; a
 * finale without one opens on じゅんび and ends on つづく without a story.
 * The rules are the episodes' (mojiFinale.test.ts).
 */
export const MOJI_FINALE_SCRIPTS: Partial<Record<string, FinaleScript>> = {
  'moji-1-boss': MOJI1_FINALE,
  'moji-2-boss': MOJI2_FINALE,
};
