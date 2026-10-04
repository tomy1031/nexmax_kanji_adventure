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
  /**
   * Its one-word nature, shown beside its name on じゅんび (2026-10-04「モジクイに もう少し
   * 個性が 欲しい」): a picture, the word in furigana notation, and English for the EN setting.
   */
  trait?: { icon: string; ja: string; en: string };
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
  /** The なかま (data/individuals.ts) this episode's first clear brings (09 §3 A). */
  grants?: string;
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
    boss: { name: 'モジクイの こども', img: 'img/battle/mojikui_kid.webp', trait: { icon: '😜', ja: 'いたずらっこ', en: 'prankster' }, hp: 70, attack: 25, element: Element.AN, icon: 'GiShadowGrasp' },
  },
  {
    id: 'moji-1-2',
    chapter: 'moji-1',
    order: 2,
    // Not her name: it is gone until the player writes it (2026-10-02「表示前は 名前が 出ない」).
    title: 'きえた なまえ',
    kanji: [...'金土山川田'],
    bg: 'naniwa_station_square',
    boss: { name: 'モジクイ', img: 'img/battle/mojikui.webp', trait: { icon: '😋', ja: 'なんでも 食(た)べる', en: 'eats anything' }, hp: 80, attack: 30, element: Element.AN, icon: 'GiShadowFollower' },
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
    boss: { name: 'とけいの モジクイ', img: 'img/battle/mojikui_clock.webp', trait: { icon: '⏱️', ja: 'せっかち', en: 'impatient' }, hp: 90, attack: 32, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-4',
    chapter: 'moji-1',
    order: 4,
    title: 'なかまの ロボット',
    kanji: [...'六七八九十'],
    bg: 'naniwa_factory',
    boss: { name: 'はぐるまの モジクイ', img: 'img/battle/mojikui_gear.webp', trait: { icon: '😤', ja: 'がんこもの', en: 'stubborn' }, hp: 96, attack: 34, element: Element.AN, icon: 'GiShadowFollower' },
    // 七ばん, the factory robot who wakes up: まじめの ネクマックス (09 §1.2).
    grants: 'ISTJ',
  },
  {
    id: 'moji-1-5',
    chapter: 'moji-1',
    order: 5,
    title: 'いくらですか',
    kanji: [...'百千万円'],
    bg: 'naniwa_market',
    boss: { name: 'ねふだの モジクイ', img: 'img/battle/mojikui_price.webp', trait: { icon: '🤑', ja: 'けちんぼ', en: 'stingy' }, hp: 80, attack: 36, element: Element.AN, icon: 'GiShadowFollower' },
  },
  // 1章 6〜11話（10 §1・§4）: ユニット3〜5 を 2話ずつ。題は その 話で 書く 字を かなで（書く 前は 読めない）。
  // ボスの 数字は 10 §4 の 表（上の 決まりに 合わせて ある）。
  {
    id: 'moji-1-6',
    chapter: 'moji-1',
    order: 6,
    title: 'はじめまして',
    kanji: [...'学生先会社員'],
    bg: 'naniwa_school',
    boss: { name: 'なふだの モジクイ', img: 'img/battle/mojikui_nametag.webp', trait: { icon: '🙈', ja: 'はずかしがりや', en: 'shy' }, hp: 96, attack: 36, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-7',
    chapter: 'moji-1',
    order: 7,
    title: 'びょういんの ほん',
    kanji: [...'医者本中国人'],
    bg: 'naniwa_clinic',
    boss: { name: 'ほんの モジクイ', img: 'img/battle/mojikui_book.webp', trait: { icon: '😪', ja: 'ねぼすけの 本(ほん)の むし', en: 'sleepy bookworm' }, hp: 96, attack: 38, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-8',
    chapter: 'moji-1',
    order: 8,
    title: 'とまった とけいだい',
    kanji: [...'今朝昼晩時分半'],
    bg: 'naniwa_clocktower',
    boss: { name: 'とけいだいの モジクイ', img: 'img/battle/mojikui_clocktower.webp', trait: { icon: '🎩', ja: 'いばりんぼう', en: 'pompous' }, hp: 110, attack: 40, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-9',
    chapter: 'moji-1',
    order: 9,
    title: 'おみせは やすみ？',
    kanji: [...'午前後休毎何'],
    bg: 'naniwa_shopstreet',
    boss: { name: 'かんばんの モジクイ', img: 'img/battle/mojikui_signboard.webp', trait: { icon: '💤', ja: 'なまけもの', en: 'lazy' }, hp: 96, attack: 40, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-10',
    chapter: 'moji-1',
    order: 10,
    title: 'がっこうへ いく',
    kanji: [...'行来校週去年'],
    bg: 'naniwa_bus_stop',
    boss: { name: 'バスの モジクイ', img: 'img/battle/mojikui_bus.webp', trait: { icon: '💦', ja: 'あわてんぼう', en: 'hasty' }, hp: 96, attack: 42, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-1-11',
    chapter: 'moji-1',
    order: 11,
    title: 'でんしゃが うごかない',
    kanji: [...'駅電車自転'],
    bg: 'naniwa_station_deep',
    boss: { name: 'えきの モジクイ', img: 'img/battle/mojikui_station.webp', trait: { icon: '🚫', ja: 'がんこな もんばん', en: 'stern gatekeeper' }, hp: 80, attack: 42, element: Element.AN, icon: 'GiShadowFollower' },
  },
  // 2章「市場の ともだち」（docs/design/12）: 海の むこうの 港町 ミナトタウン。字は 本の 順、
  // HP は 1章と 同じ 決まり（★1・武器なしで 1字 約2回）。手ごたえは こうげきで 出す。
  {
    id: 'moji-2-1',
    chapter: 'moji-2',
    order: 1,
    title: 'たかい？ やすい？',
    kanji: [...'高安大小新'],
    bg: 'port_market',
    boss: { name: 'はかりの モジクイ', img: 'img/battle/mojikui_scale.webp', trait: { icon: '😏', ja: 'ずるがしこい', en: 'crafty' }, hp: 96, attack: 44, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-2',
    chapter: 'moji-2',
    order: 2,
    title: 'いろの ない ふく',
    kanji: [...'古青白赤黒'],
    bg: 'port_clothes',
    boss: { name: 'いろの モジクイ', img: 'img/battle/mojikui_paint.webp', trait: { icon: '🎨', ja: 'げいじゅつか きどり', en: 'would-be artist' }, hp: 96, attack: 44, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-3',
    chapter: 'moji-2',
    order: 3,
    title: 'いしだんの うえの おみせ',
    kanji: [...'上下父母子手'],
    bg: 'port_stairs',
    boss: { name: 'いしだんの モジクイ', img: 'img/battle/mojikui_stairs.webp', trait: { icon: '🤪', ja: 'おっちょこちょい', en: 'clumsy' }, hp: 112, attack: 46, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-4',
    chapter: 'moji-2',
    order: 4,
    title: 'なにが すきですか',
    kanji: [...'好主肉魚食飲物'],
    bg: 'port_foodhall',
    boss: { name: 'はらぺこ モジクイ', img: 'img/battle/mojikui_hungry.webp', trait: { icon: '🍽️', ja: 'くいしんぼう', en: 'glutton' }, hp: 128, attack: 46, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-5',
    chapter: 'moji-2',
    order: 5,
    title: 'みぎ？ ひだり？',
    kanji: [...'近間右左'],
    bg: 'port_alley',
    boss: { name: 'みちしるべの モジクイ', img: 'img/battle/mojikui_arrow.webp', trait: { icon: '🌀', ja: 'ほうこうおんち', en: 'always lost' }, hp: 80, attack: 48, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-6',
    chapter: 'moji-2',
    order: 6,
    title: 'いぬは どこですか',
    kanji: [...'外男女犬'],
    bg: 'port_park',
    boss: { name: 'こうえんの モジクイ', img: 'img/battle/mojikui_park.webp', trait: { icon: '🐶', ja: 'じっと して いない', en: 'can\'t sit still' }, hp: 80, attack: 48, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-7',
    chapter: 'moji-2',
    order: 7,
    title: 'としょかんで よみます',
    kanji: [...'書聞読見話'],
    bg: 'port_library',
    boss: { name: 'しんぶんの モジクイ', img: 'img/battle/mojikui_newspaper.webp', trait: { icon: '🧐', ja: 'しったかぶり', en: 'know-it-all' }, hp: 96, attack: 50, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-8',
    chapter: 'moji-2',
    order: 8,
    title: 'はじめての ともだち',
    kanji: [...'買起帰友達'],
    bg: 'port_seaside',
    boss: { name: 'にっきの モジクイ', img: 'img/battle/mojikui_diary.webp', trait: { icon: '🤫', ja: 'ひみつが 好(す)き', en: 'loves secrets' }, hp: 96, attack: 50, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-9',
    chapter: 'moji-2',
    order: 9,
    title: 'しゃしんを とりましょう',
    kanji: [...'茶酒写真紙'],
    bg: 'port_photo',
    boss: { name: 'カメラの モジクイ', img: 'img/battle/mojikui_camera.webp', trait: { icon: '📸', ja: 'めだちたがりや', en: 'show-off' }, hp: 96, attack: 52, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    id: 'moji-2-10',
    chapter: 'moji-2',
    order: 10,
    title: 'えいがを みませんか',
    kanji: [...'映画店英語'],
    bg: 'port_cinema',
    boss: { name: 'フィルムの モジクイ', img: 'img/battle/mojikui_film.webp', trait: { icon: '🎭', ja: 'おおげさ', en: 'dramatic' }, hp: 96, attack: 52, element: Element.AN, icon: 'GiShadowFollower' },
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
