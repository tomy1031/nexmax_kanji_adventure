/**
 * Build the compound-word (熟語) table the forge rewards.
 *
 * Source: EDICT2 from the Electronic Dictionary Research & Development Group
 * (http://ftp.edrdg.org/pub/Nihongo/edict2.gz), CC BY-SA 4.0. The file is not
 * committed; fetch it first:
 *
 *   curl -sSL -o /tmp/edict2.gz http://ftp.edrdg.org/pub/Nihongo/edict2.gz
 *   gunzip -f /tmp/edict2.gz && iconv -f EUC-JP -t UTF-8 /tmp/edict2 > /tmp/edict2.utf8
 *   for l in n5 n4 n3 n2; do curl -sSL -o /tmp/jlpt_$l.csv \
 *     https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/$l.csv; done
 *   node scripts/build_compounds.mjs /tmp/edict2.utf8 /tmp
 *
 * 2026-09-23: 「実在する漢字がちょっと怪しいものが多い」. EDICT's frequency flag
 * alone let through words no learner meets (中前, 一女, 高見) and a few that
 * should never be shown (土人). A word now has to be in the JLPT N5–N2
 * vocabulary lists (open-anki-jlpt-decks, MIT) as well — the words a learner
 * of this level actually meets — plus a short hand-checked list of everyday
 * words those lists miss (EVERYDAY below).
 *
 * Output: src/data/compounds.generated.ts — every 2- and 3-kanji word that can
 * be written using only the kanji the game teaches, with its reading and a
 * short English gloss. This is what turns "combine two kanji" from a lookup
 * table someone had to invent into something the language already says.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2] ?? '/tmp/edict2';
const jlptDir = process.argv[3] ?? '/tmp';

/** One CSV row, honouring double-quoted fields. */
const csvRow = (line) => {
  const out = [];
  let cur = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
};

/**
 * Words in the JLPT N5–N2 vocabulary lists, with the list's reading and
 * first meaning — the pair taught at this level. The lists write suru-verbs
 * with their する (入学 → にゅうがくする); the noun is what the forge names.
 */
const JLPT = new Map();
for (const level of ['n5', 'n4', 'n3', 'n2']) {
  for (const line of readFileSync(`${jlptDir}/jlpt_${level}.csv`, 'utf8').split('\n').slice(1)) {
    const [word, reading, meaning] = csvRow(line);
    if (!word || !reading || JLPT.has(word)) continue;
    const gloss = (meaning ?? '')
      .replace(/\([^)]*\)?/g, '')
      .split(/[,;]/)[0]
      .replace(/^(a|an|the|to) /i, '')
      .replace(/\s+/g, ' ')
      .trim();
    JLPT.set(word, { reading: reading.replace(/する$/, ''), gloss });
  }
}

/** Where the list's reading is not the one a beginner should meet first. */
const READING = { 日本: 'にほん' };

/**
 * Everyday words the JLPT lists happen to miss, checked by hand: they are
 * words a child would say, and the story or the station signs of 現代編 use
 * them.
 */
const EVERYDAY = new Set([
  '大雨', '小雨', '小川', '休日', '外食', '男女', '水中', '中国', '出前',
  '東口', '西口', '南口', '北口', '雨水', '山道', '日本語', '一年生', '本日',
]);

/** Never shown, whatever the lists say. */
const NEVER = new Set(['土人', '外人', '白人', '愛人', '女中', '何分']);
const OUT = 'src/data/compounds.generated.ts';

// Read the character set straight out of the generated module rather than
// importing it, so this script stays runnable by plain node.
const generated = readFileSync('src/data/kanji.generated.ts', 'utf8');
const LEVEL = new Map(
  [...generated.matchAll(/char:"(.)", level:"(N[345])"/g)].map((m) => [m[1], m[2]]),
);
if (LEVEL.size === 0) {
  throw new Error('no kanji found in src/data/kanji.generated.ts — run build_kanji_data.mjs first');
}
const OWNED = new Set(LEVEL.keys());
const KANJI_ONLY = /^[一-龯]{2,3}$/;

// EDICT tags that mark a sense we should not put in front of a learner.
const REJECT_TAGS = /\((?:vulg|derog|sl|obs|obsc|arch|rare|X|sK|iK|ok|ik|oK)\)/;
// Parts of speech worth keeping: nouns and noun-like words make weapon names.
const KEEP_POS = /\((?:[^)]*\b(?:n|n-adv|n-t|adj-no|adj-na|vs)\b[^)]*)\)/;

/**
 * The first sense of an entry.
 *
 * EDICT packs every sense of a word into one line, numbered (1), (2), … A
 * common word often carries an archaic or rare minor sense — 先生 has an
 * archaic "one's elder" as sense 4 — and judging the whole line by those tags
 * threw away the word entirely. Only the first sense is ever shown to the
 * learner, so only the first sense is judged.
 */
const firstSense = (body) => {
  const second = body.search(/\(2\)/);
  return second === -1 ? body : body.slice(0, second);
};

