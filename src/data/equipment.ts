import { gearFromId, type ForgedPart } from '../lib/forge/gear';

/**
 * そうび — shields, body armour and charms, each made of kanji.
 *
 * The weapon slot is filled by the forge. The other three slots are filled
 * from this table: every item names the characters it is made of, and it can
 * be made the moment the learner owns them. One item appears per stage, made
 * from that stage's characters, so the rule the whole game rests on — a new
 * character is new strength — shows up as a new thing to wear.
 *
 * Design: docs/design/07_そうびと成長とバトル.md §1.
 */

export const GearSlot = {
  SHIELD: 'shield',
  BODY: 'body',
  CHARM: 'charm',
} as const;
export type GearSlot = (typeof GearSlot)[keyof typeof GearSlot];

/**
 * Where a piece is worn. A second accessory slot opens at クラス ★4
 * (lib/nexmaxClass.ts, docs/design/21): it takes the same pieces as `charm`.
 */
export type WearSlot = GearSlot | 'charm2';

/** The kind of piece a slot takes. */
export const itemSlotOf = (s: WearSlot): GearSlot => (s === 'charm2' ? 'charm' : s);

export const SLOT_LABEL: Record<WearSlot | 'weapon', string> = {
  weapon: '武器(ぶき)',
  shield: '盾(たて)',
  body: 'からだ',
  charm: 'アクセサリ',
  charm2: 'アクセサリ 2',
};

export interface GearItem {
  id: string;
  slot: GearSlot;
  /** Furigana notation. */
  name: string;
  /** The characters it is made of. All must be owned. */
  kanji: string[];
  /** Stage whose story introduces it; it is listed from then on. */
  stage: string;
  /** One line on what it does, furigana notation. */
  blurb: string;
  defense?: number;
  hp?: number;
  /** Extra mistakes the opponent tolerates before it strikes. */
  patience?: number;
  /** Percent added to damage. */
  attackPct?: number;
  /** Game Icons name. */
  icon: string;
  /**
   * Made in 漢字やさん from two or three kanji (lib/forge/gear.ts), not taken
   * from this table: what it is made of, its ★ and its element.
   */
  forged?: ForgedPart;
}

