import { Element } from '../lib/forge/elements';
import { WeaponClass } from '../lib/forge/weapon';
import type { Rarity } from '../lib/companionSkill';

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
  /** The card: the character's id for its first card ("ISTJ", "rin"), "ISTJ-4" for its ★4 (docs/design/11 §4.1). */
  id: string;
  /** The character the card is of — its わざ and lines go by this. */
  char: string;
  /** ★3〜5. The same character can come as more than one. */
  rarity: Rarity;
  /** ネクマックスの なかま (a robot) or 町の 人 (a person of Naniwa Town). */
  kind: 'robot' | 'town';
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
  /**
   * A town person's first episode (the story meets them there): the gacha
   * keeps them, and their dressed cards, back until it is cleared (lib/gacha.ts isMet).
   */
  meets?: string;
}

const portrait = (code: string) => `img/chara/types/${code}.webp`;
const emblem = (code: string) => `img/ui/emblems/${code}.webp`;

/** The sixteen robots' first cards: ★3, or ★4 for the rare three (Rank.SPECIAL). */
type RobotDef = Omit<Individual, 'char' | 'rarity' | 'kind'>;
const robot = (d: RobotDef): Individual => ({ ...d, char: d.id, rarity: d.rank === 'SPECIAL' ? 4 : 3, kind: 'robot' });

/**
 * The sixteen. Names and taglines follow NexmaxAcademy's personality ledger so
 * a learner who met them there recognises them here.
 */
