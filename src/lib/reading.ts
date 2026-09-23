import type { KanjiData } from '../types/kanji';
import { getKanjiByChar } from './kanjiDb';

/**
 * Readings of a kanji shown on its own — in the drill header, on a material
 * card, in the stage's list of characters.
 *
 * Kun'yomi first (it is the word a learner meets alone: 山 = やま), except
 * for the characters that are almost always read on'yomi when they stand
 * alone in N5 material — the numbers and a few counters.
 *
 * A kun reading with okurigana is shown as the word, not the stem
 * (2026-09-23: 「大きいのような 送り仮名が 必要な 漢字だと、おおしか 書いてなくて 変」):
 * 大 is 大(おお)きい, never 大(おお) alone.
 */

const ON_FIRST = new Set([...'一二三四五六七八九十百千万円年午半毎語校電国金']);

export const kataToHira = (s: string): string =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/** A kun reading split into the part under the kanji and its okurigana. */
export interface KunForm {
  stem: string;
  okuri: string;
}

/** "おお(きい)" → { stem: おお, okuri: きい }. */
export const kunForm = (kun: string): KunForm => {
  const m = kun.match(/^([^()]*)\(([^)]*)\)$/);
  return m ? { stem: m[1], okuri: m[2] } : { stem: kun, okuri: '' };
};

type Readable = Pick<KanjiData, 'char' | 'on' | 'kun'>;

/** The reading used for the kanji on its own, as stem + okurigana. */
export const primaryForm = (k: Readable): KunForm => {
  const kun = k.kun[0] ? kunForm(k.kun[0]) : null;
  const on = k.on[0] ? kataToHira(k.on[0]) : '';
  if (ON_FIRST.has(k.char) && on) return { stem: on, okuri: '' };
  return kun ?? { stem: on, okuri: '' };
};

/** The primary reading as said aloud: おおきい, やま, いち. */
export const primaryReading = (k: Readable): string => {
  const f = primaryForm(k);
  return f.stem + f.okuri;
};

/** The primary reading without okurigana, for naming: 大 → おお. */
export const primaryStem = (k: Readable): string => primaryForm(k).stem;

/** The kanji as a word in furigana notation: "山(やま)", "大(おお)きい". */
export const kanjiRuby = (k: Readable): string => {
  const f = primaryForm(k);
  return f.stem ? `${k.char}(${f.stem})${f.okuri}` : k.char;
};

/** Every kun reading as a word in furigana notation: 上(うえ)・上(あ)げる. */
export const kunWords = (k: Readable): string[] =>
  k.kun.map((r) => {
    const f = kunForm(r);
    return `${k.char}(${f.stem})${f.okuri}`;
  });

/** Every on reading, in katakana as dictionaries write it. */
export const onReadings = (k: Readable): string[] => k.on;

/** A single character as a word in furigana notation, looked up by the character. */
export const charRuby = (char: string): string => {
  const k = getKanjiByChar(char);
  return k ? kanjiRuby(k) : char;
};