export const GEAR: GearItem[] = [
  {
    id: 'shield-oo',
    slot: 'shield',
    name: '大(おお)きな 盾(たて)',
    kanji: ['大'],
    stage: 'mukashi-1',
    blurb: '「大(おお)きい」の 字(じ)で 作(つく)った 盾(たて)。',
    defense: 3,
    icon: 'GiRoundShield',
  },
  {
    id: 'charm-me',
    slot: 'charm',
    name: '目(め)の おまもり',
    kanji: ['目'],
    stage: 'mukashi-2',
    blurb: 'よく 見(み)て 書(か)きます。敵(てき)が 動(うご)くまでの ミスが 1(ひと)つ ふえる。',
    patience: 1,
    icon: 'GiEyeTarget',
  },
  {
    id: 'body-ki',
    slot: 'body',
    name: '木(き)の よろい',
    kanji: ['木'],
    stage: 'mukashi-3',
    blurb: '木(き)の 皮(かわ)を かさねた よろい。',
    hp: 20,
    icon: 'GiLeatherArmor',
  },
  {
    id: 'shield-yama',
    slot: 'shield',
    name: '山(やま)の 盾(たて)',
    kanji: ['山'],
    stage: 'mukashi-3',
    blurb: '山(やま)の ように 動(うご)かない 盾(たて)。',
    defense: 6,
    icon: 'GiCheckedShield',
  },
  {
    id: 'charm-ki',
    slot: 'charm',
    name: '気(き)の はちまき',
    kanji: ['気'],
    stage: 'mukashi-4',
    blurb: '気(き)もちが つよく なる。こうげき ＋10%。',
    attackPct: 10,
    icon: 'GiRibbon',
  },
  {
    id: 'body-tsukiyo',
    slot: 'body',
    name: '月夜(つきよ)の ころも',
    kanji: ['月', '夕'],
    stage: 'mukashi-5',
    blurb: '夕(ゆう)がたから 夜(よる)の 光(ひかり)を あつめた ころも。',
    hp: 35,
    icon: 'GiRobe',
  },
  {
    id: 'charm-toki',
    slot: 'charm',
    name: '時(とき)の おまもり',
    kanji: ['時'],
    stage: 'mukashi-6',
    blurb: 'あわてない。ミスが 1(ひと)つ ふえ、こうげき ＋5%。',
    patience: 1,
    attackPct: 5,
    icon: 'GiSandsOfTime',
  },
  {
    id: 'shield-shiho',
    slot: 'shield',
    name: '東西南北(とうざいなんぼく)の 盾(たて)',
    kanji: ['東', '西', '南', '北'],
    stage: 'mukashi-7',
    blurb: 'どの 方(ほう)から 来(き)ても まもる 盾(たて)。',
    defense: 10,
    icon: 'GiCompass',
  },
  {
    id: 'charm-hon',
    slot: 'charm',
    name: '本(ほん)の しおり',
    kanji: ['本', '読'],
    stage: 'mukashi-8',
    blurb: '読(よ)んだ 字(じ)が 力(ちから)に なる。こうげき ＋20%。',
    attackPct: 20,
    icon: 'GiBookmarklet',
  },
  {
    id: 'body-kin',
    slot: 'body',
    name: '金(きん)の よろい',
    kanji: ['金'],
    stage: 'mukashi-9',
    blurb: 'とても かたい よろい。',
    hp: 50,
    icon: 'GiBreastplate',
  },
  {
    id: 'charm-tomo',
    slot: 'charm',
    name: '友(とも)の きずな',
    kanji: ['友'],
    stage: 'mukashi-10',
    blurb: '一人(ひとり)じゃない。ミスが 1(ひと)つ ふえ、こうげき ＋10%。',
    patience: 1,
    attackPct: 10,
    icon: 'GiThreeFriends',
  },
  // 新ルートの アクセサリ（docs/design/19 §3、2026-10-08「アクセサリはもっと数を増やして」）: 1話に 1つ、
  // その 話の 字で 作る。効き目は 話が すすむほど 大きい（1章 10点 → 4章 30点ほど。がまん 1 ≒ こうげき 10% ≒ HP 25）。
  {
    id: 'charm-tsuki',
    slot: 'charm',
    name: '月(つき)の ペンダント',
    kanji: ['月'],
    stage: 'moji-1-1',
    blurb: '夜(よる)も まもって くれる 月(つき)の かざり。',
    patience: 1,
    icon: 'GiCrescentStaff',
  },
  {
    id: 'charm-yama',
    slot: 'charm',
    name: '山(やま)の すず',
    kanji: ['山'],
    stage: 'moji-1-2',
    blurb: '山(やま)の おまもりの すず。',
    defense: 1,
    hp: 15,
    icon: 'GiRingingBell',
  },
  {
    id: 'charm-mitsuboshi',
    slot: 'charm',
    name: '三(みっ)つ星(ぼし)の バッジ',
    kanji: ['三'],
    stage: 'moji-1-3',
    blurb: '三(みっ)つの 星(ほし)が ひかる バッジ。',
    attackPct: 8,
    icon: 'GiStarMedal',
  },
  {
    id: 'charm-hachi',
    slot: 'charm',
    name: '八(はち)の おうぎ',
    kanji: ['八'],
    stage: 'moji-1-4',
    blurb: '八(はち)の 字(じ)の ように ひろがる おうぎ。いい ことが ふえる。',
    hp: 5,
    patience: 1,
    icon: 'GiFeatherWound',
  },
  {
    id: 'charm-senen',
    slot: 'charm',
    name: '千円(せんえん)の さいふ',
    kanji: ['千', '円'],
    stage: 'moji-1-5',
    blurb: '千円(せんえん)が 入(はい)った 小(ちい)さい さいふ。',
    attackPct: 10,
    icon: 'GiTwoCoins',
  },
  {
    id: 'charm-sensei',
    slot: 'charm',
    name: '先生(せんせい)の めがね',
    kanji: ['先', '生'],
    stage: 'moji-1-6',
    blurb: 'よく 見(み)える めがね。',
    patience: 1,
    attackPct: 3,
    icon: 'GiSpectacles',
  },
  {
    id: 'charm-isha',
    slot: 'charm',
    name: '医者(いしゃ)の ちょうしんき',
    kanji: ['医', '者'],
    stage: 'moji-1-7',
    blurb: 'からだの 音(おと)を 聞(き)く どうぐ。',
    hp: 25,
    icon: 'GiStethoscope',
  },
  {
    id: 'charm-asa',
    slot: 'charm',
    name: '朝(あさ)の めざまし',
    kanji: ['朝'],
    stage: 'moji-1-8',
    blurb: '朝(あさ)、はやく おこして くれる とけい。',
    patience: 1,
    attackPct: 5,
    icon: 'GiAlarmClock',
  },
  {
    id: 'charm-mainichi',
    slot: 'charm',
    name: '毎日(まいにち)の カレンダー',
    kanji: ['毎', '日'],
    stage: 'moji-1-9',
    blurb: '毎日(まいにち) 書(か)くと、つよく なる。',
    hp: 15,
    patience: 1,
    icon: 'GiCalendar',
  },
  {
    id: 'charm-gakkou',
    slot: 'charm',
    name: '学校(がっこう)の バッジ',
    kanji: ['学', '校'],
    stage: 'moji-1-10',
    blurb: '学校(がっこう)で ならった 字(じ)の 力(ちから)。',
    attackPct: 12,
    icon: 'GiOpenBook',
  },
  {
    id: 'charm-densha',
    slot: 'charm',
    name: '電車(でんしゃ)の きっぷ',
    kanji: ['電', '車'],
    stage: 'moji-1-11',
    blurb: 'ナニワタウンへ 行(い)く 電車(でんしゃ)の きっぷ。',
    patience: 1,
    attackPct: 8,
    icon: 'GiTicket',
  },
  {
    id: 'charm-atarashii',
    slot: 'charm',
    name: '新(あたら)しい リボン',
    kanji: ['新'],
    stage: 'moji-2-1',
    blurb: 'あたらしい 町(まち)で もらった リボン。',
    hp: 10,
    attackPct: 12,
    icon: 'GiBowTieRibbon',
  },
  {
    id: 'charm-aoi',
    slot: 'charm',
    name: '青(あお)い 星(ほし)',
    kanji: ['青'],
    stage: 'moji-2-2',
    blurb: '青(あお)く ひかる 星(ほし)の かざり。',
    defense: 3,
    patience: 1,
    icon: 'GiStarsStack',
  },
  {
    id: 'charm-tebukuro',
    slot: 'charm',
    name: '手(て)ぶくろ',
    kanji: ['手'],
    stage: 'moji-2-3',
    blurb: '字(じ)を 書(か)く 手(て)を まもる。',
    attackPct: 15,
    icon: 'GiGloves',
  },
  {
    id: 'charm-sakana',
    slot: 'charm',
    name: '魚(さかな)の キーホルダー',
    kanji: ['魚'],
    stage: 'moji-2-4',
    blurb: 'ミナトタウンの 魚(さかな)。',
    hp: 30,
    icon: 'GiFishbone',
  },
  {
    id: 'charm-migihidari',
    slot: 'charm',
    name: '右(みぎ)と 左(ひだり)の イヤリング',
    kanji: ['右', '左'],
    stage: 'moji-2-5',
    blurb: '右(みぎ)と 左(ひだり)で 色(いろ)が ちがう。',
    patience: 1,
    attackPct: 8,
    icon: 'GiEarrings',
  },
  {
    id: 'charm-inu',
    slot: 'charm',
    name: '犬(いぬ)の バッジ',
    kanji: ['犬'],
    stage: 'moji-2-6',
    blurb: 'げんきな 犬(いぬ)の バッジ。',
    defense: 4,
    hp: 15,
    icon: 'GiSittingDog',
  },
  {
    id: 'charm-maiku',
    slot: 'charm',
    name: '話(はなし)の マイク',
    kanji: ['話', '聞'],
    stage: 'moji-2-7',
    blurb: '話(はな)して、聞(き)いて、つよく なる。',
    attackPct: 18,
    icon: 'GiMicrophone',
  },
  {
    id: 'charm-kaerimichi',
    slot: 'charm',
    name: '帰(かえ)り道(みち)の ランタン',
    kanji: ['帰'],
    stage: 'moji-2-8',
    blurb: '夜(よる)の 帰(かえ)り道(みち)を てらす。',
    hp: 20,
    patience: 1,
    icon: 'GiLantern',
  },
  {
    id: 'charm-shashin',
    slot: 'charm',
    name: '写真(しゃしん)の ロケット',
    kanji: ['写', '真'],
    stage: 'moji-2-9',
    blurb: 'だいじな 写真(しゃしん)を 入(い)れる ペンダント。',
    patience: 1,
    attackPct: 10,
    icon: 'GiHeartNecklace',
  },
  {
    id: 'charm-eiga',
    slot: 'charm',
    name: '映画(えいが)の チケット',
    kanji: ['映', '画'],
    stage: 'moji-2-10',
    blurb: '映画館(えいがかん)の チケット。',
    attackPct: 20,
    icon: 'GiFilmStrip',
  },
  {
    id: 'charm-kitte',
    slot: 'charm',
    name: '切手(きって)の ブローチ',
    kanji: ['切', '手'],
    stage: 'moji-3-1',
    blurb: '山(やま)の 絵(え)の 切手(きって)。',
    hp: 10,
    patience: 1,
    attackPct: 12,
    icon: 'GiStamper',
  },
  {
    id: 'charm-tabi',
    slot: 'charm',
    name: '旅(たび)の コンパス',
    kanji: ['旅'],
    stage: 'moji-3-2',
    blurb: 'どこへ 行(い)っても まよわない。',
    patience: 2,
    icon: 'GiCompass',
  },
  {
    id: 'charm-hana',
    slot: 'charm',
    name: '花(はな)の かんむり',
    kanji: ['花'],
    stage: 'moji-3-3',
    blurb: 'マンプクタウンの 花(はな)で 作(つく)った。',
    hp: 40,
    patience: 1,
    icon: 'GiFlowerTwirl',
  },
  {
    id: 'charm-ame',
    slot: 'charm',
    name: '雨(あめ)の しずく',
    kanji: ['雨'],
    stage: 'moji-3-4',
    blurb: '雨(あめ)の 日(ひ)に ひかる しずく。',
    defense: 5,
    patience: 1,
    icon: 'GiWaterDrop',
  },
  {
    id: 'charm-tsukuru',
    slot: 'charm',
    name: '作(つく)る 人(ひと)の ゴーグル',
    kanji: ['作'],
    stage: 'moji-3-5',
    blurb: 'ものを 作(つく)る 人(ひと)の ゴーグル。',
    attackPct: 25,
    icon: 'GiSteampunkGoggles',
  },
  {
    id: 'charm-akarui',
    slot: 'charm',
    name: '明(あか)るい ランプ',
    kanji: ['明'],
    stage: 'moji-4-1',
    blurb: 'くらい ところも 明(あか)るく する。',
    hp: 10,
    patience: 1,
    attackPct: 15,
    icon: 'GiLightBulb',
  },
  {
    id: 'charm-omoi',
    slot: 'charm',
    name: '重(おも)い いかり',
    kanji: ['重'],
    stage: 'moji-4-2',
    blurb: 'おもくて、うごかない。',
    defense: 6,
    hp: 20,
    icon: 'GiAnchor',
  },
  {
    id: 'charm-genki',
    slot: 'charm',
    name: '元気(げんき)の おまもり',
    kanji: ['元', '気'],
    stage: 'moji-4-3',
    blurb: '元気(げんき)が 出(で)る おまもり。',
    hp: 50,
    patience: 1,
    icon: 'GiSun',
  },
  {
    id: 'charm-yuumei',
    slot: 'charm',
    name: '有名(ゆうめい)な メダル',
    kanji: ['有', '名'],
    stage: 'moji-4-4',
    blurb: 'みんなが 知(し)って いる メダル。',
    attackPct: 30,
    icon: 'GiMedal',
  },
  {
    id: 'charm-miyako',
    slot: 'charm',
    name: '京(みやこ)の ちょうちん',
    kanji: ['京'],
    stage: 'moji-4-5',
    blurb: 'ミヤコタウンの ちょうちん。',
    defense: 6,
    patience: 1,
    attackPct: 10,
    icon: 'GiPaperLantern',
  },
  {
    id: 'charm-yoru',
    slot: 'charm',
    name: '夜(よる)の 星(ほし)かざり',
    kanji: ['夜'],
    stage: 'moji-4-6',
    blurb: '夜(よる)の 空(そら)の 星(ほし)と 月(つき)。',
    hp: 20,
    patience: 2,
    icon: 'GiNightSky',
  },
  {
    id: 'charm-ashi',
    slot: 'charm',
    name: '足(あし)の はね',
    kanji: ['足'],
    stage: 'moji-4-7',
    blurb: '足(あし)が かるく なる はね。',
    patience: 1,
    attackPct: 20,
    icon: 'GiFeather',
  },
  // 5章 シズカタウン（docs/design/20）: 4章より 少し 強い。
  {
    id: 'charm-nebou',
    slot: 'charm',
    name: '寝(ね)る ときの ぼうし',
    kanji: ['寝'],
    stage: 'moji-5-1',
    blurb: 'よく 寝(ね)て、あしたも 書(か)きます。',
    hp: 20,
    patience: 2,
    icon: 'GiNightSleep',
  },
  {
    id: 'charm-kanji',
    slot: 'charm',
    name: '漢字(かんじ)の ふで',
    kanji: ['漢', '字'],
    stage: 'moji-5-2',
    blurb: '漢字(かんじ)を 書(か)く ふで。',
    attackPct: 32,
    icon: 'GiPaintBrush',
  },
  {
    id: 'charm-gin',
    slot: 'charm',
    name: '銀(ぎん)の かぎ',
    kanji: ['銀'],
    stage: 'moji-5-3',
    blurb: '銀(ぎん)で 作(つく)った かぎ。',
    defense: 7,
    hp: 15,
    patience: 1,
    icon: 'GiSkeletonKey',
  },
  {
    id: 'charm-orgel',
    slot: 'charm',
    name: '音楽(おんがく)の オルゴール',
    kanji: ['音', '楽'],
    stage: 'moji-5-4',
    blurb: '音楽(おんがく)が ながれる 小(ちい)さい はこ。',
    patience: 1,
    attackPct: 23,
    icon: 'GiMusicalNotes',
  },
  {
    id: 'charm-fuyu',
    slot: 'charm',
    name: '冬(ふゆ)の マフラー',
    kanji: ['冬'],
    stage: 'moji-5-5',
    blurb: '冬(ふゆ)でも あたたかい マフラー。',
    defense: 4,
    hp: 40,
    patience: 1,
    icon: 'GiWinterHat',
  },
  {
    id: 'charm-clover',
    slot: 'charm',
    name: '運(うん)の いい クローバー',
    kanji: ['運'],
    stage: 'moji-5-6',
    blurb: 'いい ことが ある 四(よ)つばの クローバー。',
    patience: 2,
    attackPct: 12,
    icon: 'GiClover',
  },
  {
    id: 'charm-kazoku',
    slot: 'charm',
    name: '家族(かぞく)の ブレスレット',
    kanji: ['家', '族'],
    stage: 'moji-5-7',
    blurb: '家族(かぞく) みんなの ブレスレット。',
    hp: 60,
    attackPct: 10,
    icon: 'GiHearts',
  },
  {
    id: 'charm-kai',
    slot: 'charm',
    name: '海(うみ)の かいがら',
    kanji: ['海'],
    stage: 'moji-5-8',
    blurb: '海(うみ)の 音(おと)が する かいがら。',
    defense: 8,
    hp: 20,
    patience: 1,
    icon: 'GiScallop',
  },
  {
    id: 'charm-mado',
    slot: 'charm',
    name: '窓(まど)の ステンドグラス',
    kanji: ['窓'],
    stage: 'moji-5-9',
    blurb: '月(つき)の あかりが 入(はい)る 窓(まど)の ガラス。',
    patience: 1,
    attackPct: 25,
    icon: 'GiWindow',
  },
  {
    id: 'charm-uta',
    slot: 'charm',
    name: '歌(うた)の ハープ',
    kanji: ['歌'],
    stage: 'moji-5-10',
    blurb: '歌(うた)と いっしょに ひく ハープ。',
    patience: 1,
    attackPct: 26,
    icon: 'GiLyre',
  },
];

