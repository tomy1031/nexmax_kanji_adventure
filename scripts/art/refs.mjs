/**
 * Gather the reference images that are not in the repo, into art-src/ref/.
 *
 *   node scripts/art/refs.mjs
 *
 * - The placeholder SVGs of ソネ・ナラ・イグーチ, as PNG (image generators
 *   take raster references): art-src/ref/{sone,nara,iguchi}.png
 * - Panels of the original manga「夢を信じたネクマックス」(nextmake.site),
 *   the canon for the 現代編 cast: the self-introduction page (#1) and the
 *   seniors with the ▲ and ▭ faces (#4).
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'art-src/ref';
mkdirSync(OUT, { recursive: true });

for (const who of ['sone', 'nara', 'iguchi']) {
  await sharp(`public/img/chara/gendai/${who}.svg`, { density: 200 })
    .resize(1024, 1366, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(`${OUT}/${who}.png`);
  console.log(`✔ ${OUT}/${who}.png`);
}

const MANGA = {
  'manga_1_5.jpg': 'https://nextmake.site/wp-content/uploads/2025/07/5-.jpg', // #1 自己紹介（ソネ・ナラ・イグーチ）
  'manga_1_5_3.jpg': 'https://nextmake.site/wp-content/uploads/2025/07/5-3.jpg', // #1「おれたちも 一緒だよ」
  'manga_4_03.jpg': 'https://nextmake.site/wp-content/uploads/2026/05/03.jpg', // #4 ▭ の 先輩
  'manga_4_05.jpg': 'https://nextmake.site/wp-content/uploads/2026/05/05.jpg', // #4 ▲ と ▭ の 先輩
};
for (const [name, url] of Object.entries(MANGA)) {
  const to = `${OUT}/${name}`;
  if (existsSync(to)) {
    console.log(`= ${to}（ある）`);
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(to, Buffer.from(await res.arrayBuffer()));
    console.log(`✔ ${to}`);
  } catch (e) {
    console.log(`✘ ${to} — ${e.message}。ブラウザで ${url} を 開いて 保存する`);
  }
}
