import type { Compound } from '../types/forge';
import type { JlptLevel } from '../types/kanji';
import { getKanjiByChar } from '../lib/kanjiDb';

/**
 * Real words the dictionary pass (scripts/build_compounds.mjs) leaves out, so
 * the forge called them 言葉には なりません (2026-10-22「正しい 漢字が 正しくない の
 * 表示の まま」).
 *
 * - **Numbers with counters** — 百円・五時・十人・三百・何月. JMdict lists only
 *   a few of them (三時 but not 五時, 四人 but not 五人), and 1章 teaches
 *   一〜十・百・千・万・円 first, so they are the first words a learner tries.
 *   Built here by rule, with the sound changes (いっぽん・さんびゃく・よっか).
 * - **Everyday words JMdict files as a pronoun, an adverb or an abbreviation**
 *   (自分・全然・高校), which the build drops for not naming a thing.
 *
 * Every word keeps the forge's rules: 2 or 3 kanji, each one the game
 * teaches. Words the dictionary already has keep its entry (compounds.ts).
 */

/** 一〜十 as counted, with the plain reading. */
const DIGITS: { char: string; reading: string }[] = [
  { char: '一', reading: 'いち' },
  { char: '二', reading: 'に' },
  { char: '三', reading: 'さん' },
  { char: '四', reading: 'よん' },
  { char: '五', reading: 'ご' },
  { char: '六', reading: 'ろく' },
  { char: '七', reading: 'なな' },
  { char: '八', reading: 'はち' },
  { char: '九', reading: 'きゅう' },
  { char: '十', reading: 'じゅう' },
];

/** The characters the rules join on: 何 (what), 十, 万, 円. */
const WHAT_CHAR = '何';
const TEN_CHAR = '十';
const MAN_CHAR = '万';
const YEN_CHAR = '円';

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

/**
 * A counter after 一〜十: its readings one by one (the sound changes are the
 * point of learning them), and the English with `#` for the number.
 */
interface Counter {
  char: string;
  readings: readonly [string, string, string, string, string, string, string, string, string, string];
  gloss: (n: number) => string;
  /** 何 + the counter, when it is a word: its reading. */
  what?: string;
  whatGloss?: string;
}

