import { ALL_KANJI } from '../../data/kanji.generated';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { episodesOf, type MojiEpisode } from '../../data/mojiEpisodes';
import type { JlptLevel } from '../../types/kanji';
import { pickRound } from './round';

/**
 * ともだちとの へやの ルール (2026-10-15「対戦機能について、N5,N4,N3とステージごとの漢字で出題の絞り込みが
 * できるようにしてほしい。武器防具、レベル、ガチャキャラサポートありなしをチェックボックスで変更できるように。
 * これはルームを作る人が最初に決められます。ルームにはそれが表示されています」).
 *
 * The room's maker chooses them before the room opens; the host sends them
 * with its PROFILE and HANDSHAKE, so the friend sees them as soon as it joins
 * and both sides fight by the same numbers. A random match uses the defaults.
 *
 * What each switch brings stays small next to writing well (clean 1.5× against
 * two slips 0.8×, about 1.9×): the best of everything is about 1.67× (rules.test).
 */

export const LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3'];

export interface RoomRules {
  /** The JLPT levels asked (at least one). */
  levels: JlptLevel[];
  /** The episodes whose kanji are asked (moji-1-1 …); null = every kanji of those levels. */
  stages: string[] | null;
  /** 武器・防具: the weapon's hit, the shield's guard, the armour's HP. */
  gear: boolean;
  /** ネクマックスの レベル: its HP. */
  level: boolean;
  /** なかま（ガチャの キャラ）: who stands for each side, and its わざ. */
  companion: boolean;
}

export const DEFAULT_RULES: RoomRules = { levels: [...LEVELS], stages: null, gear: true, level: false, companion: true };

/** The episodes a room can ask from: every written one, by chapter. */
export const STAGE_CHAPTERS: { id: string; order: number; title: string; episodes: MojiEpisode[] }[] = MOJI_CHAPTERS.map((c) => ({
  id: c.id,
  order: c.order,
  title: c.title,
  episodes: episodesOf(c.id),
})).filter((c) => c.episodes.length > 0);

const EPISODE_IDS = new Set(STAGE_CHAPTERS.flatMap((c) => c.episodes.map((e) => e.id)));
const KANJI_OF_EPISODE = new Map(STAGE_CHAPTERS.flatMap((c) => c.episodes.map((e) => [e.id, e.kanji] as const)));
const LEVEL_OF_CHAR = new Map(ALL_KANJI.map((k) => [k.char, k.level] as const));

/**
 * Every kanji, in the order a learner meets them: the town's episodes first
 * (book order), then the rest by level. A round fills up from here once the
 * kanji both players have are used.
 */
const BOOK_ORDER: string[] = (() => {
  const route = STAGE_CHAPTERS.flatMap((c) => c.episodes.flatMap((e) => e.kanji));
  const seen = new Set(route);
  const rest = LEVELS.flatMap((l) => ALL_KANJI.filter((k) => k.level === l && !seen.has(k.char)).map((k) => k.char));
  return [...new Set([...route, ...rest])];
})();

/** Rules read off the wire: anything missing or broken falls back to the default. */
export const cleanRules = (raw: unknown): RoomRules => {
  if (!raw || typeof raw !== 'object') return DEFAULT_RULES;
  const r = raw as Partial<RoomRules>;
  const levels = Array.isArray(r.levels) ? LEVELS.filter((l) => r.levels!.includes(l)) : [...LEVELS];
  const stages = Array.isArray(r.stages) ? r.stages.filter((s) => typeof s === 'string' && EPISODE_IDS.has(s)) : null;
  return {
    levels: levels.length ? levels : [...LEVELS],
    stages: stages && stages.length ? stages : null,
    gear: r.gear !== false,
    level: r.level === true,
    companion: r.companion !== false,
  };
};

/** The kanji a room asks, in book order. */
export const rulesPool = (rules: RoomRules): string[] => {
  const levels = new Set(rules.levels);
  const inStages = rules.stages ? new Set(rules.stages.flatMap((s) => KANJI_OF_EPISODE.get(s) ?? [])) : null;
  return BOOK_ORDER.filter((c) => levels.has(LEVEL_OF_CHAR.get(c) ?? 'N3') && (!inStages || inStages.has(c)));
};

/**
 * The round of a match: from the room's range, the kanji both have first
 * (round.ts), then the range in book order — 1章 first, as before rules.
 */