const byId = new Map(GEAR.map((g) => [g.id, g]));

/** A forged shield or body piece as the rest of そうび reads it. */
const fromForged = (p: ForgedPart): GearItem => ({
  id: p.id,
  slot: p.slot,
  name: p.name,
  kanji: [...p.word],
  stage: 'forge',
  blurb: p.blurb,
  defense: p.defense,
  hp: p.hp,
  icon: p.icon,
  forged: p,
});

/** A table item, or a forged piece built again from its id (`shield:<kanji ids>`). */
export const getGear = (id: string | null | undefined): GearItem | undefined => {
  if (!id) return undefined;
  const table = byId.get(id);
  if (table) return table;
  const forged = gearFromId(id);
  return forged ? fromForged(forged) : undefined;
};

/** Characters the item still needs, given the characters owned. */
export const missingFor = (item: GearItem, ownedChars: ReadonlySet<string>): string[] =>
  item.kanji.filter((c) => !ownedChars.has(c));

/** Gear the learner has been shown so far: every stage reached or cleared. */
export const gearInView = (reachedStages: ReadonlySet<string>): GearItem[] =>
  GEAR.filter((g) => reachedStages.has(g.stage));

/**
 * The one hint to show: the first item in view not yet made, and whether it
 * can be made now. Null once everything in view is made.
 */
export const nextGearHint = (
  inView: GearItem[],
  made: readonly string[],
  ownedChars: ReadonlySet<string>,
): { item: GearItem; missing: string[] } | null => {
  const item = inView.find((g) => !made.includes(g.id));
  return item ? { item, missing: missingFor(item, ownedChars) } : null;
};
