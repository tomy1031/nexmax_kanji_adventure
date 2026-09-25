/**
 * Kana stroke data for the writing drill (かな編, 08 §3.4).
 *
 * The kanji stroke files in public/kanji-data/ come from animCJK's
 * graphicsJa.txt. hanzi-writer-data-jp has no kana, but animCJK does:
 * graphicsJaKana.txt, same format. One thing needs fixing on the way through:
 * a kana stroke that crosses itself (the loop of あ, ぬ, の …) is stored as
 * several pieces, so あ has 4 "strokes" where a learner writes 3. The pieces
 * are named in the SVGs (z12354d3a, z12354d3b), so the pieces of one stroke
 * are joined back into one: the outlines side by side, and the median of the
 * first piece only — every piece already carries the whole stroke's median
 * (the later ones with a marked start), so joining them end to end would
 * make the learner draw the loop twice.
 *
 * Fetch animCJK's files first (not committed):
 *
 *   mkdir -p /tmp/animCJK/svgsJaKana && cd /tmp/animCJK
 *   curl -sSfO https://raw.githubusercontent.com/parsimonhi/animCJK/master/graphicsJaKana.txt
 *   for cp in $(node -e "for (const l of require('fs').readFileSync('graphicsJaKana.txt','utf8').trim().split('\n')) console.log(JSON.parse(l).character.codePointAt(0))"); do
 *     curl -sSf -o svgsJaKana/$cp.svg https://raw.githubusercontent.com/parsimonhi/animCJK/master/svgsJaKana/$cp.svg; done
 *   node scripts/build_kana_strokes.mjs /tmp/animCJK
 *
 * Output: public/kanji-data/<kana>.json, the same shape as the kanji files.
 * Licence: see docs/licenses.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2] ?? '/tmp/animCJK';
const OUT = 'public/kanji-data';

let written = 0;
let joined = 0;
for (const line of readFileSync(`${dir}/graphicsJaKana.txt`, 'utf8').trim().split('\n')) {
  const { character, strokes, medians } = JSON.parse(line);
  const cp = character.codePointAt(0);
  const svg = readFileSync(`${dir}/svgsJaKana/${cp}.svg`, 'utf8');
  // Stroke pieces, in drawing order: "d3a" -> stroke 3.
  const ids = [...svg.matchAll(new RegExp(`id="z${cp}d(\\d+)[a-z]?"`, 'g'))].map((m) => Number(m[1]));
  if (ids.length !== strokes.length) {
    throw new Error(`${character}: ${ids.length} stroke ids in the svg, ${strokes.length} in the graphics file`);
  }
  const out = { strokes: [], medians: [] };
  ids.forEach((n, i) => {
    if (n === out.strokes.length) {
      // Another piece of the stroke just started.
      out.strokes[n - 1] += ` ${strokes[i]}`;
      joined++;
    } else {
      out.strokes.push(strokes[i]);
      out.medians.push([...medians[i]]);
    }
  });
  writeFileSync(`${OUT}/${character}.json`, `${JSON.stringify(out)}\n`);
  written++;
}
console.log(`wrote ${written} kana to ${OUT}/ (${joined} stroke pieces joined)`);
