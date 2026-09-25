/**
 * かな編 (08 §3.4): the kana, their romaji, and which episode teaches which.
 *
 * Only the 46 + 46 base kana are written. Voiced (が), semi-voiced (ぱ) and
 * small (ゃ・っ) forms are never drilled: they become readable when their
 * base is known, which is what baseKana() says.
 */

const H_ROWS = [
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
] as const;

const VOICED: [string, string, string][] = [
  // voiced, base, romaji
  ['が', 'か', 'ga'], ['ぎ', 'き', 'gi'], ['ぐ', 'く', 'gu'], ['げ', 'け', 'ge'], ['ご', 'こ', 'go'],
  ['ざ', 'さ', 'za'], ['じ', 'し', 'ji'], ['ず', 'す', 'zu'], ['ぜ', 'せ', 'ze'], ['ぞ', 'そ', 'zo'],
  ['だ', 'た', 'da'], ['ぢ', 'ち', 'ji'], ['づ', 'つ', 'zu'], ['で', 'て', 'de'], ['ど', 'と', 'do'],
  ['ば', 'は', 'ba'], ['び', 'ひ', 'bi'], ['ぶ', 'ふ', 'bu'], ['べ', 'へ', 'be'], ['ぼ', 'ほ', 'bo'],
  ['ぱ', 'は', 'pa'], ['ぴ', 'ひ', 'pi'], ['ぷ', 'ふ', 'pu'], ['ぺ', 'へ', 'pe'], ['ぽ', 'ほ', 'po'],
  ['ぁ', 'あ', 'a'], ['ぃ', 'い', 'i'], ['ぅ', 'う', 'u'], ['ぇ', 'え', 'e'], ['ぉ', 'お', 'o'],
  ['ゃ', 'や', 'ya'], ['ゅ', 'ゆ', 'yu'], ['ょ', 'よ', 'yo'], ['っ', 'つ', ''],
];

const toKata = (s: string) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

/** Every base kana, hiragana then katakana. */
export const HIRAGANA: string[] = H_ROWS.map(([k]) => k);
export const KATAKANA: string[] = HIRAGANA.map(toKata);

/** Romaji of every kana the prologue can show (base, voiced, small; both scripts). */
export const ROMAJI: Record<string, string> = {};
/** The base kana a form is read by: が -> か, ャ -> ヤ, ア -> ア. */
const BASE: Record<string, string> = {};
for (const [k, r] of H_ROWS) {
  ROMAJI[k] = r;
  ROMAJI[toKata(k)] = r;
  BASE[k] = k;
  BASE[toKata(k)] = toKata(k);
}
for (const [v, b, r] of VOICED) {
  ROMAJI[v] = r;
  ROMAJI[toKata(v)] = r;
  BASE[v] = b;
  BASE[toKata(v)] = toKata(b);
}
ROMAJI['ヴ'] = 'vu';
BASE['ヴ'] = 'ウ';

export const baseKana = (c: string): string | undefined => BASE[c];
export const isKana = (c: string): boolean => c in BASE;

/** Writes that make a kana yours. Kanji take ten (constraints 2026-09-16); kana take three (08 §3.4). */
export const KANA_REPS = 3;
/**
 * How forgiving stroke matching is for kana (kanji use 1.15). Kana are
 * nearly all curves, and a beginner's loop is never the font's loop; the
 * value is set from simulated shaky writing (kanaStrokes.test.ts): at 1.8
 * a wobbly hand passes 99% of kana writes, at 1.15 about 95% of gentle ones.
 */
export const KANA_LENIENCY = 1.8;
/** Reps that show the model underneath. */
export const KANA_SAMPLE_REPS = 2;

export interface KanaEpisode {
  /** "kana-1" … also the id recorded as cleared. */
  id: string;
  order: number;
  script: 'hiragana' | 'katakana';
  /** Title in furigana notation (kana only — nothing here needs a reading). */
  title: string;
  /** The kana written in this episode, in order. */
  kana: string[];
}

const slice = (list: string[], from: string, to: string) => list.slice(list.indexOf(from), list.indexOf(to) + 1);

export const KANA_EPISODES: KanaEpisode[] = (
  [
  { order: 1, script: 'hiragana', title: 'きえた こえ', kana: slice(HIRAGANA, 'あ', 'お') },
  { order: 2, script: 'hiragana', title: 'かおの ない き', kana: slice(HIRAGANA, 'か', 'そ') },
  { order: 3, script: 'hiragana', title: 'なまえの ない むら', kana: slice(HIRAGANA, 'た', 'の') },
  { order: 4, script: 'hiragana', title: 'くろい くも', kana: slice(HIRAGANA, 'は', 'も') },
  { order: 5, script: 'hiragana', title: 'ほしの ない よる', kana: slice(HIRAGANA, 'や', 'ん') },
  { order: 6, script: 'katakana', title: 'カタカナの えき', kana: slice(KATAKANA, 'ア', 'コ') },
  { order: 7, script: 'katakana', title: 'スタート', kana: slice(KATAKANA, 'サ', 'ト') },
  { order: 8, script: 'katakana', title: 'キップ', kana: slice(KATAKANA, 'ナ', 'ホ') },
  { order: 9, script: 'katakana', title: 'ぼくの なまえ', kana: slice(KATAKANA, 'マ', 'ヨ') },
  { order: 10, script: 'katakana', title: 'ありがとう', kana: slice(KATAKANA, 'ラ', 'ン') },
  ] satisfies Omit<KanaEpisode, 'id'>[]
).map((e) => ({ ...e, id: `kana-${e.order}` }));

export const getKanaEpisode = (id: string): KanaEpisode | undefined => KANA_EPISODES.find((e) => e.id === id);

/** An episode opens once the one before it is cleared. */
export const isKanaEpisodeUnlocked = (ep: KanaEpisode, cleared: readonly string[]): boolean =>
  ep.order === 1 || cleared.includes(`kana-${ep.order - 1}`);
