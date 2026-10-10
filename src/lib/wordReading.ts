import { READING_USE } from '../data/readings.generated';
import { getKanjiByChar } from './kanjiDb';
import { parseRuby } from './ruby';
import { charRuby, kataToHira, kunForm, primaryStem, usedReadings } from './reading';

/**
 * How each kanji of a word is read in it: 友人 ゆうじん → ゆう・じん,
 * 学校 がっこう → がっ・こう, 手紙 てがみ → て・がみ.
 *
 * 2026-10-10「言葉図鑑の選択肢の読みと答えの読みが合わない」: a kanji shown
 * beside a word must carry the reading it has in that word, not the one it
 * has on its own (友 is とも alone, ゆう in 友人). Words read as a whole —
 * 大人 おとな, 今日 きょう, 一人 ひとり — cannot be split, and get null: their
 * kanji are shown without a reading of their own.
 */

const VOICED: Record<string, string[]> = {
  か: ['が'], き: ['ぎ'], く: ['ぐ'], け: ['げ'], こ: ['ご'],
  さ: ['ざ'], し: ['じ'], す: ['ず'], せ: ['ぜ'], そ: ['ぞ'],
  た: ['だ'], ち: ['ぢ', 'じ'], つ: ['づ', 'ず'], て: ['で'], と: ['ど'],
  は: ['ば', 'ぱ'], ひ: ['び', 'ぴ'], ふ: ['ぶ', 'ぷ'], へ: ['べ', 'ぺ'], ほ: ['ぼ', 'ぽ'],
};

/**
 * Readings the kanji table leaves out that common words use: 東西 とうざい,
 * 万国 ばんこく (on); 何時 なんじ, 入口 いりぐち, 月夜 つきよ (kun).
 */
const EXTRA_ON: Readonly<Record<string, readonly string[]>> = { 西: ['さい'], 万: ['ばん'] };
const EXTRA_KUN: Readonly<Record<string, readonly string[]>> = { 何: ['なん'], 入: ['いり'], 夜: ['よ'] };

/** The i-row of a kana: う → い, く → き … (the ます form of a verb: 買う → 買い). */
const I_ROW: Record<string, string> = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };

/**
 * Every reading of a kanji as a bare hiragana stem: the ones learners meet
 * first, the table's, the noun forms of its verbs (入る → いり in 入口,
 * 買う → かい in 買物, 上げる → あげ in 売上), and the pieces the aligned
 * example words show (十(とお)日(か), 八(やっ)つ).
 */
