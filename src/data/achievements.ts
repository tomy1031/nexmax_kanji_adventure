import type { GameState } from '../store/gameStore';
import { TITLES, earnsTitle } from '../lib/forge/discovery';
import { stripRuby } from '../lib/ruby';
import { MASTERY_REPS } from '../lib/mastery';
import { levelOf, ownedCount } from '../lib/level';
import { gearFromId, parseForgedGearId } from '../lib/forge/gear';
import { KANA_REPS } from './kana';
import { GEAR } from './equipment';
import { CARDS } from './individuals';
import { HIDDEN_WEAPONS, isHiddenWeapon } from './hiddenWeapons';
import { ALL_KANJI } from './kanji.generated';

const CHAR_OF = new Map(ALL_KANJI.map((k) => [k.id, k.char]));

/**
 * 称号 (2026-10-08「称号は 一つの 方向から だけで なく、多種多様な 種類を。
 * 達成したら その都度 ジェムが 受け取れる ように。ステージクリアや 小クリア
 * など、達成時に ポップアップで」).
 *
 * Fifteen families, each a thing the player does — find words, master
 * kanji, write, clear episodes and towns, win on ★3 and Hard, forge, find
 * かくし words, make charms, meet なかま, come back day after day, level up,
 * win versus — and in each a ladder of titles, earned when the family's
 * count reaches it; its ◆ is taken once (gameStore.claimTitle), from the
 * popup that says it was earned (AchievementToast) or from 称号
 * (TitlesScreen). No title is a かくし word: the list shows before it is earned.
 *
 * Names a beginner can read (2026-10-08「称号名として 難しい 言葉の 配慮を」):
 * the kind of thing (ことば, 漢字, 旅, 作り, たいせん …) and a rank from one
 * short list every family shares — たまご (just started) → 好き → 名人
 * (very good at it) → 先生 → 王さま — or a loanword the learner knows
 * (ヒーロー, リーダー, チャンピオン, レジェンド). Their kanji are the route's
 * own, or 漢字・王・神 with their readings (achievements.test.ts).
 *
 * ことば's ladder lives with ことば図鑑 (lib/forge/discovery.ts TITLES).
 */

/** What a family's count is read from: the save. */
export type AchState = Pick<
  GameState,
  | 'foundWords'
  | 'progress'
  | 'kana'
  | 'clearedStages'
  | 'perfectStages'
  | 'hardStages'
  | 'weapons'
  | 'gear'
  | 'individuals'
  | 'streak'
  | 'exp'
  | 'versus'
  | 'writes'
>;

export interface Tier {
  at: number;
  /** The title as it reads, furigana taken out. */
  word: string;
  /** In furigana notation. */
  ruby: string;
  en: string;
  /** ◆ given once it is taken. */
  gems: number;
}

export interface Family {
  id: string;
  icon: string;
  /** What is counted, furigana notation: クリアした 話(わ). */
  label: string;
  /** Its unit, furigana notation: 語(ご), 話(わ), Lv. */
  unit: string;
  measure: (s: AchState) => number;
  tiers: readonly Tier[];
}

export interface Achievement extends Tier {
  /** `<family>-<at>`, kept in the save (titleRewards, titlesSeen). */
  id: string;
  family: Family;
}

const t = (at: number, ruby: string, en: string, gems: number): Tier => ({ at, word: ruby.replace(/\(([^)]*)\)/g, ''), ruby, en, gems });

/** The episodes of 文字が 消えた 町 (moji-1-3), and each chapter's まとめの ボス (moji-1-boss). */
const EPISODE = /^moji-\d+-\d+$/;
const TOWN = /^moji-\d+-boss$/;

/** Forged pieces made (shields and body pieces from 漢字やさん, lib/forge/gear.ts). */
const forgedParts = (gear: readonly string[]) => gear.filter((id) => parseForgedGearId(id) != null);

const CHARMS = new Set(GEAR.filter((g) => g.slot === 'charm').map((g) => g.id));

