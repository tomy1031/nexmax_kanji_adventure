import { HIRAGANA, KATAKANA, KANA_EPISODES } from './kana';
import { KANA_WORDS, kanaToWrite, type KanaWord } from './kanaWords';

/**
 * 0章の たたかい (docs/design/22 §4, 2026-10-15「ひらがなの時も敵キャラクターを作って戦わせて」
 * 「ひらがな、カタカナのそれぞれボス戦も作って。対象はすべてのひらがな」).
 *
 * Every kana episode ends in a fight with one of the shadow's little ones,
 * and each script ends in a boss that holds all 46 of its kana. The fight is
 * 「きいて かく」: a word is said, the player writes its kana one by one, and the
 * finished word strikes. The opponent holds the kana it is about (字の ふういん,
 * lib/seals.ts): it asks them first and cannot fall before each is written.
 * Pure, so it is tested (kanaBattle.test.ts); the screen is KanaBattle.tsx.
 */

export type KanaScript = 'hiragana' | 'katakana';

export interface KanaFoe {
  /** Its name, in kana (0章 shows kana only). */
  name: string;
  img: string;
  hp: number;
  /** What its strike takes from Nexmax. */
  attack: number;
  /** Slips it lets pass before it strikes. */
  patience: number;
}

/** Nexmax in 0章: ★1 through the hiragana, ★2 through the katakana (docs/design/22 §2). */
export const KANA_HERO: Record<KanaScript, { star: 1 | 2; hp: number; img: string }> = {
  hiragana: { star: 1, hp: 60, img: 'img/battle/nexmax_star1_battle.webp' },
  katakana: { star: 2, hp: 80, img: 'img/battle/nexmax_star2_battle.webp' },
};

/** Damage of one kana: clean, one slip, two or more (or a look at the stroke order). */
export const KANA_HIT = 7;
const ACCURACY = [1.5, 1.1, 0.8] as const;
export const kanaDamage = (mistakes: number, hinted: boolean): number => KANA_HIT * (hinted ? ACCURACY[2] : ACCURACY[Math.min(2, Math.max(0, mistakes))]);

/** A finished word's blow: its kana's damage together, times the kana weapon (1 without one). */
export const wordDamage = (perKana: readonly { mistakes: number; hinted: boolean }[], weapon = 1): number =>
  Math.max(1, Math.round(perKana.reduce((n, k) => n + kanaDamage(k.mistakes, k.hinted), 0) * weapon));

const foe = (name: string, img: string, kanaCount: number, attack: number): KanaFoe => ({ name, img: `img/battle/${img}.webp`, hp: kanaCount * 13, attack, patience: 3 });
const kanaOf = (id: string) => KANA_EPISODES.find((e) => e.id === id)?.kana.length ?? 5;

/** The opponent of each kana episode (art: scripts/art/manifest.mjs, mojikui_kana_*). */
export const KANA_FOES: Record<string, KanaFoe> = {
  'kana-1': foe('ひこうきの かげ', 'mojikui_kana_plane', kanaOf('kana-1'), 12),
  'kana-2': foe('さくらの かげ', 'mojikui_kana_petal', kanaOf('kana-2'), 13),
  'kana-3': foe('いぬの かげ', 'mojikui_kana_puppy', kanaOf('kana-3'), 14),
  'kana-4': foe('くもの かげ', 'mojikui_kana_cloud', kanaOf('kana-4'), 15),
  'kana-5': foe('よぞらの かげ', 'mojikui_kana_bat', kanaOf('kana-5'), 15),
  'kana-6': foe('かいさつの かげ', 'mojikui_kana_gate', kanaOf('kana-6'), 16),
  'kana-7': foe('きっぷの かげ', 'mojikui_kana_moth', kanaOf('kana-7'), 17),
  'kana-8': foe('でんしゃの かげ', 'mojikui_kana_train', kanaOf('kana-8'), 18),
  'kana-9': foe('うみの かげ', 'mojikui_kana_gull', kanaOf('kana-9'), 18),
  'kana-10': foe('うずの かげ', 'mojikui_kana_swirl', kanaOf('kana-10'), 19),
};

export interface KanaBoss {
  /** "kana-boss-1": also the id recorded as cleared. */
  id: string;
  script: KanaScript;
  /** The episode it comes after (and opens with). */
  after: string;
  /** Title, kana only, and in English. */
  title: string;
  en: string;
  /** The scene it is fought in. */
  bg: string;
  foe: KanaFoe;
}

