/**
 * プロローグ — before the kana forest and the town (08 §10.2).
 *
 * 2026-09-27「はじまりが 唐突。いきなり 森に いたり ビルに いたり。最初 英語で
 * 説明が できるので、没入できる 世界観と その ための 導入が 欲しい」.
 *
 * The learner cannot read Japanese yet, so the story is told in English, one
 * short line per picture. The pictures carry it: letters of light, the town
 * that runs on them, the shadow that eats them, the robot that falls. Japanese
 * appears only as the letters themselves (furigana notation).
 *
 * Each beat names what the stage shows (PrologueScreen draws it).
 */

export type PrologueVisual =
  /** Letters of light drifting up a night sky. */
  | 'letters'
  /** The town on the hill, its signs lit. */
  | 'town'
  /** The shadow opens its eyes; the letters are pulled into it. */
  | 'wake'
  /** The town's signs gone to holes, the shadow over it. */
  | 'eaten'
  /** Nexmax stands before the shadow. */
  | 'guard'
  /** Nexmax is flung away, a falling star. */
  | 'fall'
  /** A hand of light writes あ. */
  | 'write';

export interface PrologueBeat {
  visual: PrologueVisual;
  /** English narration. */
  text: string;
}

export const PROLOGUE: PrologueBeat[] = [
  { visual: 'letters', text: 'Far away, there is a land where letters are alive.' },
  { visual: 'letters', text: 'Each one holds a little light.' },
  { visual: 'town', text: 'In the town on the hill, people live by that light — station signs, clocks, the names on their doors.' },
  { visual: 'town', text: 'Even the words they say to each other are made of it.' },
  { visual: 'wake', text: 'Then, one night, something woke up in the dark.' },
  { visual: 'eaten', text: 'A shadow that eats letters. People call it the Mojikui — the Letter-Eater.' },
  { visual: 'eaten', text: 'It ate the signs. It ate the names. It ate the words right out of people’s mouths.' },
  { visual: 'guard', text: 'One small robot stood in its way — Nexmax, keeper of the letters.' },
  { visual: 'fall', text: 'The shadow swallowed his words, even his name, and threw him far away — down into the forest.' },
  { visual: 'write', text: 'You are a traveler. You cannot read a single letter here.' },
  { visual: 'write', text: 'But you have what the shadow fears most: a hand that writes. Write a letter, and it comes back to life.' },
];

/** Where the prologue leads: the kana forest for beginners, the town for those who read kana. */
export const PROLOGUE_EXITS = {
  kana: '/kana/kana-1',
  town: '/moji/moji-1-1',
} as const;