export const roundFor = (rules: RoomRules, mine: readonly string[], theirs: readonly string[], rnd: () => number = Math.random): string[] => {
  const pool = rulesPool(rules);
  const inPool = new Set(pool);
  return pickRound(
    mine.filter((c) => inPool.has(c)),
    theirs.filter((c) => inPool.has(c)),
    pool,
    undefined,
    rnd,
  );
};

// --- power ------------------------------------------------------------------

/** The weapon's pull on a hit: at most +20%. */
export const MAX_WEAPON_BONUS = 0.2;
/** The shield's guard: at most 10% off each hit taken. */
export const MAX_GUARD = 0.1;
/** The armour's HP: at most +10. */
export const MAX_GEAR_HP = 10;
/** The level's HP: +1 a level after the first, at most +15. */
export const MAX_LEVEL_HP = 15;

/** One side's own numbers, before the room's rules say which count (sent with its PROFILE). */
export interface VersusPower {
  /** 1.0 bare-handed … 1.2. */
  weapon: number;
  /** 0 … 0.1 off each hit taken. */
  guard: number;
  /** 0 … +10 HP from the armour. */
  gearHp: number;
  /** 0 … +15 HP from the level. */
  levelHp: number;
}

export const NO_POWER: VersusPower = { weapon: 1, guard: 0, gearHp: 0, levelHp: 0 };

/**
 * A side's power from its save: the weapon's attack (96 = the best), the worn
 * shield's ぼうぎょ and armour's HP (lib/battle statsFromGear, over the bare
 * 100), and the level.
 */
export const powerFrom = ({ weaponAttack, defense, gearHp, level }: { weaponAttack: number | null; defense: number; gearHp: number; level: number }): VersusPower => ({
  weapon: weaponAttack == null ? 1 : 1 + Math.min(MAX_WEAPON_BONUS, Math.max(0, (weaponAttack / 96) * MAX_WEAPON_BONUS)),
  guard: Math.min(MAX_GUARD, Math.max(0, defense) * 0.01),
  gearHp: Math.min(MAX_GEAR_HP, Math.max(0, Math.round(gearHp / 4))),
  levelHp: Math.min(MAX_LEVEL_HP, Math.max(0, level - 1)),
});

/** A power off the wire: clamped, so a broken or changed client cannot send more than the rules allow. */
export const cleanPower = (raw: unknown): VersusPower => {
  if (!raw || typeof raw !== 'object') return NO_POWER;
  const p = raw as Partial<VersusPower>;
  const n = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  return {
    weapon: n(p.weapon, 1, 1 + MAX_WEAPON_BONUS, 1),
    guard: n(p.guard, 0, MAX_GUARD, 0),
    gearHp: Math.round(n(p.gearHp, 0, MAX_GEAR_HP, 0)),
    levelHp: Math.round(n(p.levelHp, 0, MAX_LEVEL_HP, 0)),
  };
};

/** What counts in this room: the hit, the guard and the HP of one side. */
export const appliedPower = (power: VersusPower, rules: RoomRules, baseHp: number): { weapon: number; guard: number; maxHp: number } => ({
  weapon: rules.gear ? power.weapon : 1,
  guard: rules.gear ? power.guard : 0,
  maxHp: baseHp + (rules.gear ? power.gearHp : 0) + (rules.level ? power.levelHp : 0),
});

/** A hit after the other side's guard (never below 1). */
export const guarded = (damage: number, guard: number): number => Math.max(1, Math.round(damage * (1 - guard)));

// --- what the room shows ---------------------------------------------------------

/** The range in a few words, furigana notation: 「N5・N4 ／ 1章 2話ぶん」. */
export const rangeLabel = (rules: RoomRules): string => {
  const levels = rules.levels.length === LEVELS.length ? 'N5〜N3' : rules.levels.join('・');
  if (!rules.stages) return `${levels} ／ ぜんぶの ステージ`;
  const chosen = new Set(rules.stages);
  const parts = STAGE_CHAPTERS.flatMap((c) => {
    const eps = c.episodes.filter((e) => chosen.has(e.id));
    if (!eps.length) return [];
    if (eps.length === c.episodes.length) return [`${c.order}章(しょう)`];
    return [`${c.order}章(しょう) ${eps.map((e) => e.order).join('・')}話(わ)`];
  });
  return `${levels} ／ ${parts.join('、')}`;
};
