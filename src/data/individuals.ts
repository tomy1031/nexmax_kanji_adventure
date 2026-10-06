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
  /**
   * Display name in furigana notation: 「役職：名前」, the title then the name
   * (2026-10-06「時の魔術師：トキ のように」), e.g. 時(とき)の 魔(ま)術(じゅつ)師(し)：トキ.
   */
  name: string;
  /** The name alone — their character's reading (docs/design/18 §1) — for tight spaces. */
  shortName: string;
  /**
   * What they are: the robot's old title (「まじめの ネクマックス」), the town
   * person's job in the story (「パン屋さん」), or the costume's (「名探偵」).
   */
  title: string;
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
 * The sixteen. Taglines follow NexmaxAcademy's personality ledger, and the
 * ledger's title stays as each one's role (「まじめの ネクマックス」); the name is
 * the reading of their character (data/charKanji.ts, docs/design/18 §1):
 * 正 タダシ, 守 マモル, 夢 ユメ …
 */
const ROBOTS: RobotDef[] = [
  // --- 物語でもらう個体 ---------------------------------------------------
  {
    id: 'ISTJ',
    name: 'まじめの ネクマックス：タダシ',
    shortName: 'タダシ',
    title: 'まじめの ネクマックス',
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
    name: 'みまもりの ネクマックス：マモル',
    shortName: 'マモル',
    title: 'みまもりの ネクマックス',
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
    name: 'スタートの ネクマックス：ススム',
    shortName: 'ススム',
    title: 'スタートの ネクマックス',
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
    name: 'まとめの ネクマックス：カナメ',
    shortName: 'カナメ',
    title: 'まとめの ネクマックス',
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
    name: 'おせわの ネクマックス：ユウ',
    shortName: 'ユウ',
    title: 'おせわの ネクマックス',
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
    name: 'なぜなぜの ネクマックス：コウ',
    shortName: 'コウ',
    title: 'なぜなぜの ネクマックス',
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
    name: 'アイデアの ネクマックス：アラタ',
    shortName: 'アラタ',
    title: 'アイデアの ネクマックス',
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
    name: 'おもいやりの ネクマックス：ココロ',
    shortName: 'ココロ',
    title: 'おもいやりの ネクマックス',
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
    name: 'ゆめの ネクマックス：ユメ',
    shortName: 'ユメ',
    title: 'ゆめの ネクマックス',
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
    name: 'わくわくの ネクマックス：タビ',
    shortName: 'タビ',
    title: 'わくわくの ネクマックス',
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
    name: 'どうぐの ネクマックス：タクミ',
    shortName: 'タクミ',
    title: 'どうぐの ネクマックス',
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
    name: 'デザインの ネクマックス：イロハ',
    shortName: 'イロハ',
    title: 'デザインの ネクマックス',
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
    name: 'もりあげの ネクマックス：ウタ',
    shortName: 'ウタ',
    title: 'もりあげの ネクマックス',
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
    name: 'よそうの ネクマックス：サキ',
    shortName: 'サキ',
    title: 'よそうの ネクマックス',
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
    name: 'あんないの ネクマックス：ミチ',
    shortName: 'ミチ',
    title: 'あんないの ネクマックス',
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
    name: 'おうえんの ネクマックス：ヒカリ',
    shortName: 'ヒカリ',
    title: 'おうえんの ネクマックス',
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
 * On the cards everyone goes by their character's reading (docs/design/18 §1,
 * 「町の 人は カードだけ」): the story still says とけいだいの 人, kept as their
 * role. リン keeps her own name (she came from abroad; 鈴 and 林 have no stroke data).
 */
const town = (id: string, name: string, title: string, tagline: string, favours: WeaponClass, resists: Element, meets: string): Individual => ({
  id,
  char: id,
  rarity: 3,
  kind: 'town',
  name: `${title}：${name}`,
  shortName: name,
  title,
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
  town('rin', 'リン', '留(りゅう)学(がく)生(せい)', '本(ほん)が だいすきな りゅうがくせい。', WeaponClass.SPEAR, Element.KOU, 'moji-1-7'),
  town('yamada', '山(やま)田(だ)さん', 'ナニワの おとなり', 'ナニワタウンの やさしい 人(ひと)。', WeaponClass.STAFF, Element.MOKU, 'moji-1-2'),
  town('teacher', 'マナミ', '日(に)本(ほん)語(ご)の 先(せん)生(せい)', '日本語(にほんご)学校(がっこう)の 先(せん)生(せい)。', WeaponClass.SWORD, Element.KIN, 'moji-1-6'),
  town('doctor', 'ナオ', '町(まち)の お医(い)者(しゃ)さん', 'みんなの けんこうを まもります。', WeaponClass.SHIELD, Element.SUI, 'moji-1-7'),
  town('baker', 'アサヒ', 'パン屋(や)さん', 'まいあさ おいしい パンを やきます。', WeaponClass.HAMMER, Element.KA, 'moji-1-9'),
  town('keeper', 'トキ', '時(と)計(けい)台(だい)の 番(ばん)人(にん)', '町(まち)の 時間(じかん)を まもります。', WeaponClass.AXE, Element.DO, 'moji-1-8'),
  // 2章 ミナトタウン（docs/design/13）: はじめての ともだち ソラと、町で 会う 二人。
  town('sora', 'ソラ', '港(みなと)町(まち)の 子(こ)', 'ミナトタウンの 子(こ)。えいがと 英(えい)語(ご)が 好(す)き。', WeaponClass.BOW, Element.SUI, 'moji-2-3'),
  town('usher', 'セイラ', '映(えい)画(が)館(かん)の 人(ひと)', 'むかしの ゆめは えいがスター。', WeaponClass.DAGGER, Element.KOU, 'moji-2-10'),
  town('photographer', 'マコト', '写(しゃ)真(しん)屋(や)さん', 'お茶(ちゃ)も 出(だ)す しゃしんやさん。', WeaponClass.STAFF, Element.AN, 'moji-2-9'),
  // 3章 マンプクタウン（docs/design/14）: 料理人に なりたい ハナ。
  town('hana', 'ハナ', '料(りょう)理(り)人(にん)の たまご', 'りょうりにんが ゆめの 12さい。ラーメンが 好(す)き。', WeaponClass.DAGGER, Element.KA, 'moji-3-2'),
];

/**
 * ★4・★5 — the same character dressed up (11 §4.1). Same わざ and weapon,
 * stronger: the favoured-weapon bonus +10 a step, the わざ by rarity.
 */
const dressed = (char: string, rarity: 4 | 5, title: string): Individual => {
  const base = [...ROBOTS.map(robot), ...TOWN].find((i) => i.id === char)!;
  return {
    ...base,
    id: `${char}-${rarity}`,
    rarity,
    name: `${title}：${base.shortName}`,
    title,
    art: `img/chara/cards/${char}-${rarity}.webp`,
    rank: rarity === 5 ? Rank.SPECIAL : Rank.STANDARD,
    bonus: base.bonus + (rarity - base.rarity) * 10,
  };
};

export const DRESSED: readonly Individual[] = [
  dressed('ISTJ', 4, '駅(えき)長(ちょう)'),
  dressed('ISFJ', 4, '看(かん)護(ご)師(し)'),
  dressed('ESTP', 4, 'ランナー'),
  dressed('ESTJ', 4, '生(せい)徒(と)会(かい)長(ちょう)'),
  dressed('ESFJ', 4, 'カフェの 店(てん)長(ちょう)'),
  dressed('INTP', 4, '博(はか)士(せ)'),
  dressed('ENTP', 4, '発(はつ)明(めい)家(か)'),
  dressed('INFJ', 4, '図(と)書(しょ)委(い)員(いん)'),
  dressed('INFP', 4, '絵(え)かき'),
  dressed('ENFP', 4, '探(たん)検(けん)家(か)'),
  dressed('ISTP', 4, '整(せい)備(び)士(し)'),
  dressed('ISFP', 4, '夏(なつ)の 絵(え)師(し)'),
  dressed('ESFP', 4, 'アイドル'),
  dressed('ISTJ', 5, '侍(さむらい)'),
  dressed('ESTP', 5, '宇(う)宙(ちゅう)飛(ひ)行(こう)士(し)'),
  dressed('ENFP', 5, '祭(まつ)りの 主(しゅ)役(やく)'),
  dressed('INTJ', 5, '名(めい)探(たん)偵(てい)'),
  dressed('ENTJ', 5, '船(せん)長(ちょう)'),
  dressed('ENFJ', 5, 'ネオンの 歌(うた)姫(ひめ)'),
  dressed('rin', 4, 'ゆかたの 留(りゅう)学(がく)生(せい)'),
  dressed('yamada', 4, '花(はな)火(び)の 名(めい)人(じん)'),
  dressed('teacher', 4, '書(しょ)道(どう)家(か)'),
  dressed('doctor', 4, '桜(さくら)の 名(めい)医(い)'),
  dressed('baker', 4, 'クリスマスの パン屋(や)'),
  dressed('keeper', 4, '星(ほし)空(ぞら)の 番(ばん)人(にん)'),
  dressed('rin', 5, '祭(まつ)りの 舞(まい)姫(ひめ)'),
  dressed('keeper', 5, '時(とき)の 魔(ま)術(じゅつ)師(し)'),
  dressed('sora', 4, '映(えい)画(が)監(かん)督(とく)'),
  dressed('sora', 5, '港(みなと)の キャプテン'),
  dressed('photographer', 4, 'お茶(ちゃ)の 名(めい)人(じん)'),
  dressed('usher', 4, '銀(ぎん)幕(まく)の スター'),
  dressed('hana', 4, '天(てん)才(さい)料(りょう)理(り)人(にん)'),
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
