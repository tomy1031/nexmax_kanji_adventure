import { describe, expect, it } from 'vitest';
import { CARD_LINES, COMPANION_LINES, DEFAULT_LINES, HURT_LINE } from './companionLines';
import { SKILL_INFO, SkillKind, skillEffect } from '../lib/companionSkill';
import { MOJI1_SCRIPTS } from './scripts/moji1';
import { MOJI2_SCRIPTS } from './scripts/moji2';
import { MOJI3_SCRIPTS } from './scripts/moji3';
import { MOJI4_SCRIPTS } from './scripts/moji4';

/**
 * みんなの日本語 1冊目 — the words a player reads beside the story
 * (2026-10-07「もう少し 文章を みんなの日本語の レベルに 準拠した 文法や
 * 単語レベルに」). The story scripts have their own checks
 * (mojiEpisodes.test.ts); these cover the companions' lines and わざ, and the
 * potential form the story checks do not catch.
 */

const plain = (s: string) => s.replace(/\([^)]*\)/g, '');

/** Later than 1冊目 — or kept out of it on purpose (docs/constraints.md 2026-10-04). */
const PAST_LEVEL: [RegExp, string][] = [
  [/(こう|ろう|よう|ぼう|おう)[！!。、]/, 'volitional (行こう)'],
  [/(きめろ|見よ|ひかれ|すすめ[！!。…]|がんばれ|とんで いけ)/, 'imperative'],
  [/(よめ|読め|はなせ|話せ|のめ|飲め|よべ|あるけ|歩け|かえれ|帰れ|書け|かけ)(ます|ません|る|ない|た)/, 'potential'],
  [/(られ|えば|けば|れば|なら、|たら、|だら、|かもしれ|ていく|ず[、。！])/, 'passive, conditional or literary'],
  [/みたい/, 'みたい'],
];

const levelIssues = (where: string, text: string): string[] =>
  PAST_LEVEL.filter(([re]) => re.test(plain(text))).map(([, why]) => `${where}: ${why} — ${text}`);

describe('companions speak 1冊目 Japanese', () => {
  it('keeps every line to 1冊目 grammar', () => {
    const bad: string[] = [];
    const sets = { ...COMPANION_LINES, ...CARD_LINES, default: DEFAULT_LINES };
    for (const [id, l] of Object.entries(sets)) for (const t of [l.start, l.skill, l.win]) bad.push(...levelIssues(id, t));
    for (const [k, t] of Object.entries(HURT_LINE)) bad.push(...levelIssues(`hurt ${k}`, t));
    for (const k of Object.values(SkillKind))
      for (const r of [3, 4, 5] as const) bad.push(...levelIssues(`わざ ${k}`, SKILL_INFO[k].says(skillEffect(k, r))));
    expect(bad).toEqual([]);
  });
});

describe('the story says why a word cannot be read', () => {
  const scripts = [MOJI1_SCRIPTS, MOJI2_SCRIPTS, MOJI3_SCRIPTS, MOJI4_SCRIPTS].flatMap((m) =>
    Object.values(m).flatMap((s) => [s.intro, s.encounter, s.outro]),
  );

  it('never says "only the sounds are left": the kanji are missing, so no one understands (2026-10-07)', () => {
    const bad = scripts.flatMap((s) => s.lines.filter((l) => /おとだけ/.test(l.text)).map((l) => `${s.stageId}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('uses no potential form (よめません), which is 27課', () => {
    const bad = scripts.flatMap((s) => s.lines.flatMap((l) => levelIssues(s.stageId, l.text).filter((m) => m.includes('potential'))));
    expect(bad).toEqual([]);
  });
});
