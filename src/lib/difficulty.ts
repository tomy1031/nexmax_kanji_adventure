import type { KanjiData } from '../types/kanji';
import type { Element } from './forge/elements';
import { type Weapon } from './forge/weapon';
import { weaponFromRecipe } from './forge/recipe';
import { getIndividual, type Individual } from '../data/individuals';
import { getGear } from '../data/equipment';
import { episodesOf, type MojiBoss, type MojiEpisode } from '../data/mojiEpisodes';
import { finaleOrder, type MojiFinale } from '../data/mojiFinale';
import { getKanjiByChar } from './kanjiDb';
import { basePatience, computeDamage, statsFromGear, type PlayerStats } from './battle';
import { MASTERY_REPS, masteryMultiplier, starsOf } from './mastery';
import { applyLevel, levelOf, ownedCount } from './level';
import { WRITES_PER_READ } from './readTurn';

/**
 * 難易度 (docs/design/09 §4): an episode's fight in Normal — the story's,
 * as it is — or, once the episode is cleared, in Hard.
 *
 * Hard answers 「武器 その他 そろえると 敵が 格段に 弱く なる」: its opponent is
 * sized to the player as they stand, so a better weapon, a higher level or
 * more ★ never make it a walkover. Its HP is a number of clean writes of
 * the kanji it will ask for, with today's weapon and stars; its strike
 * takes a third of today's HP, whatever the shield and the なかま. It
 * tolerates one slip fewer, asks for the chapter's earlier kanji too, and
 * throws a kanji to read after every write. New-route episodes only.
 */

export type Difficulty = 'normal' | 'hard';

/** Clean writes per kanji asked, at today's strength. */
export const HARD_WRITES_PER_KANJI = 2.5;
/** Hard is never softer than this much of the story's HP. */
export const HARD_MIN_HP_FACTOR = 1.5;
/** Strikes a full-HP Nexmax survives, less one: the third one ends it. */
export const HARD_STRIKES_TO_LOSE = 3;
export const HARD_PATIENCE_DROP = 1;
export const HARD_MIN_PATIENCE = 2;
/** Write, read, write, read… */
export const HARD_WRITES_PER_READ = 1;

/** What a fight reads off the save to know how strong Nexmax is. */
export interface LoadoutSave {
  weapons: readonly { id: string; kanjiIds: readonly string[] }[];
  equippedWeapon: string | null;
  activeIndividual: string | null;
  equippedGear: Readonly<Record<string, string | null>>;
  exp: number;
  progress: Readonly<Record<string, { reps?: number } | undefined>>;
}

export interface Loadout {
  weapon: Weapon | null;
  individual: Individual | null;
  /** Worn gear and the level, as BattleScene adds them up on the new route. */
  stats: PlayerStats;
}

/** Nexmax as the next new-route fight will field him (BattleScene's weapon, なかま and stats). */
export const loadoutFromSave = (save: LoadoutSave): Loadout => {
  const recipe = save.weapons.find((w) => w.id === save.equippedWeapon);
  // The same recipe → weapon as the fight (強化 included): Hard keeps up with it.
  const weapon = recipe ? weaponFromRecipe(recipe) : null;
  const individual = save.activeIndividual ? (getIndividual(save.activeIndividual) ?? null) : null;
  const gear = statsFromGear(
    Object.values(save.equippedGear)
      .map((id) => getGear(id))
      .filter((g) => g != null),
  );
  return { weapon, individual, stats: applyLevel(gear, levelOf(save.exp, ownedCount(save.progress))) };
};

/**
 * One clean write of a kanji with `reps` writes, at full strength: no slip,
 * no rust, no COMBO (rust is the reason to review, COMBO the reward for a
 * clean run — Hard leaves both to the player).
 */
export const cleanHit = (loadout: Loadout, defender: Element, reps: number): number =>
  computeDamage({
    weapon: loadout.weapon,
    individual: loadout.individual,
    defenderElement: defender,
    mistakes: 0,
    attackPct: loadout.stats.attackPct,
    mastery: masteryMultiplier(starsOf(reps), true),
  }).damage;

