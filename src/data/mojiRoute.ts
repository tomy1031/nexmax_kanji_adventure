import type { JlptLevel } from '../types/kanji';
import { KANJI_UNITS } from './minnaKanji';
import { episodesOf } from './mojiEpisodes';

/**
 * 新ルート「文字が 消えた 町」— chapter table (docs/design/08_新ルート_文字が消えた町.md).
 *
 * The route follows the lesson order of 『みんなの日本語』: 初級I (1–25) is the
 * N5 part, 初級II (26–50) the N4 part. Only the order is borrowed from the
 * book — no example sentences, dialogue, characters or pictures.
 *
 * Chapters are cut on the kanji books' boundaries (minnaKanji.ts): a unit is
 * only studied after its lesson, so a chapter covers five lessons and the
 * units that open inside them. The episodes (話) inside each chapter come
 * with the story (08 §10, 段2〜); until a chapter has them it is shown as
 * じゅんび中.
 */

export interface MojiChapter {
  /** Stable id, "moji-<order>". Never collides with the picture-book arcs. */
  id: string;
  /** Position in the route, 1-based. */
  order: number;
  level: JlptLevel;
  /** Lessons covered, inclusive. */
  lessons: { from: number; to: number };
  /** Title in furigana notation. */
  title: string;
  /** Setup shown on the chapter card, furigana notation. */
  summary: string;
  /** Kanji-book units taught here (minnaKanji.ts). */
  units: number[];
  /** Kanji taught here: the units' kanji, in the book's order. */
  kanji: string[];
}

/** Kanji introduced by each lesson, keyed by lesson number (minnaKanji.ts). */
export const LESSON_KANJI: Record<number, string[]> = {};
for (const u of KANJI_UNITS) (LESSON_KANJI[u.lesson] ??= []).push(...u.kanji);

/** Every kanji introduced up to and including `lesson`. */
export const kanjiIntroducedBy = (lesson: number): Set<string> => {
  const out = new Set<string>();
  for (const [n, chars] of Object.entries(LESSON_KANJI)) {
    if (Number(n) <= lesson) for (const c of chars) out.add(c);
  }
  return out;
};

/** The book part a level's chapters come from. */
export const PART_OF_LEVEL: Record<JlptLevel, { book: string; lessons: { from: number; to: number } | null }> = {
  N5: { book: '初級(しょきゅう)I', lessons: { from: 1, to: 25 } },
  N4: { book: '初級(しょきゅう)II', lessons: { from: 26, to: 50 } },
  // 中級I's table of contents is still to be checked (08 §3.3).
  N3: { book: '中級(ちゅうきゅう)I', lessons: null },
};

export const MOJI_CHAPTERS: MojiChapter[] = (
  [
    { order: 1, level: 'N5', lessons: { from: 1, to: 5 }, units: [1, 2, 3, 4, 5], title: '字(じ)の ない 町(まち)', summary: '電車(でんしゃ)で 町(まち)に 着(つ)いた。駅(えき)の 看板(かんばん)も 時計(とけい)も、字(じ)が 消(き)えて 読(よ)めない。' },
    { order: 2, level: 'N5', lessons: { from: 6, to: 10 }, units: [6, 7, 8, 9, 10], title: '市場(いちば)の ともだち', summary: 'にぎやかな 市場(いちば)で、はじめての ともだちに 会(あ)う。' },
    { order: 3, level: 'N5', lessons: { from: 11, to: 15 }, units: [11, 12], title: '読(よ)めない メニュー', summary: 'レストランと 店(みせ)。メニューの 字(じ)が 消(き)えて いる。' },
    { order: 4, level: 'N5', lessons: { from: 16, to: 20 }, units: [13, 14, 15], title: '町(まち)を 回(まわ)る', summary: 'ともだちと 町(まち)を 回(まわ)って、字(じ)を 取(と)り戻(もど)す。' },
    { order: 5, level: 'N5', lessons: { from: 21, to: 25 }, units: [16, 17, 18, 19, 20], title: 'モジクイの 王(おう)', summary: '「もし 字(じ)が なかったら…」。ネクマックスが ★4へ。' },
    { order: 6, level: 'N4', lessons: { from: 26, to: 30 }, units: [24, 25, 26, 27, 28, 29, 30], title: 'ネットに 逃(に)げた モジクイ', summary: 'IT会社(かいしゃ)で インターン。モジクイが ネットに 逃(に)げる。' },
    { order: 7, level: 'N4', lessons: { from: 31, to: 35 }, units: [31, 32, 33, 34, 35], title: '消(き)えた「止(と)まれ」', summary: '道(みち)の「止(と)まれ」が 消(き)えて、町(まち)が あぶない。' },
    { order: 8, level: 'N4', lessons: { from: 36, to: 40 }, units: [36, 37, 38, 39, 40], title: '食(た)べられた 字(じ)', summary: 'モジクイに 字(じ)を 食(た)べられた。なかまと 取(と)り戻(もど)しに 行(い)く。' },
    { order: 9, level: 'N4', lessons: { from: 41, to: 45 }, units: [41, 42, 43, 44, 45], title: '会社(かいしゃ)を 守(まも)れ', summary: 'なかまと いっしょに、会社(かいしゃ)の システムを 守(まも)る。' },
    { order: 10, level: 'N4', lessons: { from: 46, to: 50 }, units: [46, 47, 48, 49, 50], title: 'ことばの 力(ちから)', summary: 'お客様(きゃくさま)との 大切(たいせつ)な 場(ば)。敬語(けいご)の 力(ちから)で 町(まち)を 守(まも)る。ネクマックスが ★5へ。' },
  ] as const
).map((c) => ({
  ...c,
  id: `moji-${c.order}`,
  units: [...c.units],
  kanji: c.units.flatMap((n) => [...(KANJI_UNITS.find((u) => u.unit === n)?.kanji ?? '')]),
}));

/** A chapter can be played once some of its episodes have been written (mojiEpisodes.ts). */
export const isChapterReady = (chapter: MojiChapter): boolean => episodesOf(chapter.id).length > 0;
