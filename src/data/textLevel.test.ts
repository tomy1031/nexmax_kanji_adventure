import { describe, expect, it } from 'vitest';
import { CARD_LINES, COMPANION_LINES, DEFAULT_LINES, HURT_LINE } from './companionLines';
import { SKILL_INFO, SkillKind, skillEffect } from '../lib/companionSkill';
import { MOJI1_PRELUDE, MOJI1_SCRIPTS } from './scripts/moji1';
import { MOJI2_SCRIPTS } from './scripts/moji2';
import { MOJI3_SCRIPTS } from './scripts/moji3';
import { MOJI4_SCRIPTS } from './scripts/moji4';
import { MOJI5_SCRIPTS } from './scripts/moji5';
import { KANA_SCRIPTS } from './scripts/kana';
import { MOJI_EPISODES } from './mojiEpisodes';
import { MOJI_FINALES } from './mojiFinale';
import { MOJI_FINALE_SCRIPTS } from './mojiFinaleScripts';
import { MOJI_CHAPTERS } from './mojiRoute';
import { MOJI_SCRIPTS } from './mojiScripts';
import { wordsOfLine } from './glossary';
import type { NovelScript } from '../types/novel';

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
  [/(よめ|読め|はなせ|話せ|のめ|飲め|よべ|あるけ|歩け|かえれ|帰れ|書け|うれ|売れ)(ます|ません|る|ない|た)/, 'potential'],
  [/たべられ|食べられ/, 'passive'],
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
  const scripts = [MOJI1_SCRIPTS, MOJI2_SCRIPTS, MOJI3_SCRIPTS, MOJI4_SCRIPTS, MOJI5_SCRIPTS].flatMap((m) =>
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

  it('keeps 0章 (かな) to the plain words a beginner has: no potential, no passive', () => {
    const bad = Object.values(KANA_SCRIPTS).flatMap((k) => [k.intro, k.outro]).flatMap((s) =>
      s.lines.flatMap((l) => [l.text, l.ja ?? ''].flatMap((t) => levelIssues(s.stageId, t).filter((m) => /potential|passive/.test(m)))),
    );
    expect(bad).toEqual([]);
  });
});

/**
 * Words that come after the lessons a chapter covers (2026-10-09「いしだん すべる など、
 * レベルに対して難しい言葉が多い…みんなの日本語の課と習う漢字のレベルを考えて、言葉を工夫して。
 * どうしてもできない場合は辞書を」), each with the lesson of 『みんなの日本語』 that teaches it
 * (99: not in 初級). Listed in the forms the lines used.
 */

/** Said an easier way (いしだん → かいだん, ねむって → ねて): not back before their lesson, English or not. */
const SAID_EASIER: Record<string, number> = {
  いしだん: 99, すべる: 99, ほそい: 99, みちしるべ: 99, つきました: 25, きえました: 99, ねむって: 99,
  かじって: 99, かじる: 99, やめて: 16, いりぐち: 99, むこう: 99, すっきり: 99, なおりました: 99,
  もじばん: 99, あきません: 29, あきました: 29, いきさき: 99, よていひょう: 99, まげる: 99, のって: 16,
  おく: 99, とおしません: 99, われました: 99, とびます: 31, こんど: 99, ひらきました: 99, みえません: 27,
  じこくひょう: 15, しょうてんがい: 99, こまりますね: 99, かむ: 99, みさき: 99, まんなか: 99, まず: 99,
  めくる: 99, かえして: 17, まっしろ: 99, ひかり: 99, おもいで: 99, むかし: 35, うつります: 99,
  いっぱい: 99, てらします: 99, あそびましょう: 13, わすれました: 17, たてもの: 23, まずい: 99,
  すきま: 99, わりこむ: 99, わりこみ: 99, おきゃくさん: 99, とどけます: 99, とんで: 31, いや: 99,
  はしります: 27, はしって: 27, はしらないで: 27, かいじょう: 99, うら: 99, きまり: 99, つまみぐい: 99,
  あじみ: 99, おぼえて: 17, つきません: 29, うごかす: 99, ころんで: 99, まにあいます: 99, ゆうべ: 99,
  わらう: 44, しゃべって: 99, しゃべったり: 99, しつこい: 99, さがして: 99, ごちそう: 99, ただ: 99,
};

