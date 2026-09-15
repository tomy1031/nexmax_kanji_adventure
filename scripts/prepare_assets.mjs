/**
 * One-shot asset preparation.
 *
 * Takes the raw art dropped into `nexmax_kanji/` (the picture-book pages and
 * the title key art) plus the NexMax reference sheet, and writes web-sized
 * WebP into `public/img/`. Re-runnable: it always overwrites.
 *
 *   node scripts/prepare_assets.mjs
 */
import sharp from 'sharp';
import { mkdirSync, existsSync, statSync } from 'node:fs';

const SRC = 'nexmax_kanji';
mkdirSync('public/img/bg', { recursive: true });
mkdirSync('public/img/chara', { recursive: true });

// The six picture-book spreads, in story order. These are the canon for the
// N5 arc (むかし編) and stand in as its novel-scene backgrounds until the
// text-free versions are generated (see docs/skills/画像生成プロンプト.md).
const PAGES = [
  ['598251405647544359 (1).jpg', 'mukashi_village'],
  ['598251451516977599.jpg', 'mukashi_mountain'],
  ['598251467706990770.jpg', 'mukashi_wildpath'],
  ['598251480071275046.jpg', 'mukashi_portal'],
  ['598251492101325199 (1).jpg', 'mukashi_forest'],
  ['598251505204068951.jpg', 'mukashi_greattree'],
];

const out = [];
const emit = async (label, p) => {
  await p;
  out.push(label);
};

for (const [file, name] of PAGES) {
  const from = `${SRC}/${file}`;
  if (!existsSync(from)) {
    console.warn(`skip (missing): ${from}`);
    continue;
  }
  await emit(
    `bg/${name}.webp`,
    sharp(from).resize({ width: 1600 }).webp({ quality: 80 }).toFile(`public/img/bg/${name}.webp`),
  );
}

const TITLE = `${SRC}/bd32d364-9055-46a1-9217-16f6aceaddb1.png`;
if (existsSync(TITLE)) {
  await emit(
    'bg/title_keyart.webp',
    sharp(TITLE).resize({ width: 1440 }).webp({ quality: 80 }).toFile('public/img/bg/title_keyart.webp'),
  );
}

const SHEET = `${SRC}/ChatGPT Image 2025年7月25日 16_16_00.png`;
if (existsSync(SHEET)) {
  await emit(
    'chara/variants_sheet.webp',
    sharp(SHEET).resize({ width: 1024 }).webp({ quality: 82 }).toFile('public/img/chara/variants_sheet.webp'),
  );
}

// The 853 KB reference PNG is the style anchor for image generation, but the
// game only needs a display-sized copy.
if (existsSync('public/img/chara/reference.png')) {
  await emit(
    'chara/nexmax.webp',
    sharp('public/img/chara/reference.png')
      .resize({ width: 768 })
      .webp({ quality: 84 })
      .toFile('public/img/chara/nexmax.webp'),
  );
}

for (const f of out) {
  const { size } = statSync(`public/img/${f}`);
  console.log(`${f.padEnd(32)} ${(size / 1024).toFixed(0)} KB`);
}
