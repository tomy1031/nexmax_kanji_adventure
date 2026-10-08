import type { GameState } from '../store/gameStore';
import { TITLES, earnsTitle } from '../lib/forge/discovery';
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
 * win versus — and in each a ladder of titles. A title is a real word (with
 * its furigana), earned when the family's count reaches it; its ◆ is taken
 * once (gameStore.claimTitle), from the popup that says it was earned
 * (AchievementToast) or from 称号 (TitlesScreen). No title is a かくし word:
 * the list is shown before it is earned.
 *
 * ことば keeps the ladder ことば図鑑 always had (lib/forge/discovery.ts TITLES).
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
  /** The title, a real word. */
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
      t(5, '漢字(かんじ)好(ず)き', 'kanji lover', 30),
      t(20, '字(じ)の 職人(しょくにん)', 'letter craftsman', 60),
      t(50, '書道家(しょどうか)', 'calligrapher', 120),
      t(100, '字(じ)の 達人(たつじん)', 'letter virtuoso', 200),
      t(165, '漢字王(かんじおう)', 'kanji king', 300),
    ],
  },
  {
    id: 'writes',
    icon: '🖌',
    label: '書(か)いた 回数(かいすう)',
    unit: '回(かい)',
    measure: (s) => s.writes,
    tiers: [
      t(100, '練習生(れんしゅうせい)', 'trainee', 20),
      t(500, '書(か)き手(て)', 'writer', 50),
      t(1000, '筆(ふで)の 達人(たつじん)', 'master of the brush', 100),
      t(3000, '書聖(しょせい)', 'saint of writing', 200),
    ],
  },
  {
    id: 'kana',
    icon: 'あ',
    label: '書(か)いた かな',
    unit: '字(じ)',
    measure: (s) => Object.values(s.kana).filter((n) => n >= KANA_REPS).length,
    tiers: [
      t(10, 'はじめの 一歩(いっぽ)', 'first step', 20),
      t(46, 'かな使(つか)い', 'kana user', 50),
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
      t(1, '旅人(たびびと)', 'traveler', 20),
      t(5, '冒険家(ぼうけんか)', 'adventurer', 50),
      t(15, '町(まち)の 味方(みかた)', 'friend of the towns', 100),
      t(30, '英雄(えいゆう)', 'hero', 200),
    ],
  },
  {
    id: 'towns',
    icon: '🏙',
    label: '取(と)り戻(もど)した 町(まち)',
    unit: '町(まち)',
    measure: (s) => s.clearedStages.filter((id) => TOWN.test(id)).length,
    tiers: [
      t(1, 'ナニワの 恩人(おんじん)', 'savior of Naniwa', 100),
      t(2, 'ミナトの 恩人(おんじん)', 'savior of Minato', 120),
      t(3, 'マンプクの 恩人(おんじん)', 'savior of Manpuku', 150),
      t(4, 'ミヤコの 恩人(おんじん)', 'savior of Miyako', 200),
    ],
  },
  {
    id: 'perfect',
    icon: '👑',
    label: 'かんぺきで クリア（★3）',
    unit: '回(かい)',
    measure: (s) => s.perfectStages.length,
    tiers: [
      t(1, '丁寧(ていねい)', 'careful', 30),
      t(5, '正確(せいかく)', 'precise', 60),
      t(15, '完璧主義(かんぺきしゅぎ)', 'perfectionist', 120),
      t(30, '無敵(むてき)', 'flawless', 200),
    ],
  },
  {
    id: 'hard',
    icon: '👹',
    label: 'ハードで 勝(か)った',
    unit: '回(かい)',
    measure: (s) => s.hardStages.length,
    tiers: [
      t(1, '勇者(ゆうしゃ)', 'brave one', 50),
      t(5, '猛者(もさ)', 'tough fighter', 100),
      t(15, '鬼退治(おにたいじ)', 'demon slayer', 200),
    ],
  },
  {
    id: 'forge',
    icon: '🔨',
    label: '作(つく)った 武器(ぶき)・そうび',
    unit: 'こ',
    measure: (s) => s.weapons.length + forgedParts(s.gear).length,
    tiers: [
      t(1, '鍛冶見習(かじみなら)い', 'smith apprentice', 20),
      t(10, '鍛冶屋(かじや)', 'blacksmith', 50),
      t(30, '名工(めいこう)', 'master smith', 120),
      t(60, '刀匠(とうしょう)', 'swordsmith', 200),
    ],
  },
  {
    id: 'hidden',
    icon: '🔑',
    label: '見(み)つけた かくし言葉(ことば)',
    unit: 'こ',
    measure: (s) => hiddenFound(s),
    tiers: [
      t(1, '探検家(たんけんか)', 'explorer', 50),
      t(5, '発見王(はっけんおう)', 'great discoverer', 100),
      t(15, '名探偵(めいたんてい)', 'great detective', 200),
      t(Object.keys(HIDDEN_WEAPONS).length, '秘宝(ひほう)ハンター', 'treasure hunter', 300),
    ],
  },
  {
    id: 'charms',
    icon: '💍',
    label: '作(つく)った アクセサリ',
    unit: 'こ',
    measure: (s) => s.gear.filter((id) => CHARMS.has(id)).length,
    tiers: [
      t(3, 'おしゃれ', 'fashionable', 30),
      t(10, 'コレクター', 'collector', 60),
      t(25, '宝石商(ほうせきしょう)', 'jeweler', 120),
      t(CHARMS.size, 'アクセサリ王(おう)', 'accessory king', 200),
    ],
  },
  {
    id: 'companions',
    icon: '🤝',
    label: 'なかまの カード',
    unit: '枚(まい)',
    measure: (s) => s.individuals.length,
    tiers: [
      t(3, 'なかま思(おも)い', 'good friend', 30),
      t(10, 'リーダー', 'leader', 60),
      t(25, '大家族(だいかぞく)', 'big family', 120),
      t(CARDS.length, '全員集合(ぜんいんしゅうごう)', 'everyone together', 250),
    ],
  },
  {
    id: 'streak',
    icon: '📅',
    label: 'つづけた 日(ひ)',
    unit: '日(にち)',
    measure: (s) => s.streak.count,
    tiers: [
      t(3, 'がんばり屋(や)', 'hard worker', 20),
      t(7, '努力家(どりょくか)', 'diligent one', 50),
      t(14, 'コツコツ名人(めいじん)', 'steady master', 100),
      t(30, '継続王(けいぞくおう)', 'king of keeping on', 150),
    ],
  },
  {
    id: 'level',
    icon: '⭐',
    label: 'ネクマックスの レベル',
    unit: 'Lv',
    measure: (s) => levelOf(s.exp, ownedCount(s.progress)),
    tiers: [
      t(10, '一人立(ひとりだ)ち', 'on its own feet', 30),
      t(20, '中堅(ちゅうけん)', 'seasoned', 60),
      t(35, 'ベテラン', 'veteran', 120),
      t(50, '伝説(でんせつ)', 'legend', 200),
    ],
  },
  {
    id: 'versus',
    icon: '⚔️',
    label: 'たいせんで 勝(か)った',
    unit: '回(かい)',
    measure: (s) => s.versus.wins,
    tiers: [
      t(1, '挑戦者(ちょうせんしゃ)', 'challenger', 30),
      t(10, '勝負師(しょうぶし)', 'gamesman', 80),
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
 * Whether a title's ◆ has been taken. ことば's were kept by their word for a
 * day before the families came (2026-10-08): those count too.
 */
export const isTaken = (taken: readonly string[], a: Achievement): boolean =>
  taken.includes(a.id) || (a.family.id === 'words' && taken.includes(a.word));

/** Earned and not yet taken. */
export const claimable = (s: AchState, taken: readonly string[]): Achievement[] => {
  const reached = new Set(reachedIds(s));
  return ACHIEVEMENTS.filter((a) => reached.has(a.id) && !isTaken(taken, a));
};
