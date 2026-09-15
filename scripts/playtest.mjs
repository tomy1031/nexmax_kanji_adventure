/**
 * Walks the game the way a learner would and screenshots each step.
 *
 * Runs against a preview server (npm run preview). The writing canvas cannot
 * be driven by synthetic strokes, so the drill is satisfied by seeding the
 * save with owned kanji before the run — everything else is real clicks.
 *
 *   npm run preview &
 *   node scripts/playtest.mjs [baseURL] [outDir]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173/nexmax_kanji_adventure/';
const OUT = process.argv[3] ?? 'playtest';
const CHROMIUM = process.env.E2E_CHROMIUM_PATH || undefined;

mkdirSync(OUT, { recursive: true });

// The N5 characters the first stages teach, plus enough to make real words.
const SEED_KANJI = [
  'n5_one_hitotsu', 'n5_two_futatsu', 'n5_person_hito', 'n5_sun_hi', 'n5_big_ookii',
  'n5_small_chiisai', 'n5_above_ue', 'n5_below_shita', 'n5_mountain_yama', 'n5_river_kawa',
  'n5_tree_ki', 'n5_fire_hi', 'n5_water_mizu', 'n5_earth_tsuchi', 'n5_book_hon',
];

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  📸 ${name}`);
};

const run = async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, // a real phone
    deviceScaleFactor: 2,
  });

  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });

  console.log('▶ title');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01-title');

  console.log('▶ map');
  await page.getByRole('button', { name: /はじめる|つづきから/ }).click();
  await page.waitForTimeout(600);
  await shot(page, '02-map');

  console.log('▶ story');
  await page.getByRole('button', { name: /田.*んぼの 村/ }).click();
  await page.waitForTimeout(900);
  await shot(page, '03-story');

  // Advance a few lines to reach a choice.
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'つぎへ' }).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
  }
  await shot(page, '04-story-choice');

  console.log('▶ drill');
  await page.getByRole('button', { name: 'とばす' }).click();
  await page.waitForTimeout(1200);
  await shot(page, '05-drill');

  // Seed owned kanji so the forge and battle can be exercised without
  // simulating handwriting.
  console.log('▶ seeding save');
  await page.evaluate((ids) => {
    const key = 'nexmax-kanji-adventure';
    const raw = JSON.parse(localStorage.getItem(key) ?? '{"state":{},"version":1}');
    const now = Date.now();
    raw.state = raw.state ?? {};
    raw.state.progress = raw.state.progress ?? {};
    for (const id of ids) {
      raw.state.progress[id] = {
        reps: 10, mistakes: 0, streak: 3,
        nextReview: now + 86400000, intervalDays: 1, obtainedAt: now,
      };
    }
    raw.state.gems = 300;
    localStorage.setItem(key, JSON.stringify(raw));
  }, SEED_KANJI);

  console.log('▶ forge');
  await page.goto(`${BASE}#/forge`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, '06-forge-empty');

  // 火 + 山 = 火山, a real word.
  await page.getByRole('button', { name: '火', exact: true }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '山', exact: true }).first().click();
  await page.waitForTimeout(500);
  await shot(page, '07-forge-kazan');

  await page.getByRole('button', { name: /^作.*る$/ }).click();
  await page.waitForTimeout(700);
  await shot(page, '08-forge-made');
  await page.mouse.click(195, 100);
  await page.waitForTimeout(400);

  console.log('▶ collection');
  await page.goto(`${BASE}#/collection`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, '09-collection');
  await page.getByRole('button', { name: /なかま/ }).click();
  await page.waitForTimeout(400);
  await shot(page, '10-individuals');

  console.log('▶ gacha');
  await page.goto(`${BASE}#/gacha`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, '11-gacha');
  await page.getByRole('button', { name: /ひく/ }).click();
  await page.waitForTimeout(1400);
  await shot(page, '12-gacha-result');

  console.log('▶ daily');
  await page.goto(`${BASE}#/daily`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, '13-daily');

  console.log('▶ settings');
  await page.goto(`${BASE}#/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, '14-settings');

  console.log('▶ battle');
  await page.goto(`${BASE}#/stage/mukashi-1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'とばす' }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, '15-battle-or-drill');

  await browser.close();

  if (errors.length) {
    console.log(`\n❌ ${errors.length} browser error(s):`);
    for (const e of [...new Set(errors)].slice(0, 20)) console.log('   ' + e);
    process.exitCode = 1;
  } else {
    console.log('\n✅ no browser errors');
  }
};

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
