/**
 * 文字が 消えた 町 — the episodes (話) inside each chapter (08 §4.2.1, 段2).
 *
 * A chapter's kanji come from the kanji book's units; an episode teaches a
 * handful of them (08 §4.1: 5〜9), in the book's order. Each episode is
 * お話 → write each kanji (10 times, constraints 2026-09-16) → お話, and the
 * written kanji come back into the story's text (KanjiBackText).
 */

export interface MojiEpisode {
  /** "moji-1-1": chapter 1, episode 1. Also the id recorded as cleared. */
  id: string;
  chapter: string;
  order: number;
  /** Title in furigana notation. */
  title: string;
  /** Kanji written here, in the book's order. */
  kanji: string[];
}

export const MOJI_EPISODES: MojiEpisode[] = [
  { id: 'moji-1-1', chapter: 'moji-1', order: 1, title: 'きえた カレンダー', kanji: [...'日月火水木'] },
  { id: 'moji-1-2', chapter: 'moji-1', order: 2, title: '山(やま)田(だ)さん', kanji: [...'金土山川田'] },
];

export const episodesOf = (chapterId: string): MojiEpisode[] =>
  MOJI_EPISODES.filter((e) => e.chapter === chapterId).sort((a, b) => a.order - b.order);

export const getMojiEpisode = (id: string): MojiEpisode | undefined => MOJI_EPISODES.find((e) => e.id === id);

/** An episode opens once the one before it in its chapter is cleared. */
export const isMojiEpisodeUnlocked = (ep: MojiEpisode, cleared: readonly string[]): boolean => {
  if (ep.order === 1) return true;
  const prev = episodesOf(ep.chapter).find((e) => e.order === ep.order - 1);
  return prev ? cleared.includes(prev.id) : false;
};