const COUNTERS: Counter[] = [
  {
    char: '月',
    readings: ['いちがつ', 'にがつ', 'さんがつ', 'しがつ', 'ごがつ', 'ろくがつ', 'しちがつ', 'はちがつ', 'くがつ', 'じゅうがつ'],
    gloss: (n) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'][n - 1],
    what: 'なんがつ',
    whatGloss: 'what month',
  },
  {
    char: '日',
    readings: ['ついたち', 'ふつか', 'みっか', 'よっか', 'いつか', 'むいか', 'なのか', 'ようか', 'ここのか', 'とおか'],
    gloss: (n) => `${ORDINAL[n - 1]} day of the month`,
    what: 'なんにち',
    whatGloss: 'what day of the month',
  },
  {
    char: '時',
    readings: ['いちじ', 'にじ', 'さんじ', 'よじ', 'ごじ', 'ろくじ', 'しちじ', 'はちじ', 'くじ', 'じゅうじ'],
    gloss: (n) => `${n} o'clock`,
    what: 'なんじ',
    whatGloss: 'what time',
  },
  {
    char: '分',
    readings: ['いっぷん', 'にふん', 'さんぷん', 'よんぷん', 'ごふん', 'ろっぷん', 'ななふん', 'はっぷん', 'きゅうふん', 'じゅっぷん'],
    gloss: (n) => `${n} minute${n > 1 ? 's' : ''}`,
    what: 'なんぷん',
    whatGloss: 'how many minutes',
  },
  {
    char: '年',
    readings: ['いちねん', 'にねん', 'さんねん', 'よねん', 'ごねん', 'ろくねん', 'ななねん', 'はちねん', 'きゅうねん', 'じゅうねん'],
    gloss: (n) => `${n} year${n > 1 ? 's' : ''}`,
    what: 'なんねん',
    whatGloss: 'how many years',
  },
  {
    char: '人',
    readings: ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', 'ななにん', 'はちにん', 'きゅうにん', 'じゅうにん'],
    gloss: (n) => (n === 1 ? 'one person' : `${n} people`),
    what: 'なんにん',
    whatGloss: 'how many people',
  },
  {
    char: '円',
    readings: ['いちえん', 'にえん', 'さんえん', 'よえん', 'ごえん', 'ろくえん', 'ななえん', 'はちえん', 'きゅうえん', 'じゅうえん'],
    gloss: (n) => `${n} yen`,
    what: 'なんえん',
    whatGloss: 'how many yen',
  },
  {
    char: '回',
    readings: ['いっかい', 'にかい', 'さんかい', 'よんかい', 'ごかい', 'ろっかい', 'ななかい', 'はっかい', 'きゅうかい', 'じゅっかい'],
    gloss: (n) => (n === 1 ? 'once' : `${n} times`),
    what: 'なんかい',
    whatGloss: 'how many times',
  },
  {
    char: '本',
    readings: ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
    gloss: (n) => `${n} long thing${n > 1 ? 's' : ''} (pens, bottles)`,
    what: 'なんぼん',
    whatGloss: 'how many (long things)',
  },
  {
    char: '歳',
    readings: ['いっさい', 'にさい', 'さんさい', 'よんさい', 'ごさい', 'ろくさい', 'ななさい', 'はっさい', 'きゅうさい', 'じゅっさい'],
    gloss: (n) => `${n} year${n > 1 ? 's' : ''} old`,
    what: 'なんさい',
    whatGloss: 'how old',
  },
  {
    char: '番',
    readings: ['いちばん', 'にばん', 'さんばん', 'よんばん', 'ごばん', 'ろくばん', 'ななばん', 'はちばん', 'きゅうばん', 'じゅうばん'],
    gloss: (n) => `number ${n}`,
    what: 'なんばん',
    whatGloss: 'what number',
  },
  {
    char: '階',
    readings: ['いっかい', 'にかい', 'さんがい', 'よんかい', 'ごかい', 'ろっかい', 'ななかい', 'はっかい', 'きゅうかい', 'じゅっかい'],
    gloss: (n) => `${ORDINAL[n - 1]} floor`,
    what: 'なんがい',
    whatGloss: 'what floor',
  },
  {
    char: '台',
    readings: ['いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'],
    gloss: (n) => `${n} machine${n > 1 ? 's' : ''} (cars, computers)`,
    what: 'なんだい',
    whatGloss: 'how many (machines)',
  },
  {
    char: '枚',
    readings: ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'],
    gloss: (n) => `${n} flat thing${n > 1 ? 's' : ''} (paper, stamps)`,
    what: 'なんまい',
    whatGloss: 'how many (flat things)',
  },
  {
    char: '冊',
    readings: ['いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', 'ななさつ', 'はっさつ', 'きゅうさつ', 'じゅっさつ'],
    gloss: (n) => `${n} book${n > 1 ? 's' : ''}`,
    what: 'なんさつ',
    whatGloss: 'how many books',
  },
  {
    char: '杯',
    readings: ['いっぱい', 'にはい', 'さんばい', 'よんはい', 'ごはい', 'ろっぱい', 'ななはい', 'はっぱい', 'きゅうはい', 'じゅっぱい'],
    gloss: (n) => `${n} cup${n > 1 ? 's' : ''} (of drink)`,
    what: 'なんばい',
    whatGloss: 'how many cups',
  },
  {
    char: '度',
    readings: ['いちど', 'にど', 'さんど', 'よんど', 'ごど', 'ろくど', 'ななど', 'はちど', 'きゅうど', 'じゅうど'],
    gloss: (n) => (n === 1 ? 'once' : `${n} times`),
    what: 'なんど',
    whatGloss: 'how many times',
  },
  {
    char: '号',
    readings: ['いちごう', 'にごう', 'さんごう', 'よんごう', 'ごごう', 'ろくごう', 'ななごう', 'はちごう', 'きゅうごう', 'じゅうごう'],
    gloss: (n) => `number ${n}`,
    what: 'なんごう',
    whatGloss: 'what number',
  },
];

/** Counters of two kanji, for 一〜十 and 何: the second kanji's reading after the first's. */
const PAIR_COUNTERS: { word: string; first: Counter['readings']; tail: string; gloss: (n: number) => string; what?: string; whatGloss?: string; upTo?: number }[] = [
  {
    word: '時間',
    first: ['いちじ', 'にじ', 'さんじ', 'よじ', 'ごじ', 'ろくじ', 'しちじ', 'はちじ', 'くじ', 'じゅうじ'],
    tail: 'かん',
    gloss: (n) => `${n} hour${n > 1 ? 's' : ''}`,
    what: 'なんじかん',
    whatGloss: 'how many hours',
  },
  {
    word: '週間',
    first: ['いっしゅう', 'にしゅう', 'さんしゅう', 'よんしゅう', 'ごしゅう', 'ろくしゅう', 'ななしゅう', 'はっしゅう', 'きゅうしゅう', 'じゅっしゅう'],
    tail: 'かん',
    gloss: (n) => `${n} week${n > 1 ? 's' : ''}`,
    what: 'なんしゅうかん',
    whatGloss: 'how many weeks',
  },
  {
    word: '年生',
    first: ['いちねん', 'にねん', 'さんねん', 'よねん', 'ごねん', 'ろくねん', 'ななねん', 'はちねん', 'きゅうねん', 'じゅうねん'],
    tail: 'せい',
    gloss: (n) => `${ORDINAL[n - 1]}-year student`,
    what: 'なんねんせい',
    whatGloss: 'what year (at school)',
    upTo: 6,
  },
];