const stemsOf = (char: string): string[] => {
  const k = getKanjiByChar(char);
  const out: string[] = [];
  const add = (s: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  if (k)
    for (const r of [...usedReadings(k), ...k.on, ...k.kun]) {
      const { stem, okuri } = kunForm(r);
      add(kataToHira(stem));
      if (okuri) {
        // godan: 入(い)る → いり; ichidan: 上(あ)げる → あげ.
        add(stem + (I_ROW[okuri.at(-1)!] ? okuri.slice(0, -1) + I_ROW[okuri.at(-1)!] : okuri));
        if (okuri.endsWith('る') && okuri.length > 1) add(stem + okuri.slice(0, -1));
      }
    }
  // The aligned example words keep irregular pieces: 十(とお)日(か), 八(やっ)つ.
  for (const use of Object.values(READING_USE))
    for (const [, , , example] of use) for (const seg of parseRuby(example)) if (seg.text === char && seg.reading) add(seg.reading);
  for (const r of [...(EXTRA_ON[char] ?? []), ...(EXTRA_KUN[char] ?? [])]) add(r);
  return out;
};

const stemCache = new Map<string, string[]>();
const stems = (char: string): string[] => {
  let s = stemCache.get(char);
  if (!s) stemCache.set(char, (s = stemsOf(char)));
  return s;
};

/** え-row → あ-row at the end of a stem before another kanji: 雨(あめ) → あま in 雨水, 金(かね) → かな in 金物. */
const E_TO_A: Record<string, string> = { え: 'あ', け: 'か', せ: 'さ', て: 'た', ね: 'な', め: 'ま', れ: 'ら' };

/** The ways a reading can sound at a place in a word: voiced after the first kanji, cut short (っ) before the last. */
const formsAt = (stem: string, first: boolean, last: boolean): string[] => {
  const heads = first ? [stem] : [stem, ...(VOICED[stem[0]] ?? []).map((v) => v + stem.slice(1))];
  const out = [...heads];
  if (!last)
    for (const h of heads) {
      if (/[つちくき]$/.test(h) && h.length > 1) out.push(`${h.slice(0, -1)}っ`);
      // A one-kana reading cut short too: 切(き) → きっ in 切手.
      if (h.length === 1) out.push(`${h}っ`);
      const a = E_TO_A[h.at(-1)!];
      if (a && h.length > 1) out.push(h.slice(0, -1) + a);
    }
  // じゅう → じゅっ・じっ (十分 じゅっぷん, 十回 じっかい).
  if (!last && stem === 'じゅう') out.push('じゅっ', 'じっ');
  return out;
};

/** One kanji's part of a word's reading, and whether it is the kanji's on (音) reading. */
export interface WordPiece {
  piece: string;
  on: boolean;
}

/** A kanji's on readings in hiragana: 友 → ゆう. */
const onStems = (char: string): string[] => [...(getKanjiByChar(char)?.on ?? []).map(kataToHira), ...(EXTRA_ON[char] ?? [])];

/**
 * Each kanji's part of `word`'s `reading`, or null when the word is read as a
 * whole (or has a character that is not a kanji of the game).
 */
export const splitWord = (word: string, reading: string): WordPiece[] | null => {
  const chars = [...word];
  const n = chars.length;
  const options = chars.map((c, i) => (c === '々' && i > 0 ? stems(chars[i - 1]) : stems(c)));
  if (options.some((o) => o.length === 0)) return null;

  const walk = (i: number, at: number, done: WordPiece[]): WordPiece[] | null => {
    if (i === n) return at === reading.length ? done : null;
    for (const stem of options[i]) {
      for (const piece of formsAt(stem, i === 0, i === n - 1)) {
        if (!reading.startsWith(piece, at)) continue;
        // は-row turns ぱ-row only after っ or ん: 一分 いっぷん, 三百 さんびゃく.
        if (piece[0] !== stem[0] && /^[ぱぴぷぺぽ]/.test(piece) && !/[っん]$/.test(done[i - 1]?.piece ?? '')) continue;
        const found = walk(i + 1, at + piece.length, [...done, { piece, on: onStems(chars[i]).includes(stem) }]);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(0, 0, []);
};

/** The reading of each kanji of `word` within `reading` (see splitWord), or null. */
export const readingsInWord = (word: string, reading: string): string[] | null => splitWord(word, reading)?.map((p) => p.piece) ?? null;

/**
 * The readings over kanji set side by side (漢字やさん's slots): each kanji's
 * own — or, when together they make a word, each one's reading in it: 友 and
 * 人 read ゆう・じん over 友人(ゆうじん), not とも・ひと. A word read as a whole
 * (大人 おとな) leaves the slots without readings; the word carries its own.
 */
export const slotReadings = (chars: readonly string[], word?: { word: string; reading: string } | null): (string | undefined)[] => {
  if (!word) return chars.map((c) => {
    const k = getKanjiByChar(c);
    return k ? primaryStem(k) : undefined;
  });
  const parts = readingsInWord(word.word, word.reading);
  return chars.map((_, i) => parts?.[i]);
};

/**
 * How `char` is read in `text` (furigana notation): 時 in 時(とき)の おまもり is
 * とき, 月 in 月夜(つきよ)の ころも is つき. Undefined when the text does not
 * have it; null when it is inside a word read as a whole.
 */
export const readingInText = (text: string, char: string): string | null | undefined => {
  for (const seg of parseRuby(text)) {
    const i = [...seg.text].indexOf(char);
    if (!seg.reading || i === -1) continue;
    if ([...seg.text].length === 1) return seg.reading;
    return readingsInWord(seg.text, seg.reading)?.[i] ?? null;
  }
  return undefined;
};

/**
 * A kanji with the reading `text` gives it, for a list shown beside that text —
 * the kanji a piece of gear needs, under its name: 時(とき), not 時(じ), for
 * 時(とき)の おまもり. Not in the text: its usual reading. In a word read as a
 * whole: bare.
 */
export const charRubyIn = (text: string, char: string): string => {
  const r = readingInText(text, char);
  return r === undefined ? charRuby(char) : r === null ? char : `${char}(${r})`;
};
