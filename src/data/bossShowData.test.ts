import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MOJI_FINALES } from './mojiFinale';
import { MOJI_FINALE_SCRIPTS } from './mojiFinaleScripts';
import { MOJI_CHAPTERS } from './mojiRoute';
import { MOJI_CAST } from './mojiScripts';
import { KANA_BOSSES } from './kanaBattle';
import { kanaToWrite } from './kanaWords';
import { HIRAGANA, KATAKANA } from './kana';
import { KANA_BOSS_SCRIPTS } from './scripts/kanaFights';
import { kanaCast } from './scripts/kana';
import { wordsOfLine } from './glossary';
import { getKanjiByChar } from '../lib/kanjiDb';
import { unreadKanji } from '../lib/ruby';
import { finisherChars, type BossLine, type BossShow } from '../lib/bossShow';

/**
 * ボスの 見せ場 (lib/bossShow.ts, docs/design/24): the lines said mid-fight keep
 * the rules of the story they are part of — the town's (mojiEpisodes.test.ts,
 * textLevel.test.ts) for the まとめの ボス, 0章's (kana.test.ts,
 * kanaFights.test.ts) for the two kana bosses. Kept here rather than added to
 * those loops: the beats are not scenes (no page, no picture of their own).
 */

const plain = (s: string) => s.replace(/\([^)]*\)/g, '');
const linesOf = (show: BossShow): BossLine[] => [...show.beats.flat(), show.finisherLine];

/** Each chapter's grammar ceiling, as mojiEpisodes.test.ts checks its scripts. */
const PAST_LEVEL: Record<number, RegExp> = {
  // 1冊目, 1〜10課 (1章・2章)
  1: /(られ|れます|れません|えば|けば|れば|なら|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、|たいです|かったです)/,
  2: /(られ|れます|れません|えば|けば|れば|なら|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、|たいです|かったです)/,
  // 15課
  3: /(られ|れます|れません|えば|けば|れば|なら、|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、)/,
  // 20課
  4: /(られ|れます|れません|えば|けば|(?<!なけ)れば|なら、|たら、|だら、|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、|(こう|ろう|よう|ぼう)[！!。])/,
  // 25課
  5: /(られ|えば|けば|(?<!なけ)れば|なら、|かもしれ|ていきます|ていく|みたい|(こう|ろう|よう|ぼう)[！!。])/,
};

/** Later words a line may keep only with their English under ？ことば (textLevel.test.ts WITH_ENGLISH), by lesson. */
const WITH_ENGLISH: Record<string, number> = { こわい: 99, ずっと: 12, まけません: 21, だめ: 99, はれました: 99, もどりました: 99, にげます: 99 };

/** Who may speak in each chapter's fight: Nexmax, the boss, and the friends who are there. */
const FRIENDS: Record<number, string[]> = { 1: [], 2: ['sora'], 3: ['hana'], 4: ['sora', 'hana'], 5: ['sora', 'hana'] };

