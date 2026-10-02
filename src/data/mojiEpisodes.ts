import { Element } from '../lib/forge/elements';

/**
 * 文字が 消えた 町 — the episodes (話) inside each chapter (08 §4.2.1, 段2).
 *
 * A chapter's kanji come from the kanji book's units; an episode teaches a
 * handful of them (08 §4.1: 5〜9), in the book's order. Each episode is
 * お話 → write each kanji three times (★1, lib/mastery.ts) → じゅんび (write
 * more, or fight) → a fight written from memory → お話, and the written
 * kanji come back into the story's text (KanjiBackText).
 */

/** The episode's opponent: a モジクイ, the thing that eats letters. */
export interface MojiBoss {
  /** Name in furigana notation. */
  name: string;
  /** Its picture (a path under public/), in the story and the fight. */
  img?: string;
  hp: number;
  attack: number;
  element: Element;
  /** Game Icons name. */
  icon: string;
}

export interface MojiEpisode {
  /** "moji-1-1": chapter 1, episode 1. Also the id recorded as cleared. */
  id: string;
  chapter: string;
  order: number;
  /** Title in furigana notation. */
  title: string;
  /** Kanji written here, in the book's order. */
  kanji: string[];
  /** Picture-book scene behind the fight. */
  bg: string;
  boss: MojiBoss;
}

export const MOJI_EPISODES: MojiEpisode[] = [
  // HP is set so a ★1 hand (three writes each, no weapon) needs about two
  // clean writes per kanji; ★2 and ★3 shorten the fight (08 §4.2.2).
  {
    id: 'moji-1-1',
    chapter: 'moji-1',
    order: 1,
    title: 'きえた カレンダー',
    kanji: [...'日月火水木'],
    bg: 'naniwa_town_station',
    boss: { name: 'モジクイの こども', img: 'img/battle/mojikui_kid.webp', hp: 70, attack: 25, element: Element.AN, icon: 'GiShadowGrasp' },
  },
  {
    id: 'moji-1-2',
    chapter: 'moji-1',
    order: 2,
    // Not her name: it is gone until the player writes it (2026-10-02「表示前は 名前が 出ない」).
    title: 'きえた なまえ',
    kanji: [...'金土山川田'],
    bg: 'naniwa_station_square',
    boss: { name: 'モジクイ', img: 'img/battle/mojikui.webp', hp: 80, attack: 30, element: Element.AN, icon: 'GiShadowFollower' },
  },
  // 1章 3〜5話（09 §1）: ユニット2 の 数と お金。HP は 上の 決まり（★1・武器なしで 1字 約2回）に 合わせた
  // （5話は 4字なので 低め）。がまん・なかま（4話）は 別の しくみで 入る。
  {
    id: 'moji-1-3',
    chapter: 'moji-1',
    order: 3,
    title: '山(やま)の ロープウェー',
    kanji: [...'一二三四五'],
    bg: 'naniwa_ropeway',
    boss: { name: 'とけいの モジクイ', img: 'img/battle/mojikui_clock.webp', hp: 90, attack: 32, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-4',
    chapter: 'moji-1',
    order: 4,
    title: 'なかまの ロボット',
    kanji: [...'六七八九十'],
    bg: 'naniwa_factory',
    boss: { name: 'はぐるまの モジクイ', img: 'img/battle/mojikui_gear.webp', hp: 96, attack: 34, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-5',
    chapter: 'moji-1',
    order: 5,
    title: 'いくらですか',
    kanji: [...'百千万円'],
    bg: 'naniwa_market',
    boss: { name: 'ねふだの モジクイ', img: 'img/battle/mojikui_price.webp', hp: 80, attack: 36, element: Element.AN, icon: 'GiShadowFollower' },
  },
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
