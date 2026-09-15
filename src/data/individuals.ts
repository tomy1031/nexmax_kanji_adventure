import { Element } from '../lib/forge/elements';
import { WeaponClass } from '../lib/forge/weapon';

/**
 * ネクマックスの個体 — the collectible characters.
 *
 * One Nexmax became many. The roster reuses the sixteen personality-type
 * portraits NexmaxAcademy already has art for, so every individual ships with
 * a real drawing rather than a placeholder silhouette.
 *
 * An individual is not a stat stick: each one is *good at one kind of weapon*,
 * which gives the learner a reason to forge outside their favourite element.
 */

export const Rank = {
  /** Given by the story. Everyone gets these. */
  STORY: 'STORY',
  /** Pulled from the gacha. */
  STANDARD: 'STANDARD',
  /** Pulled from the gacha, rarely. */
  SPECIAL: 'SPECIAL',
} as const;
export type Rank = (typeof Rank)[keyof typeof Rank];

export interface Individual {
  id: string;
  /** Display name in furigana notation. */
  name: string;
  /** Short name for tight spaces. */
  shortName: string;
  /** One line on who they are, N5-readable, furigana notation. */
  tagline: string;
  /** Portrait, relative to public/. */
  art: string;
  emblem: string;
  rank: Rank;
  /** The weapon class this individual swings hardest. */
  favours: WeaponClass;
  /** Element this individual resists. */
  resists: Element;
  /** Percent bonus to attack when holding a favoured weapon. */
  bonus: number;
}

const portrait = (code: string) => `img/chara/types/${code}.webp`;
const emblem = (code: string) => `img/ui/emblems/${code}.webp`;

/**
 * The sixteen. Names and taglines follow NexmaxAcademy's personality ledger so
 * a learner who met them there recognises them here.
 */
