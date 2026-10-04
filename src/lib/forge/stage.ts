import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { KANJI_UNITS } from '../../data/minnaKanji';

/**
 * 武器の 段 — how far along the route a weapon's kanji are
 * (2026-10-04「武器の 強さは ステージを 超える ごとに 強く なる」).
 *
 * A kanji's step is the episode that teaches it: 1話 = 1 … 11話 = 11. Kanji
 * past 1章 (no episodes yet) follow the kanji books, about two episodes a
 * unit, so the curve keeps rising as chapters are added. A word's step is
 * that of its newest kanji: the word can first be made there.
 */

const EPISODE_STEP = new Map<string, number>();
MOJI_EPISODES.filter((e) => e.kanji.length > 0).forEach((e, i) => e.kanji.forEach((c) => EPISODE_STEP.set(c, i + 1)));
const LAST_EPISODE_STEP = Math.max(0, ...EPISODE_STEP.values());

const UNIT_OF = new Map<string, number>();
for (const u of KANJI_UNITS) for (const c of u.kanji) UNIT_OF.set(c, u.unit);
/** The last kanji-book unit the episodes cover. */
const LAST_EPISODE_UNIT = Math.max(0, ...[...EPISODE_STEP.keys()].map((c) => UNIT_OF.get(c) ?? 0));
const LAST_UNIT = Math.max(...KANJI_UNITS.map((u) => u.unit));

/** Episodes a kanji-book unit will take, past the ones already made. */
const EPISODES_PER_UNIT = 2;

export const stageOfKanji = (char: string): number => {
  const ep = EPISODE_STEP.get(char);
  if (ep != null) return ep;
  const unit = UNIT_OF.get(char) ?? LAST_UNIT + 1; // past the books: after all of them
  return LAST_EPISODE_STEP + Math.max(1, unit - LAST_EPISODE_UNIT) * EPISODES_PER_UNIT;
};

export const stageOfWord = (chars: string[]): number => Math.max(1, ...chars.map(stageOfKanji));

/**
 * How much stronger a real word's weapon is for its step: +8% an episode
 * through 1章 (×1.0 at 1話, ×1.8 at 11話), then +2% an episode, up to ×3.
 */
export const stageGrowth = (step: number): number => {
  const s = Math.max(1, step);
  const early = Math.min(s, LAST_EPISODE_STEP) - 1;
  const late = Math.max(0, s - LAST_EPISODE_STEP);
  return Math.min(3, 1 + 0.08 * early + 0.02 * late);
};

/** Where a step is on the route, for a label: 1章の 話 number, or null past it. */
export const episodeOfStep = (step: number): number | null => (step >= 1 && step <= LAST_EPISODE_STEP ? step : null);

/** かくし武器 hit this much harder than their ★ and step alone would. */
export const HIDDEN_BOOST = 1.3;
