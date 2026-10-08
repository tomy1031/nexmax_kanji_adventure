import type { Compound } from '../types/forge';
import type { JlptLevel } from '../types/kanji';
import { getCompounds } from './compounds';
import { isHiddenWeapon } from './hiddenWeapons';
import { MOJI_EPISODES, type MojiEpisode } from './mojiEpisodes';

/**
 * ずかんの 字カード — what a kanji's card shows besides itself (ZukanScreen).
 *
 * A learner who cannot read Japanese yet reviews a kanji by its sound, a
 * few real words that use it, and its meaning behind EN; and goes back to
 * write it where it is taught.
 */

/** The town episode that teaches a kanji, if it is written yet. */
export const episodeOfKanji = (char: string): MojiEpisode | undefined => MOJI_EPISODES.find((e) => e.kanji.includes(char));

const LEVEL_ORDER: Record<JlptLevel, number> = { N5: 0, N4: 1, N3: 2 };

/**
 * Real words with the kanji, for its card: words the player can already
 * read whole first (every kanji in them written) — of those, the ones not in
 * ことば図鑑 yet (`found`) before the ones that are, so the card keeps
 * offering a word to learn (docs/design/19 §4) — then the learner-level core
 * before the dictionary's wider words, then the most basic (N5 before N4),
 * then the shortest.
 */
export const cardWords = (char: string, owned: ReadonlySet<string>, limit = 3, found: ReadonlySet<string> = new Set()): Compound[] =>
  getCompounds()
    // A かくし word is found only by trying (data/hiddenWeapons.ts): the card never shows it.
    .filter((c) => c.word.includes(char) && !isHiddenWeapon(c.word))
    .map((c) => ({ c, readable: [...c.word].every((ch) => owned.has(ch)) }))
    .sort(
      (a, b) =>
        Number(b.readable) - Number(a.readable) ||
        (a.readable ? Number(found.has(a.c.word)) - Number(found.has(b.c.word)) : 0) ||
        // The learner-level core first: the dictionary's long tail is for finding, not for the card.
        (a.c.tier ?? 0) - (b.c.tier ?? 0) ||
        LEVEL_ORDER[a.c.level] - LEVEL_ORDER[b.c.level] ||
        a.c.word.length - b.c.word.length,
    )
    .slice(0, limit)
    .map(({ c }) => c);
