import type { Rarity, SkillKind } from '../../lib/companionSkill';

/**
 * なかまの わざ in たいせん (docs/design/11 §7) — the same six as in a story
 * fight, made to fit a match between two players:
 *
 *   - What changes only this side's own writing works as it is: ちから (the
 *     next hit), コンボ (the run), おちつき (this side's slips), ヒント (a
 *     free look at the stroke order).
 *   - What would change this side's HP is a ward instead: いやし takes 15 off
 *     the other side's next hit, まもり the whole of it. The one who hits
 *     applies the ward and sends the damage as it landed, so the two screens
 *     always agree on both HPs, even when a わざ and a hit cross on the wire.
 *
 * The rarity counts, but only a little (★5 is 1.1× a ★3): a match is decided
 * by writing, not by the gacha.
 */

/** A ward that takes the whole hit. */
export const WARD_ALL = 999;

export interface VersusSkill {
  /** Taken off the other side's next hit on this side. */
  ward?: number;
  /** This side's next hit is multiplied by this. */
  power?: number;
  /** Slips that do not count — the ones already on the current character first, then the next ones (three are a self-hit). */
  slipsBack?: number;
  /** Characters whose stroke order may be looked at without the penalty. */
  freeLooks?: number;
  comboAdd?: number;
  /** Writes that may slip without ending the COMBO. */
  comboShield?: number;
}

const scale = (r: Rarity) => 1 + 0.05 * (r - 3);

export const versusSkill = (kind: SkillKind, rarity: Rarity = 3): VersusSkill => {
  switch (kind) {
    case 'heal':
      return { ward: Math.round(15 * scale(rarity)) };
    case 'guard':
      return { ward: WARD_ALL };
    case 'calm':
      return { slipsBack: 2 };
    case 'hint':
      return { freeLooks: 1 };
    case 'power':
      return { power: Math.round(1.4 * scale(rarity) * 100) / 100 };
    case 'combo':
      return { comboAdd: 2, comboShield: 2 };
  }
};

/** What it does, said on the field (furigana notation). */
export const versusSkillSays = (s: VersusSkill): string =>
  s.ward === WARD_ALL
    ? 'あいての つぎの こうげきを ふせぐ'
    : s.ward
      ? `あいての つぎの こうげきを ${s.ward} へらす`
      : s.power
        ? `つぎの こうげき ×${s.power}`
        : s.slipsBack
          ? `ミスを ${s.slipsBack}回(かい) なかった ことに する`
          : s.freeLooks
            ? '書(か)きじゅんを 見(み)ても こうげきが へらない'
            : `コンボ ＋${s.comboAdd}・${s.comboShield}字(じ) まちがえても 切(き)れない`;

/** A hit landing on a side with a ward: what is left, and what the ward took. */
export const throughWard = (damage: number, ward: number): { damage: number; warded: number } => {
  const warded = Math.min(damage, Math.max(0, ward));
  return { damage: damage - warded, warded };
};
