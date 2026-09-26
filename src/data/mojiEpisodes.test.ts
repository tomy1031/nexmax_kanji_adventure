import { describe, it, expect } from 'vitest';
import { MOJI_EPISODES, episodesOf, isMojiEpisodeUnlocked } from './mojiEpisodes';
import { MOJI_CHAPTERS } from './mojiRoute';
import { MOJI1_CAST, MOJI1_SCRIPTS } from './scripts/moji1';
import { getKanjiByChar } from '../lib/kanjiDb';
import { unreadKanji } from '../lib/ruby';
import { SCENES, fxNamesOf } from '../features/picturebook/scenes';

describe('文字が 消えた 町: episodes', () => {
  it('teach each chapter’s kanji in the book’s order, a handful at a time', () => {
    for (const ch of MOJI_CHAPTERS) {
      const taught = episodesOf(ch.id).flatMap((e) => e.kanji);
      expect(taught, ch.id).toEqual(ch.kanji.slice(0, taught.length));
    }
    for (const ep of MOJI_EPISODES) {
      expect(ep.kanji.length, ep.id).toBeGreaterThanOrEqual(3);
      expect(ep.kanji.length, ep.id).toBeLessThanOrEqual(9);
      for (const k of ep.kanji) expect(getKanjiByChar(k), `${ep.id} ${k}`).toBeDefined();
    }
  });

  it('open one after another', () => {
    const [a, b] = episodesOf('moji-1');
    expect(isMojiEpisodeUnlocked(a, [])).toBe(true);
    expect(isMojiEpisodeUnlocked(b, [])).toBe(false);
    expect(isMojiEpisodeUnlocked(b, [a.id])).toBe(true);
  });
});

describe('1章 scripts', () => {
  const scripts = Object.values(MOJI1_SCRIPTS).flatMap((s) => [s.intro, s.outro]);

  it('exist for every episode of chapter 1', () => {
    expect(Object.keys(MOJI1_SCRIPTS).sort()).toEqual(episodesOf('moji-1').map((e) => e.id).sort());
    for (const s of scripts) expect(s.lines[0].bg, s.stageId).toBeTruthy();
  });

  it('give every kanji a reading — lines, big glyphs, titles and names', () => {
    const bare: string[] = [];
    const check = (where: string, t?: string) => {
      for (const c of t ? unreadKanji(t) : []) bare.push(`${where}: ${c} in "${t}"`);
    };
    for (const s of scripts) {
      for (const l of s.lines) {
        check(s.stageId, l.text);
        check(s.stageId, l.glyph);
      }
    }
    for (const e of MOJI_EPISODES) check(e.id, e.title);
    for (const c of MOJI1_CAST) check(c.id, c.name);
    expect(bare).toEqual([]);
  });

  it('keep English behind the EN button, and use pictures', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) if (/[A-Za-z]/.test(l.text)) bad.push(`${s.stageId}: English on screen "${l.text}"`);
      if (!s.lines.some((l) => /\p{Extended_Pictographic}/u.test(l.text + (l.glyph ?? '')))) bad.push(`${s.stageId}: no pictures`);
    }
    expect(bad).toEqual([]);
  });

  it('use real scenes, effects, speakers and sprites', () => {
    const bad: string[] = [];
    const cast = new Map(MOJI1_CAST.map((c) => [c.id, c.sprites]));
    for (const s of scripts) {
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) scene = l.bg;
        if (!SCENES[scene]) bad.push(`${s.stageId}: scene ${scene}`);
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) bad.push(`${s.stageId}: fx ${fx}`);
        if (l.speaker && !cast.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite) {
          const [who, expr] = l.sprite.split(':');
          if (!cast.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
