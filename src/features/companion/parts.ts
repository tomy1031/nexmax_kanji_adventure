import { useGameStore } from '../../store/gameStore';
import { getIndividual, type Individual } from '../../data/individuals';
import { classRuby } from '../../lib/forge/weapon';
import { ELEMENT_LABEL, type Element } from '../../lib/forge/elements';

/** The companion screens' shared bits (CompanionSheet, CompanionChip, CompanionPick). */

/** ★3 silver, ★4 gold, ★5 pink: the frame of the card. */
export const RARITY_FRAME: Record<number, string> = { 3: '#9fb0c8', 4: '#e8a317', 5: '#d0567a' };

export const classLine = (ind: Individual) => `${classRuby(ind.favours)} ＋${ind.bonus}%`;

/** Halves the opponent's strike when it is of the element this companion resists (lib/battle.ts counterDamage). */
export const resistsLine = (el: Element) => `${ELEMENT_LABEL[el].ja}(${ELEMENT_LABEL[el].reading})の こうげき 半分(はんぶん)`;

/** The companions owned, the one along first, then ★5 → ★3, then by the order they came. */
export const useOwnedCompanions = (): Individual[] => {
  const owned = useGameStore((s) => s.individuals);
  const activeId = useGameStore((s) => s.activeIndividual);
  return owned
    .map((id, i) => ({ c: getIndividual(id), i }))
    .filter((x): x is { c: Individual; i: number } => x.c != null)
    .sort((a, b) => Number(b.c.id === activeId) - Number(a.c.id === activeId) || b.c.rarity - a.c.rarity || a.i - b.i)
    .map((x) => x.c);
};