export const FAMILIES: readonly Family[] = [
  {
    id: 'words',
    icon: '📗',
    label: '見(み)つけた ことば',
    unit: '語(ご)',
    measure: (s) => Object.values(s.foundWords).filter(earnsTitle).length,
    tiers: TITLES.map((x) => ({ at: x.at, word: x.word, ruby: x.ruby, en: x.en, gems: x.gems })),
  },
  {
    id: 'masters',
    icon: '✍️',
    label: '漢字(かんじ)マスター（★3）',
    unit: '字(じ)',
    measure: (s) => Object.values(s.progress).filter((p) => (p?.reps ?? 0) >= MASTERY_REPS[2]).length,
    tiers: [
      t(5, '漢字(かんじ)の たまご', 'kanji beginner', 30),
      t(20, '漢字好(かんじず)き', 'kanji lover', 60),
      t(50, '漢字名人(かんじめいじん)', 'kanji expert', 120),
      t(100, '漢字(かんじ)の 先生(せんせい)', 'kanji teacher', 200),
      t(165, '漢字(かんじ)の 王(おう)さま', 'kanji king', 300),
    ],
  },
  {
    id: 'writes',
    icon: '🖌',
    label: '書(か)いた 回数(かいすう)',
    unit: '回(かい)',
    measure: (s) => s.writes,
    tiers: [
      t(100, '書(か)き好(ず)き', 'loves writing', 20),
      t(500, '書(か)き名人(めいじん)', 'writing expert', 50),
      t(1000, '書(か)きの 先生(せんせい)', 'writing teacher', 100),
      t(3000, '書(か)きの 王(おう)さま', 'king of writing', 200),
    ],
  },
  {
    id: 'kana',
    icon: 'あ',
    label: '書(か)いた かな',
    unit: '字(じ)',
    measure: (s) => Object.values(s.kana).filter((n) => n >= KANA_REPS).length,
    tiers: [
      t(10, 'かなの たまご', 'kana beginner', 20),
      t(46, 'かな名人(めいじん)', 'kana expert', 50),
      t(92, 'かなマスター', 'kana master', 100),
    ],
  },
  {
    id: 'episodes',
    icon: '🚩',
    label: 'クリアした 話(わ)',
    unit: '話(わ)',
    measure: (s) => s.clearedStages.filter((id) => EPISODE.test(id)).length,
    tiers: [
      t(1, 'はじめての 旅(たび)', 'first journey', 20),
      t(5, '旅(たび)好(ず)き', 'loves journeys', 50),
      t(15, '旅(たび)の 名人(めいじん)', 'journey expert', 100),
      t(30, '旅(たび)の 王(おう)さま', 'king of journeys', 200),
    ],
  },
  {
    id: 'towns',
    icon: '🏙',
    label: '取(と)り戻(もど)した 町(まち)',
    unit: '町(まち)',
    measure: (s) => s.clearedStages.filter((id) => TOWN.test(id)).length,
    tiers: [
      t(1, 'ナニワの ヒーロー', 'hero of Naniwa', 100),
      t(2, 'ミナトの ヒーロー', 'hero of Minato', 120),
      t(3, 'マンプクの ヒーロー', 'hero of Manpuku', 150),
      t(4, 'ミヤコの ヒーロー', 'hero of Miyako', 200),
      // 5章: the king's castle in the world without letters; the letters come back for everyone.
      t(5, '字(じ)の ヒーロー', 'hero of letters', 250),
    ],
  },
  {
    id: 'perfect',
    icon: '👑',
    label: 'かんぺきで クリア（★3）',
    unit: '回(かい)',
    measure: (s) => s.perfectStages.length,
    tiers: [
      t(1, 'かんぺきの たまご', 'perfect beginner', 30),
      t(5, 'かんぺき名人(めいじん)', 'perfect expert', 60),
      t(15, 'かんぺきの 先生(せんせい)', 'perfect teacher', 120),
      t(30, 'かんぺきの 王(おう)さま', 'king of perfect', 200),
    ],
  },
  {
    id: 'hard',
    icon: '👹',
    label: 'ハードで 勝(か)った',
    unit: '回(かい)',
    measure: (s) => s.hardStages.length,
    tiers: [
      t(1, 'ハードの たまご', 'hard-mode beginner', 50),
      t(5, 'ハード名人(めいじん)', 'hard-mode expert', 100),
      t(15, 'ハードの 王(おう)さま', 'king of hard mode', 200),
    ],
  },
  {
    id: 'forge',
    icon: '🔨',
    label: '作(つく)った 武器(ぶき)・そうび',
    unit: 'こ',
    measure: (s) => s.weapons.length + forgedParts(s.gear).length,
    tiers: [
      t(1, '作(つく)りの たまご', 'maker beginner', 20),
      t(10, '作(つく)り名人(めいじん)', 'making expert', 50),
      t(30, '作(つく)りの 先生(せんせい)', 'making teacher', 120),
      t(60, '作(つく)りの 王(おう)さま', 'king of making', 200),
    ],
  },
  {
    id: 'hidden',
    icon: '🔑',
    label: '見(み)つけた かくし言葉(ことば)',
    unit: 'こ',
    measure: (s) => hiddenFound(s),
    tiers: [
      t(1, 'たからさがしの たまご', 'treasure-hunt beginner', 50),
      t(5, 'たからさがし名人(めいじん)', 'treasure-hunt expert', 100),
      t(15, 'たからさがしの 先生(せんせい)', 'treasure-hunt teacher', 200),
      t(Object.keys(HIDDEN_WEAPONS).length, 'トレジャーハンター', 'treasure hunter', 300),
    ],
  },
  {
    id: 'charms',
    icon: '💍',
    label: '作(つく)った アクセサリ',
    unit: 'こ',
    measure: (s) => s.gear.filter((id) => CHARMS.has(id)).length,
    tiers: [
      t(3, 'おしゃれさん', 'fashionable', 30),
      t(10, 'コレクター', 'collector', 60),
      t(25, 'アクセサリ名人(めいじん)', 'accessory expert', 120),
      t(CHARMS.size, 'アクセサリの 王(おう)さま', 'accessory king', 200),
    ],
  },
  {
    id: 'companions',
    icon: '🤝',
    label: 'なかまの カード',
    unit: '枚(まい)',
    measure: (s) => s.individuals.length,
    tiers: [
      t(3, 'なかま好(ず)き', 'loves friends', 30),
      t(10, 'リーダー', 'leader', 60),
      t(25, 'キャプテン', 'captain', 120),
      t(CARDS.length, 'なかまの 王(おう)さま', 'king of friends', 250),
    ],
  },
  {
    id: 'streak',
    icon: '📅',
    label: 'つづけた 日(ひ)',
    unit: '日(にち)',
    measure: (s) => s.streak.count,
    tiers: [
      t(3, 'がんばりやさん', 'hard worker', 20),
      t(7, '毎日(まいにち)名人(めいじん)', 'every-day expert', 50),
      t(14, '毎日(まいにち)の 先生(せんせい)', 'every-day teacher', 100),
      t(30, '毎日(まいにち)の 王(おう)さま', 'king of every day', 150),
    ],
  },
  {
    id: 'level',
    icon: '⭐',
    label: 'ネクマックスの レベル',
    unit: 'Lv',
    measure: (s) => levelOf(s.exp, ownedCount(s.progress)),
    tiers: [
      t(10, 'ルーキー', 'rookie', 30),
      t(20, 'エース', 'ace', 60),
      t(35, 'ベテラン', 'veteran', 120),
      t(50, 'レジェンド', 'legend', 200),
    ],
  },
  {
    id: 'versus',
    icon: '⚔️',
    label: 'たいせんで 勝(か)った',
    unit: '回(かい)',
    measure: (s) => s.versus.wins,
    tiers: [
      t(1, 'たいせんの たまご', 'versus beginner', 30),
      t(10, 'たいせん名人(めいじん)', 'versus expert', 80),
      t(30, 'チャンピオン', 'champion', 150),
    ],
  },
];

