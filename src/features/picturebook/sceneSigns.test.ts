import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { SCENES } from './scenes';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { KANA_EPISODES } from '../../data/kana';
import { KANA_SCRIPTS } from '../../data/scripts/kana';
import { MOJI1_PRELUDE } from '../../data/scripts/moji1';
import { MOJI_SCRIPTS } from '../../data/mojiScripts';
import { MOJI_FINALE_SCRIPTS } from '../../data/mojiFinaleScripts';
import { parseRuby } from '../../lib/ruby';
import { glyphIsSigns, signReading, signRuby } from './signReading';

const withSigns = Object.entries(SCENES).filter(([, def]) => def.signs);

describe('scene signs (2026-10-02「書く ことで 町の 景色が 変わる」)', () => {
  it('measure their spots on the real picture size', async () => {
    for (const [id, def] of withSigns) {
      const meta = await sharp(`public/${def.photo}`).metadata();
      expect([meta.width, meta.height], id).toEqual([...def.signs!.image]);
      for (const s of def.signs!.spots) {
        expect(s.x + s.w, `${id} ${s.char}`).toBeLessThanOrEqual(def.signs!.image[0]);
        expect(s.y + s.h, `${id} ${s.char}`).toBeLessThanOrEqual(def.signs!.image[1]);
      }
    }
  });

  it('give every written 1章 kanji a sign in its episode’s scene', () => {
    for (const ep of MOJI_EPISODES.filter((e) => e.kanji.length && SCENES[e.bg]?.signs)) {
      const chars = SCENES[ep.bg].signs!.spots.map((s) => s.char);
      for (const k of ep.kanji) expect(chars, `${ep.id} ${k}`).toContain(k);
    }
  });

  it('light every kana episode’s letters in the scene it opens in', () => {
    for (const ep of KANA_EPISODES) {
      const scene = KANA_SCRIPTS[ep.id].intro.lines[0].bg!;
      const chars = SCENES[scene].signs?.spots.map((s) => s.char) ?? [];
      expect(chars, ep.id).toEqual(ep.kana);
    }
  });

  it('keep hung boards inside the middle of the picture, above the characters', () => {
    for (const [id, def] of withSigns.filter(([, d]) => d.signs!.style === 'hang')) {
      const [w, h] = def.signs!.image;
      for (const s of def.signs!.spots) {
        expect(s.x, `${id} ${s.char}`).toBeGreaterThanOrEqual(w * 0.08);
        expect(s.x + s.w, `${id} ${s.char}`).toBeLessThanOrEqual(w * 0.92);
        expect(s.y + s.h, `${id} ${s.char}`).toBeLessThanOrEqual(h * 0.4);
      }
    }
  });
});

describe('signs stay on screen', () => {
  it('slide a tall page sideways so every sign of the station calendar fits a narrow phone', async () => {
    const { signPageX } = await import('./hasSign');
    const signs = SCENES.naniwa_town_station.signs!;
    // 390×844: the page covers the box at 1.172×, 469 px wide.
    const pageW = 469;
    const boxW = 390;
    const x = signPageX(signs, pageW, boxW)!;
    const k = pageW / signs.image[0];
    for (const s of signs.spots) {
      expect(x + s.x * k, s.char).toBeGreaterThanOrEqual(0);
      expect(x + (s.x + s.w) * k, s.char).toBeLessThanOrEqual(boxW + 0.5);
    }
    // Not cut sideways: nothing to slide.
    expect(signPageX(signs, 375, 375)).toBeNull();
  });
});

describe('a sign reads its letter as the story does there (2026-10-10「読みが 合わない…ほかに ないか」)', () => {
  it('lets the signs stand for a big glyph only when they say the same, readings and all', () => {
    const calendar = SCENES.naniwa_town_station.signs!.spots;
    expect(glyphIsSigns('日(にち) 月(げつ) 火(か) 水(すい) 木(もく)', calendar)).toBe(true);
    // The calendar's 水 is すい (水曜日): a 水(みず) glyph is drawn, not left to the sign.
    expect(glyphIsSigns('水(みず)', calendar)).toBe(false);
    // 山田さん's name is やまだ; the map's 田 is た.
    expect(glyphIsSigns('山(やま)田(だ)', SCENES.naniwa_station_square.signs!.spots)).toBe(false);
  });

  it('gives a letter the story lists in a scene the reading its sign shows there', () => {
    const scripts = [MOJI1_PRELUDE, ...Object.values(MOJI_SCRIPTS).flatMap((s) => [s.intro, s.encounter, s.outro]), ...Object.values(MOJI_FINALE_SCRIPTS).flatMap((f) => (f ? [f.intro, f.outro] : []))];
    const bad: string[] = [];
    for (const s of scripts) {
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) scene = l.bg;
        const spots = SCENES[scene]?.signs?.spots ?? [];
        const segs = parseRuby(l.glyph ?? '');
        segs.forEach((seg, i) => {
          // A letter on its own — not part of a word (山(やま)田(だ), 主(しゅ)食(しょく)) — that has a sign here.
          const alone = !segs[i - 1]?.reading && !segs[i + 1]?.reading;
          const spot = spots.find((p) => p.char === seg.text);
          if (seg.reading && alone && spot && signReading(spot) !== seg.reading) bad.push(`${s.stageId} ${scene}: ${seg.text}(${seg.reading}), sign ${signRuby(spot)}`);
        });
      }
    }
    expect(bad).toEqual([]);
  });
});
