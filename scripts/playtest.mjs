/**
 * Walks the game the way a learner would and screenshots each step.
 *
 * Runs against a preview server. The writing canvas cannot be driven by
 * synthetic strokes, so the drill is satisfied by seeding the save with owned
 * kanji before the forge and battle steps — everything else is real clicks.
 *
 *   npm run preview &
 *   node scripts/playtest.mjs [baseURL] [outDir]
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173/nexmax_kanji_adventure/';
const OUT = process.argv[3] ?? 'playtest';
const CHROMIUM = process.env.E2E_CHROMIUM_PATH || undefined;
const STEP_TIMEOUT = 8000;

mkdirSync(OUT, { recursive: true });

// Seed ids are read out of the generated data rather than typed here, so a
// rename in the dataset cannot leave this script silently seeding nothing.
const generated = readFileSync('src/data/kanji.generated.ts', 'utf8');
const idFor = (char) => {
  const m = generated.match(new RegExp(`\\{ id:"([^"]+)", char:"${char}"`));
  if (!m) throw new Error(`no kanji id for ${char} — regenerate src/data/kanji.generated.ts`);
  return m[1];
};
// Stage 1's nine characters (so the battle is reachable without simulating
// handwriting) plus a few more that make real compounds in the forge.
const SEED_CHARS = [...'一二三人日大小上下山川木火水土本'];
const SEED_KANJI = SEED_CHARS.map(idFor);

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  📸 ${name}`);
};

/** Click, but never hang: a miss is reported and the walk continues. */
const tryClick = async (page, locator, label) => {
  try {
    await locator.click({ timeout: STEP_TIMEOUT });
    return true;
  } catch {
    console.log(`  ⚠ could not click: ${label}`);
    return false;
  }
};

const seedSave = (page) =>
  page.evaluate((ids) => {
    const key = 'nexmax-kanji-adventure';
    const raw = JSON.parse(localStorage.getItem(key) ?? '{"state":{},"version":1}');
    const now = Date.now();
    raw.state = raw.state ?? {};
    raw.state.progress = raw.state.progress ?? {};
    for (const id of ids) {
      raw.state.progress[id] = {
        reps: 10,
        mistakes: 0,
        streak: 3,
        nextReview: now + 86400000,
        intervalDays: 1,
        obtainedAt: now,
      };
    }
    raw.state.gems = 300;
    localStorage.setItem(key, JSON.stringify(raw));
  }, SEED_KANJI);

/**
 * Hash routes do not reload the page, so the zustand store keeps whatever it
 * hydrated at first load. Any navigation that must pick up a seeded save has
 * to go through a real reload.
 */
const hardGoto = async (page, hash) => {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
};

const run = async () => {
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    // Required in the container: no user namespace for the sandbox, and
    // /dev/shm is too small for Chromium's default shared memory.
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, // a real phone
    deviceScaleFactor: 2,
  });
  page.setDefaultTimeout(STEP_TIMEOUT);

  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });

  console.log('▶ title');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01-title');

  console.log('▶ map');
  await tryClick(page, page.getByRole('button', { name: /はじめる|つづきから/ }), 'start');
  await page.waitForTimeout(600);
  await shot(page, '02-map');

  console.log('▶ story');
  await tryClick(page, page.getByRole('button', { name: /田.*んぼの 村/ }), 'stage 1');
  await page.waitForTimeout(900);
  await shot(page, '03-story');

  for (let i = 0; i < 5; i++) {
    await tryClick(page, page.getByRole('button', { name: 'つぎへ' }), 'advance');
    await page.waitForTimeout(250);
  }
  await shot(page, '04-story-choice');

  console.log('▶ drill');
  await tryClick(page, page.getByRole('button', { name: 'とばす' }), 'skip story');
  await page.waitForTimeout(1500);
  await shot(page, '05-drill');

  console.log('▶ seeding save');
  await seedSave(page);

  console.log('▶ forge');
  await hardGoto(page, '#/forge');
  await shot(page, '06-forge');

  // 火 + 山 = 火山, a real word: the reward path.
  const grid = page.locator('.grid button');
  await tryClick(page, grid.filter({ hasText: /^火$/ }).first(), '火');
  await page.waitForTimeout(200);
  await tryClick(page, grid.filter({ hasText: /^山$/ }).first(), '山');
  await page.waitForTimeout(600);
  await shot(page, '07-forge-kazan');

  await tryClick(page, page.getByRole('button', { name: /^作.*る$/ }), 'craft');
  await page.waitForTimeout(800);
  await shot(page, '08-forge-made');
  await page.mouse.click(195, 90);
  await page.waitForTimeout(400);

  // 山 + 火 = not a word: the contrast that teaches the rule.
  await hardGoto(page, '#/forge');
  await tryClick(page, grid.filter({ hasText: /^山$/ }).first(), '山');
  await page.waitForTimeout(200);
  await tryClick(page, grid.filter({ hasText: /^火$/ }).first(), '火');
  await page.waitForTimeout(600);
  await shot(page, '09-forge-not-a-word');

  console.log('▶ collection');
  await hardGoto(page, '#/collection');
  await shot(page, '10-collection');
  await tryClick(page, page.getByRole('button', { name: /なかま/ }), 'individuals tab');
  await page.waitForTimeout(400);
  await shot(page, '11-individuals');

  console.log('▶ gacha');
  await hardGoto(page, '#/gacha');
  await shot(page, '12-gacha');
  await tryClick(page, page.getByRole('button', { name: /ひく/ }), 'pull');
  await page.waitForTimeout(1600);
  await shot(page, '13-gacha-result');

  console.log('▶ daily');
  await hardGoto(page, '#/daily');
  await shot(page, '14-daily');

  console.log('▶ settings');
  await hardGoto(page, '#/settings');
  await shot(page, '15-settings');

  console.log('▶ battle');
  await hardGoto(page, '#/stage/mukashi-1');
  await tryClick(page, page.getByRole('button', { name: 'とばす' }), 'skip story');
  await page.waitForTimeout(1800);
  await shot(page, '16-battle');

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
