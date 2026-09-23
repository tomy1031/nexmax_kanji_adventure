import type { KanjiData } from '../types/kanji';
import { getKanjiByChar } from './kanjiDb';

/**
 * The one reading shown next to a kanji on its own — in the drill header,
 * on a material card, above a slot in the rep counter.
 *
 * Kun'yomi first (it is the word a learner meets alone: 山 = やま), except
 * for the characters that are almost always read on'yomi when they stand
 * alone in N5 material — the numbers and a few counters.
 */

const ON_FIRST = new Set([...'一二三四五六七八九十百千万円年午半毎語校電国金']);

export const kataToHira = (s: string): string =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

export const primaryReading = (k: Pick<KanjiData, 'char' | 'on' | 'kun'>): string => {
  const kun = k.kun[0]?.replace(/\(.*\)/, '');
  const on = k.on[0] ? kataToHira(k.on[0]) : '';
  if (ON_FIRST.has(k.char)) return on || kun || '';
  return kun || on;
};

/** The kanji in furigana notation, ready for <RubyText>: "山(やま)". */
export const kanjiRuby = (k: Pick<KanjiData, 'char' | 'on' | 'kun'>): string => {
  const r = primaryReading(k);
  return r ? `${k.char}(${r})` : k.char;
};

/** A single character in furigana notation, looked up by the character. */
export const charRuby = (char: string): string => {
  const k = getKanjiByChar(char);
  return k ? kanjiRuby(k) : char;
};
