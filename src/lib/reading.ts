import type { KanjiData } from '../types/kanji';
import { READING_USE } from '../data/readings.generated';
import { getKanjiByChar } from './kanjiDb';

/**
 * Readings of a kanji shown on its own — in the drill header, on a material
 * card, in the stage's list of characters.
 *
 * 2026-09-24: 「漢字の 送りがなを 文字の ところに 表示するのは 違う。漢字は
 * 漢字、添え物として 読みがななどが あるのが 大切」. The character stands
 * alone, with one reading above it as furigana — never 大(おお)きい in the
 * character's place. Okurigana belongs to the reading list and to example
 * words, which are the add-ons.
 *
 * Which reading goes above it comes from the words a learner of this level
 * reads (src/data/readings.generated.ts, from the JLPT N5–N2 lists), not from
 * the dictionary's order: 社 is しゃ (会社), not やしろ
 * (2026-09-24: 「やしろ（社 しゃ が 正しい）とか、レベルに 適切で ない 読み」).
 */

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

const isOn = (r: string) => /^[ァ-ヶー]/.test(r);

/**
 * The readings a learner meets, most basic first. Readings first met only in
 * N2 words are beyond this game (N5–N3) and left out, unless nothing else is
 * left. A kanji whose readings never show up in the word lists keeps the
 * table's own (on first).
 */
export const usedReadings = (k: Readable): string[] => {
  const use = READING_USE[k.char] ?? [];
  const atLevel = use.filter((u) => u[1] !== 'N2');
  if (atLevel.length) return atLevel.map((u) => u[0]);
  if (use.length) return use.map((u) => u[0]);
  return [...k.on, ...k.kun];
};

/** The reading above the character, as stem + okurigana. */
export const primaryForm = (k: Readable): KunForm => {
  const r = usedReadings(k)[0];
  if (!r) return { stem: '', okuri: '' };
  return isOn(r) ? { stem: kataToHira(r), okuri: '' } : kunForm(r);
};

/** The primary reading as said aloud: しゃ, やま, おおきい. */
export const primaryReading = (k: Readable): string => {
  const f = primaryForm(k);
  return f.stem + f.okuri;
};

/** The primary reading without okurigana: 大 → だい. */
export const primaryStem = (k: Readable): string => primaryForm(k).stem;

/** The character with its reading above it, and nothing else: "社(しゃ)", "山(やま)". */
export const kanjiRuby = (k: Readable): string => {
  const stem = primaryStem(k);
  return stem ? `${k.char}(${stem})` : k.char;
};

/** The kun readings a learner meets, each as a word: 上(うえ)・上(あ)げる. */
export const kunWords = (k: Readable): string[] =>
  usedReadings(k)
    .filter((r) => !isOn(r))
    .map((r) => {
      const f = kunForm(r);
      return `${k.char}(${f.stem})${f.okuri}`;
    });

/** The kun readings a learner meets, as the table writes them: おお(きい). */
export const kunReadings = (k: Readable): string[] => usedReadings(k).filter((r) => !isOn(r));

/** The on readings a learner meets, in katakana as dictionaries write them. */
export const onReadings = (k: Readable): string[] => usedReadings(k).filter(isOn);

/**
 * The most basic word that uses the primary reading, in furigana notation:
 * 社 → 会(かい)社(しゃ), 山 → 山(やま). For the fill-in prompt in battle.
 */
export const exampleWord = (k: Readable): string | null => {
  const use = READING_USE[k.char];
  return use?.length ? use[0][3] : null;
};

/** A single character with its reading above it, looked up by the character. */
export const charRuby = (char: string): string => {
  const k = getKanjiByChar(char);
  return k ? kanjiRuby(k) : char;
};
