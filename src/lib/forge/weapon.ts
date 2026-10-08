import type { KanjiData } from '../../types/kanji';
import type { Compound } from '../../types/forge';
import { compoundsVersion, getCompounds } from '../../data/compounds';
import { Element, elementOf, ELEMENT_LABEL } from './elements';
import { primaryStem } from '../reading';
import { HIDDEN_BOOST, stageGrowth, stageOfKanji, stageOfWord } from './stage';
import { isHiddenWeapon } from '../../data/hiddenWeapons';

/**
 * The forge.
 *
 * Two or three owned kanji go in; one weapon comes out. The same kanji in the
 * same order always produce the same weapon, so a learner can tell a friend
 * "put 火 and 山 together" and get the same thing — and so nothing has to be
 * stored but the recipe.
 *
 * The design problem is that 618 kanji give 381,924 ordered pairs, and a game
 * that treats all of them alike is a slot machine. So the pair is graded:
 *
 *   - If the pair spells a real Japanese word (火山 = かざん, volcano), that is
 *     a FIND. The word becomes the weapon's name, the learner is shown what it
 *     means, and the weapon is markedly stronger. 4,893 of these exist.
 *   - If it does not, the weapon is still made and still useful — named by
 *     stitching the two readings together — but plainly weaker than a find.
 *
 * That is the whole teaching move: the reward for knowing which kanji actually
 * go together is a better weapon, and the game says the word out loud at the
 * moment the learner cares about it.
 */

export const WeaponClass = {
  SWORD: 'SWORD',
  AXE: 'AXE',
  SPEAR: 'SPEAR',
  BOW: 'BOW',
  STAFF: 'STAFF',
  HAMMER: 'HAMMER',
  DAGGER: 'DAGGER',
  // 無 — Nexmax's own robot weapons, one for each kind of word (classOf).
  FIST: 'FIST',
  GEAR: 'GEAR',
  DRILL: 'DRILL',
  CANNON: 'CANNON',
  MAGNET: 'MAGNET',
} as const;
export type WeaponClass = (typeof WeaponClass)[keyof typeof WeaponClass];

/** The shape's name: kanji with its reading, or katakana on its own (a robot's weapon is a loanword). */
export const CLASS_LABEL: Record<WeaponClass, { ja: string; reading?: string }> = {
  SWORD: { ja: '剣', reading: 'けん' },
  AXE: { ja: '斧', reading: 'おの' },
  SPEAR: { ja: '槍', reading: 'やり' },
  BOW: { ja: '弓', reading: 'ゆみ' },
  STAFF: { ja: '杖', reading: 'つえ' },
  HAMMER: { ja: '槌', reading: 'つち' },
  DAGGER: { ja: '短刀', reading: 'たんとう' },
  FIST: { ja: 'ロケットパンチ' },
  GEAR: { ja: 'ギアカッター' },
  DRILL: { ja: 'ドリル' },
  CANNON: { ja: 'キャノン' },
  MAGNET: { ja: 'マグネット' },
};

/** The shape's name in furigana notation: 剣(けん), ドリル. */
export const classRuby = (cls: WeaponClass): string => {
  const { ja, reading } = CLASS_LABEL[cls];
  return reading ? `${ja}(${reading})` : ja;
};

/**
 * The first kanji decides the weapon's shape. Its element is the thing the
 * learner can see in the character, so the mapping stays guessable.
 *
 * 無 has no one shape: two kanji in three land there, and a forge that turned
 * all of them into one thing (a shield, until 2026-10-08) made the same
 * weapon over and over. Its kanji are told apart by what kind of word they
 * are (classOf), each kind a weapon of Nexmax's own; MAGNET stands for the
 * family where a single shape is wanted (the gacha's day of the week never
 * names 無).
 */
export const CLASS_OF_ELEMENT: Record<Element, WeaponClass> = {
  KA: WeaponClass.SWORD,
  SUI: WeaponClass.BOW,
  MOKU: WeaponClass.STAFF,
  KIN: WeaponClass.AXE,
  DO: WeaponClass.HAMMER,
  KOU: WeaponClass.SPEAR,
  AN: WeaponClass.DAGGER,
  MU: WeaponClass.MAGNET,
};

