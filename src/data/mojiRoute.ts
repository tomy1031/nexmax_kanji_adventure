import type { JlptLevel } from '../types/kanji';

/**
 * 新ルート「文字が 消えた 町」— chapter table (docs/design/08_新ルート_文字が消えた町.md).
 *
 * The route follows the lesson order of 『みんなの日本語』: 初級I (1–25) is the
 * N5 part, 初級II (26–50) the N4 part. Only the order is borrowed from the
 * book — no example sentences, dialogue, characters or pictures.
 *
 * This is the empty frame (08 §10, 段1). Which kanji each lesson teaches waits
 * on the teaching materials (08 §11), so LESSON_KANJI and every chapter's
 * kanji are empty and no chapter is playable yet. mojiRoute.test.ts already
 * checks what the filled table must satisfy.
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
  /** Kanji taught here. Empty until the per-lesson list exists. */
  kanji: string[];
}

/** Kanji introduced by each lesson, keyed by lesson number. Filled in 段2. */
export const LESSON_KANJI: Record<number, string[]> = {};

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

export const MOJI_CHAPTERS: MojiChapter[] = [
  {
    id: 'moji-1',
    order: 1,
    level: 'N5',
    lessons: { from: 1, to: 3 },
    title: '字(じ)の ない 空港(くうこう)',
    summary: '空港(くうこう)に 着(つ)いた。看板(かんばん)も 名前(なまえ)も 読(よ)めない。',
    kanji: [],
  },
  {
    id: 'moji-2',
    order: 2,
    level: 'N5',
    lessons: { from: 4, to: 6 },
    title: '止(と)まった 駅(えき)',
    summary: '駅(えき)の 時計(とけい)と 行(い)き先(さき)の 字(じ)が 消(き)えて、電車(でんしゃ)に 乗(の)れない。',
    kanji: [],
  },
  {
    id: 'moji-3',
    order: 3,
    level: 'N5',
    lessons: { from: 7, to: 10 },
    title: '市場(いちば)の ともだち',
    summary: 'にぎやかな 市場(いちば)で、はじめての ともだちに 会(あ)う。',
    kanji: [],
  },
  {
    id: 'moji-4',
    order: 4,
    level: 'N5',
    lessons: { from: 11, to: 13 },
    title: '読(よ)めない メニュー',
    summary: 'レストランと 店(みせ)。メニューの 字(じ)が 消(き)えて いる。',
    kanji: [],
  },
  {
    id: 'moji-5',
    order: 5,
    level: 'N5',
    lessons: { from: 14, to: 20 },
    title: '町(まち)を 回(まわ)る',
    summary: 'ともだちと 町(まち)を 回(まわ)って、字(じ)を 取(と)り戻(もど)す。',
    kanji: [],
  },
  {
    id: 'moji-6',
    order: 6,
    level: 'N5',
    lessons: { from: 21, to: 25 },
    title: 'モジクイの 王(おう)',
    summary: '「もし 字(じ)が なかったら…」。ネクマックスが ★4へ。',
    kanji: [],
  },
  {
    id: 'moji-7',
    order: 7,
    level: 'N4',
    lessons: { from: 26, to: 30 },
    title: 'ネットに 逃(に)げた モジクイ',
    summary: 'IT会社(かいしゃ)で インターン。モジクイが ネットに 逃(に)げる。',
    kanji: [],
  },
  {
    id: 'moji-8',
    order: 8,
    level: 'N4',
    lessons: { from: 31, to: 37 },
    title: '消(き)えた「止(と)まれ」',
    summary: '道(みち)の「止(と)まれ」が 消(き)えて、町(まち)が あぶない。',
    kanji: [],
  },
  {
    id: 'moji-9',
    order: 9,
    level: 'N4',
    lessons: { from: 38, to: 48 },
    title: '会社(かいしゃ)を 守(まも)れ',
    summary: 'なかまと いっしょに、会社(かいしゃ)の システムを 守(まも)る。',
    kanji: [],
  },
  {
    id: 'moji-10',
    order: 10,
    level: 'N4',
    lessons: { from: 49, to: 50 },
    title: 'ことばの 力(ちから)',
    summary: 'お客様(きゃくさま)との 大切(たいせつ)な 場(ば)。敬語(けいご)の 力(ちから)で 町(まち)を 守(まも)る。ネクマックスが ★5へ。',
    kanji: [],
  },
];

/** A chapter can be played once its kanji have been assigned. */
export const isChapterReady = (chapter: MojiChapter): boolean => chapter.kanji.length > 0;
