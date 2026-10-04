import type { JlptLevel } from './kanji';

/**
 * A real Japanese compound word that can be written with the game's kanji.
 *
 * Crafting a combination that happens to be a real word is the forge's best
 * reward: the learner discovers the word by building it, and the game can tell
 * them what it means at the moment they care.
 */
export interface Compound {
  /** The written word, e.g. "火山". */
  word: string;
  /** Its reading in hiragana, e.g. "かざん". */
  reading: string;
  /** A short English gloss. */
  gloss: string;
  /** The hardest JLPT level among its characters. */
  level: JlptLevel;
  /** A word of the learner-level core (JLPT N5–N2 vocabulary) — the first a card shows. */
  common: boolean;
  /** 0 core, 1 common (JMdict), 2 more (newspaper frequency) — scripts/build_compounds.mjs. */
  tier?: 0 | 1 | 2;
}