const lines = readFileSync(src, 'utf8').split('\n');

/** @type {Map<string, {word:string, reading:string, gloss:string, priority:boolean}>} */
const found = new Map();

for (const line of lines) {
  if (!line || line.startsWith('　')) continue;

  // 表記1;表記2 [よみ] /(pos) gloss/gloss/
  const m = line.match(/^([^\s[]+)\s+(?:\[([^\]]+)\]\s+)?\/(.*)\/?$/);
  if (!m) continue;
  const [, headwords, readingField, body] = m;

  const sense = firstSense(body);
  if (REJECT_TAGS.test(sense)) continue;
  if (!KEEP_POS.test(sense)) continue;

  // (P) marks a high-frequency entry — these are the words worth rewarding.
  const priority = /\/\(P\)\//.test(line) || body.includes('(P)');

  const word = headwords.split(';')[0].replace(/\([^)]*\)/g, '');
  if (!KANJI_ONLY.test(word)) continue;
  if (![...word].every((c) => OWNED.has(c))) continue;

  const reading = (readingField ?? '').split(';')[0].replace(/\([^)]*\)/g, '').trim();
  if (!reading) continue;

  // First gloss only, trimmed of EDICT's bracketed metadata.
  const gloss = sense
    .split('/')
    .map((g) => g.replace(/\([^)]*\)/g, '').trim())
    .filter((g) => g && !/^[A-Z]{1,4}$/.test(g))[0];
  if (!gloss || gloss.length > 40) continue;

  const existing = found.get(word);
  if (!existing || (priority && !existing.priority)) {
    found.set(word, { word, reading, gloss, priority });
  }
}

// Order: shortest first, then priority words, then alphabetical by reading —
// deterministic so the generated file does not churn between runs.
const all = [...found.values()].sort(
  (a, b) =>
    a.word.length - b.word.length ||
    Number(b.priority) - Number(a.priority) ||
    a.word.localeCompare(b.word, 'ja'),
);

/** The hardest level among a word's characters — the word's own level. */
const levelOf = (word) => {
  const ranks = [...word].map((c) => ({ N5: 0, N4: 1, N3: 2 })[LEVEL.get(c)] ?? 2);
  return ['N5', 'N4', 'N3'][Math.max(...ranks)];
};

// Only EDICT's high-frequency entries. The full set is 20k words deep and
// mostly words a learner at this level will never meet; rewarding 愛寒 the
// same as 火山 would teach the wrong thing, and the table has to ship to a
// phone.
const rows = all
  .filter((w) => (JLPT.has(w.word) || EVERYDAY.has(w.word)) && !NEVER.has(w.word))
  // The JLPT list's reading is the one taught at this level (一日 = いちにち).
  .map((w) => {
    const j = JLPT.get(w.word);
    return {
      ...w,
      reading: READING[w.word] ?? j?.reading ?? w.reading,
      gloss: j?.gloss || w.gloss,
      level: levelOf(w.word),
    };
  })
  // Glosses carrying a subject tag ({astron}, {chem}) are specialist senses.
  .filter((w) => !/[{}]/.test(w.gloss) && /^[ぁ-ん]+$/.test(w.reading));
const two = rows.filter((r) => r.word.length === 2).length;
const three = rows.length - two;
const byLevel = rows.reduce((a, r) => ({ ...a, [r.level]: (a[r.level] ?? 0) + 1 }), {});

// Packed one word per line as word|reading|gloss|level, parsed once on first
// use. Object literals for the same data cost roughly three times as much.
const packed = rows.map((r) => `${r.word}|${r.reading}|${r.gloss.replace(/\|/g, '/')}|${r.level}`).join('\n');

writeFileSync(
  OUT,
  `// GENERATED by scripts/build_compounds.mjs — do not edit by hand.
// Source: EDICT2 (Electronic Dictionary Research & Development Group), CC BY-SA 4.0.
// Learner-level compounds (JLPT N5–N2 vocabulary) writable with the game's ${LEVEL.size} kanji:
// ${rows.length} words (${two} two-character, ${three} three-character)
// N5:${byLevel.N5 ?? 0} / N4:${byLevel.N4 ?? 0} / N3:${byLevel.N3 ?? 0}
import type { Compound } from '../types/forge';
import type { JlptLevel } from '../types/kanji';

/** word|reading|gloss|level, one per line. */
const PACKED = ${JSON.stringify(packed)};

let cache: readonly Compound[] | null = null;

/** The compound table, parsed on first use. */
export const getCompounds = (): readonly Compound[] => {
  if (cache) return cache;
  cache = PACKED.split('\\n').map((line) => {
    const [word, reading, gloss, level] = line.split('|');
    return { word, reading, gloss, level: level as JlptLevel, common: true };
  });
  return cache;
};
`,
);

console.log(
  `wrote ${OUT}: ${rows.length} learner-level compounds (${two} 2-char, ${three} 3-char) — N5:${byLevel.N5 ?? 0} N4:${byLevel.N4 ?? 0} N3:${byLevel.N3 ?? 0}`,
);