describe('まとめの ボスの 見せ場', () => {
  const finales = MOJI_FINALES.map((f) => {
    const chapter = MOJI_CHAPTERS.find((c) => c.id === f.chapter)!;
    return { f, chapter, show: MOJI_FINALE_SCRIPTS[f.id]?.show };
  });

  it('gives every まとめの ボス two beats of one to three lines, a phase-2 picture and a finisher', () => {
    for (const { f, show } of finales) {
      expect(show, f.id).toBeDefined();
      expect(show!.beats.map((b) => b.length > 0 && b.length <= 3), f.id).toEqual([true, true]);
      expect(existsSync(`public/${show!.phase2Img}`), show!.phase2Img).toBe(true);
    }
  });

  it('reads every kanji, keeps English behind EN, and lets only who is there speak', () => {
    const cast = new Map(MOJI_CAST.map((c) => [c.id, c]));
    const bad: string[] = [];
    for (const { f, chapter, show } of finales) {
      const boss = f.boss.img?.includes('king') ? 'mojikui_king' : 'mojikui_boss';
      const may = new Set(['nexmax', boss, ...FRIENDS[chapter.order]]);
      for (const l of linesOf(show!)) {
        for (const k of unreadKanji(l.text)) bad.push(`${f.id}: ${k} in "${l.text}"`);
        if (/[A-Za-z]/.test(l.text)) bad.push(`${f.id}: English on screen "${l.text}"`);
        if (!l.en) bad.push(`${f.id}: no English behind EN "${l.text}"`);
        if (!l.speaker || !cast.has(l.speaker)) bad.push(`${f.id}: speaker ${l.speaker}`);
        else if (!may.has(l.speaker)) bad.push(`${f.id}: ${l.speaker} is not in this fight`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('stays within the lessons of its chapter', () => {
    const bad: string[] = [];
    for (const { f, chapter, show } of finales) {
      for (const l of linesOf(show!)) {
        if (PAST_LEVEL[chapter.order].test(plain(l.text))) bad.push(`${f.id}: ${l.text}`);
        const glossed = new Set(wordsOfLine(l.text).map((w) => w.word));
        for (const [w, lesson] of Object.entries(WITH_ENGLISH)) {
          const said = plain(l.text).split(/[\s、。！？!?…「」]+/u).some((t) => t.replace(/[^\p{L}ー]/gu, '').startsWith(w));
          if (said && lesson > chapter.lessons.to && !glossed.has(w)) bad.push(`${f.id}: ${w} without English — ${l.text}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('finishes on one kanji taught by then, with stroke data, which Nexmax names', () => {
    for (const { f, chapter, show } of finales) {
      const c = finisherChars(show!.finisher);
      expect([...c], f.id).toHaveLength(1);
      expect(unreadKanji(show!.finisher), f.id).toEqual([]);
      expect(getKanjiByChar(c), c).toBeDefined();
      expect(existsSync(`public/kanji-data/${c}.json`), c).toBe(true);
      const taughtIn = MOJI_CHAPTERS.find((ch) => ch.kanji.includes(c));
      expect(taughtIn && taughtIn.order <= chapter.order, `${f.id}: ${c}`).toBe(true);
      expect(show!.finisherLine.speaker).toBe('nexmax');
      expect(plain(show!.finisherLine.text), f.id).toContain(c);
    }
  });

  it('uses each finisher once: 友 is kept for the King (5章), who writes it after', () => {
    const all = finales.map(({ show }) => finisherChars(show!.finisher));
    expect(new Set(all).size).toBe(all.length);
    expect(finisherChars(MOJI_FINALE_SCRIPTS['moji-5-boss']!.show!.finisher)).toBe('友');
  });
});

describe('0章の ボスの 見せ場', () => {
  const bosses = KANA_BOSSES.map((b) => ({ b, show: KANA_BOSS_SCRIPTS[b.id]?.show }));

  it('gives both kana bosses a nature, two beats, a phase-2 picture and a finishing word', () => {
    for (const { b, show } of bosses) {
      expect(show, b.id).toBeDefined();
      expect(show!.beats.map((x) => x.length > 0 && x.length <= 3), b.id).toEqual([true, true]);
      expect(existsSync(`public/${show!.phase2Img}`), show!.phase2Img).toBe(true);
      expect(show!.trait?.ja, b.id).toMatch(/^[ぁ-んァ-ンー\s]+$/);
      expect(show!.trait?.en, b.id).toMatch(/[a-z]/);
      expect(show!.finisherWord?.emoji, b.id).toBeTruthy();
      expect(show!.finisherWord?.en, b.id).toMatch(/[A-Za-z]/);
    }
  });

  it('keeps 0章’s rules: no kanji, Nexmax in kana and pictures, narration in English with kana Japanese', () => {
    const bad: string[] = [];
    for (const { b, show } of bosses) {
      const cast = new Set(kanaCast(b.script).map((c) => c.id));
      for (const l of linesOf(show!)) {
        if (/[一-龯]/.test(l.text)) bad.push(`${b.id}: kanji in "${l.text}"`);
        if (l.speaker) {
          if (!cast.has(l.speaker)) bad.push(`${b.id}: speaker ${l.speaker}`);
          if (/[A-Za-z]/.test(l.text)) bad.push(`${b.id}: English from ${l.speaker} "${l.text}"`);
        } else {
          if (!/[A-Za-z]/.test(l.text)) bad.push(`${b.id}: narration not in English "${l.text}"`);
          if (!l.ja || /[一-龯A-Za-z]/.test(l.ja)) bad.push(`${b.id}: no kana Japanese for "${l.text}"`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('finishes on a word of its own script, every kana of it drawable, which Nexmax names', () => {
    for (const { b, show } of bosses) {
      const letters = kanaToWrite({ kana: show!.finisher, emoji: '', en: '' });
      const own = new Set(b.script === 'hiragana' ? HIRAGANA : [...KATAKANA, 'ッ']);
      for (const k of letters) {
        expect(own.has(k), `${b.id}: ${k}`).toBe(true);
        expect(existsSync(`public/kanji-data/${k}.json`), k).toBe(true);
      }
      expect(show!.finisherLine.text, b.id).toContain(show!.finisher);
    }
  });
});
