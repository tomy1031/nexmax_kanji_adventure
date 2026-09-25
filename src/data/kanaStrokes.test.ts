import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { HIRAGANA, KATAKANA, KANA_LENIENCY } from './kana';

/**
 * The kana drill must accept a beginner's writing (2026-09-26: 「ひらがな判定が
 * 厳し過ぎます。あもかけませんでした」). The cause was the stroke data: a loop
 * stroke joined from animCJK's pieces carried its median twice, so only
 * drawing the loop twice could match. These tests run hanzi-writer's own
 * matcher on the shipped files.
 */

type Pt = { x: number; y: number };
type Matcher = {
  strokeMatches: (s: { points: Pt[] }, c: unknown, n: number, o: { leniency: number }) => { isMatch: boolean };
  parseCharData: (ch: string, data: unknown) => unknown;
};

// hanzi-writer keeps its matcher private; lift it out of the published bundle.
const loadMatcher = (): Matcher => {
  const src = readFileSync('node_modules/hanzi-writer/dist/hanzi-writer.js', 'utf8')
    .replace(/var HanziWriter = /, 'return ')
    .replace(/return HanziWriter;\s*\}\(\)\);\s*$/, 'return { strokeMatches, parseCharData };\n}());');
  return new Function('global', 'window', src)(globalThis, undefined) as Matcher;
};

const KANA = [...HIRAGANA, ...KATAKANA];
const load = (k: string): { strokes: string[]; medians: number[][][] } =>
  JSON.parse(readFileSync(`public/kanji-data/${k}.json`, 'utf8'));

describe('kana stroke data', () => {
  it('never runs a stroke’s path twice', () => {
    const doubled = KANA.filter((k) =>
      load(k).medians.some((m) => new Set(m.map((p) => p.join(','))).size < m.length),
    );
    expect(doubled).toEqual([]);
  });

  it('accepts shaky writing along each stroke', () => {
    const { strokeMatches, parseCharData } = loadMatcher();
    let seed = 42;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    // A hand that is a little off in size and place, and wobbles as it goes.
    const shaky = (med: number[][], sc: number, ox: number, oy: number): Pt[] => {
      const pts: number[][] = [];
      for (let i = 0; i < med.length - 1; i++)
        for (let t = 0; t < 1; t += 0.2) pts.push([med[i][0] + (med[i + 1][0] - med[i][0]) * t, med[i][1] + (med[i + 1][1] - med[i][1]) * t]);
      pts.push(med[med.length - 1]);
      let dx = 0;
      let dy = 0;
      return pts.map(([x, y]) => {
        dx = dx * 0.8 + gauss() * 27;
        dy = dy * 0.8 + gauss() * 27;
        return { x: 512 + (x - 512) * sc + ox + dx, y: 390 + (y - 390) * sc + oy + dy };
      });
    };

    const hard: string[] = [];
    for (const k of KANA) {
      const data = load(k);
      const c = parseCharData(k, data);
      let passed = 0;
      for (let t = 0; t < 10; t++) {
        const sc = 0.9 + rnd() * 0.2;
        const ox = gauss() * 30;
        const oy = gauss() * 30;
        let mistakes = 0;
        data.medians.forEach((m, s) => {
          for (let a = 0; a < 5 && !strokeMatches({ points: shaky(m, sc, ox, oy) }, c, s, { leniency: KANA_LENIENCY }).isMatch; a++) mistakes++;
        });
        if (mistakes <= 2) passed++;
      }
      if (passed < 8) hard.push(`${k} ${passed}/10`);
    }
    expect(hard).toEqual([]);
  });
});
