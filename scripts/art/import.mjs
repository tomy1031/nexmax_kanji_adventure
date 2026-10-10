/**
 * Turn generated pictures (art-src/<id>.png) into the web files the game loads.
 *
 *   node scripts/art/import.mjs            # everything found in art-src/
 *   node scripts/art/import.mjs nx_think   # one entry
 *
 * By kind (see manifest.mjs):
 *   chara   white background removed (flood fill from the edges, so white
 *           inside the character — NexMax's face-screen — stays), trimmed,
 *           fit in 768x1152, WebP with alpha. With `matchFrame` (the same
 *           pose redrawn) it is laid on that picture's canvas instead, in its
 *           figure's box; `flatWhite` also clears flat white shut inside it
 *   enemy   the same, fit in 512x512
 *   prop    a thing on its own (a weapon): the same cut-out, trimmed, fit inside 512x512
 *           (white shut inside it is cleared too, unless the entry says keepWhite)
 *   bg      cover-cropped to 800x1440 (the picture-book page, 400x720 at 2x)
 *   fg      as bg, keeping transparency; a raw file with no alpha is keyed
 *           on #00FF00
 *   map-half  the top and bottom halves stacked into one tall map, 800x2600
 *   icon    icon-512x512.png, icon-192x192.png, apple-touch-icon.png and favicon-48.png in public/, opaque
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';
import { ASSETS } from './manifest.mjs';

const only = process.argv[2];
const rawOf = (id) => ['png', 'jpg', 'jpeg', 'webp'].map((e) => `art-src/${id}.${e}`).find(existsSync);
const ensureDir = (file) => mkdirSync(dirname(file), { recursive: true });

/** RGBA pixels of a file, plus whether it already carries real transparency. */
const load = async (file, w, h) => {
  // Transparency is judged on the file itself: the padding a resize adds (a
  // square picture into a tall box) is not the picture being transparent.
  const own = await sharp(file).ensureAlpha().raw().toBuffer();
  let transparent = false;
  for (let i = 3; i < own.length; i += 4) if (own[i] < 250) { transparent = true; break; }
  let img = sharp(file).ensureAlpha();
  if (w && h) img = img.resize(w, h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, info, transparent };
};

/** Clear the background that touches the border (flood fill). */
const floodClear = (data, w, h, isBg) => {
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isBg(i)) continue;
    seen[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  for (let i = 0; i < w * h; i++) {
    if (seen[i]) data[i * 4 + 3] = 0;
    else {
      const x = i % w;
      const rim = (x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (i >= w && seen[i - w]) || (i < w * (h - 1) && seen[i + w]);
      if (rim) data[i * 4 + 3] = Math.min(data[i * 4 + 3], 150);
    }
  }
};

/**
 * Background shut inside the picture — the gap between a bow and its string —
 * that a flood from the edges cannot reach: large patches of flat, pure white.
 * Only for things (prop) and the Mojikui (enemy group: an ink body with no
 * white of its own, where the white shut between its wisps showed as specks):
 * a person's white shirt and Nexmax's face-screen must stay.
 */
const clearEnclosedWhite = (data, w, h, minArea) => {
  const pure = (i) => data[i * 4 + 3] > 0 && data[i * 4] >= 250 && data[i * 4 + 1] >= 250 && data[i * 4 + 2] >= 250;
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !pure(start)) continue;
    const region = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      region.push(i);
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j >= 0 && j < w * h && !seen[j] && pure(j)) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (region.length >= minArea) for (const i of region) data[i * 4 + 3] = 0;
  }
};

/**
 * The background shut inside a character — the white between ★4 Nexmax's
 * ink swirl and his body (nexmax_brush_star4) — told from his own white by
 * how flat it is: a big patch that is mostly pure white. The face-screen,
 * the brush's bristles and the ink's highlights are shaded, so they stay.
 */
const clearFlatWhite = (data, w, h, { minArea = 2000, flat = 0.6, T = 236 } = {}) => {
  const near = (i) => data[i * 4 + 3] > 0 && data[i * 4] >= T && data[i * 4 + 1] >= T && data[i * 4 + 2] >= T;
  const pure = (i) => data[i * 4] >= 253 && data[i * 4 + 1] >= 253 && data[i * 4 + 2] >= 253;
  const seen = new Uint8Array(w * h);
  const cleared = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !near(start)) continue;
    const region = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      region.push(i);
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j >= 0 && j < w * h && !seen[j] && near(j)) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (region.length >= minArea && region.filter(pure).length >= flat * region.length) for (const i of region) cleared[i] = 1;
  }
  // As floodClear: the cleared patch goes, and the pixels on its rim are softened.
  for (let i = 0; i < w * h; i++) {
    if (cleared[i]) data[i * 4 + 3] = 0;
    else {
      const x = i % w;
      const rim = (x > 0 && cleared[i - 1]) || (x < w - 1 && cleared[i + 1]) || (i >= w && cleared[i - w]) || (i < w * (h - 1) && cleared[i + w]);
      if (rim) data[i * 4 + 3] = Math.min(data[i * 4 + 3], 150);
    }
  }
};

const cutOut = async (file, { enclosed = false, minArea = 2500, flatWhite = false } = {}) => {
  const { data, info, transparent } = await load(file, 1024, 1536);
  if (!transparent) {
    const T = 236;
    floodClear(data, info.width, info.height, (i) => data[i * 4 + 3] < 16 || (data[i * 4] >= T && data[i * 4 + 1] >= T && data[i * 4 + 2] >= T));
    if (enclosed) clearEnclosedWhite(data, info.width, info.height, minArea);
    if (flatWhite) clearFlatWhite(data, info.width, info.height);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 });
};

