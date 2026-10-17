/**
 * ボスの 見せ場 (docs/design/24, 2026-10-17「ボス戦に関して、盛り上がるストーリーや演出を」):
 * what every boss has besides its fight, the same for the two 0章 bosses and
 * the five まとめの ボス.
 *
 *   1. 登場: a VS call — Nexmax and the boss slam in, its name and nature.
 *   2. とちゅうの お話: when its HP first falls to 2/3 and to 1/3 (0章: as its
 *      2nd and 3rd stage open), the fight stops for a line or two, and from the
 *      second its picture changes (phase 2).
 *   3. とどめの 一字: an ordinary blow never ends it. A blow that would leaves it
 *      a sliver and calls the finisher — a kanji (town) or a word (0章) that
 *      means something to its chapter — and writing that ends the fight.
 *
 * Pure: the screens (BattleScene, KanaBattle) ask these when HP moves.
 */

/** One line of a boss's mid-fight story. */
export interface BossLine {
  /** Who says it: a cast id ('nexmax', 'sora', the boss's id); none for 0章's narration. */
  speaker?: string;
  /** Furigana notation in the town; kana (and pictures) in 0章. */
  text: string;
  /** English behind EN (the town's lines). */
  en?: string;
  /** 0章's narration in Japanese, kana only. */
  ja?: string;
}

export interface BossShow {
  /** Its one-word nature on the VS call (a picture, kana, English); the town's bosses already have one (MojiBoss.trait). */
  trait?: { icon: string; ja: string; en: string };
  /** The lines at 2/3 and at 1/3 of its HP (0章: as its 2nd and 3rd stage open). */
  beats: [BossLine[], BossLine[]];
  /** Its picture from the second beat on, on the same canvas as the first. */
  phase2Img: string;
  /** The finisher: one kanji in furigana notation (town, 「友(とも)」) or one word in kana (0章). */
  finisher: string;
  /** For a 0章 finisher word: its picture and English, as the fight shows a word. */
  finisherWord?: { emoji: string; en: string };
  /** Nexmax's call as the finisher comes up. */
  finisherLine: BossLine;
}

/** The finisher's character(s), without the reading: 「友(とも)」 → 友. */
export const finisherChars = (finisher: string): string => finisher.replace(/\([^)]*\)/g, '');

/** Where the beats fall, as a share of the boss's HP. */
export const BEAT_AT = [2 / 3, 1 / 3] as const;

/**
 * The beats a blow has reached and that have not been shown, in order: HP
 * from `max` down to `after`, `shown` beats already played. A blow that
 * passes both brings both, one after the other.
 */
export const beatsReached = (max: number, after: number, shown: number): number[] =>
  BEAT_AT.map((_, i) => i).filter((i) => i >= shown && after <= max * BEAT_AT[i]);

/** 0章's beats go by stage: the 2nd stage opening is beat 0, the 3rd beat 1. */
export const beatsOfStages = (before: number, after: number, shown: number): number[] => {
  const out: number[] = [];
  for (let stage = Math.max(before + 1, 1); stage <= after; stage++) if (stage - 1 >= shown && stage - 1 < BEAT_AT.length) out.push(stage - 1);
  return out;
};

/** What is left of the boss while the finisher is called: never 0, about 3% of its HP. */
export const finisherSliver = (max: number): number => Math.max(1, Math.round(max * 0.03));

/**
 * A blow on a boss with a finisher: one that would end the fight before the
 * finisher has been written leaves the sliver instead, and calls it.
 */
export const holdForFinisher = (hpAfter: number, max: number, finisherDone: boolean): { hp: number; call: boolean } =>
  hpAfter > 0 || finisherDone ? { hp: hpAfter, call: false } : { hp: finisherSliver(max), call: true };
