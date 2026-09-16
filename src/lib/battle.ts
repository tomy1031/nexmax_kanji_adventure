import type { Weapon } from './forge/weapon';
import { effectiveness, Element } from './forge/elements';
import type { Individual } from '../data/individuals';

/**
 * Battle maths.
 *
 * The rule the whole game rests on: **damage comes from writing the character
 * correctly**, not from a stat check. The weapon sets the ceiling; the
 * learner's hand decides how much of that ceiling they reach. A player who
 * grinds gems but cannot write will stall, which is the correct outcome for a
 * study game.
 */

/** Damage multiplier by how clean the rep was. */
export const accuracyMultiplier = (mistakes: number): number => {
  if (mistakes === 0) return 1.5; // 一発 — the reward for real mastery
  if (mistakes === 1) return 1.0;
  if (mistakes === 2) return 0.6;
  return 0.25;
};

export interface DamageInput {
  weapon: Weapon | null;
  individual: Individual | null;
  defenderElement: Element;
  mistakes: number;
  /** 0..1 from srs.rustLevel — a weapon made of forgotten kanji hits softer. */
  rust?: number;
}

export interface DamageResult {
  damage: number;
  /** 2 = strong, 0.5 = weak, 1 = neither. */
  elementMultiplier: number;
  accuracyMultiplier: number;
  /** True when the individual's favoured weapon class is equipped. */
  favoured: boolean;
  perfect: boolean;
}

/** Bare hands, when nothing is forged yet. Deliberately weak but never zero. */
const UNARMED_ATTACK = 5;

export const computeDamage = ({
  weapon,
  individual,
  defenderElement,
  mistakes,
  rust = 0,
}: DamageInput): DamageResult => {
  const base = weapon?.attack ?? UNARMED_ATTACK;
  const attackElement = weapon?.element ?? Element.MU;

  const elementMultiplier = effectiveness(attackElement, defenderElement);
  const accuracy = accuracyMultiplier(mistakes);

  const favoured = Boolean(weapon && individual && individual.favours === weapon.weaponClass);
  const individualMultiplier = favoured ? 1 + individual!.bonus / 100 : 1;

  // Rust takes at most a third off — enough to notice and go review, not
  // enough to make a neglected save unplayable.
  const rustMultiplier = 1 - Math.min(1, Math.max(0, rust)) * 0.33;

  const damage = Math.max(
    1,
    Math.round(base * elementMultiplier * accuracy * individualMultiplier * rustMultiplier),
  );

  return {
    damage,
    elementMultiplier,
    accuracyMultiplier: accuracy,
    favoured,
    perfect: mistakes === 0,
  };
};

/**
 * What the opponent hits back for. Only a failed write lets it through, so a
 * learner who writes well never takes damage at all.
 */
export const counterDamage = (
  bossAttack: number,
  individual: Individual | null,
  attackElement: Element,
): number => {
  const resisted = individual?.resists === attackElement;
  return Math.max(1, Math.round(bossAttack * (resisted ? 0.5 : 1)));
};

/** A write counts as failed — and lets the opponent counter — at three slips. */
export const isFailedWrite = (mistakes: number): boolean => mistakes >= 3;

/** Player HP. Flat for now; individuals differ by role, not by bulk. */
export const PLAYER_MAX_HP = 100;

/** Stars for the clear: 3 for a flawless run, 1 for scraping through. */
export const starsFor = (totalMistakes: number, hpLeft: number): 1 | 2 | 3 => {
  if (totalMistakes === 0 && hpLeft === PLAYER_MAX_HP) return 3;
  if (totalMistakes <= 3) return 2;
  return 1;
};