export const INDIVIDUALS: readonly Individual[] = [
  // --- 物語でもらう個体 ---------------------------------------------------
  {
    id: 'ISTJ',
    name: 'まじめの ネクマックス',
    shortName: 'まじめ',
    tagline: '決(き)めた ことを 最後(さいご)まで します。',
    art: portrait('ISTJ'),
    emblem: emblem('ISTJ'),
    rank: Rank.STORY,
    favours: WeaponClass.SWORD,
    resists: Element.KA,
    bonus: 15,
  },
  {
    id: 'ISFJ',
    name: 'みまもりの ネクマックス',
    shortName: 'みまもり',
    tagline: '静(しず)かに、みんなを 助(たす)けます。',
    art: portrait('ISFJ'),
    emblem: emblem('ISFJ'),
    rank: Rank.STORY,
    favours: WeaponClass.SHIELD,
    resists: Element.DO,
    bonus: 15,
  },
  {
    id: 'ESTP',
    name: 'スタートの ネクマックス',
    shortName: 'スタート',
    tagline: 'まず、やって みます。',
    art: portrait('ESTP'),
    emblem: emblem('ESTP'),
    rank: Rank.STORY,
    favours: WeaponClass.DAGGER,
    resists: Element.AN,
    bonus: 15,
  },

  // --- ガチャ（ふつう） ---------------------------------------------------
  {
    id: 'ESTJ',
    name: 'まとめの ネクマックス',
    shortName: 'まとめ',
    tagline: '順番(じゅんばん)を 決(き)めて、進(すす)めます。',
    art: portrait('ESTJ'),
    emblem: emblem('ESTJ'),
    rank: Rank.STANDARD,
    favours: WeaponClass.HAMMER,
    resists: Element.DO,
    bonus: 20,
  },
  {
    id: 'ESFJ',
    name: 'おせわの ネクマックス',
    shortName: 'おせわ',
    tagline: '人(ひと)と 人(ひと)を つなぎます。',
    art: portrait('ESFJ'),
    emblem: emblem('ESFJ'),
    rank: Rank.STANDARD,
    favours: WeaponClass.STAFF,
    resists: Element.MOKU,
    bonus: 20,
  },
  {
    id: 'INTP',
    name: 'なぜなぜの ネクマックス',
    shortName: 'なぜなぜ',
    tagline: '仕組(しく)みを 調(しら)べます。',
    art: portrait('INTP'),
    emblem: emblem('INTP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.STAFF,
    resists: Element.KIN,
    bonus: 20,
  },
  {
    id: 'ENTP',
    name: 'アイデアの ネクマックス',
    shortName: 'アイデア',
    tagline: 'もっと いい やり方(かた)を 見(み)つけます。',
    art: portrait('ENTP'),
    emblem: emblem('ENTP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.BOW,
    resists: Element.KOU,
    bonus: 20,
  },
  {
    id: 'INFJ',
    name: 'おもいやりの ネクマックス',
    shortName: 'おもいやり',
    tagline: '人(ひと)の 気持(きも)ちを 考(かんが)えます。',
    art: portrait('INFJ'),
    emblem: emblem('INFJ'),
    rank: Rank.STANDARD,
    favours: WeaponClass.SHIELD,
    resists: Element.AN,
    bonus: 20,
  },
  {
    id: 'INFP',
    name: 'ゆめの ネクマックス',
    shortName: 'ゆめ',
    tagline: '好(す)きな ことを 大事(だいじ)に します。',
    art: portrait('INFP'),
    emblem: emblem('INFP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.STAFF,
    resists: Element.KOU,
    bonus: 20,
  },
  {
    id: 'ENFP',
    name: 'わくわくの ネクマックス',
    shortName: 'わくわく',
    tagline: '新(あたら)しい ことに 人(ひと)を さそいます。',
    art: portrait('ENFP'),
    emblem: emblem('ENFP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.BOW,
    resists: Element.SUI,
    bonus: 20,
  },
  {
    id: 'ISTP',
    name: 'どうぐの ネクマックス',
    shortName: 'どうぐ',
    tagline: '手(て)を 動(うご)かして 直(なお)します。',
    art: portrait('ISTP'),
    emblem: emblem('ISTP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.AXE,
    resists: Element.KIN,
    bonus: 20,
  },
  {
    id: 'ISFP',
    name: 'デザインの ネクマックス',
    shortName: 'デザイン',
    tagline: 'きれいに 作(つく)ります。',
    art: portrait('ISFP'),
    emblem: emblem('ISFP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.DAGGER,
    resists: Element.MOKU,
    bonus: 20,
  },
  {
    id: 'ESFP',
    name: 'もりあげの ネクマックス',
    shortName: 'もりあげ',
    tagline: '今(いま)、ここを 楽(たの)しく します。',
    art: portrait('ESFP'),
    emblem: emblem('ESFP'),
    rank: Rank.STANDARD,
    favours: WeaponClass.HAMMER,
    resists: Element.KA,
    bonus: 20,
  },

  // --- ガチャ（めずらしい） -----------------------------------------------
  {
    id: 'INTJ',
    name: 'よそうの ネクマックス',
    shortName: 'よそう',
    tagline: '先(さき)を 見(み)て、道(みち)を 作(つく)ります。',
    art: portrait('INTJ'),
    emblem: emblem('INTJ'),
    rank: Rank.SPECIAL,
    favours: WeaponClass.SPEAR,
    resists: Element.AN,
    bonus: 35,
  },
  {
    id: 'ENTJ',
    name: 'あんないの ネクマックス',
    shortName: 'あんない',
    tagline: 'みんなと ゴールへ 進(すす)みます。',
    art: portrait('ENTJ'),
    emblem: emblem('ENTJ'),
    rank: Rank.SPECIAL,
    favours: WeaponClass.SWORD,
    resists: Element.KIN,
    bonus: 35,
  },
  {
    id: 'ENFJ',
    name: 'おうえんの ネクマックス',
    shortName: 'おうえん',
    tagline: 'みんなを 元気(げんき)に します。',
    art: portrait('ENFJ'),
    emblem: emblem('ENFJ'),
    rank: Rank.SPECIAL,
    favours: WeaponClass.SPEAR,
    resists: Element.KOU,
    bonus: 35,
  },
];

const byId = new Map(INDIVIDUALS.map((i) => [i.id, i]));
export const getIndividual = (id: string): Individual | undefined => byId.get(id);

export const individualsOfRank = (rank: Rank): Individual[] =>
  INDIVIDUALS.filter((i) => i.rank === rank);