/**
 * 無の 字の 武器 (2026-10-08「盾が 武器に なって いるのは 変。ネクマックスに
 * 相応しい 武器を」): what kind of word the kanji is, read off its English
 * gloss like its element (elements.ts) — first kind in this order wins, so
 * 起 "wake up" is a movement before "up" can make it a direction.
 *
 *   人・からだ (人 父 友 手 …)        → ロケットパンチ: Nexmax's fist flies out
 *   数・時 (一 百 半 毎 今 曜 …)       → ギアカッター: a spinning cog, like a clock's
 *   動き (行 来 出 歩 送 …)          → ドリル: it turns and drives forward
 *   方向・場所 (上 右 東 中 前 …)      → キャノン: it aims one way
 *   ほか — ようす・もの (大 新 長 物 …) → マグネット: it pulls
 */
const MU_KINDS: [WeaponClass, string[]][] = [
  [
    WeaponClass.FIST,
    ['person', 'people', 'man', 'woman', 'men', 'women', 'boy', 'girl', 'child', 'children', 'baby', 'father',
     'mother', 'parent', 'parents', 'brother', 'sister', 'husband', 'wife', 'family', 'friend', 'companion',
     'master', 'owner', 'guest', 'host', 'doctor', 'employee', 'member', 'company', 'society', 'self', 'oneself',
     'king', 'lord', 'citizen', 'hand', 'arm', 'finger', 'foot', 'leg', 'mouth', 'face', 'head', 'neck', 'tooth',
     'name'],
  ],
  [
    WeaponClass.GEAR,
    ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand',
     'million', 'half', 'every', 'each', 'all', 'many', 'much', 'few', 'several', 'both', 'what', 'times',
     'double', 'twice', 'first', 'second', 'now', 'present', 'daytime', 'nightfall', 'weekday', 'early', 'late',
     'past', 'future', 'today', 'tomorrow', 'yesterday', 'always', 'age', 'period', 'era'],
  ],
  [
    WeaponClass.DRILL,
    ['go', 'come', 'enter', 'exit', 'leave', 'return', 'arrive', 'depart', 'gone', 'pass', 'walk', 'run', 'stand',
     'sit', 'rest', 'wait', 'meet', 'send', 'lend', 'borrow', 'give', 'receive', 'take', 'carry', 'hold', 'put',
     'push', 'pull', 'throw', 'catch', 'use', 'travel', 'move', 'ride', 'fly', 'wake', 'rouse', 'rise', 'raise',
     'revolve', 'turn', 'change', 'begin', 'start', 'follow', 'visit', 'talk', 'speak', 'tell', 'hear', 'listen',
     'copy', 'reflect', 'attend', 'doing', 'do', 'exertion', 'practice', 'answer', 'ask', 'open', 'shut', 'wear'],
  ],
  [
    WeaponClass.CANNON,
    ['above', 'up', 'below', 'down', 'top', 'bottom', 'middle', 'inside', 'outside', 'center', 'centre', 'left',
     'right', 'north', 'south', 'east', 'west', 'before', 'after', 'front', 'back', 'behind', 'ahead', 'previous',
     'next', 'near', 'far', 'interval', 'space', 'between', 'side', 'direction', 'way', 'corner', 'edge', 'beyond',
     'outer', 'inner', 'position'],
  ],
];
const MU_KIND_OF = new Map<string, WeaponClass>();
for (const [cls, words] of MU_KINDS) for (const w of words) if (!MU_KIND_OF.has(w)) MU_KIND_OF.set(w, cls);

const classCache = new Map<string, WeaponClass>();

/** The shape a kanji gives a weapon when it comes first: its element's, or for 無 its kind of word's. */
export const classOf = (k: KanjiData): WeaponClass => {
  const element = elementOf(k);
  if (element !== Element.MU) return CLASS_OF_ELEMENT[element];
  const hit = classCache.get(k.id);
  if (hit) return hit;
  const words = k.meanings.flatMap((m) => m.toLowerCase().split(/[^a-z-]+/)).filter(Boolean);
  let found: WeaponClass = WeaponClass.MAGNET;
  outer: for (const [cls] of MU_KINDS) {
    for (const w of words) {
      if (MU_KIND_OF.get(w) === cls) {
        found = cls;
        break outer;
      }
    }
  }
  classCache.set(k.id, found);
  return found;
};

export const Rarity = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
} as const;
export type Rarity = (typeof Rarity)[keyof typeof Rarity];

export const RARITY_LABEL: Record<Rarity, { ja: string; color: string }> = {
  1: { ja: '★', color: '#93a3b8' },
  2: { ja: '★★', color: '#5cbf6a' },
  3: { ja: '★★★', color: '#3aa8f0' },
  4: { ja: '★★★★', color: '#a78bfa' },
  5: { ja: '★★★★★', color: '#ffcf4a' },
};

