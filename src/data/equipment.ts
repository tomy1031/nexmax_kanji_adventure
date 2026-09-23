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

export const SLOT_LABEL: Record<GearSlot | 'weapon', string> = {
  weapon: '武器(ぶき)',
  shield: '盾(たて)',
  body: 'からだ',
  charm: 'アクセサリ',
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
    blurb: 'よく 見(み)て 書(か)ける。敵(てき)が 動(うご)くまでの ミスが 1(ひと)つ ふえる。',
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
];

const byId = new Map(GEAR.map((g) => [g.id, g]));
export const getGear = (id: string | null | undefined): GearItem | undefined => (id ? byId.get(id) : undefined);

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
