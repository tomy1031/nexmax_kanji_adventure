import { comboMultiplier } from '../lib/mastery';

/**
 * たたかいの ひみつ — the rules of a town fight, for じゅんび (BattleScene,
 * lib/mastery.ts). The second page after ★の ひみつ (starPerks.ts): the
 * stars say what writing buys, these say why it is needed — the opponent
 * hunts the least-written kanji, so the practice is the strategy.
 *
 * Pictures first, short Japanese, English behind EN, as in starPerks.ts.
 */
export type TipId = 'noModel' | 'stars' | 'hunted' | 'combo' | 'counter' | 'read' | 'seal' | 'skill';

export interface FightRule {
  id: TipId;
  icons: string;
  /** Furigana notation. */
  text: string;
  en: string;
}

/** The COMBO cap, as a percentage: comboMultiplier stops growing here. */
export const COMBO_CAP_PERCENT = Math.round((comboMultiplier(Number.MAX_SAFE_INTEGER) - 1) * 100);

export const FIGHT_RULES: FightRule[] = [
  { id: 'noModel', icons: '🙈', text: '手本(てほん)なしで 書(か)く', en: 'No model to trace: write it from memory.' },
  { id: 'hunted', icons: '👾', text: 'あいては ★が 少(すく)ない 字(じ)を ねらう', en: 'The opponent goes for the letter with the fewest ★.' },
  {
    id: 'combo',
    icons: '🔥',
    text: `ミス なしで つづけて 書(か)く → COMBO（+${COMBO_CAP_PERCENT}%まで）`,
    en: `Clean writes in a row build a COMBO, up to +${COMBO_CAP_PERCENT}%.`,
  },
  { id: 'counter', icons: '💢', text: 'ミスが たまる → あいての こうげき', en: 'Let the slips pile up, and it strikes back.' },
  { id: 'read', icons: '📖', text: 'ときどき 読(よ)みの もんだい。読(よ)みを えらぶ', en: 'Now and then it throws a letter: pick its reading.' },
  {
    id: 'seal',
    icons: '🔒',
    text: 'あいては 字(じ)を もって います。字(じ)を ぜんぶ 書(か)いて、たおしましょう！',
    en: 'It holds the letters. It cannot fall until you have written every one of them.',
  },
  {
    id: 'skill',
    icons: '🤝',
    text: '書(か)くと なかまの ゲージが たまる。いっぱい → かおを タップ → わざ',
    en: "Writing fills your friend's ring. When it is full, tap their face for a special move.",
  },
];

/** ★の ひみつ (starPerks.ts) in one line, for its turn among the tips. */
export const STARS_TIP: FightRule = {
  id: 'stars',
  icons: '⭐',
  text: '★が 多(おお)い 字(じ) → こうげきが 強(つよ)い。★3 → 字(じ)の わざ',
  en: 'The more ★ a letter has, the harder it hits. At ★3 a clean write is a special move.',
};

/**
 * The rules told one at a time (2026-10-04「じゅんびの 説明も 1つずつ 出す
 * 形に」), each once. What to know before a fight is told on じゅんび, one a
 * visit, in this order; what happens in a fight is told the first time it
 * happens there (BattleScene). Both pages stay a tap away on じゅんび.
 */
export const READY_TIPS: readonly TipId[] = ['noModel', 'stars', 'hunted'];
export const BATTLE_TIPS: readonly TipId[] = ['counter', 'combo', 'read', 'seal', 'skill'];

export const tipOf = (id: TipId): FightRule => (id === 'stars' ? STARS_TIP : FIGHT_RULES.find((r) => r.id === id)!);

/**
 * Whether a tip is still to be told. A player who has read both pages of
 * ひみつ (tutorials.stars, from before the tips or from the じゅんび button)
 * has been told them all.
 */
export const tipDue = (id: TipId, seen: readonly string[], readAll: boolean): boolean => !readAll && !seen.includes(id);

/** The じゅんび tip for this visit: the first one not yet told, if any. */
export const nextReadyTip = (seen: readonly string[], readAll: boolean): TipId | null => READY_TIPS.find((t) => tipDue(t, seen, readAll)) ?? null;