/** One boss a script, holding all 46 of its kana (docs/design/22 §4.2). */
export const KANA_BOSSES: KanaBoss[] = [
  {
    id: 'kana-boss-1',
    script: 'hiragana',
    after: 'kana-5',
    title: 'ほしを たべた かげ',
    en: 'The Shadow That Ate the Stars',
    bg: 'naniwa_runway_night',
    foe: { name: 'ほしを たべた おおかげ', img: 'img/battle/mojikui_kana_starboss.webp', hp: 46 * 10, attack: 12, patience: 3 },
  },
  {
    id: 'kana-boss-2',
    script: 'katakana',
    after: 'kana-10',
    title: 'さいごの しゃりょう',
    en: 'The Last Car',
    bg: 'naniwa_last_car',
    foe: { name: 'モジクイ', img: 'img/battle/mojikui_kana_slurp.webp', hp: 46 * 10, attack: 14, patience: 3 },
  },
];

export const getKanaBoss = (id: string): KanaBoss | undefined => KANA_BOSSES.find((b) => b.id === id);
export const kanaBossAfter = (episodeId: string): KanaBoss | undefined => KANA_BOSSES.find((b) => b.after === episodeId);
/** A boss opens once the episode it follows is cleared. */
export const isKanaBossOpen = (boss: KanaBoss, cleared: readonly string[]): boolean => cleared.includes(boss.after);

/** The script's kana in order, and its episodes'. */
export const scriptKana = (script: KanaScript): string[] => (script === 'hiragana' ? HIRAGANA : KATAKANA);
const scriptEpisodes = (script: KanaScript) => KANA_EPISODES.filter((e) => e.script === script);

// --- what is asked ----------------------------------------------------------------

export interface KanaFight {
  foe: KanaFoe;
  /** The words it can say. */
  words: KanaWord[];
  /** The kana it holds (seals), and how they are split into stages (a boss has three). */
  seals: string[];
  stages: string[][];
}

/** The words an episode's opponent can say: its own list, then any earlier ones of the same script that fit. */
export const episodeFight = (episodeId: string): KanaFight => {
  const ep = KANA_EPISODES.find((e) => e.id === episodeId)!;
  return { foe: KANA_FOES[episodeId], words: KANA_WORDS[episodeId] ?? [], seals: [...ep.kana], stages: [[...ep.kana]] };
};

/** A boss's fight: every word of its script, all 46 kana sealed, in three stages along the kana's order. */
export const bossFight = (boss: KanaBoss): KanaFight => {
  const kana = scriptKana(boss.script);
  const words = scriptEpisodes(boss.script).flatMap((e) => KANA_WORDS[e.id] ?? []);
  const third = Math.ceil(kana.length / 3);
  return { foe: boss.foe, words, seals: [...kana], stages: [kana.slice(0, third), kana.slice(third, third * 2), kana.slice(third * 2)] };
};

/** The stage a fight is in: the first whose seals are not all written yet (the last when all are). */
export const stageOf = (fight: KanaFight, opened: ReadonlySet<string>): number => {
  const i = fight.stages.findIndex((s) => s.some((k) => !opened.has(k)));
  return i < 0 ? fight.stages.length - 1 : i;
};

/**
 * The next word: the one that writes the most kana still sealed (the
 * current stage's first among equals, then by chance). With every seal open,
 * any word but the one just said.
 */
export const nextWord = (fight: KanaFight, opened: ReadonlySet<string>, last: KanaWord | null, rnd: () => number = Math.random): KanaWord => {
  const stage = new Set(fight.stages[stageOf(fight, opened)]);
  const fresh = (w: KanaWord, inStage: boolean) => new Set(kanaToWrite(w).filter((k) => fight.seals.includes(k) && !opened.has(k) && (!inStage || stage.has(k)))).size;
  const pool = fight.words.filter((w) => w !== last);
  const from = pool.length ? pool : fight.words;
  // The most sealed kana at once, so all 46 open in as few words as there can be; the stage breaks ties.
  const score = (w: KanaWord) => fresh(w, false) * 100 + fresh(w, true);
  const best = Math.max(...from.map(score));
  const top = from.filter((w) => score(w) === best);
  return top[Math.floor(rnd() * top.length)];
};

/** The words in the order nextWord would say them if every kana were written clean: how many it takes to open every seal. */
export const wordsToOpenAll = (fight: KanaFight, rnd: () => number = () => 0): KanaWord[] => {
  const opened = new Set<string>();
  const said: KanaWord[] = [];
  let last: KanaWord | null = null;
  while (fight.seals.some((k) => !opened.has(k)) && said.length < 200) {
    const word = nextWord(fight, opened, last, rnd);
    for (const k of kanaToWrite(word)) opened.add(k);
    said.push(word);
    last = word;
  }
  return said;
};