/** かくし words made, as a weapon or as a shield or body piece — each word once. */
function hiddenFound(s: AchState): number {
  const found = new Set<string>();
  for (const w of s.weapons) {
    const word = w.kanjiIds.map((id) => CHAR_OF.get(id) ?? '').join('');
    if (isHiddenWeapon(word)) found.add(word);
  }
  for (const id of s.gear) {
    const p = gearFromId(id);
    if (p?.hidden) found.add(p.word);
  }
  return found.size;
}

/** Every title, family by family, ladder order. */
export const ACHIEVEMENTS: readonly Achievement[] = FAMILIES.flatMap((family) =>
  family.tiers.map((tier) => ({ ...tier, id: `${family.id}-${tier.at}`, family })),
);

const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export const getAchievement = (id: string): Achievement | undefined => byId.get(id);

/** Each family's count now. */
export const measures = (s: AchState): Map<string, number> => new Map(FAMILIES.map((f) => [f.id, f.measure(s)]));

/** The titles earned, by id. */
export const reachedIds = (s: AchState): string[] => {
  const m = measures(s);
  return ACHIEVEMENTS.filter((a) => (m.get(a.family.id) ?? 0) >= a.at).map((a) => a.id);
};

/**
 * ことば's titles as they were named, and kept in the save, for a day before
 * the families came and the names were made easy (2026-10-08): 見習い was
 * what is now ことばの たまご, and so on.
 */
const OLD_WORD_TITLE: Readonly<Record<number, string>> = Object.fromEntries(
  ([[10, '見習(みなら)い'], [30, '一人前(いちにんまえ)'], [55, '名人(めいじん)'], [80, '先生(せんせい)'], [105, '生(い)き字引(じびき)']] as const).map(([at, ruby]) => [at, stripRuby(ruby)]),
);

/** Whether a title's ◆ has been taken — by its id, or by ことば's old name. */
export const isTaken = (taken: readonly string[], a: Achievement): boolean =>
  taken.includes(a.id) || (a.family.id === 'words' && (taken.includes(a.word) || taken.includes(OLD_WORD_TITLE[a.at] ?? '')));

/** Earned and not yet taken. */
export const claimable = (s: AchState, taken: readonly string[]): Achievement[] => {
  const reached = new Set(reachedIds(s));
  return ACHIEVEMENTS.filter((a) => reached.has(a.id) && !isTaken(taken, a));
};
