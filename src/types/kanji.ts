/** JLPT level — also the game's three arcs. */
export const JlptLevel = {
  N5: 'N5',
  N4: 'N4',
  N3: 'N3',
} as const;
export type JlptLevel = (typeof JlptLevel)[keyof typeof JlptLevel];

/** Story arc. One per JLPT level, and the game's visual theme key. */
export const Arc = {
  /** N5 — むかし編. Village, plague, the giant tree. Pastel picture-book. */
  MUKASHI: 'mukashi',
  /** N4 — 現代編. The internet, IT, a dream worth believing. */
  GENDAI: 'gendai',
  /** N3 — 未来編. Nexmax mass-produced as a household robot. */
  MIRAI: 'mirai',
} as const;
export type Arc = (typeof Arc)[keyof typeof Arc];

export const ARC_OF_LEVEL: Record<JlptLevel, Arc> = {
  N5: Arc.MUKASHI,
  N4: Arc.GENDAI,
  N3: Arc.MIRAI,
};

export const LEVEL_OF_ARC: Record<Arc, JlptLevel> = {
  [Arc.MUKASHI]: 'N5',
  [Arc.GENDAI]: 'N4',
  [Arc.MIRAI]: 'N3',
};

/** One kanji as the game knows it. Built from src/data/kanji_master.csv. */
export interface KanjiData {
  /** Stable id, e.g. "n5_fire_hi". */
  id: string;
  char: string;
  level: JlptLevel;
  /** On'yomi readings, katakana. */
  on: string[];
  /** Kun'yomi readings, hiragana; okurigana in parentheses. */
  kun: string[];
  /** English glosses. The learner's bridge language. */
  meanings: string[];
  /** Stroke count. Drives both drill length and weapon weight. */
  strokes: number;
  tags: string[];
  exampleSentence?: string;
  exampleReading?: string;
}

/** Per-kanji learning state. Persisted. */
export interface KanjiProgress {
  /** Completed writing reps. The kanji is owned (usable in the forge) at 10. */
  reps: number;
  /** Total mistaken strokes across all reps — feeds the review scheduler. */
  mistakes: number;
  /** Consecutive clean reps. */
  streak: number;
  /** Epoch ms of the next scheduled review. */
  nextReview: number;
  /** Current spacing interval in days. */
  intervalDays: number;
  /** Epoch ms the kanji was first obtained (reps hit the goal). */
  obtainedAt?: number;
}

/** Reps required to obtain a kanji for the forge. Fixed by the brief. */
export const REPS_TO_OBTAIN = 10;
