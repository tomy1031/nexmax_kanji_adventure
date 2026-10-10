import type { WearSlot } from '../../data/equipment';
import { forgedGearArt, gearFromId, isCape } from '../../lib/forge/gear';

/** そうびの 絵 (scripts/art/manifest.mjs, gear) and where it sits on a Nexmax picture (GearOn.tsx). */

/** A table item has its own picture; a forged piece the one for its slot and element (lib/forge/gear.ts). */
export const gearArt = (id: string) => {
  const forged = gearFromId(id);
  return forged ? forgedGearArt(forged.slot, forged.element) : `img/gear/${id}.webp`;
};

/** A forged piece at ★5 glows gold where it is worn (GearOn) and listed. */
export const gearIsGold = (id: string | null | undefined): boolean => (id ? (gearFromId(id)?.rarity ?? 0) >= 5 : false);

export type Worn = Partial<Record<WearSlot, string | null>>;

/** A box on a Nexmax picture, as shares (0..1) of its frame; `rotate` in degrees. */
export interface GearBox {
  x: number;
  y: number;
  w: number;
  rotate?: number;
}

/**
 * Where each slot sits on a Nexmax picture. The armour comes in two shapes:
 * a harness whose wings stick out above his shoulders, and a cape that
 * streams out behind him. Both sit behind his picture, so each needs its own
 * box to be seen at all.
 */
export interface GearLayout {
  wings: GearBox;
  cape: GearBox;
  shield: GearBox;
  charm: GearBox;
  /** The second accessory (クラス ★4), on the other side of his head. */
  charm2: GearBox;
}

/** The armour pieces drawn as a cape; the others are winged harnesses. */
const CAPES = new Set(['body-tsukiyo']);

export const bodyBox = (layout: GearLayout, id: string) => {
  const forged = gearFromId(id);
  return (forged ? isCape(forged.slot, forged.element) : CAPES.has(id)) ? layout.cape : layout.wings;
};

/** The battle's Nexmax with the brush (img/battle/nexmax_brush.webp). */
export const LAYOUT_BATTLE: GearLayout = {
  wings: { x: 0, y: 0.3, w: 1 },
  cape: { x: -0.2, y: 0.3, w: 0.9, rotate: 26 },
  shield: { x: -0.06, y: 0.56, w: 0.42, rotate: -8 },
  charm: { x: 0.7, y: 0.2, w: 0.24 },
  charm2: { x: 0.84, y: 0.45, w: 0.2 },
};

/** もちもの's travelling Nexmax (img/stageselect/nexmax_travel.webp), walking to the right. */
export const LAYOUT_TRAVEL: GearLayout = {
  wings: { x: -0.12, y: 0.14, w: 1.3 },
  cape: { x: -0.42, y: 0.12, w: 1.0, rotate: 28 },
  shield: { x: -0.12, y: 0.5, w: 0.48, rotate: -8 },
  charm: { x: 0.8, y: 0.0, w: 0.26 },
  charm2: { x: -0.1, y: -0.04, w: 0.24 },
};
