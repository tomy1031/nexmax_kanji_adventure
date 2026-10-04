/**
 * Where the face is on every portrait the story's name plate shows
 * (features/novel/NamePlate.tsx, look "night"), so the round frame centres on
 * the face instead of one fixed crop for all (2026-10-04「g-plate-face の 顔
 * 位置が ずれている」).
 *
 *   node scripts/face_crops.mjs            → src/data/faceCrops.generated.ts
 *   node scripts/face_crops.mjs --preview out.png
 *
 * The face is found on a small copy of each cut-out picture: the largest patch
 * of skin in the upper part (people), else the largest patch of near-white
 * there (Nexmax's face screen), else the top of the figure (Mojikui). A
 * picture listed in OVERRIDES is placed by hand.
 */
import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'node:fs';

const DIRS = [
  ['img/chara/naniwa', () => true],
  ['img/battle', (f) => f.startsWith('mojikui')],
];
const OUT = 'src/data/faceCrops.generated.ts';
const W = 96;

/** By hand, for pictures the search gets wrong: [x, y, size] as shares of the picture's width / height / width. */
const OVERRIDES = {
  // A held card or sign, or a raised hand, reads as the face.
  'img/chara/naniwa/folk_ropeway_happy.webp': [0.52, 0.26, 0.4],
  'img/chara/naniwa/folk_ropeway_trouble.webp': [0.57, 0.24, 0.38],
  'img/chara/naniwa/folk_sora_papa_trouble.webp': [0.5, 0.26, 0.38],
  'img/chara/naniwa/folk_vendor_happy.webp': [0.54, 0.26, 0.4],
  'img/chara/naniwa/folk_vendor_trouble.webp': [0.53, 0.23, 0.38],
  'img/chara/naniwa/folk_keeper_trouble.webp': [0.52, 0.3, 0.38],
  // モジクイ（docs/design/13）: 肌色が なく、お札や 煙が 顔の 上に ある。1体ずつ 顔の 形が ちがう ので 手で。
  'img/battle/mojikui.webp': [0.43, 0.43, 0.4],
  'img/battle/mojikui_kid.webp': [0.34, 0.42, 0.5],
  'img/battle/mojikui_clock.webp': [0.58, 0.44, 0.4],
  'img/battle/mojikui_gear.webp': [0.5, 0.34, 0.42],
  'img/battle/mojikui_price.webp': [0.5, 0.38, 0.4],
  'img/battle/mojikui_nametag.webp': [0.52, 0.28, 0.36],
  'img/battle/mojikui_book.webp': [0.28, 0.33, 0.4],
  'img/battle/mojikui_clocktower.webp': [0.53, 0.17, 0.34],
  'img/battle/mojikui_signboard.webp': [0.43, 0.47, 0.42],
  'img/battle/mojikui_bus.webp': [0.53, 0.44, 0.42],
  'img/battle/mojikui_station.webp': [0.42, 0.22, 0.36],
  'img/battle/mojikui_boss.webp': [0.5, 0.16, 0.34],
  'img/battle/mojikui_scale.webp': [0.39, 0.29, 0.38],
  'img/battle/mojikui_paint.webp': [0.65, 0.24, 0.38],
  'img/battle/mojikui_stairs.webp': [0.35, 0.36, 0.4],
  'img/battle/mojikui_hungry.webp': [0.45, 0.3, 0.45],
  'img/battle/mojikui_arrow.webp': [0.47, 0.32, 0.4],
  'img/battle/mojikui_park.webp': [0.5, 0.36, 0.42],
  'img/battle/mojikui_newspaper.webp': [0.45, 0.26, 0.38],
  'img/battle/mojikui_diary.webp': [0.43, 0.33, 0.4],
  'img/battle/mojikui_camera.webp': [0.47, 0.32, 0.4],
  'img/battle/mojikui_film.webp': [0.58, 0.32, 0.4],
};

// Bright peach: cream paper (r ≈ g) and wood (dark, very orange) are left out.
const isSkin = (r, g, b) => r > 215 && g > 150 && r - g >= 18 && g - b >= 8 && r - b <= 100;
const isWhite = (r, g, b) => r > 225 && g > 225 && b > 225;

const components = (mask, w, h) => {
  const seen = new Uint8Array(w * h);
  const out = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || seen[i]) continue;
    const stack = [i];
    seen[i] = 1;
    let n = 0, minx = w, maxx = 0, miny = h, maxy = 0, sy = 0;
    while (stack.length) {
      const j = stack.pop();
      const x = j % w, y = (j / w) | 0;
      n++; sy += y;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      for (const k of [j - 1, j + 1, j - w, j + w]) {
        if (k < 0 || k >= w * h || seen[k] || !mask[k]) continue;
        if ((k === j - 1 && x === 0) || (k === j + 1 && x === w - 1)) continue;
        seen[k] = 1;
        stack.push(k);
      }
    }
    out.push({ n, minx, maxx, miny, maxy, cy: sy / n });
  }
  return out;
};

