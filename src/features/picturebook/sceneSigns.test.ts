import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { SCENES } from './scenes';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { KANA_EPISODES } from '../../data/kana';
import { KANA_SCRIPTS } from '../../data/scripts/kana';

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

  it('light kana-1’s letters at the airport where it opens', () => {
    const scene = KANA_SCRIPTS['kana-1'].intro.lines[0].bg!;
    const chars = SCENES[scene].signs?.spots.map((s) => s.char) ?? [];
    expect(chars).toEqual(KANA_EPISODES[0].kana);
  });
});