export interface Weapon {
  /** Recipe id — the kanji ids joined with '+'. */
  id: string;
  /** The characters as written, e.g. "火山". */
  word: string;
  /** Display name in furigana notation. */
  name: string;
  /** Plain name without annotations. */
  plainName: string;
  /** Set when the recipe spells a real word. */
  compound: Compound | null;
  weaponClass: WeaponClass;
  element: Element;
  rarity: Rarity;
  attack: number;
  weight: number;
  /** react-icons/gi component name. */
  icon: string;
  /** One-line description shown in the inventory, furigana notation. */
  blurb: string;
  /** 強化 level 0..5 (lib/forge/recipe.ts), when it came from a saved recipe. */
  level?: number;
  /** How far along the route its kanji are (lib/forge/stage.ts): 1話 = 1. */
  stage?: number;
  /** A かくし武器 (data/hiddenWeapons.ts). */
  hidden?: boolean;
}

// ---------------------------------------------------------------------------
// Compound lookup
// ---------------------------------------------------------------------------

let compoundIndex: Map<string, Compound> | null = null;
let indexedVersion = -1;

const compoundFor = (word: string): Compound | null => {
  // Rebuilt once the rest of the words has loaded (data/compounds.ts).
  if (!compoundIndex || indexedVersion !== compoundsVersion()) {
    compoundIndex = new Map(getCompounds().map((c) => [c.word, c]));
    indexedVersion = compoundsVersion();
  }
  return compoundIndex.get(word) ?? null;
};

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness
// ---------------------------------------------------------------------------

/** FNV-1a. Same recipe, same number, forever. */
const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

/**
 * Icon pools per weapon class, from react-icons/gi (Game Icons, CC BY 3.0).
 * Listed explicitly rather than filtered at runtime so the bundle only has to
 * carry the components actually referenced.
 */
export const ICON_POOL: Record<WeaponClass, string[]> = {
  SWORD: [
    'GiBroadsword', 'GiKatana', 'GiSaberSlash', 'GiTwoHandedSword', 'GiWingedSword',
    'GiZeusSword', 'GiStripedSword', 'GiSwordInStone', 'GiCrystalShine', 'GiRelicBlade',
    'GiSparklingSabre', 'GiSharpSmile', 'GiBloodySword', 'GiFireSpellCast', 'GiSwordBrandish',
  ],
  AXE: [
    'GiBattleAxe', 'GiWarAxe', 'GiWoodAxe', 'GiStoneAxe', 'GiSharpAxe',
    'GiAxeSwing', 'GiMagicAxe', 'GiFireAxe', 'GiCrossedAxes', 'GiHatchet',
  ],
  SPEAR: [
    'GiSpearHook', 'GiTrident', 'GiSunSpear', 'GiStoneSpear', 'GiThrownSpear',
    'GiHalberd', 'GiSpearFeather', 'GiBarbedSpear', 'GiLightningTrio', 'GiHarpoonTrident',
  ],
  BOW: [
    'GiBowArrow', 'GiCrossbow', 'GiHighShot', 'GiArrowCluster', 'GiPocketBow',
    'GiBowString', 'GiArrowFlights', 'GiFlyingShuriken', 'GiArrowsShield', 'GiBullseye',
  ],
  STAFF: [
    'GiWizardStaff', 'GiMagicPalm', 'GiCrystalWand', 'GiGreenPower', 'GiLeafSwirl',
    'GiWoodStick', 'GiSpellBook', 'GiFairyWand', 'GiVineWhip', 'GiCrescentStaff',
  ],
  HAMMER: [
    'GiThorHammer', 'GiWarhammer', 'GiSpikedMace', 'GiStoneBlock', 'GiHeavyFall',
    'GiMineralHeart', 'GiEarthCrack', 'GiFlangedMace', 'GiStoneSphere', 'GiHammerDrop',
  ],
  DAGGER: [
    'GiPlainDagger', 'GiCurvyKnife', 'GiThrownDaggers', 'GiSai', 'GiShardSword',
    'GiPoisonBottle', 'GiDaggerRose', 'GiNeedleDrill', 'GiBlackHandShield', 'GiShadowFollower',
  ],
  FIST: [
    'GiFist', 'GiPunch', 'GiPunchBlast', 'GiBoxingGlove', 'GiRobotGrab',
    'GiMechanicalArm', 'GiBrassKnuckles', 'GiStrong',
  ],
  GEAR: [
    'GiCog', 'GiGears', 'GiSpinningBlades', 'GiCircularSaw', 'GiCircularSawblade',
    'GiGearHammer', 'GiShuriken', 'GiPocketWatch',
  ],
  DRILL: [
    'GiDrill', 'GiScrew', 'GiScrewdriver', 'GiSpiralArrow', 'GiVortex',
    'GiTornado', 'GiRocketThruster', 'GiMineWagon',
  ],
  CANNON: [
    'GiCannon', 'GiCannonBall', 'GiCannonShot', 'GiTurret', 'GiArtilleryShell',
    'GiLaserBlast', 'GiFireRay', 'GiRocket',
  ],
  MAGNET: [
    'GiMagnet', 'GiMagnetBlast', 'GiMagnetMan', 'GiElectric', 'GiLightningArc',
    'GiSparkPlug', 'GiBatteryPack', 'GiPowerGenerator',
  ],
};

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

