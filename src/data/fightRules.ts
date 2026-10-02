import { comboMultiplier } from '../lib/mastery';

/**
 * たたかいの ひみつ — the rules of a town fight, for じゅんび (BattleScene,
 * lib/mastery.ts). The second page after ★の ひみつ (starPerks.ts): the
 * stars say what writing buys, these say why it is needed — the opponent
 * hunts the least-written kanji, so the practice is the strategy.
 *
 * Pictures first, short Japanese, English behind EN, as in starPerks.ts.
 */
export interface FightRule {
  icons: string;
  /** Furigana notation. */
  text: string;
  en: string;
}

/** The COMBO cap, as a percentage: comboMultiplier stops growing here. */
export const COMBO_CAP_PERCENT = Math.round((comboMultiplier(Number.MAX_SAFE_INTEGER) - 1) * 100);

export const FIGHT_RULES: FightRule[] = [
  { icons: '🙈', text: '手本(てほん)なしで 書(か)く', en: 'No model to trace: write it from memory.' },
  { icons: '👾', text: 'あいては ★が 少(すく)ない 字(じ)を ねらう', en: 'The opponent goes for the letter with the fewest ★.' },
  {
    icons: '🔥',
    text: `まちがえずに つづけて 書(か)くと COMBO（+${COMBO_CAP_PERCENT}%まで）`,
    en: `Clean writes in a row build a COMBO, up to +${COMBO_CAP_PERCENT}%.`,
  },
  { icons: '💢', text: 'ミスが たまると こうげきされる', en: 'Let the slips pile up, and it strikes back.' },
];