/** The `n` least-written kanji, as the opponent picks them (pickWeakest: reps up to ★3, then pool order). */
export const weakestN = <K extends { id: string }>(pool: readonly K[], repsOf: (id: string) => number, n: number): K[] =>
  pool
    .map((k, i) => ({ k, i, r: Math.min(repsOf(k.id), MASTERY_REPS[2]) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .slice(0, n)
    .map((x) => x.k);

/** HP: a few clean writes of each kanji it asks for, and never under half again the story's. */
export const hardBossHp = (normalHp: number, hits: readonly number[]): number =>
  Math.max(
    Math.ceil(normalHp * HARD_MIN_HP_FACTOR),
    Math.round(HARD_WRITES_PER_KANJI * hits.reduce((n, h) => n + h, 0)),
  );

/**
 * Attack: set so a strike — after the なかま's resistance and the shield —
 * takes a third of today's HP, and never under the story's attack.
 */
export const hardBossAttack = (normalAttack: number, loadout: Loadout, element: Element): number => {
  const strike = Math.max(normalAttack, Math.ceil(loadout.stats.maxHp / HARD_STRIKES_TO_LOSE));
  const resisted = loadout.individual?.resists === element;
  return Math.ceil((strike + loadout.stats.defense) / (resisted ? 0.5 : 1));
};

/** One slip fewer, before charms and the level. */
export const hardPatience = (normal: number): number => Math.max(HARD_MIN_PATIENCE, normal - HARD_PATIENCE_DROP);

export const writesPerReadFor = (d: Difficulty): number => (d === 'hard' ? HARD_WRITES_PER_READ : WRITES_PER_READ);

/** Hard's kanji: the episode's first, then the chapter's earlier episodes' (a review). */
export const hardPool = (ep: MojiEpisode): KanjiData[] =>
  [ep, ...episodesOf(ep.chapter).filter((e) => e.order < ep.order)]
    .flatMap((e) => e.kanji)
    .map((c) => getKanjiByChar(c))
    .filter((k) => k != null);

/** Hard opens with the episode's first clear. */
export const isHardOpen = (episodeId: string, cleared: readonly string[]): boolean => cleared.includes(episodeId);

export interface HardFight {
  boss: { hp: number; attack: number };
  patience: number;
  pool: KanjiData[];
  writesPerRead: number;
}

/** What a Hard fight is sized from: the story's boss and patience, how many kanji it asks for, and from which. */
export interface HardTarget {
  boss: Pick<MojiBoss, 'hp' | 'attack' | 'element'>;
  patience: number;
  asks: number;
  pool: KanjiData[];
}

/** A Hard fight, sized to the save. Read once as the fight starts — it moves as the player writes. */
export const hardFightFor = (t: HardTarget, save: LoadoutSave): HardFight => {
  const loadout = loadoutFromSave(save);
  const repsOf = (id: string) => save.progress[id]?.reps ?? 0;
  const asked = weakestN(t.pool, repsOf, t.asks);
  return {
    boss: {
      hp: hardBossHp(t.boss.hp, asked.map((k) => cleanHit(loadout, t.boss.element, repsOf(k.id)))),
      attack: hardBossAttack(t.boss.attack, loadout, t.boss.element),
    },
    patience: hardPatience(t.patience),
    pool: t.pool,
    writesPerRead: HARD_WRITES_PER_READ,
  };
};

/** An episode's Hard fight. */
export const hardFight = (ep: MojiEpisode, save: LoadoutSave): HardFight =>
  hardFightFor({ boss: ep.boss, patience: basePatience(ep.order), asks: ep.kanji.length, pool: hardPool(ep) }, save);

/** A まとめの ボス's Hard fight: the whole chapter, weakest first; HP sized to the weakest `asks`. */
export const hardFinaleFight = (f: MojiFinale, save: LoadoutSave, now?: number): HardFight =>
  hardFightFor({ boss: f.boss, patience: f.patience, asks: f.asks, pool: finaleOrder(f, save.progress, now) }, save);
