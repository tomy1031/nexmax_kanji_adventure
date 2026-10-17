import { HIRAGANA, KATAKANA, KANA_EPISODES } from './kana';
import { KANA_WORDS, kanaToWrite, type KanaWord } from './kanaWords';
import { sealFloor, strikeSealed } from '../lib/seals';

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
  hiragana: { star: 1, hp: 80, img: 'img/battle/nexmax_star1_battle.webp' },
  katakana: { star: 2, hp: 100, img: 'img/battle/nexmax_star2_battle.webp' },
};

/**
 * A slipped finger is part of writing (2026-10-15「多少はミスタッチ前提でゲームバランスを作ることが大切」
 * 「何度かに一度は間違える」): one slip on a kana barely costs its blow, and the
 * first slip on each kana is not counted toward the opponent's strike (rageOf).
 * Damage of one kana: clean, one slip, two, three or more; a look at the stroke order counts as two.
 */
export const KANA_HIT = 7;
const ACCURACY = [1.5, 1.4, 1.0, 0.7] as const;
export const kanaDamage = (mistakes: number, hinted: boolean): number => KANA_HIT * (hinted ? ACCURACY[2] : ACCURACY[Math.min(3, Math.max(0, mistakes))]);
/** Slips on one kana that count toward the opponent's strike: all but the first. */
export const rageOf = (mistakes: number): number => Math.max(0, mistakes - 1);
/** A word written without a single slip mends Nexmax a little (6% of his HP). */
export const cleanWordHeal = (maxHp: number): number => Math.round(maxHp * 0.06);
/** Each stage of a boss that opens mends him a lot (40% of his HP) — a breath between the stages. */
export const STAGE_HEAL = 0.4;

/** A finished word's blow: its kana's damage together, times the kana weapon (1 without one). */
export const wordDamage = (perKana: readonly { mistakes: number; hinted: boolean }[], weapon = 1): number =>
  Math.max(1, Math.round(perKana.reduce((n, k) => n + kanaDamage(k.mistakes, k.hinted), 0) * weapon));

const foe = (name: string, img: string, kanaCount: number, attack: number): KanaFoe => ({ name, img: `img/battle/${img}.webp`, hp: kanaCount * 13, attack, patience: 4 });
const kanaOf = (id: string) => KANA_EPISODES.find((e) => e.id === id)?.kana.length ?? 5;

/** The opponent of each kana episode (art: scripts/art/manifest.mjs, mojikui_kana_*). */
export const KANA_FOES: Record<string, KanaFoe> = {
  'kana-1': foe('ひこうきの かげ', 'mojikui_kana_plane', kanaOf('kana-1'), 8),
  'kana-2': foe('さくらの かげ', 'mojikui_kana_petal', kanaOf('kana-2'), 9),
  'kana-3': foe('いぬの かげ', 'mojikui_kana_puppy', kanaOf('kana-3'), 10),
  'kana-4': foe('くもの かげ', 'mojikui_kana_cloud', kanaOf('kana-4'), 10),
  'kana-5': foe('よぞらの かげ', 'mojikui_kana_bat', kanaOf('kana-5'), 11),
  'kana-6': foe('かいさつの かげ', 'mojikui_kana_gate', kanaOf('kana-6'), 11),
  'kana-7': foe('きっぷの かげ', 'mojikui_kana_moth', kanaOf('kana-7'), 12),
  'kana-8': foe('でんしゃの かげ', 'mojikui_kana_train', kanaOf('kana-8'), 12),
  'kana-9': foe('うみの かげ', 'mojikui_kana_gull', kanaOf('kana-9'), 13),
  'kana-10': foe('うずの かげ', 'mojikui_kana_swirl', kanaOf('kana-10'), 13),
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
    foe: { name: 'ほしを たべた おおかげ', img: 'img/battle/mojikui_kana_starboss.webp', hp: 46 * 10, attack: 10, patience: 4 },
  },
  {
    id: 'kana-boss-2',
    script: 'katakana',
    after: 'kana-10',
    title: 'さいごの しゃりょう',
    en: 'The Last Car',
    bg: 'naniwa_last_car',
    foe: { name: 'モジクイ', img: 'img/battle/mojikui_kana_slurp.webp', hp: 46 * 10, attack: 12, patience: 4 },
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

/**
 * The stage a fight is in, by how many of its seals are open: a boss's 46 in
 * thirds (16・15・15), whichever kana they are — the words are chosen to open
 * as many as they can, not in the chart's order.
 */
export const stageOf = (fight: KanaFight, opened: ReadonlySet<string>): number => {
  const open = fight.seals.filter((k) => opened.has(k)).length;
  const per = Math.ceil(fight.seals.length / fight.stages.length);
  return Math.min(fight.stages.length - 1, Math.floor(open / per));
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

// --- a whole fight, for the balance tests -------------------------------------------

/** How many slips a hand makes on a kana (0, 1, 2 …). */
export type KanaHand = (kana: string, rnd: () => number) => number;

export interface KanaFightResult {
  won: boolean;
  /** How often the opponent struck, and the HP left. */
  strikes: number;
  hpLeft: number;
  words: number;
  kana: number;
}

/**
 * A fight played to its end with no continue, by the same rules as the screen
 * (KanaBattle.tsx): the words nextWord picks, a hand's slips on each kana, the
 * first slip on a kana free, a strike each `patience` counted slips, the seals'
 * floor, a clean word's mend and a stage's mend. What the balance tests run
 * (kanaBattle.test.ts) to say a player who slips now and then wins.
 */
export const playKanaFight = (fight: KanaFight, script: KanaScript, hand: KanaHand, rnd: () => number, weapon = 1): KanaFightResult => {
  const maxHp = KANA_HERO[script].hp;
  const { foe } = fight;
  let hp = maxHp;
  let foeHp = foe.hp;
  let rage = 0;
  let strikes = 0;
  let kanaWritten = 0;
  const opened = new Set<string>();
  let last: KanaWord | null = null;
  for (let words = 1; words <= 300; words++) {
    const word = nextWord(fight, opened, last, rnd);
    last = word;
    const stageBefore = stageOf(fight, opened);
    const per: { mistakes: number; hinted: boolean }[] = [];
    for (const k of kanaToWrite(word)) {
      const m = hand(k, rnd);
      for (let slip = 1; slip <= m; slip++) {
        if (slip < 2) continue;
        rage += 1;
        if (rage < foe.patience) continue;
        rage = 0;
        strikes += 1;
        hp -= foe.attack;
        if (hp <= 0) return { won: false, strikes, hpLeft: 0, words, kana: kanaWritten };
      }
      per.push({ mistakes: m, hinted: false });
      opened.add(k);
      kanaWritten += 1;
    }
    const floor = sealFloor(foe.hp, fight.seals.length, fight.seals.filter((s) => !opened.has(s)).length);
    foeHp = strikeSealed(foeHp, wordDamage(per, weapon), floor).hp;
    if (foeHp === 0) return { won: true, strikes, hpLeft: hp, words, kana: kanaWritten };
    if (per.every((p) => p.mistakes === 0)) hp = Math.min(maxHp, hp + cleanWordHeal(maxHp));
    if (stageOf(fight, opened) > stageBefore) hp = Math.min(maxHp, hp + Math.round(maxHp * STAGE_HEAL));
  }
  return { won: false, strikes, hpLeft: hp, words: 300, kana: kanaWritten };
};