const greenKey = async (file) => {
  const { data, info, transparent } = await load(file);
  if (!transparent) {
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const lead = g - Math.max(r, b);
      // The key itself, and the anti-aliased rim right next to it. Leaves and
      // grass are green too, but never this close to pure #00FF00.
      if (g > 200 && lead > 150) data[i + 3] = 0;
      else if (g > 160 && lead > 100) {
        data[i + 3] = Math.round(data[i + 3] * 0.5);
        data[i + 1] = Math.max(r, b) + 30;
      }
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
};

/** The box (left, top, width, height) of a picture's visible pixels. */
const alphaBox = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 16) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, W: info.width, H: info.height };
};

/**
 * matchFrame: the same pose redrawn (★4, docs/design/21) laid on the original
 * picture's canvas, its figure in the original's box — as tall, centred, on
 * the same feet — so whatever the game lays over the original (gearLayout.ts)
 * sits on the new one too.
 */
const onFrameOf = async (cut, frameFile) => {
  const box = await alphaBox(frameFile);
  const fit = await sharp(await cut.png().toBuffer())
    .resize(box.width, box.height, { fit: 'inside' })
    .png()
    .toBuffer();
  const { width: w, height: h } = await sharp(fit).metadata();
  return sharp({ create: { width: box.W, height: box.H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([
    { input: fit, left: Math.round(box.left + (box.width - w) / 2), top: box.top + box.height - h },
  ]);
};

const done = [];
const skipped = [];
const mapsTouched = new Set();

for (const a of ASSETS) {
  if (only && a.id !== only) continue;
  const raw = rawOf(a.id);
  if (!raw) {
    if (only) skipped.push(`${a.id}: art-src/${a.id}.png が 無い`);
    continue;
  }
  const out = `public/${a.out}`;
  ensureDir(out);
  if (a.kind === 'chara' && a.matchFrame) {
    const img = await cutOut(raw, { flatWhite: a.flatWhite });
    await (await onFrameOf(img, a.matchFrame)).webp({ quality: 88, alphaQuality: 90 }).toFile(out);
  } else if (a.kind === 'chara') {
    const img = await cutOut(raw, a.group === 'enemy' ? { enclosed: true, minArea: 300 } : {});
    await (await img.png().toBuffer().then((b) => sharp(b)))
      .resize(768, 1152, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(out);
  } else if (a.kind === 'enemy') {
    const img = await cutOut(raw);
    await (await img.png().toBuffer().then((b) => sharp(b)))
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(out);
  } else if (a.kind === 'prop') {
    // keepWhite: glass and paper, whose own white highlights are not background.
    const img = await cutOut(raw, { enclosed: !a.keepWhite });
    await (await img.png().toBuffer().then((b) => sharp(b)))
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(out);
  } else if (a.kind === 'bg') {
    await sharp(raw).resize(800, 1440, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(out);
  } else if (a.kind === 'fg') {
    const img = await greenKey(raw);
    await (await img.png().toBuffer().then((b) => sharp(b)))
      .resize(800, 1440, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85, alphaQuality: 90 })
      .toFile(out);
  } else if (a.kind === 'map-half') {
    mapsTouched.add(a.out);
    continue;
  } else if (a.kind === 'icon') {
    // Opaque: a transparent corner shows as black on some home screens.
    const sizes = { 'icon-512x512.png': 512, 'icon-192x192.png': 192, 'apple-touch-icon.png': 180, 'favicon-48.png': 48 };
    for (const [file, px] of Object.entries(sizes)) {
      await sharp(raw).flatten({ background: '#1b1f4a' }).resize(px, px, { fit: 'cover' }).png({ palette: true, quality: 92, compressionLevel: 9 }).toFile(`public/${file}`);
    }
    // Maskable: the launcher may crop to a circle, so the art sits inside the safe 80%.
    await sharp(raw)
      .resize(410, 410)
      .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#1b1f4a' })
      .flatten({ background: '#1b1f4a' })
      .png({ palette: true, quality: 92, compressionLevel: 9 })
      .toFile('public/icon-maskable-512.png');
    done.push(`${a.id} → public/${Object.keys(sizes).join(', public/')}, public/icon-maskable-512.png`);
    continue;
  }
  done.push(`${a.id} → ${out}`);
}

// Maps: both halves needed.
for (const out of mapsTouched) {
  const halves = ASSETS.filter((a) => a.out === out);
  const top = rawOf(halves.find((a) => a.half === 'top').id);
  const bottom = rawOf(halves.find((a) => a.half === 'bottom').id);
  if (!top || !bottom) {
    skipped.push(`${out}: 上と 下の 両方が 要る（${halves.map((h) => h.id).join(' / ')}）`);
    continue;
  }
  const [t, b] = await Promise.all([top, bottom].map((f) => sharp(f).resize(1024, 1536, { fit: 'cover' }).toBuffer()));
  const tall = await sharp({ create: { width: 1024, height: 3072, channels: 3, background: '#88c070' } })
    .composite([
      { input: t, top: 0, left: 0 },
      { input: b, top: 1536, left: 0 },
    ])
    .png()
    .toBuffer();
  ensureDir(`public/${out}`);
  await sharp(tall).resize(800, 2600, { fit: 'cover' }).webp({ quality: 82 }).toFile(`public/${out}`);
  done.push(`${halves.map((h) => h.id).join(' + ')} → public/${out}`);
}

for (const d of done) console.log(`✔ ${d}`);
for (const s of skipped) console.log(`… ${s}`);
if (!done.length && !skipped.length) console.log('art-src/ に 取り込む 画像が ありません（node scripts/art/prompt.mjs --todo で 一覧）');
console.log('\nつぎ: docs/画像素材リスト.md §5 の とおり ゲームに つなぐ');
