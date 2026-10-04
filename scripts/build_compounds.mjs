/**
 * Build the compound-word (熟語) table the forge rewards.
 *
 * Source: JMdict (English) from the Electronic Dictionary Research &
 * Development Group, CC BY-SA 4.0 (credited in せってい). The file is not
 * committed; fetch it first:
 *
 *   curl -sSL -o /tmp/JMdict_e.gz http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz && gunzip -kf /tmp/JMdict_e.gz
 *   node scripts/build_compounds.mjs /tmp/JMdict_e
 *
 * Three tiers, in this order in the output:
 *
 *   0  the core (scripts/data/compounds_core.txt): the JLPT N5–N2 vocabulary
 *      a learner of this level meets, with the reading and gloss taught for
 *      it (2026-09-23「実在する漢字がちょっと怪しいものが多い」 — made with the
 *      JLPT lists, open-anki-jlpt-decks, MIT). Kanji cards show these first.
 *   1  every other everyday word JMdict marks common (ichi1・news1・spec1・
 *      spec2・gai1 on the written form — what EDICT prints as (P)).
 *   2  words from the newspaper frequency list's second half (news2), so a
 *      player who keeps combining finds more (2026-10-04「漢字の 組み合わせは
 *      今の 5倍は あると 思う。実際に ある 漢字を もっと 探して（会社員とか）」).
 *
 * Every word: 2 or 3 kanji, all of them taught by the game; a noun-like
 * first sense (it names a weapon); a common spelling (not 'usually kana',
 * not an irregular form); no vulgar, derogatory, archaic or jargon (baseball,
 * sumo, mahjong, shogi) sense; nothing about killing or death, and nothing in
 * NEVER — this is a game for teenagers, and a word becomes a weapon's name.
 *
 * Output: src/data/compounds.generated.ts (the core) and compounds.more.generated.ts
 * (the rest), read through src/data/compounds.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2] ?? '/tmp/JMdict_e';
const OUT = 'src/data/compounds.generated.ts';

/** Never shown, whatever the dictionary says. */
const NEVER = new Set([
  '土人', '外人', '白人', '愛人', '女中', '何分', '悪女', '情夫', '情婦', '売春', '買春', '売春婦', '遊女', '毒物', '毒薬',
  '麻薬', '薬物', '黒人', '原爆', '性交', '性病', '性的', '性欲', '性愛', '性教育', '同性愛', '発情', '浮気', '色気',
  '下半身', '乳首', '暴行', '自害', '心中', '入水', '中絶', '月経', '身重', '小便', '大便',
]);
/** Characters whose words are kept out (killing, death) — but for these everyday ones. */
const NEVER_CHAR = /[殺死葬遺]/;
const STILL_OK = new Set(['必死']);

const generated = readFileSync('src/data/kanji.generated.ts', 'utf8');
const LEVEL = new Map([...generated.matchAll(/char:"(.)", level:"(N[345])"/g)].map((m) => [m[1], m[2]]));
if (LEVEL.size === 0) throw new Error('no kanji found in src/data/kanji.generated.ts — run build_kanji_data.mjs first');
const OWNED = new Set(LEVEL.keys());
const writable = (w) => /^[一-龯]{2,3}$/.test(w) && [...w].every((c) => OWNED.has(c));
const allowed = (w) => !NEVER.has(w) && (STILL_OK.has(w) || !NEVER_CHAR.test(w));

/** The hardest level among a word's characters — the word's own level. */
const levelOf = (word) => ['N5', 'N4', 'N3'][Math.max(...[...word].map((c) => ({ N5: 0, N4: 1, N3: 2 })[LEVEL.get(c)] ?? 2))];