/** The reading a kanji lends to a made-up name: kun first, stripped of okurigana. */
export const nameReading = (k: KanjiData): string => {
  const kun = k.kun[0]?.replace(/\(.*\)/, '');
  if (kun) return kun;
  return k.on[0] ?? '';
};

// ---------------------------------------------------------------------------
// The forge itself
// ---------------------------------------------------------------------------

/**
 * Rarity.
 *
 * The one rule this must never break: **a real word always outranks a
 * non-word.** So the tiers are split — non-words live in ★1–★2, real words
 * start at ★3. Nothing about stroke count or character count can cross that
 * line.
 *
 * (An earlier version scored these on one scale, and three heavy unrelated
 * characters tied 火山 on rarity while hitting four times as hard. That taught
 * exactly the wrong lesson.)
 */
const rarityFor = (compound: Compound | null, kanji: KanjiData[], seed: number): Rarity => {
  if (!compound) {
    // Not a word. Piling on more characters must not help, so this looks at
    // the average character, never the total.
    const avg = kanji.reduce((n, k) => n + k.strokes, 0) / kanji.length;
    return (avg >= 10 ? 2 : 1) as Rarity;
  }

  let score = 3; // any real word starts here
  if (compound.word.length >= 3) score += 1; // 三字熟語 are rarer and harder
  if (compound.level === 'N3') score += 1; // harder vocabulary
  // A small deterministic wobble so two equally good finds are not identical.
  if (seed % 4 === 0) score += 1;

  return Math.min(5, score) as Rarity;
};

/**
 * Attack, banded by rarity so the tiers cannot overlap.
 *
 * Within a band, a heavier character makes a heavier weapon — but the band is
 * set by whether the recipe is a real word, so no amount of stroke count lets
 * a non-word reach a word.
 */
const ATTACK_BAND: Record<Rarity, { floor: number; span: number }> = {
  1: { floor: 8, span: 6 },
  2: { floor: 15, span: 8 },
  3: { floor: 26, span: 14 },
  4: { floor: 42, span: 20 },
  5: { floor: 66, span: 30 },
};

/** How heavy the recipe's characters are, 0..1: 1 stroke → 0, 20+ → 1. The average, so three never beat two for being three. */
export const heavinessOf = (kanji: KanjiData[]): number => {
  const avg = kanji.reduce((n, k) => n + k.strokes, 0) / kanji.length;
  return Math.min(1, Math.max(0, (avg - 1) / 19));
};

const attackFor = (rarity: Rarity, kanji: KanjiData[]): number => {
  const { floor, span } = ATTACK_BAND[rarity];
  return Math.round(floor + heavinessOf(kanji) * span);
};

/**
 * What a recipe is, before it is a weapon, a shield or a body piece
 * (gear.ts): the word it spells, its element, its ★, how far along the route
 * its kanji are, and whether it is a かくし word. One function, so the three
 * things the forge makes keep the same rules.
 */
export interface ForgeCore {
  /** The kanji ids joined with '+'. */
  id: string;
  word: string;
  seed: number;
  compound: Compound | null;
  element: Element;
  rarity: Rarity;
  stage: number;
  hidden: boolean;
  /** 0..1 (heavinessOf). */
  heaviness: number;
}

