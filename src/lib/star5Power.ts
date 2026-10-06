/**
 * ★5 だけの ちから (docs/design/18 §2).
 *
 * A ★5 card used to be only its character a step stronger — 2026-10-06
 * 「ピックアップキャラの何がすごいのか全然わからない」. Now each ★5 also has
 * one power of its own, after its character, always on in a fight where the
 * companion's わざ works (the new route, past the tutorial). Each is a plain
 * number a child can see happen.
 */

export interface Star5Effect {
  /** 正: a write with no slip (and no look) hits this many times harder. */
  cleanMul?: number;
  /** 進: the わざ gauge starts half full. */
  gaugeStartHalf?: boolean;
  /** 旅: a broken COMBO keeps half of itself. */
  comboKeepHalf?: boolean;
  /** 先: looks at the stroke order that cost nothing, each fight. */
  freeLooks?: number;
  /** 道: added to the gauge on every write that fills it at all. */
  gaugeBonus?: number;
  /** 光: HP back each time the わざ is used. */
  skillHeal?: number;
  /** 本: the reading turn's hit is multiplied by this. */
  readingMul?: number;
  /** 時: slips more before the opponent strikes. */
  patience?: number;
  /** 空: added to the most HP. */
  maxHp?: number;
}

export interface Star5Power {
  /** The power's name, furigana notation. */
  name: string;
  /** What it does, in a line, furigana notation. */
  says: string;
  effect: Star5Effect;
}

/** Keyed by card id: the nine ★5 cards (data/individuals.ts DRESSED). */
export const STAR5_POWER: Readonly<Record<string, Star5Power>> = {
  'ISTJ-5': { name: 'まっすぐ ひとふで', says: 'ミスなしで 書(か)いた 字(じ)の こうげき ×1.3', effect: { cleanMul: 1.3 } },
  'ESTP-5': { name: 'スタートダッシュ', says: 'わざの ゲージが はじめから 半分(はんぶん) たまって いる', effect: { gaugeStartHalf: true } },
  'ENFP-5': { name: 'たびは つづく', says: 'コンボが 切(き)れても 半分(はんぶん) のこる', effect: { comboKeepHalf: true } },
  'INTJ-5': { name: '先(さき)よみ', says: '書(か)きじゅんを 見(み)るのが 1回(かい) ただ（たたかい ごとに）', effect: { freeLooks: 1 } },
  'ENTJ-5': { name: 'ちかみち', says: 'わざの ゲージが 1つ 多(おお)く たまる', effect: { gaugeBonus: 1 } },
  'ENFJ-5': { name: 'ひかりの いやし', says: 'わざを つかった とき、HPも 15 もどる', effect: { skillHeal: 15 } },
  'rin-5': { name: 'よみの ちから', says: '読(よ)みの もんだいの こうげき 2ばい', effect: { readingMul: 2 } },
  'keeper-5': { name: '時(とき)とめ', says: 'てきが こうげき する までの ミスが 1つ 多(おお)い', effect: { patience: 1 } },
  'sora-5': { name: '大(おお)空(ぞら)', says: 'HP の さいだいが ＋20', effect: { maxHp: 20 } },
};

export const star5PowerOf = (cardId: string | null | undefined): Star5Power | undefined => (cardId ? STAR5_POWER[cardId] : undefined);

// --- How the fight uses it (features/battle/BattleScene.tsx) -----------------

/** 空・時: the most HP and the patience, with the power. */
export const withStar5Stats = <S extends { maxHp: number; patience: number }>(stats: S, e: Star5Effect | undefined): S =>
  e ? { ...stats, maxHp: stats.maxHp + (e.maxHp ?? 0), patience: stats.patience + (e.patience ?? 0) } : stats;

/** 進: where the gauge starts. */
export const star5GaugeStart = (e: Star5Effect | undefined, full: number): number => (e?.gaugeStartHalf ? Math.floor(full / 2) : 0);

/** 道: one write's gauge gain, with the power (nothing stays nothing). */
export const star5GaugeGain = (gain: number, e: Star5Effect | undefined): number => (gain > 0 ? gain + (e?.gaugeBonus ?? 0) : gain);

/** 正: the hit of one write, from whether it was clean. */
export const star5CleanMul = (clean: boolean, e: Star5Effect | undefined): number => (clean ? (e?.cleanMul ?? 1) : 1);

/** 旅: what a broken COMBO comes down to. */
export const star5ComboAfterBreak = (combo: number, e: Star5Effect | undefined): number => (e?.comboKeepHalf ? Math.floor(combo / 2) : 0);
