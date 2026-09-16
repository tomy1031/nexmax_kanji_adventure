import type { KanjiData } from '../../types/kanji';
import type { Compound } from '../../types/forge';
import { getCompounds } from '../../data/compounds.generated';
import { Element, elementOf, ELEMENT_LABEL } from './elements';

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
  SHIELD: 'SHIELD',
} as const;
export type WeaponClass = (typeof WeaponClass)[keyof typeof WeaponClass];

export const CLASS_LABEL: Record<WeaponClass, { ja: string; reading: string }> = {
  SWORD: { ja: '剣', reading: 'けん' },
  AXE: { ja: '斧', reading: 'おの' },
  SPEAR: { ja: '槍', reading: 'やり' },
  BOW: { ja: '弓', reading: 'ゆみ' },
  STAFF: { ja: '杖', reading: 'つえ' },
  HAMMER: { ja: '槌', reading: 'つち' },
  DAGGER: { ja: '短刀', reading: 'たんとう' },
  SHIELD: { ja: '盾', reading: 'たて' },
};

/**
 * The first kanji decides the weapon's shape. Its element is the thing the
 * learner can see in the character, so the mapping stays guessable.
 */
const CLASS_OF_ELEMENT: Record<Element, WeaponClass> = {
  KA: WeaponClass.SWORD,
  SUI: WeaponClass.BOW,
  MOKU: WeaponClass.STAFF,
  KIN: WeaponClass.AXE,
  DO: WeaponClass.HAMMER,
  KOU: WeaponClass.SPEAR,
  AN: WeaponClass.DAGGER,
  MU: WeaponClass.SHIELD,
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
}

// ---------------------------------------------------------------------------
// Compound lookup
// ---------------------------------------------------------------------------

let compoundIndex: Map<string, Compound> | null = null;

const compoundFor = (word: string): Compound | null => {
  if (!compoundIndex) {
    compoundIndex = new Map(getCompounds().map((c) => [c.word, c]));
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
  SHIELD: [
    'GiVikingShield', 'GiTempleGate', 'GiRoundShield', 'GiEdgedShield', 'GiCheckedShield',
    'GiShieldBash', 'GiTribalShield', 'GiTemplarShield', 'GiStoneWall', 'GiSurroundedShield',
  ],
};

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

/** The reading a kanji lends to a made-up name: kun first, stripped of okurigana. */
const nameReading = (k: KanjiData): string => {
  const kun = k.kun[0]?.replace(/\(.*\)/, '');
  if (kun) return kun;
  return k.on[0] ?? '';
};

// ---------------------------------------------------------------------------
// The forge itself
// ---------------------------------------------------------------------------

/** Rarity from how good the recipe is. A real word is worth two whole tiers. */
const rarityFor = (compound: Compound | null, kanji: KanjiData[], seed: number): Rarity => {
  let score = 0;
  if (compound) score += 2;
  if (compound?.level === 'N3') score += 1;
  if (kanji.length >= 3) score += 1;
  // Heavier characters are rarer to obtain, so they carry a little weight.
  if (kanji.reduce((n, k) => n + k.strokes, 0) >= 24) score += 1;
  // A small deterministic wobble so two equally-good recipes are not identical.
  if (seed % 5 === 0) score += 1;

  return Math.min(5, Math.max(1, score + 1)) as Rarity;
};

/**
 * Build the weapon a recipe makes. Pure: same input, same output, no state.
 */
export const forgeWeapon = (kanji: KanjiData[]): Weapon | null => {
  if (kanji.length < 2 || kanji.length > 3) return null;

  const id = kanji.map((k) => k.id).join('+');
  const word = kanji.map((k) => k.char).join('');
  const seed = hash(id);

  const compound = compoundFor(word);
  const element = elementOf(kanji[0]);
  const weaponClass = CLASS_OF_ELEMENT[element];
  const rarity = rarityFor(compound, kanji, seed);

  // Stroke count is the weapon's mass: a 24-stroke character makes a heavier
  // thing than a 2-stroke one, which is both intuitive and true of the effort
  // it took to earn.
  const weight = kanji.reduce((n, k) => n + k.strokes, 0);
  const base = 6 + weight * 1.5;
  const rarityMult = 1 + (rarity - 1) * 0.28;
  const attack = Math.round(base * rarityMult);

  const pool = ICON_POOL[weaponClass];
  const icon = pool[seed % pool.length];

  const classLabel = CLASS_LABEL[weaponClass];
  const elementLabel = ELEMENT_LABEL[element];

  let name: string;
  let plainName: string;
  let blurb: string;

  if (compound) {
    // A real word. Say the word, its reading and its meaning — this is the
    // moment the vocabulary actually lands.
    plainName = `${compound.word}の${classLabel.ja}`;
    name = `${compound.word}(${compound.reading})の ${classLabel.ja}(${classLabel.reading})`;
    blurb = `「${compound.word}」は ${compound.gloss}。本当(ほんとう)に ある 言葉(ことば)。`;
  } else {
    // Not a word. Still a weapon — named by reading the characters aloud.
    const reading = kanji.map(nameReading).join('');
    plainName = `${word}の${classLabel.ja}`;
    name = `${word}(${reading})の ${classLabel.ja}(${classLabel.reading})`;
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
  };
};

/**
 * Every real word the learner could make right now from the kanji they own.
 * This is the forge's hint list — it never shows words they cannot build.
 */
export const discoverableCompounds = (ownedChars: Set<string>): Compound[] =>
  getCompounds().filter((c) => [...c.word].every((ch) => ownedChars.has(ch)));
