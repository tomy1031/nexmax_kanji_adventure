/**
 * Which readings of each kanji a learner at this level actually meets.
 *
 * 2026-09-24: 「やしろ（社 しゃ が正しい）とか、レベルに適切でない読みを
 * 与えてるものもある」. The kanji table lists every reading a dictionary
 * gives (社: シャ / やしろ), in the dictionary's order. Which one to show
 * first cannot come from that order; it has to come from the words the
 * learner will read. This script aligns every word in the JLPT N5–N2
 * vocabulary lists with its reading, kanji by kanji, and records which
 * reading of each kanji the word uses.
 *
 *   node scripts/build_readings.mjs /tmp   (the jlpt_n5..n2.csv files; see build_compounds.mjs)
 *
 * Output: src/data/readings.generated.ts — per kanji, the readings in use,
 * each with the lowest JLPT level it appears at, how many words use it, and
 * the most basic word that shows it, in furigana notation (for the
 * fill-in prompt in battle).
 * Words that do not align (jukujikun such as 大人・今日) are skipped.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2] ?? '/tmp';
const OUT = 'src/data/readings.generated.ts';

const csvRow = (line) => {
  const out = [];
  let cur = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
};

const kataToHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const isKana = (c) => /[ぁ-んァ-ヶー]/.test(c);

// The kanji table: char -> [{ key, stem, okuri }]
const table = readFileSync('src/data/kanji.generated.ts', 'utf8');
const KANJI = new Map();
for (const m of table.matchAll(/char:"(.)", level:"(N\d)", on:\[([^\]]*)\], kun:\[([^\]]*)\]/g)) {
  const list = (s) => [...s.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const readings = [];
  for (const on of list(m[3])) readings.push({ key: on, stem: kataToHira(on), okuri: '', kind: 'on' });
  for (const kun of list(m[4])) {
    const k = kun.match(/^([^()]*)\(([^)]*)\)$/);
    readings.push({ key: kun, stem: k ? k[1] : kun, okuri: k ? k[2] : '', kind: 'kun' });
  }
  KANJI.set(m[1], { level: m[2], readings });
}

const VOICE = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ' };
const HALF = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
/** The surface forms a reading can take inside a word: rendaku, sokuon. */
const variants = (stem, first, last) => {
  const out = new Set([stem]);
  if (!first) {
    const h = stem[0];
    if (VOICE[h]) out.add(VOICE[h] + stem.slice(1));
    if (HALF[h]) out.add(HALF[h] + stem.slice(1));
  }
  if (!last && stem.length >= 2 && /[つちくきー]$/.test(stem)) out.add(stem.slice(0, -1) + 'っ');
  for (const v of [...out]) if (!first && HALF[v[0]] === undefined && VOICE[v[0]] === undefined) out.add(v);
  return [...out];
};

/**
 * Align a word with its reading. Returns [{ char, key }] for the kanji whose
 * reading was matched, or null. Kanji outside the table match 1–4 kana.
 */
const align = (word, reading) => {
  const w = [...word];
  const r = kataToHira(reading);
  const go = (i, j, acc) => {
    if (i === w.length) return j === r.length ? acc : null;
    const c = w[i];
    if (isKana(c)) return kataToHira(c) === r[j] ? go(i + 1, j + 1, acc) : null;
    if (c === '々') {
      const prev = acc[acc.length - 1];
      if (!prev) return null;
      for (const v of variants(prev.surface, false, i === w.length - 1)) {
        if (r.startsWith(v, j)) {
          const got = go(i + 1, j + v.length, [...acc, { char: c, key: null, surface: v, i }]);
          if (got) return got;
        }
      }
      return null;
    }
    const k = KANJI.get(c);
    if (!k) {
      for (let n = 1; n <= 4 && j + n <= r.length; n++) {
        const got = go(i + 1, j + n, [...acc, { char: c, key: null, surface: r.slice(j, j + n), i }]);
        if (got) return got;
      }
      return null;
    }
    for (const rd of k.readings) {
      // The table's split of a kun reading is not always the spelling's
      // (くら(す) is written 暮らす), so any leading part of the whole kun
      // word may sit under the kanji when kana follow it in the word.
      const stems = rd.okuri
        ? [...new Set([rd.stem, ...[...(rd.stem + rd.okuri)].map((_, n, a) => a.slice(0, n + 1).join(''))])]
        : [rd.stem];
      for (const v of stems.flatMap((st) => variants(st, i === 0, i === w.length - 1))) {
        if (!r.startsWith(v, j)) continue;
        // A kun reading with okurigana must be followed by that okurigana's
        // first kana in the word (上がる・上げる both start with あ).
        if (rd.okuri && i + 1 < w.length && !isKana(w[i + 1])) continue;
        const got = go(i + 1, j + v.length, [...acc, { char: c, key: rd.key, surface: v, i }]);
        if (got) return got;
      }
    }
    return null;
  };
  return go(0, 0, []);
};