/** Tens, hundreds, thousands, ten thousands — the numbers themselves. */
const NUMBERS: { word: string; reading: string }[] = [
  ...DIGITS.slice(1, 9).map((d) => ({ word: d.char + TEN_CHAR, reading: `${d.reading}じゅう` })),
  { word: '百', reading: 'ひゃく' },
  { word: '二百', reading: 'にひゃく' },
  { word: '三百', reading: 'さんびゃく' },
  { word: '四百', reading: 'よんひゃく' },
  { word: '五百', reading: 'ごひゃく' },
  { word: '六百', reading: 'ろっぴゃく' },
  { word: '七百', reading: 'ななひゃく' },
  { word: '八百', reading: 'はっぴゃく' },
  { word: '九百', reading: 'きゅうひゃく' },
  { word: '千', reading: 'せん' },
  { word: '二千', reading: 'にせん' },
  { word: '三千', reading: 'さんぜん' },
  { word: '四千', reading: 'よんせん' },
  { word: '五千', reading: 'ごせん' },
  { word: '六千', reading: 'ろくせん' },
  { word: '七千', reading: 'ななせん' },
  { word: '八千', reading: 'はっせん' },
  { word: '九千', reading: 'きゅうせん' },
  ...DIGITS.map((d) => ({ word: d.char + MAN_CHAR, reading: `${d.reading}まん` })),
  { word: '百万', reading: 'ひゃくまん' },
  { word: '千万', reading: 'せんまん' },
];

const NUMBER_VALUE: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000 };
const valueOf = (word: string): number => {
  let total = 0;
  let digit = 0;
  for (const c of word) {
    const d = DIGITS.findIndex((x) => x.char === c);
    if (d !== -1 && c !== TEN_CHAR) digit = d + 1;
    else {
      const unit = NUMBER_VALUE[c];
      // 万 multiplies everything before it (十万・百万); 十・百・千 only the digit.
      total = unit === 10000 ? ((total + digit) || 1) * unit : total + (digit || 1) * unit;
      digit = 0;
    }
  }
  return total + digit;
};

/** Everyday words the dictionary pass drops (see above), with what JMdict files them as. */
const EVERYDAY: { word: string; reading: string; gloss: string }[] = [
  { word: '自分', reading: 'じぶん', gloss: 'oneself' }, // pronoun
  { word: '全然', reading: 'ぜんぜん', gloss: '(not) at all' }, // adverb
  { word: '高校', reading: 'こうこう', gloss: 'high school' }, // abbreviation of 高等学校
  { word: '何曜日', reading: 'なんようび', gloss: 'what day of the week' },
  { word: '十一月', reading: 'じゅういちがつ', gloss: 'November' },
  { word: '十二月', reading: 'じゅうにがつ', gloss: 'December' },
  { word: '二十日', reading: 'はつか', gloss: '20th day of the month' },
  { word: '十一時', reading: 'じゅういちじ', gloss: "11 o'clock" },
  { word: '十二時', reading: 'じゅうにじ', gloss: "12 o'clock" },
  { word: '二十歳', reading: 'はたち', gloss: '20 years old' },
  { word: '銀行員', reading: 'ぎんこういん', gloss: 'bank clerk' },
  { word: '薬屋', reading: 'くすりや', gloss: 'pharmacy' },
  { word: '時計屋', reading: 'とけいや', gloss: 'watch shop' },
];

const LEVEL_ORDER: JlptLevel[] = ['N5', 'N4', 'N3'];

/** The hardest level among a word's characters, or null when one is not taught. */
const levelOf = (word: string): JlptLevel | null => {
  let at = 0;
  for (const c of word) {
    const k = getKanjiByChar(c);
    if (!k) return null;
    at = Math.max(at, LEVEL_ORDER.indexOf(k.level));
  }
  return LEVEL_ORDER[at];
};

/** Every extra word, built once (when the rest of the dictionary loads). */
export const extraCompounds = (): Compound[] => {
  const out: Compound[] = [];
  const add = (word: string, reading: string, gloss: string) => {
    const level = levelOf(word);
    if (!level || [...word].length < 2 || [...word].length > 3) return;
    out.push({ word, reading, gloss, level, common: false, tier: 1 });
  };
  for (const counter of COUNTERS) {
    DIGITS.forEach((d, i) => add(d.char + counter.char, counter.readings[i], counter.gloss(i + 1)));
    if (counter.what) add(WHAT_CHAR + counter.char, counter.what, counter.whatGloss!);
  }
  for (const pair of PAIR_COUNTERS) {
    DIGITS.slice(0, pair.upTo ?? 10).forEach((d, i) => add(d.char + pair.word, pair.first[i] + pair.tail, pair.gloss(i + 1)));
    if (pair.what) add(WHAT_CHAR + pair.word, pair.what, pair.whatGloss!);
  }
  for (const n of NUMBERS) add(n.word, n.reading, valueOf(n.word).toLocaleString('en-US'));
  // Prices beyond 十円: 百円・千円, and the coins and notes (五十円・五百円・五千円・一万円).
  for (const n of NUMBERS) add(n.word + YEN_CHAR, `${n.reading}えん`, `${valueOf(n.word).toLocaleString('en-US')} yen`);
  for (const e of EVERYDAY) add(e.word, e.reading, e.gloss);
  return out;
};
