/**
 * Title-screen art: the delivered PNGs in `art-src/titlesozai/` (one per part
 * — backgrounds, logo, Nexmax, button plates) become WebP in
 * `public/img/title/`, each no larger than the screen ever shows it.
 * Re-runnable: it always overwrites.
 *
 *   node scripts/prepare_title_assets.mjs
 *
 * The PNGs are 1.4–3 MB each and stay out of git and out of public/ (anything
 * in public/ ships with the build); only the WebP this writes is committed.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync, statSync } from 'node:fs';

const SRC = 'art-src/titlesozai';
const OUT = 'public/img/title';
mkdirSync(OUT, { recursive: true });

/** Bounding box of the pixels that are not (almost) fully transparent. */
const alphaBox = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let left = w, top = h, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] <= 8) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return { left, top, right, bottom, w, h };
};

/** A box grown by `pad` px on every side, kept inside the picture. */
const padded = ({ left, top, right, bottom, w, h }, pad) => {
  const l = Math.max(0, left - pad);
  const t = Math.max(0, top - pad);
  return { left: l, top: t, width: Math.min(w - 1, right + pad) - l + 1, height: Math.min(h - 1, bottom + pad) - t + 1 };
};

const need = (name) => {
  const file = `${SRC}/${name}`;
  if (!existsSync(file)) throw new Error(`missing: ${file}`);
  return file;
};

const out = [];

// Backgrounds: opaque. The tall one for phones, the wide one for PCs and
// tablets on their side; both kept at their delivered size.
await sharp(need('06_背景素材_大阪の町.png')).webp({ quality: 76 }).toFile(`${OUT}/bg.webp`);
out.push('bg.webp');
await sharp(need('11_背景素材_大阪の町_PC.png')).webp({ quality: 76 }).toFile(`${OUT}/bg_wide.webp`);
out.push('bg_wide.webp');

// Logo and Nexmax: cut down to what is drawn, so the layout sizes the art
// itself and not the empty margin around it. The logo is at most ~500 CSS px
// wide, Nexmax at most ~260 px tall; 2x of that is plenty.
const LOGO = need('02_タイトルロゴ.png');
await sharp(LOGO)
  .extract(padded(await alphaBox(LOGO), 6))
  .resize({ width: 1000, withoutEnlargement: true })
  .webp({ quality: 80, alphaQuality: 85 })
  .toFile(`${OUT}/logo.webp`);
out.push('logo.webp');

const NEXMAX = need('01_ネクマックス_キャラクター.png');
await sharp(NEXMAX)
  .extract(padded(await alphaBox(NEXMAX), 6))
  .resize({ height: 600, withoutEnlargement: true })
  .webp({ quality: 84, alphaQuality: 85 })
  .toFile(`${OUT}/nexmax.webp`);
out.push('nexmax.webp');

// Buttons: all cut with the same box, so equal widths on screen mean the
// plates are drawn at the same scale. Blue is the one big button (≤ ~350 CSS
// px), brown the smaller ones (≤ ~250 px).
const BUTTONS = [
  ['07_ボタン_はじめから_青.png', 'btn_new_blue.webp', 760],
  ['08_ボタン_はじめから_茶.png', 'btn_new_brown.webp', 560],
  ['09_ボタン_つづきから_青.png', 'btn_continue_blue.webp', 760],
  ['10_ボタン_つづきから_茶.png', 'btn_continue_brown.webp', 560],
  ['05_ボタン_せってい.png', 'btn_settings.webp', 560],
].map(([file, name, width]) => [need(file), name, width]);
const boxes = await Promise.all(BUTTONS.map(([file]) => alphaBox(file)));
const union = boxes.reduce((a, b) => ({
  left: Math.min(a.left, b.left),
  top: Math.min(a.top, b.top),
  right: Math.max(a.right, b.right),
  bottom: Math.max(a.bottom, b.bottom),
  w: a.w,
  h: a.h,
}));
for (const [file, name, width] of BUTTONS) {
  await sharp(file)
    .extract(padded(union, 6))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 85 })
    .toFile(`${OUT}/${name}`);
  out.push(name);
}

let total = 0;
for (const f of out) {
  const { size } = statSync(`${OUT}/${f}`);
  total += size;
  const { width, height } = await sharp(`${OUT}/${f}`).metadata();
  console.log(`${f.padEnd(24)} ${String(width).padStart(5)}x${String(height).padEnd(5)} ${(size / 1024).toFixed(0)} KB`);
}
console.log(`${'total'.padEnd(36)} ${(total / 1024).toFixed(0)} KB`);