/** The word in furigana notation, from its alignment: 会(かい)社(しゃ), 大(おお)きい. */
const toRuby = (word, a) => {
  const byIndex = new Map(a.map((x) => [x.i, x.surface]));
  return [...word].map((c, i) => (byIndex.has(i) ? `${c}(${byIndex.get(i)})` : c)).join('');
};

const ORDER = { N5: 5, N4: 4, N3: 3, N2: 2 };
const seen = new Set();
const uses = new Map(); // char -> key -> { level, count, word, reading }
let aligned = 0;
let skipped = 0;
for (const level of ['n5', 'n4', 'n3', 'n2']) {
  const L = level.toUpperCase();
  for (const line of readFileSync(`${dir}/jlpt_${level}.csv`, 'utf8').split('\n').slice(1)) {
    const [word0, reading0] = csvRow(line);
    if (!word0 || !reading0) continue;
    // The lists write suru-verbs with する and give alternatives with ;
    const word = word0.split(/[;、,]/)[0].trim().replace(/する$/, '');
    const reading = reading0
      .split(/[;、,]/)[0]
      .replace(/\s*[(（][^)）]*[)）]/g, '')
      .trim()
      .replace(/する$/, '');
    if (!/[一-龯々]/.test(word) || /[～〜]/.test(word) || seen.has(word)) continue;
    seen.add(word);
    const a = align(word, reading);
    if (!a) {
      skipped++;
      continue;
    }
    aligned++;
    const ruby = toRuby(word, a);
    const kanjiCount = [...word].filter((c) => !isKana(c)).length;
    for (const { char, key } of a) {
      if (!key) continue;
      if (!uses.has(char)) uses.set(char, new Map());
      const m = uses.get(char);
      const u = m.get(key);
      // A word that is this kanji alone (山, 上, 大きい) — the reading a learner meets first.
      const alone = kanjiCount === 1 && [...word][0] === char;
      if (!u) m.set(key, { level: L, count: 1, ruby, alone, len: [...word].length });
      else {
        u.count++;
        u.alone ||= alone && ORDER[L] >= ORDER[u.level];
        // Keep the most basic example: lower level first, then the shorter word.
        if (ORDER[L] > ORDER[u.level] || (L === u.level && [...word].length < u.len)) Object.assign(u, { level: L, ruby, len: [...word].length });
      }
    }
  }
}

const rows = [];
for (const [char, k] of KANJI) {
  const m = uses.get(char) ?? new Map();
  // Most basic level first. Within a level: the kanji standing alone as a
  // word without okurigana (山 やま, 上 うえ) — then on'yomi (会社 の しゃ) —
  // then kun'yomi with okurigana (大きい), whose stem alone is not a word.
  const rank = (u) => (u.alone && !u.key.includes('(') ? 0 : /^[ァ-ヶ]/.test(u.key) ? 1 : 2);
  const list = [...m.entries()]
    .map(([key, u]) => ({ key, ...u }))
    .sort((a, b) => ORDER[b.level] - ORDER[a.level] || rank(a) - rank(b) || b.count - a.count);
  rows.push(`  ${JSON.stringify(char)}: ${JSON.stringify(list.map((u) => [u.key, u.level, u.count, u.ruby]))},`);
}

writeFileSync(
  OUT,
  `// GENERATED by scripts/build_readings.mjs — do not edit by hand.
// Source: JLPT N5–N2 vocabulary lists (open-anki-jlpt-decks, MIT), aligned kanji by kanji.
// ${aligned} words aligned, ${skipped} skipped (jukujikun and the like).
/** [reading as in the kanji table, lowest JLPT level, words using it, most basic word in furigana notation] */
export type ReadingUse = [string, 'N5' | 'N4' | 'N3' | 'N2', number, string];

/** Per kanji: the readings used in JLPT vocabulary, most basic first. */
export const READING_USE: Record<string, ReadingUse[]> = {
${rows.join('\n')}
};
`,
);
console.log(`wrote ${OUT}: ${aligned} aligned, ${skipped} skipped`);