export const findFace = async (file) => {
  const { data, info } = await sharp(`public/${file}`).resize({ width: W }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const h = info.height;
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
  let top = h, bottom = 0, left = W, right = 0;
  for (let i = 0; i < W * h; i++) {
    if (px(i)[3] < 128) continue;
    const x = i % W, y = (i / W) | 0;
    if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x;
  }
  const tall = bottom - top + 1;
  const pick = (test, min, share) => {
    const mask = new Uint8Array(W * h);
    for (let i = 0; i < W * h; i++) {
      const [r, g, b, a] = px(i);
      mask[i] = a >= 128 && test(r, g, b) ? 1 : 0;
    }
    // The face: of the bigger patches (hands held up are smaller), the one highest up.
    const found = components(mask, W, h).filter((c) => c.n >= min && c.cy < top + tall * share);
    const most = Math.max(0, ...found.map((c) => c.n));
    return found.filter((c) => c.n >= most * 0.45).sort((a, b) => a.miny - b.miny)[0];
  };
  const face = pick(isSkin, 14, 0.6) ?? pick(isWhite, 30, 0.5);
  let x, y, size;
  if (face) {
    const fw = face.maxx - face.minx + 1, fh = face.maxy - face.miny + 1;
    x = (face.minx + fw / 2) / W;
    // A face patch is cheeks to chin; the eyes sit a little above its middle.
    y = (face.miny + fh * 0.45) / h;
    size = (Math.max(fw, fh) * 1.5) / W;
  } else {
    // No face colour (Mojikui): the top of the figure, across its middle.
    x = (left + right + 1) / 2 / W;
    y = (top + tall * 0.25) / h;
    size = ((right - left + 1) * 0.6) / W;
  }
  const o = OVERRIDES[file];
  if (o) [x, y, size] = o;
  const r3 = (n) => Math.round(n * 1000) / 1000;
  // A chibi head is about a third of the picture's width: never zoom in further than that.
  return [r3(x), r3(y), r3(Math.min(1, Math.max(0.32, size))), r3(h / W)];
};

const files = DIRS.flatMap(([dir, keep]) => readdirSync(`public/${dir}`).filter((f) => f.endsWith('.webp') && keep(f)).map((f) => `${dir}/${f}`)).sort();
const crops = {};
for (const f of files) crops[f] = await findFace(f);

const preview = process.argv.indexOf('--preview');
if (preview > 0) {
  // What the plate shows: a 34px round window, drawn 3× bigger.
  const F = 34, Z = 3, tiles = [];
  for (const f of files) {
    const [x, y, size, aspect] = crops[f];
    const iw = Math.round(F / size), ih = Math.round(iw * aspect);
    const left = Math.round(x * iw - F / 2), top = Math.round(y * ih - F / 2);
    const big = await sharp(`public/${f}`).resize(iw, ih).png().toBuffer();
    const pad = await sharp({ create: { width: iw + F * 2, height: ih + F * 2, channels: 4, background: '#2c2a6b' } }).composite([{ input: big, left: F, top: F }]).png().toBuffer();
    tiles.push(await sharp(pad).extract({ left: left + F, top: top + F, width: F, height: F }).resize(F * Z, F * Z).flatten({ background: '#2c2a6b' }).png().toBuffer());
  }
  const cols = 10, S = F * Z + 4;
  await sharp({ create: { width: S * cols, height: S * Math.ceil(tiles.length / cols), channels: 3, background: '#000' } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * S, top: Math.floor(i / cols) * S })))
    .png()
    .toFile(process.argv[preview + 1]);
  console.log(files.map((f, i) => `${i}:${f.split('/').pop()}`).join(' '));
} else {
  const body = files.map((f) => `  ${JSON.stringify(f)}: [${crops[f].join(', ')}],`).join('\n');
  writeFileSync(
    OUT,
    `// GENERATED by scripts/face_crops.mjs — do not edit by hand. Run it again after adding or changing a portrait.
/** Portrait → [face x, face y, face size, height / width]: shares of the picture's width, height and width. */
export const FACE_CROPS: Record<string, readonly [number, number, number, number]> = {
${body}
};
`,
  );
  console.log(`wrote ${OUT}: ${files.length} portraits`);
}
