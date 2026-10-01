/**
 * Delivered UI art → web-sized WebP.
 *
 *   node scripts/prepare_ui_assets.mjs            # everything
 *   node scripts/prepare_ui_assets.mjs title      # one set
 *
 *   title       art-src/titlesozai/ → public/img/title/      (TitleScreen)
 *   kanjiyasan  art-src/kanjiyasan/ → public/img/kanjiyasan/ (ForgeScreen, 漢字やさん)
 *   battle      art-src/battle/     → public/img/battle/     (NaniwaBattleView, 文字が 消えた 町の たたかい)
 *   stageselect art-src/stageselect/ → public/img/stageselect/ (MojiRouteMap ステージせんたく, 0章の 背景)
 *
 * Every picture is written no larger than the screen ever shows it (about 2x
 * its largest CSS size). Re-runnable: it always overwrites.
 *
 * The PNGs are 1.4–3 MB each and stay out of git and out of public/ (anything
 * in public/ ships with the build); only the WebP this writes is committed.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync, statSync } from 'node:fs';

const only = process.argv[2];

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

const needIn = (dir) => (name) => {
  const file = `${dir}/${name}`;
  if (!existsSync(file)) throw new Error(`missing: ${file}`);
  return file;
};

const report = async (dir, names) => {
  let total = 0;
  for (const f of names) {
    const { size } = statSync(`${dir}/${f}`);
    total += size;
    const { width, height } = await sharp(`${dir}/${f}`).metadata();
    console.log(`${`${dir}/${f}`.padEnd(44)} ${String(width).padStart(5)}x${String(height).padEnd(5)} ${(size / 1024).toFixed(0)} KB`);
  }
  console.log(`${'total'.padEnd(56)} ${(total / 1024).toFixed(0)} KB\n`);
};

// ---------------------------------------------------------------- title --
const title = async () => {
  const need = needIn('art-src/titlesozai');
  const OUT = 'public/img/title';
  mkdirSync(OUT, { recursive: true });
  const out = [];

  // Backgrounds: opaque. The tall one for phones, the wide one for PCs and
  // tablets on their side; both kept at their delivered size.
  await sharp(need('06_背景素材_大阪の町.png')).webp({ quality: 76 }).toFile(`${OUT}/bg.webp`);
  out.push('bg.webp');
  await sharp(need('11_背景素材_大阪の町_PC.png')).webp({ quality: 76 }).toFile(`${OUT}/bg_wide.webp`);
  out.push('bg_wide.webp');

  // Logo and Nexmax: cut down to what is drawn, so the layout sizes the art
  // itself and not the empty margin around it. The logo is at most ~500 CSS
  // px wide, Nexmax at most ~260 px tall.
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
  // plates are drawn at the same scale. Blue is the one big button (≤ ~350
  // CSS px), brown the smaller ones (≤ ~250 px).
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
  await report(OUT, out);
};

// ----------------------------------------------------------- kanjiyasan --
const kanjiyasan = async () => {
  const need = needIn('art-src/kanjiyasan');
  const OUT = 'public/img/kanjiyasan';
  mkdirSync(OUT, { recursive: true });
  const out = [];

  // The workshop opening onto the city. Wide for PCs; for phones, the strip
  // from the anvil to the ferris wheel (x 280–840 of 1672).
  const BG = need('01_背景_鍛冶場と大阪風夜景.png');
  await sharp(BG).webp({ quality: 74 }).toFile(`${OUT}/bg_wide.webp`);
  out.push('bg_wide.webp');
  await sharp(BG).extract({ left: 280, top: 0, width: 560, height: 941 }).webp({ quality: 76 }).toFile(`${OUT}/bg_tall.webp`);
  out.push('bg_tall.webp');

  const SMITH = need('02_ネクマックス_鍛冶職人.png');
  await sharp(SMITH)
    .extract(padded(await alphaBox(SMITH), 6))
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 85 })
    .toFile(`${OUT}/nexmax_smith.webp`);
  out.push('nexmax_smith.webp');

  for (const [file, name, width] of [
    ['03_ボタン_もどる.png', 'btn_back.webp', 480],
    ['04_ボタン_つくる_金槌入り.png', 'btn_make.webp', 760],
  ]) {
    const f = need(file);
    await sharp(f)
      .extract(padded(await alphaBox(f), 6))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 85 })
      .toFile(`${OUT}/${name}`);
    out.push(name);
  }

  // The weapon card keeps its whole canvas: ForgeScreen places the name, the
  // stars and the rows by fractions of it. Its second row is drawn with a
  // leaf (木) in the circle; that is painted out with the circle's own dark
  // so the screen can put each element's icon there.
  const CARD = need('05_カードフレーム_武器カード_文字エリア空.png');
  const blankLeaf = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><circle cx="174" cy="1162" r="40" fill="rgb(28,27,25)"/></svg>',
  );
  const card = await sharp(CARD).composite([{ input: blankLeaf, top: 0, left: 0 }]).png().toBuffer();
  await sharp(card).resize({ width: 600 }).webp({ quality: 84, alphaQuality: 85 }).toFile(`${OUT}/card_frame.webp`);
  out.push('card_frame.webp');

  await sharp(need('06_カードフレーム_漢字枠_文字エリア空.png'))
    .resize({ width: 240 })
    .webp({ quality: 84, alphaQuality: 85 })
    .toFile(`${OUT}/kanji_frame.webp`);
  out.push('kanji_frame.webp');

  await report(OUT, out);
};

// --------------------------------------------------------------- battle --
const battle = async () => {
  const need = needIn('art-src/battle');
  const OUT = 'public/img/battle';
  mkdirSync(OUT, { recursive: true });
  const out = [];

  // The terrace at sunset. Wide for PCs. For phones only the sky, the city,
  // the river and the start of the terrace show above the deck of the frame,
  // so the tall copy is that band, from the Ferris wheel to past the sun.
  const BG = need('01_背景_蒸気都市テラス.png');
  await sharp(BG).webp({ quality: 74 }).toFile(`${OUT}/bg_wide.webp`);
  out.push('bg_wide.webp');
  await sharp(BG).extract({ left: 130, top: 0, width: 1000, height: 760 }).webp({ quality: 76 }).toFile(`${OUT}/bg_tall.webp`);
  out.push('bg_tall.webp');

  // The UI frame, cut in two across its empty middle (rows 600–700 are fully
  // transparent): the top holds the opponent's plate and bar and the corner
  // posts, the bottom the deck, Nexmax's plate and bar, the reading panel and
  // the writing board. Between them the screen can grow. Kept at the
  // delivered width: NaniwaBattleView places text by these pixels.
  const FRAME = need('02_UIフレーム.png');
  await sharp(FRAME).extract({ left: 0, top: 0, width: 941, height: 660 }).webp({ quality: 84, alphaQuality: 88 }).toFile(`${OUT}/frame_top.webp`);
  out.push('frame_top.webp');
  await sharp(FRAME).extract({ left: 0, top: 660, width: 941, height: 1012 }).webp({ quality: 84, alphaQuality: 88 }).toFile(`${OUT}/frame_bottom.webp`);
  out.push('frame_bottom.webp');

  // Nexmax with the brush and the opponent keep their whole canvas, so the
  // view's anchor points (the chest, the face) stay where they were measured.
  for (const [file, name] of [
    ['03_ネクマックス_魔法筆.png', 'nexmax_brush.webp'],
    ['04_敵_モジクイ.png', 'mojikui.webp'],
  ]) {
    await sharp(need(file)).resize({ width: 600 }).webp({ quality: 84, alphaQuality: 88 }).toFile(`${OUT}/${name}`);
    out.push(name);
  }

  const BACK = need('06_ボタン_もどる.png');
  await sharp(BACK)
    .extract(padded(await alphaBox(BACK), 6))
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 85 })
    .toFile(`${OUT}/btn_back.webp`);
  out.push('btn_back.webp');

  await report(OUT, out);
};

// ---------------------------------------------------------- stageselect --
const stageselect = async () => {
  const need = needIn('art-src/stageselect');
  const OUT = 'public/img/stageselect';
  mkdirSync(OUT, { recursive: true });
  const out = [];

  // The airport at sunset: the stage select's sky, and 0章「はじまりの 空港」's
  // picture-book page (scenes.ts). A night copy for kana-5 (the lights are
  // out), and a soft wide copy for the window around the column on a PC.
  const BG = need('01_背景_空港.png');
  await sharp(BG).webp({ quality: 76 }).toFile(`${OUT}/bg_tall.webp`);
  out.push('bg_tall.webp');
  await sharp(BG)
    .modulate({ brightness: 0.42, saturation: 0.7 })
    .composite([{ input: { create: { width: 941, height: 1672, channels: 4, background: { r: 18, g: 22, b: 70, alpha: 0.35 } } }, blend: 'over' }])
    .webp({ quality: 74 })
    .toFile(`${OUT}/bg_night.webp`);
  out.push('bg_night.webp');
  await sharp(BG)
    .extract({ left: 0, top: 300, width: 941, height: 529 })
    .resize(1672, 941)
    .blur(14)
    .modulate({ brightness: 0.7 })
    .webp({ quality: 60 })
    .toFile(`${OUT}/bg_wide.webp`);
  out.push('bg_wide.webp');

  const SIGN = need('02_看板_ステージせんたく.png');
  await sharp(SIGN).extract(padded(await alphaBox(SIGN), 6)).resize({ width: 1000 }).webp({ quality: 84, alphaQuality: 88 }).toFile(`${OUT}/sign.webp`);
  out.push('sign.webp');

  // Kept on its whole canvas: the screen places it by the canvas.
  await sharp(need('03_ネクマックス_旅.png')).resize({ width: 520 }).webp({ quality: 84, alphaQuality: 88 }).toFile(`${OUT}/nexmax_travel.webp`);
  out.push('nexmax_travel.webp');

  // The old map, without its brass frame: the band from the tower to below the
  // castle, as wide as the screen and down to its bottom (the menu stands on
  // it), with a torn top edge like the example.
  const MAP = need('04_古地図.png');
  const crop = { left: 30, top: 271, width: 1026, height: 962 };
  let edge = 'M0 26';
  for (let x = 0, i = 0; x <= crop.width; x += 18, i++) edge += ` L${x} ${(i * 37) % 23 + 4}`;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${crop.width}" height="${crop.height}"><path d="${edge} L${crop.width} ${crop.height} L0 ${crop.height} Z" fill="#fff"/></svg>`,
  );
  // (sharp resizes before it composites, so the mask goes on first, in its own pass)
  const torn = await sharp(await sharp(MAP).extract(crop).png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(torn)
    .resize({ width: 941 })
    .webp({ quality: 78, alphaQuality: 85 })
    .toFile(`${OUT}/map.webp`);
  out.push('map.webp');

  // The five cards keep their canvas (1536 × 1024): the stars are placed on it.
  for (const [file, name] of [
    ['05_カード_ひらがな.png', 'card_hiragana.webp'],
    ['06_カード_カタカナ.png', 'card_katakana.webp'],
    ['07_カード_N5.png', 'card_n5.webp'],
    ['08_カード_N4.png', 'card_n4.webp'],
    ['09_カード_N3.png', 'card_n3.webp'],
  ]) {
    await sharp(need(file)).resize({ width: 720 }).webp({ quality: 80, alphaQuality: 85 }).toFile(`${OUT}/${name}`);
    out.push(name);
  }

  const MENU = need('10_メニュー.png');
  await sharp(MENU).extract(padded(await alphaBox(MENU), 6)).resize({ width: 1300 }).webp({ quality: 82, alphaQuality: 85 }).toFile(`${OUT}/menu.webp`);
  out.push('menu.webp');

  await report(OUT, out);
};

if (!only || only === 'title') await title();
if (!only || only === 'kanjiyasan') await kanjiyasan();
if (!only || only === 'battle') await battle();
if (!only || only === 'stageselect') await stageselect();