export const forgeCore = (kanji: KanjiData[]): ForgeCore | null => {
  if (kanji.length < 2 || kanji.length > 3) return null;
  const id = kanji.map((k) => k.id).join('+');
  const word = kanji.map((k) => k.char).join('');
  const seed = hash(id);
  const compound = compoundFor(word);
  const hidden = compound != null && isHiddenWeapon(word);
  return {
    id,
    word,
    seed,
    compound,
    element: elementOf(kanji[0]),
    rarity: hidden ? (5 as Rarity) : rarityFor(compound, kanji, seed),
    stage: stageOfWord(kanji.map((k) => k.char)),
    hidden,
    heaviness: heavinessOf(kanji),
  };
};

/**
 * Build the weapon a recipe makes. Pure: same input, same output, no state.
 */
export const forgeWeapon = (kanji: KanjiData[]): Weapon | null => {
  const core = forgeCore(kanji);
  if (!core) return null;
  const { id, word, seed, compound, element, rarity, stage, hidden } = core;
  const weaponClass = classOf(kanji[0]);

  const weight = kanji.reduce((n, k) => n + k.strokes, 0);
  // A real word grows with the route: the later its kanji, the harder it hits
  // (lib/forge/stage.ts). A non-word stays in its ★1–★2 band, so a real word
  // still always beats one.
  const attack = compound ? Math.round(attackFor(rarity, kanji) * stageGrowth(stage) * (hidden ? HIDDEN_BOOST : 1)) : attackFor(rarity, kanji);

  const pool = ICON_POOL[weaponClass];
  const icon = pool[seed % pool.length];

  const classLabel = CLASS_LABEL[weaponClass];
  const className = classRuby(weaponClass);
  const elementLabel = ELEMENT_LABEL[element];

  let name: string;
  let plainName: string;
  let blurb: string;

  if (compound) {
    // A real word. Say the word, its reading and its meaning — this is the
    // moment the vocabulary actually lands.
    plainName = `${compound.word}の${classLabel.ja}`;
    name = `${compound.word}(${compound.reading})の ${className}`;
    blurb = `${hidden ? 'かくし武器(ぶき)！ ' : ''}「${compound.word}」は ${compound.gloss}。本当(ほんとう)に ある 言葉(ことば)。`;
  } else {
    // Not a word. Still a weapon — named by reading the characters aloud.
    const reading = kanji.map(nameReading).join('');
    plainName = `${word}の${classLabel.ja}`;
    name = `${word}(${reading})の ${className}`;
    blurb = `${elementLabel.ja}(${elementLabel.reading})の ちから。組(く)み合(あ)わせても 言葉(ことば)には ならない。`;
  }

  return {
    id,
    word,
    name,
    plainName,
    compound,
    weaponClass,
    element,
    rarity,
    attack,
    weight,
    icon,
    blurb,
    stage,
    hidden,
  };
};

/**
 * Every real word the learner could make right now from the kanji they own.
 * This is the forge's hint list — it never shows words they cannot build.
 */
export const discoverableCompounds = (ownedChars: Set<string>): Compound[] =>
  getCompounds().filter((c) => [...c.word].every((ch) => ownedChars.has(ch)));

/**
 * 太刀 — the one weapon made from a single kanji.
 *
 * It exists for 0話: the first character a learner owns (一) is turned
 * straight into a blade, 一(いち)の 太刀(たち), so the promise "a character you
 * own becomes a weapon" is kept the moment it is made — before there are two
 * characters to combine.
 *
 * It sits below everything the real forge makes (★1, the floor of the lowest
 * band), so it never competes with a combination, let alone a real word.
 * The ordinary forge still takes two or three characters; `forgeWeapon`
 * refuses one.
 */
export const forgeSingleBlade = (k: KanjiData): Weapon => {
  const reading = primaryStem(k);
  const element = elementOf(k);
  return {
    id: k.id,
    word: k.char,
    name: `${k.char}(${reading})の 太刀(たち)`,
    plainName: `${k.char}の太刀`,
    compound: null,
    weaponClass: WeaponClass.SWORD,
    element,
    rarity: 1,
    attack: ATTACK_BAND[1].floor,
    weight: k.strokes,
    icon: 'GiKatana',
    blurb: `字(じ) 1(ひと)つで 作(つく)った、はじめの 太刀(たち)。字(じ)を 2(ふた)つ あわせると、もっと 強(つよ)い 武器(ぶき)に なる。`,
    stage: stageOfKanji(k.char),
  };
};

/** The weapon a saved recipe makes — one character or several. */
export const weaponOf = (kanji: KanjiData[]): Weapon | null =>
  kanji.length === 1 ? forgeSingleBlade(kanji[0]) : forgeWeapon(kanji);
