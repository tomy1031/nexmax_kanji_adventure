/**
 * Makes cut-out (transparent background) copies of the character art.
 *
 * Several of the Nexmax poses in public/img/chara/ were delivered on a white
 * square. On the plain novel screen that did not matter; on the picture-book
 * scenes it shows as a white box. The character itself is never redrawn —
 * this only removes the white that touches the image border (a flood fill
 * from the edges), so white *inside* the character (the face plate, the eyes)
 * stays exactly as delivered.
 *
 *   node scripts/cutout_sprites.mjs
 *
 * Output: public/img/chara/cut/<name>.webp (512px, alpha).
 */
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const SRC = 'public/img/chara';
const OUT = join(SRC, 'cut');
const SIZE = 512;
/** How close to white a pixel must be to count as background. */
const THRESHOLD = 236;

mkdirSync(OUT, { recursive: true });

const files = [
  ...readdirSync(SRC)
    .filter((f) => f.endsWith('.webp') && f !== 'variants_sheet.webp')
    .map((f) => join(SRC, f)),
  join(SRC, 'types/ISTJ.webp'),
  join(SRC, 'types/ISFJ_f.webp'),
];

for (const file of files) {
  const { data, info } = await sharp(file)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  const isBg = (i) => {
    const a = data[i * 4 + 3];
    if (a < 16) return true;
    return data[i * 4] >= THRESHOLD && data[i * 4 + 1] >= THRESHOLD && data[i * 4 + 2] >= THRESHOLD;
  };

  // Flood fill from every border pixel.
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isBg(i)) continue;
    seen[i] = 1;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  // Clear the background, and soften the one-pixel rim next to it so the
  // edge does not keep a white halo.
  for (let i = 0; i < w * h; i++) {
    if (seen[i]) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const x = i % w;
    const nearBg =
      (x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (i >= w && seen[i - w]) || (i < w * (h - 1) && seen[i + w]);
    if (nearBg) data[i * 4 + 3] = Math.min(data[i * 4 + 3], 150);
  }

  // Trim the empty margin so every pose stands on the same baseline.
  const out = join(OUT, basename(file));
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(out);
  console.log(`✂ ${out}`);
}