// --- tier 0: the core ---------------------------------------------------------
/** @type {Map<string, {word:string, reading:string, gloss:string, tier:number}>} */
const found = new Map();
for (const line of readFileSync('scripts/data/compounds_core.txt', 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const [word, reading, gloss] = line.split('|');
  if (writable(word) && allowed(word)) found.set(word, { word, reading, gloss, tier: 0 });
}

// --- tiers 1 and 2: JMdict -----------------------------------------------------
const all = (s, tag) => [...s.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'))].map((m) => m[1]);
const NOUNISH = /&(n|n-adv|n-t|adj-no|adj-na|vs);/;
const REJECT = /&(vulg|derog|sl|obs|obsc|arch|rare|X|sens|uk|baseb|sumo|mahj|shogi|abbr|col|joc);/;
const ODD_FORM = /&(iK|oK|ateji|ik|rK|sK|io);/;

for (const entry of readFileSync(src, 'utf8').split('<entry>').slice(1)) {
  const sense = (entry.split('<sense>')[1] ?? '').split('</sense>')[0];
  if (!NOUNISH.test(all(sense, 'pos').join(' '))) continue;
  if (REJECT.test([...all(sense, 'misc'), ...all(sense, 'field')].join(' '))) continue;
  const gloss = (all(sense, 'gloss')[0] ?? '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  if (!gloss || gloss.length > 40) continue;
  const readings = entry.split('<r_ele>').slice(1).map((r) => r.split('</r_ele>')[0]);

  for (const k of entry.split('<k_ele>').slice(1).map((x) => x.split('</k_ele>')[0])) {
    const word = all(k, 'keb')[0];
    if (!word || !writable(word) || !allowed(word) || found.has(word)) continue;
    if (ODD_FORM.test(all(k, 'ke_inf').join(' '))) continue;
    const pri = all(k, 'ke_pri').join(' ');
    const tier = /ichi1|news1|spec1|spec2|gai1/.test(pri) ? 1 : /news2/.test(pri) ? 2 : 0;
    if (!tier) continue;
    // The reading that belongs to this spelling (re_restr), not a kana-only one.
    const r = readings.find((x) => !x.includes('<re_nokanji') && (!x.includes('<re_restr>') || all(x, 're_restr').includes(word)));
    const reading = r ? all(r, 'reb')[0] : null;
    // A reading in katakana is a place or a borrowing (広東 カントン): not a word to learn here.
    if (!reading || !/^[ぁ-ゖー]+$/.test(reading)) continue;
    found.set(word, { word, reading, gloss, tier });
  }
}

// Order: the core first (cards show these), then common, then the rest; within
// a tier shortest first, then by the word — deterministic, so the file does
// not churn between runs.
const rows = [...found.values()].sort((a, b) => a.tier - b.tier || a.word.length - b.word.length || a.word.localeCompare(b.word, 'ja'));
const line = (w) => `${w.word}|${w.reading}|${w.gloss.replace(/\|/g, '/')}|${levelOf(w.word)}|${w.tier}`;
const core = rows.filter((r) => r.tier === 0);
const more = rows.filter((r) => r.tier > 0);
const counts = `${rows.length} words (core ${core.length}, common ${rows.filter((r) => r.tier === 1).length}, more ${rows.filter((r) => r.tier === 2).length})`;

// The core ships with the app; the rest is its own file, loaded right after
// start (src/data/compounds.ts) so the first screen does not wait for 6,000 words.
const body = `// Generated by scripts/build_compounds.mjs from the learner core
// (scripts/data/compounds_core.txt). Do not edit by hand. Read it through src/data/compounds.ts.
// ${counts}

// word|reading|gloss|level|tier — one per line.
export const CORE_PACKED = ${JSON.stringify(core.map(line).join('\n'))};
`;
const moreBody = `// Generated by scripts/build_compounds.mjs from JMdict (EDRDG, CC BY-SA 4.0).
// Do not edit by hand. Loaded after start by src/data/compounds.ts.

// word|reading|gloss|level|tier — one per line.
export const MORE_PACKED = ${JSON.stringify(more.map(line).join('\n'))};
`;
writeFileSync('src/data/compounds.more.generated.ts', moreBody);
writeFileSync(OUT, body);
console.log(`wrote ${counts} to ${OUT} and src/data/compounds.more.generated.ts`);
