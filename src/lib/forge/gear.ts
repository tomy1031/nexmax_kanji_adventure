import type { KanjiData } from '../../types/kanji';
import type { Compound } from '../../types/forge';
import { Element, ELEMENT_LABEL } from './elements';
import { forgeCore, nameReading, type Rarity } from './weapon';
import { HIDDEN_BOOST, stageGrowth } from './stage';
import { getKanjiById } from '../kanjiDb';

/**
 * たて・からだの 合成 (docs/design/19 §2, 2026-10-08「合成対象は 武器だけで
 * なく、からだ、たても」).
 *
 * The same two or three kanji that make a weapon make a shield or a body
 * piece instead, by the same rules (forgeCore): a real word is ★3 and up and
 * grows with the route, a word that is not stays ★1–★2, a かくし word is ★5
 * and stronger still. Only the number differs — ぼうぎょ for a shield, HP for
 * a body piece — banded so that, at the episode its kanji come from, a ★5
 * shield takes about a third off that episode's strike and a ★3 one about a
 * sixth (gear.test.ts checks it against the episodes' own attack).
 *
 * The id carries the recipe — `shield:<kanji ids joined by +>` — so the save
 * keeps a forged piece in `gear` beside the table's (data/equipment.ts), and
 * getGear builds it again on read: a balance change re-tunes what is owned.
 */

export type ForgedSlot = 'shield' | 'body';

export interface ForgedPart {
  /** `shield:<ids>` / `body:<ids>`. */
  id: string;
  slot: ForgedSlot;
  kanjiIds: string[];
  /** The characters as written, e.g. "火山". */
  word: string;
  /** Furigana notation: 火山(かざん)の 盾(たて). */
  name: string;
  plainName: string;
  compound: Compound | null;
  element: Element;
  rarity: Rarity;
  /** ぼうぎょ (shield) or HP (body). */
  defense?: number;
  hp?: number;
  icon: string;
  blurb: string;
  stage: number;
  hidden: boolean;
}

interface Band {
  floor: number;
  span: number;
}

/** ぼうぎょ by ★, before the route's growth. Non-words (★1–★2) never grow. */
export const DEFENSE_BAND: Record<Rarity, Band> = {
  1: { floor: 1, span: 1 },
  2: { floor: 2, span: 1 },
  3: { floor: 4, span: 1.5 },
  4: { floor: 5.5, span: 2 },
  5: { floor: 7, span: 2.5 },
};

/** HP by ★, before the route's growth. */
export const HP_BAND: Record<Rarity, Band> = {
  1: { floor: 6, span: 4 },
  2: { floor: 10, span: 5 },
  3: { floor: 18, span: 7 },
  4: { floor: 24, span: 8 },
  5: { floor: 30, span: 10 },
};

/** Body pieces of these elements are capes, streaming out behind Nexmax; the rest are winged back units. */
const CAPE_ELEMENTS: ReadonlySet<Element> = new Set<Element>([Element.SUI, Element.AN]);

const SHIELD_ICON: Record<Element, string> = {
  KA: 'GiFireShield',
  SUI: 'GiShieldReflect',
  MOKU: 'GiCheckedShield',
  KIN: 'GiSpikedShield',
  DO: 'GiRoundShield',
  KOU: 'GiMagicShield',
  AN: 'GiShieldEchoes',
  MU: 'GiEnergyShield',
};

const BODY_ICON: Record<Element, string> = {
  KA: 'GiBreastplate',
  SUI: 'GiCape',
  MOKU: 'GiLeatherArmor',
  KIN: 'GiChestArmor',
  DO: 'GiLamellar',
  KOU: 'GiAngelWings',
  AN: 'GiCloak',
  MU: 'GiJetPack',
};

const PART_LABEL = (slot: ForgedSlot, element: Element): { ja: string; ruby: string } =>
  slot === 'shield'
    ? { ja: '盾', ruby: '盾(たて)' }
    : CAPE_ELEMENTS.has(element)
      ? { ja: 'マント', ruby: 'マント' }
      : { ja: 'よろい', ruby: 'よろい' };

export const forgedGearId = (slot: ForgedSlot, kanjiIds: readonly string[]): string => `${slot}:${kanjiIds.join('+')}`;

export const parseForgedGearId = (id: string): { slot: ForgedSlot; kanjiIds: string[] } | null => {
  const m = /^(shield|body):(.+)$/.exec(id);
  return m ? { slot: m[1] as ForgedSlot, kanjiIds: m[2].split('+') } : null;
};

/** Build the shield or body piece a recipe makes. Pure, like forgeWeapon. */
export const forgeGear = (slot: ForgedSlot, kanji: KanjiData[]): ForgedPart | null => {
  const core = forgeCore(kanji);
  if (!core) return null;
  const { compound, element, rarity, stage, hidden, heaviness, word } = core;
  const band = (slot === 'shield' ? DEFENSE_BAND : HP_BAND)[rarity];
  const raw = band.floor + heaviness * band.span;
  // A real word grows with the route, as a weapon does (stage.ts); a non-word stays in its band.
  const value = Math.max(1, Math.round(compound ? raw * stageGrowth(stage) * (hidden ? HIDDEN_BOOST : 1) : raw));
  const label = PART_LABEL(slot, element);
  const elementLabel = ELEMENT_LABEL[element];
  const reading = compound ? compound.reading : kanji.map(nameReading).join('');
  const kanjiIds = kanji.map((k) => k.id);
  return {
    id: forgedGearId(slot, kanjiIds),
    slot,
    kanjiIds,
    word,
    name: `${word}(${reading})の ${label.ruby}`,
    plainName: `${word}の${label.ja}`,
    compound,
    element,
    rarity,
    ...(slot === 'shield' ? { defense: value } : { hp: value }),
    icon: (slot === 'shield' ? SHIELD_ICON : BODY_ICON)[element],
    blurb: compound
      ? `${hidden ? 'かくし そうび！ ' : ''}「${compound.word}」は ${compound.gloss}。本当(ほんとう)に ある 言葉(ことば)。`
      : `${elementLabel.ja}(${elementLabel.reading})の ちから。組(く)み合(あ)わせても 言葉(ことば)には ならない。`,
    stage,
    hidden,
  };
};

/** The piece a saved id makes, or null when the id is not a forged one (or a kanji is gone). */
export const gearFromId = (id: string): ForgedPart | null => {
  const parsed = parseForgedGearId(id);
  if (!parsed) return null;
  const kanji = parsed.kanjiIds.map((k) => getKanjiById(k));
  if (kanji.some((k) => k == null)) return null;
  return forgeGear(parsed.slot, kanji as KanjiData[]);
};

/** Its picture: one per slot and element (scripts/art/manifest.mjs, forged gear). */
export const forgedGearArt = (slot: ForgedSlot, element: Element): string => `img/gear/forged/${slot}_${element.toLowerCase()}.webp`;

export const isCape = (slot: ForgedSlot, element: Element): boolean => slot === 'body' && CAPE_ELEMENTS.has(element);
