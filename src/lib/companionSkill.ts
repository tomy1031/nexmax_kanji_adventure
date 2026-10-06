import type { Difficulty } from './difficulty';

/**
 * なかまの わざ — what a companion does in a fight (docs/design/11 §3.2).
 *
 * Writing fills the gauge: a clean write +2, one slip +1. Full, the companion
 * glows and its わざ is one tap away. Every わざ helps the writer — heals,
 * blocks, calms the opponent, lets the stroke order be looked at for free,
 * powers up the next write, or keeps the COMBO alive — and none of them hurts
 * the opponent by itself: the damage still comes from writing.
 *
 * Hard fills slower (9, not 6): about two わざ a fight (agreed with the
 * other session, 2026-10-03). The opponent's numbers do not count わざ.
 */

export const SkillKind = {
  HEAL: 'heal',
  GUARD: 'guard',
  CALM: 'calm',
  HINT: 'hint',
  POWER: 'power',
  COMBO: 'combo',
} as const;
export type SkillKind = (typeof SkillKind)[keyof typeof SkillKind];

/** A card's rarity (§4.1). Today's companions are all ★3. */
export type Rarity = 3 | 4 | 5;

/** Each character's わざ, by personality (§3.2 table). Keyed by character: every card of it has the same. */
export const SKILL_OF: Record<string, SkillKind> = {
  ESFJ: SkillKind.HEAL,
  ISFJ: SkillKind.HEAL,
  INFJ: SkillKind.HEAL,
  ISTJ: SkillKind.GUARD,
  ISTP: SkillKind.GUARD,
  ESTJ: SkillKind.GUARD,
  INFP: SkillKind.CALM,
  INTP: SkillKind.CALM,
  ISFP: SkillKind.CALM,
  ENTJ: SkillKind.HINT,
  INTJ: SkillKind.HINT,
  ESTP: SkillKind.POWER,
  ESFP: SkillKind.POWER,
  ENTP: SkillKind.POWER,
  ENFP: SkillKind.COMBO,
  ENFJ: SkillKind.COMBO,
  // 町の なかま (data/individuals.ts TOWN)
  yamada: SkillKind.HEAL,
  doctor: SkillKind.HEAL,
  teacher: SkillKind.HINT,
  keeper: SkillKind.CALM,
  baker: SkillKind.POWER,
  rin: SkillKind.COMBO,
  // 2章（docs/design/13）
  sora: SkillKind.GUARD,
  usher: SkillKind.POWER,
  photographer: SkillKind.HINT,
  // 3章（docs/design/14）: あったかい ラーメンで げんきに。
  hana: SkillKind.HEAL,
};

/** What one use does. Only the fields of its kind are set. */
export interface SkillEffect {
  /** HP back. */
  heal?: number;
  /** The opponent's next strikes blocked. */
  guards?: number;
  /** Slips taken off the opponent's gauge (99: all of them). */
  calm?: number;
  /** Characters whose stroke order may be looked at without the half and the slip. */
  freeLooks?: number;
  /** The next write's damage is multiplied by this. */
  power?: number;
  /** Added to the COMBO at once. */
  comboAdd?: number;
  /** Writes after this one that may slip without ending the COMBO. */
  comboShield?: number;
}

/** Per きずな level (§4.2): the numbers grow 8%. Counts (blocks, looks) do not. */
export const BOND_STEP = 0.08;

export const skillEffect = (kind: SkillKind, rarity: Rarity = 3, bond = 0): SkillEffect => {
  const r = rarity - 3; // 0, 1, 2
  const grow = (n: number) => Math.round(n * (1 + BOND_STEP * bond));
  switch (kind) {
    case SkillKind.HEAL:
      return { heal: grow([25, 35, 50][r]) };
    case SkillKind.GUARD:
      return { guards: r === 2 ? 2 : 1 };
    case SkillKind.CALM:
      return { calm: [2, 3, 99][r] };
    case SkillKind.HINT:
      return { freeLooks: r === 2 ? 2 : 1 };
    case SkillKind.POWER:
      return { power: Math.round([1.5, 1.8, 2.2][r] * (1 + BOND_STEP * bond) * 100) / 100 };
    case SkillKind.COMBO:
      return { comboAdd: 2, comboShield: r === 2 ? 3 : 2 };
  }
};

/** Name, icon, colour, and what it does in a line (furigana notation). */
export const SKILL_INFO: Record<SkillKind, { name: string; icon: string; color: string; says: (e: SkillEffect) => string }> = {
  heal: { name: 'いやし', icon: '💚', color: '#5fd38a', says: (e) => `HPが ${e.heal} もどる` },
  guard: {
    name: 'まもり',
    icon: '🛡️',
    color: '#6ab0ff',
    says: (e) => (e.guards === 1 ? 'あいての つぎの こうげきを とめる' : `あいての こうげきを ${e.guards}回(かい) とめる`),
  },
  calm: {
    name: 'おちつき',
    icon: '🍃',
    color: '#8fd8c8',
    says: (e) => (e.calm! >= 99 ? 'ミスを ぜんぶ けす' : `ミスを ${e.calm}つ けす`),
  },
  hint: {
    name: 'ヒント',
    icon: '💡',
    color: '#ffd36a',
    says: (e) => `書(か)きじゅんを 見(み)ても こうげきが へらない（${e.freeLooks}字(じ)）`,
  },
  power: { name: 'ちから', icon: '💥', color: '#ff7a4a', says: (e) => `つぎの 字(じ)の こうげき ×${e.power}` },
  combo: {
    name: 'コンボ',
    icon: '🔥',
    color: '#ff6fa0',
    says: (e) => `＋${e.comboAdd}・${e.comboShield}字(じ) まちがえても コンボが 切(き)れない`,
  },
};

/** The gauge's size: 6 is three clean writes; Hard asks for half again. */
export const skillGaugeFull = (difficulty: Difficulty): number => (difficulty === 'hard' ? 9 : 6);

/** What one write adds to the gauge. Looking at the stroke order earns nothing. */
export const gaugeGain = (mistakes: number, hinted: boolean): number => (hinted ? 0 : mistakes === 0 ? 2 : mistakes === 1 ? 1 : 0);
