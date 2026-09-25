import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { HIRAGANA, KATAKANA, KANA_EPISODES, ROMAJI, isKana, isKanaEpisodeUnlocked } from './kana';
import { KANA_CAST, KANA_SCRIPTS } from './scripts/kana';
import { revealKana } from '../lib/kanaReveal';
import { SCENES, fxNamesOf } from '../features/picturebook/scenes';

describe('かな編: the kana', () => {
  it('has the 46 hiragana and 46 katakana', () => {
    expect(HIRAGANA).toHaveLength(46);
    expect(KATAKANA).toHaveLength(46);
    expect(new Set([...HIRAGANA, ...KATAKANA]).size).toBe(92);
  });

  it('teaches every kana once, hiragana first, in gojūon order', () => {
    expect(KANA_EPISODES.flatMap((e) => e.kana)).toEqual([...HIRAGANA, ...KATAKANA]);
    expect(KANA_EPISODES.map((e) => e.order)).toEqual(KANA_EPISODES.map((_, i) => i + 1));
  });

  it('has stroke data for every kana it asks for, with loops joined into one stroke', () => {
    const missing = [...HIRAGANA, ...KATAKANA].filter((k) => !existsSync(`public/kanji-data/${k}.json`));
    expect(missing).toEqual([]);
    const strokes = (k: string) => JSON.parse(readFileSync(`public/kanji-data/${k}.json`, 'utf8')).strokes.length;
    // animCJK splits a stroke that crosses itself; a learner writes it once.
    expect({ あ: strokes('あ'), ぬ: strokes('ぬ'), の: strokes('の'), ね: strokes('ね'), ツ: strokes('ツ') }).toEqual({
      あ: 3,
      ぬ: 2,
      の: 1,
      ね: 2,
      ツ: 3,
    });
  });

  it('opens episodes one after another', () => {
    expect(isKanaEpisodeUnlocked(KANA_EPISODES[0], [])).toBe(true);
    expect(isKanaEpisodeUnlocked(KANA_EPISODES[1], [])).toBe(false);
    expect(isKanaEpisodeUnlocked(KANA_EPISODES[1], ['kana-1'])).toBe(true);
  });
});

describe('かな編: the scripts', () => {
  const all = Object.values(KANA_SCRIPTS).flatMap((s) => [s.intro, s.outro]);

  it('has an opening and a closing scene for every episode', () => {
    expect(Object.keys(KANA_SCRIPTS).sort()).toEqual(KANA_EPISODES.map((e) => e.id).sort());
    for (const s of all) expect(s.lines.length, s.stageId).toBeGreaterThan(0);
  });

  it('uses kana only — no kanji, nothing without romaji', () => {
    const allowed = /[\s、。！？「」…―ー・]/;
    const bad: string[] = [];
    for (const s of all) {
      for (const l of s.lines) {
        for (const c of [...l.text, ...(l.glyph ?? '')]) if (!isKana(c) && !allowed.test(c)) bad.push(`${s.stageId}: ${c} in "${l.text}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('gives every line its English', () => {
    const bare = all.flatMap((s) => s.lines.filter((l) => !l.en?.trim()).map((l) => `${s.stageId}: ${l.text}`));
    expect(bare).toEqual([]);
  });

  it('opens every scene on a page, uses real scenes, effects and sprites', () => {
    const bad: string[] = [];
    const sprites = new Map(KANA_CAST.map((c) => [c.id, c.sprites]));
    for (const s of all) {
      if (!s.lines[0].bg) bad.push(`${s.stageId}: no opening scene`);
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) {
          scene = l.bg;
          if (!SCENES[scene]) bad.push(`${s.stageId}: scene ${scene}`);
        }
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) bad.push(`${s.stageId}: ${scene} has no fx ${fx}`);
        if (l.speaker && !sprites.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite) {
          const [who, expr] = l.sprite.split(':');
          if (!sprites.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('can read Nexmax’s name once every katakana in it is written (kana-9)', () => {
    const upTo9 = new Set(KANA_EPISODES.filter((e) => e.order <= 9).flatMap((e) => e.kana));
    expect(revealKana('ネクマックス', upTo9)).toEqual([{ text: 'ネクマックス' }]);
  });
});

describe('revealKana', () => {
  const known = new Set(['あ', 'お', 'か']);

  it('puts romaji over what is not known and leaves the rest', () => {
    expect(revealKana('あおい そら', known)).toEqual([{ text: 'あお' }, { text: 'い', romaji: 'i' }, { text: ' ' }, { text: 'そら', romaji: 'sora' }]);
  });

  it('reads voiced kana by their base', () => {
    expect(revealKana('がか', known)).toEqual([{ text: 'がか' }]);
    expect(revealKana('ぎ', known)).toEqual([{ text: 'ぎ', romaji: 'gi' }]);
  });

  it('reads small ya/yu/yo and the small tsu as part of the sound', () => {
    expect(revealKana('きゃ', new Set())).toEqual([{ text: 'きゃ', romaji: 'kya' }]);
    expect(revealKana('しょ', new Set())).toEqual([{ text: 'しょ', romaji: 'sho' }]);
    expect(revealKana('じゅ', new Set())).toEqual([{ text: 'じゅ', romaji: 'ju' }]);
    expect(revealKana('マックス', new Set())).toEqual([{ text: 'マックス', romaji: 'makkusu' }]);
  });

  it('has romaji for every kana form', () => {
    expect(Object.values(ROMAJI).filter((r) => r === undefined)).toEqual([]);
  });
});