/** No easier way to say them (こわい, モジクイは にげました): they keep their English under ？ことば. */
const WITH_ENGLISH: Record<string, number> = {
  こわい: 99, におい: 99, うれしい: 99, あかるい: 16, はれました: 99, つくります: 15, うみ: 12, ずっと: 12,
  まけません: 21, こえ: 99, はらぺこ: 99, だめ: 99, だいじょうぶ: 17,
  // 5章（docs/design/20）
  しろ: 99, まくら: 99, はんこ: 99, みみせん: 99, ゆきだるま: 99, くしゃみ: 99, アルバム: 99, なみ: 99, カーテン: 99,
  にんぎょう: 99, ホール: 99, がくふ: 99, チェロ: 99, うるさい: 99, ぐあい: 99, かんごし: 99, かいがら: 99,
  はずかしい: 99, かなしく: 99, むね: 99, スマホ: 99,
  ひかります: 99, にげました: 99, もどりました: 99, たたかいます: 99, かんばん: 99, かげ: 99, ふだ: 99,
};

/** What may follow a word in a line and leave it that word (as glossary.ts reads it). */
const AFTER = /^(?:が|を|に|へ|で|と|の|は|も|や|から|まで|です|ですか|でした|だ|な|ね)?$/;

/** The words of `list` a line says, read with the furigana taken out. */
const wordsFrom = (list: Record<string, number>, text: string): string[] =>
  plain(text)
    .split(/[\s、。！？!?…「」『』（）()・〜—]+/u)
    .map((t) => t.replace(/[^\p{L}ー]/gu, ''))
    .flatMap((t) => Object.keys(list).filter((w) => t.startsWith(w) && AFTER.test(t.slice(w.length))));

describe('the story fits the lessons of its chapter (2026-10-09)', () => {
  const lastLesson = new Map(MOJI_CHAPTERS.map((c) => [c.id, c.lessons.to]));
  const byChapter: [string, NovelScript[]][] = MOJI_CHAPTERS.filter((c) => lastLesson.get(c.id)! <= 25).map((c) => [
    c.id,
    [
      ...MOJI_EPISODES.filter((e) => e.chapter === c.id).flatMap((e) => [MOJI_SCRIPTS[e.id].intro, MOJI_SCRIPTS[e.id].encounter, MOJI_SCRIPTS[e.id].outro]),
      ...MOJI_FINALES.filter((f) => f.chapter === c.id).flatMap((f) => (MOJI_FINALE_SCRIPTS[f.id] ? [MOJI_FINALE_SCRIPTS[f.id]!.intro, MOJI_FINALE_SCRIPTS[f.id]!.outro] : [])),
      ...(c.id === 'moji-1' ? [MOJI1_PRELUDE] : []),
    ],
  ]);
  const lines = byChapter.flatMap(([chapter, scripts]) => scripts.flatMap((s) => s.lines.map((l) => ({ where: s.stageId, cap: lastLesson.get(chapter)!, text: l.text }))));

  it('covers every chapter written so far, 1章 to 5章', () => {
    expect(byChapter.map(([id, scripts]) => [id, scripts.length > 0])).toEqual([
      ['moji-1', true],
      ['moji-2', true],
      ['moji-3', true],
      ['moji-4', true],
      ['moji-5', true],
    ]);
  });

  it('says a word from a later lesson an easier way', () => {
    const bad = lines.flatMap(({ where, cap, text }) => wordsFrom(SAID_EASIER, text).filter((w) => SAID_EASIER[w] > cap).map((w) => `${where}: ${w} — ${text}`));
    expect(bad).toEqual([]);
  });

  it('gives the English under ？ことば of a later word it keeps', () => {
    const bad = lines.flatMap(({ where, cap, text }) => {
      const glossed = new Set(wordsOfLine(text).map((w) => w.word));
      return wordsFrom(WITH_ENGLISH, text).filter((w) => WITH_ENGLISH[w] > cap && !glossed.has(w)).map((w) => `${where}: ${w} — ${text}`);
    });
    expect(bad).toEqual([]);
  });

  it('keeps 0章’s Japanese to plain beginner words: its lines have no ？ことば', () => {
    // The words of 0章 itself (かんばんが ひかります → もどります), and Nexmax's かえして, which the line repeats to explain it.
    const its = ['ひかります', 'もどりました', 'かんばん', 'かげ', 'かえして'];
    const later = { ...SAID_EASIER, ...WITH_ENGLISH };
    const bad = Object.values(KANA_SCRIPTS)
      .flatMap((k) => [k.intro, k.outro])
      .flatMap((s) => s.lines.flatMap((l) => wordsFrom(later, l.ja ?? '').filter((w) => later[w] > 5 && !its.includes(w)).map((w) => `${s.stageId}: ${w} — ${l.ja}`)));
    expect(bad).toEqual([]);
  });
});
