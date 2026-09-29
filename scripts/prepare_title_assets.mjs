/**
 * Title-screen art: the delivered PNGs in `public/img/titlesozai/` (one per
 * part — background, logo, Nexmax, three button plates) become web-sized WebP
 * in `public/img/title/`. Re-runnable: it always overwrites.
 *
 *   node scripts/prepare_title_assets.mjs
 *
 * The PNGs are 1.4–2.7 MB each and stay out of git, like art-src/; only the
 * WebP this writes is committed.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync, statSync } from 'node:fs';

const SRC = 'public/img/titlesozai';
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

// Background: opaque, already portrait. Kept at its delivered size.
await sharp(need('06_背景素材_大阪の町.png')).webp({ quality: 82 }).toFile(`${OUT}/bg.webp`);
out.push('bg.webp');

// Logo and Nexmax: cut down to what is drawn, so the layout sizes the art
// itself and not the empty margin around it.
const LOGO = need('02_タイトルロゴ.png');
await sharp(LOGO)
  .extract(padded(await alphaBox(LOGO), 6))
  .resize({ width: 1100, withoutEnlargement: true })
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile(`${OUT}/logo.webp`);
out.push('logo.webp');

const NEXMAX = need('01_ネクマックス_キャラクター.png');
await sharp(NEXMAX)
  .extract(padded(await alphaBox(NEXMAX), 6))
  .resize({ height: 720, withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 90 })
  .toFile(`${OUT}/nexmax.webp`);
out.push('nexmax.webp');

// Buttons: all three cut with the same box, so equal widths on screen mean
// the plates are drawn at the same scale.
const BUTTONS = [
  ['03_ボタン_はじめる.png', 'btn_start.webp'],
  ['04_ボタン_つづきから.png', 'btn_continue.webp'],
  ['05_ボタン_せってい.png', 'btn_settings.webp'],
].map(([file, name]) => [need(file), name]);
const boxes = await Promise.all(BUTTONS.map(([file]) => alphaBox(file)));
const union = boxes.reduce((a, b) => ({
  left: Math.min(a.left, b.left),
  top: Math.min(a.top, b.top),
  right: Math.max(a.right, b.right),
  bottom: Math.max(a.bottom, b.bottom),
  w: a.w,
  h: a.h,
}));
for (const [file, name] of BUTTONS) {
  await sharp(file)
    .extract(padded(union, 6))
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(`${OUT}/${name}`);
  out.push(name);
}

for (const f of out) {
  const { size } = statSync(`${OUT}/${f}`);
  const { width, height } = await sharp(`${OUT}/${f}`).metadata();
  console.log(`${f.padEnd(20)} ${String(width).padStart(5)}x${String(height).padEnd(5)} ${(size / 1024).toFixed(0)} KB`);
}
