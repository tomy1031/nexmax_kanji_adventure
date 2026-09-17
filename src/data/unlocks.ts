import type { StageDef } from './stages';

/**
 * What opens when.
 *
 * One system per stage, in the order the learner has a use for it. The first
 * build opened six at once on the first clear, which is the same as opening
 * none: a menu of six unexplained things is not a reward, it is a wall.
 *
 * The order is "when the ground is ready", not "when it was built":
 *   - the forge needs characters to put in it
 *   - the word book needs one forge attempt to mean anything
 *   - the daily tasks need somewhere to spend what they pay out
 *   - the gacha needs a day of gems behind it, or it opens empty
 *   - versus comes after stage 8, where the story completes the rule it tests
 *
 * See docs/design/06_チュートリアルの理解設計.md §4.
 */

export const Feature = {
  FORGE: 'forge',
  WORDS: 'words',
  DAILY: 'daily',
  GACHA: 'gacha',
  COLLECTION: 'collection',
  VERSUS: 'versus',
} as const;
export type Feature = (typeof Feature)[keyof typeof Feature];

/** The stage whose clear opens each feature. */
export const UNLOCKED_BY: Record<Feature, string> = {
  forge: 'mukashi-1',
  words: 'mukashi-2',
  daily: 'mukashi-3',
  gacha: 'mukashi-4',
  collection: 'mukashi-5',
  versus: 'mukashi-8',
};

/** Label and one line of why, shown when the feature opens. */
export const FEATURE_INTRO: Record<Feature, { label: string; line: string; to: string }> = {
  forge: {
    label: '合成(ごうせい)',
    line: '手(て)に 入(い)れた 漢字(かんじ)を 2(ふた)つ あわせると、武器(ぶき)に なります。',
    to: '/forge',
  },
  words: {
    label: 'ことば図鑑(ずかん)',
    line: 'いま 作(つく)れる 言葉(ことば)が ならびます。かくれた 字(じ)を 当(あ)てましょう。',
    to: '/words',
  },
  daily: {
    label: '毎日(まいにち)の やること',
    line: '毎日(まいにち) 書(か)くと、ジェムと すみが もらえます。',
    to: '/daily',
  },
  gacha: {
    label: 'ガチャ',
    line: 'ジェムで なかまを よべます。なかまは 得意(とくい)な 武器(ぶき)を つよく します。',
    to: '/gacha',
  },
  collection: {
    label: '図鑑(ずかん)',
    line: '作(つく)った 武器(ぶき)と なかまを 見(み)られます。ここで 持(も)ちかえます。',
    to: '/collection',
  },
  versus: {
    label: 'たいせん',
    line: 'ほかの 人(ひと)と 同(おな)じ 漢字(かんじ)を 書(か)いて きそいます。',
    to: '/versus',
  },
};

export const isFeatureUnlocked = (feature: Feature, cleared: readonly string[]): boolean =>
  cleared.includes(UNLOCKED_BY[feature]);

/** Features this stage's clear opens (usually zero or one). */
export const featuresUnlockedBy = (stageId: string): Feature[] =>
  (Object.keys(UNLOCKED_BY) as Feature[]).filter((f) => UNLOCKED_BY[f] === stageId);

/**
 * How many of a stage's characters must be owned before the fight opens.
 *
 * The ten-rep rule is fixed, but requiring all nine of a stage's characters
 * meant 90 reps — about 23 minutes of tracing — before a learner had any idea
 * what the writing was for. Three is enough to fight with; the rest can be
 * collected whenever, and each one makes the fight easier.
 */
export const KANJI_NEEDED_TO_FIGHT = 3;

export const kanjiNeededFor = (stage: StageDef): number =>
  Math.min(KANJI_NEEDED_TO_FIGHT, stage.kanji.length);
