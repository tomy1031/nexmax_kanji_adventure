/**
 * プロローグ — before the kana forest and the town (08 §10.2).
 *
 * 2026-09-27「はじまりが 唐突。いきなり 森に いたり ビルに いたり。最初 英語で
 * 説明が できるので、没入できる 世界観と その ための 導入が 欲しい」.
 *
 * The learner cannot read Japanese yet, so the story is told in English, one
 * short line per picture. The pictures carry it: letters of light, the town
 * that runs on them, the shadow that eats them, the robot that falls.
 *
 * 2026-09-27「プロローグは 日本語も 表示」: each line also has its Japanese
 * (`ja`, furigana notation, every kanji read), shown above the English — the
 * learner hears what the world sounds like before they can read it.
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
  /** The same line in Japanese, furigana notation. */
  ja: string;
}

export const PROLOGUE: PrologueBeat[] = [
  {
    visual: 'letters',
    text: 'Far away, there is a land where letters are alive.',
    ja: 'とおい ところに、字(じ)が 生(い)きて いる 国(くに)が あります。',
  },
  {
    visual: 'letters',
    text: 'Each one holds a little light.',
    ja: 'ひとつ ひとつの 字(じ)に、小(ちい)さな 光(ひかり)が あります。',
  },
  {
    visual: 'town',
    text: 'In the town on the hill, people live by that light — station signs, clocks, the names on their doors.',
    ja: '丘(おか)の 上(うえ)の 町(まち)は、その 光(ひかり)で 動(うご)いて います。駅(えき)の 看板(かんばん)、時計(とけい)、ドアの 名前(なまえ)。',
  },
  {
    visual: 'town',
    text: 'Even the words they say to each other are made of it.',
    ja: '人(ひと)が 話(はな)す 言葉(ことば)も、光(ひかり)で できて います。',
  },
  {
    visual: 'wake',
    text: 'Then, one night, something woke up in the dark.',
    ja: 'ある 夜(よる)、やみの 中(なか)で、なにかが 目(め)を さましました。',
  },
  {
    visual: 'eaten',
    text: 'A shadow that eats letters. People call it the Mojikui — the Letter-Eater.',
    ja: '字(じ)を 食(た)べる 影(かげ)。みんなは「モジクイ」と よびます。',
  },
  {
    visual: 'eaten',
    text: 'It ate the signs. It ate the names. It ate the words right out of people’s mouths.',
    ja: '看板(かんばん)を 食(た)べ、名前(なまえ)を 食(た)べ、人(ひと)の 口(くち)から 言葉(ことば)まで 食(た)べました。',
  },
  {
    visual: 'guard',
    text: 'One small robot stood in its way — Nexmax, keeper of the letters.',
    ja: '小(ちい)さな ロボットが 前(まえ)に 立(た)ちました。字(じ)を 守(まも)る ネクマックスです。',
  },
  {
    visual: 'fall',
    text: 'The shadow swallowed his words, even his name, and threw him far away — down into the forest.',
    ja: '影(かげ)は ネクマックスの 言葉(ことば)と 名前(なまえ)を のみこみ、森(もり)へ 投(な)げました。',
  },
  {
    visual: 'write',
    text: 'You are a traveler. You cannot read a single letter here.',
    ja: 'きみは 旅人(たびびと)。ここの 字(じ)は、ひとつも 読(よ)めない。',
  },
  {
    visual: 'write',
    text: 'But you have what the shadow fears most: a hand that writes. Write a letter, and it comes back to life.',
    ja: 'でも きみには、影(かげ)が いちばん こわい ものが ある。書(か)く 手(て)だ。字(じ)を 書(か)けば、字(じ)は 生(い)き返(かえ)る。',
  },
];

/** The question at the end, and its two answers (furigana notation). */
export const PROLOGUE_ASK = {
  ja: 'ひらがなと カタカナが 読(よ)めますか？',
  en: 'Can you read hiragana and katakana?',
  kana: { ja: 'まだ 読(よ)めない → かなの 森(もり)へ', en: 'Not yet — start in the Kana Forest' },
  town: { ja: '読(よ)める → 町(まち)へ（1章(しょう)）', en: 'Yes — go to the town (Chapter 1)' },
};

/** Where the prologue leads: the kana forest for beginners, the town for those who read kana. */
export const PROLOGUE_EXITS = {
  kana: '/kana/kana-1',
  town: '/moji/moji-1-1',
} as const;