const ROBOTS: RobotDef[] = [
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

/** The sixteen robots, as the story and today's gacha give them. */
export const INDIVIDUALS: readonly Individual[] = ROBOTS.map(robot);

/**
 * 町の なかま (11 §4.1, 2026-10-03「町の 人は ネクマックスタイプで なくても 良い」):
 * people of Naniwa Town the player has helped, at ★3 in their town clothes.
 */
const town = (id: string, name: string, tagline: string, favours: WeaponClass, resists: Element, meets: string): Individual => ({
  id,
  char: id,
  rarity: 3,
  kind: 'town',
  name,
  shortName: name,
  tagline,
  art: `img/chara/naniwa/folk_${id}_happy.webp`,
  // No badge of their own: the portrait stands in for it.
  emblem: `img/chara/naniwa/folk_${id}_happy.webp`,
  rank: Rank.STANDARD,
  favours,
  resists,
  bonus: 20,
  meets,
});

export const TOWN: readonly Individual[] = [
  town('rin', 'リンさん', '本(ほん)が だいすきな りゅうがくせい。', WeaponClass.SPEAR, Element.KOU, 'moji-1-7'),
  town('yamada', '山(やま)田(だ)さん', 'ナニワタウンの やさしい 人(ひと)。', WeaponClass.STAFF, Element.MOKU, 'moji-1-2'),
  town('teacher', '先(せん)生(せい)', '日本語(にほんご)学校(がっこう)の 先(せん)生(せい)。', WeaponClass.SWORD, Element.KIN, 'moji-1-6'),
  town('doctor', 'お医(い)者(しゃ)さん', 'みんなの けんこうを まもります。', WeaponClass.SHIELD, Element.SUI, 'moji-1-7'),
  town('baker', 'パンやさん', 'まいあさ おいしい パンを やきます。', WeaponClass.HAMMER, Element.KA, 'moji-1-9'),
  town('keeper', 'とけいだいの 人(ひと)', '町(まち)の 時間(じかん)を まもります。', WeaponClass.AXE, Element.DO, 'moji-1-8'),
  // 2章 ミナトタウン（docs/design/13）: はじめての ともだち ソラと、町で 会う 二人。
  town('sora', 'ソラ', 'ミナトタウンの 子(こ)。えいがと 英(えい)語(ご)が 好(す)き。', WeaponClass.BOW, Element.SUI, 'moji-2-3'),
  town('usher', 'えいがかんの 人(ひと)', 'むかしの ゆめは えいがスター。', WeaponClass.DAGGER, Element.KOU, 'moji-2-10'),
  town('photographer', 'しゃしんやさん', 'お茶(ちゃ)も 出(だ)す しゃしんやさん。', WeaponClass.STAFF, Element.AN, 'moji-2-9'),
  // 3章 マンプクタウン（docs/design/14）: 料理人に なりたい ハナ。
  town('hana', 'ハナ', 'りょうりにんが ゆめの 12さい。ラーメンが 好(す)き。', WeaponClass.DAGGER, Element.KA, 'moji-3-2'),
];

/**
 * ★4・★5 — the same character dressed up (11 §4.1). Same わざ and weapon,
 * stronger: the favoured-weapon bonus +10 a step, the わざ by rarity.
 */
const dressed = (char: string, rarity: 4 | 5, title: string, fullName?: string): Individual => {
  const base = [...ROBOTS.map(robot), ...TOWN].find((i) => i.id === char)!;
  return {
    ...base,
    id: `${char}-${rarity}`,
    rarity,
    name: fullName ?? `${title} ${base.shortName}`,
    art: `img/chara/cards/${char}-${rarity}.webp`,
    rank: rarity === 5 ? Rank.SPECIAL : Rank.STANDARD,
    bonus: base.bonus + (rarity - base.rarity) * 10,
  };
};

export const DRESSED: readonly Individual[] = [
  dressed('ISTJ', 4, 'えきちょうの'),
  dressed('ISFJ', 4, 'ナースの'),
  dressed('ESTP', 4, 'ランナーの'),
  dressed('ESTJ', 4, 'せいとかいの'),
  dressed('ESFJ', 4, 'カフェの'),
  dressed('INTP', 4, 'はかせの'),
  dressed('ENTP', 4, 'はつめいかの'),
  dressed('INFJ', 4, 'としょいいんの'),
  dressed('INFP', 4, 'えかきの'),
  dressed('ENFP', 4, 'たんけんかの'),
  dressed('ISTP', 4, 'メカニックの'),
  dressed('ISFP', 4, 'ゆかたの'),
  dressed('ESFP', 4, 'アイドルの'),
  dressed('ISTJ', 5, 'さむらいの'),
  dressed('ESTP', 5, 'ロケットの'),
  dressed('ENFP', 5, 'まつりの'),
  dressed('INTJ', 5, 'たんていの'),
  dressed('ENTJ', 5, 'せんちょうの'),
  dressed('ENFJ', 5, 'ネオンの'),
  dressed('rin', 4, 'ゆかたの'),
  dressed('yamada', 4, 'はなびの'),
  dressed('teacher', 4, 'しょどうの'),
  dressed('doctor', 4, 'さくらの'),
  dressed('baker', 4, 'クリスマスの'),
  dressed('keeper', 4, 'ほしぞらの'),
  dressed('rin', 5, 'まつりの'),
  dressed('keeper', 5, 'じかんの', 'じかんの まほうつかい'),
  dressed('sora', 4, 'えいがかんとくの'),
  dressed('sora', 5, 'みなとの キャプテン'),
  dressed('photographer', 4, 'おちゃの めいじん'),
  dressed('usher', 4, 'スターの'),
  dressed('hana', 4, 'りょうりたいかいの'),
];

/** Every card there is. */
export const CARDS: readonly Individual[] = [...INDIVIDUALS, ...TOWN, ...DRESSED];

/** The characters, in order: the robots, then the town. */
export const CHARACTERS: readonly string[] = [...INDIVIDUALS, ...TOWN].map((i) => i.id);

/** A character's cards, ★ ascending. */
export const cardsOf = (char: string): Individual[] => CARDS.filter((c) => c.char === char).sort((a, b) => a.rarity - b.rarity);

const byId = new Map(CARDS.map((i) => [i.id, i]));
export const getIndividual = (id: string): Individual | undefined => byId.get(id);

export const individualsOfRank = (rank: Rank): Individual[] =>
  INDIVIDUALS.filter((i) => i.rank === rank);
