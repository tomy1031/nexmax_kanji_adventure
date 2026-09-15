import { ALL_KANJI } from '../data/kanji.generated';
import type { JlptLevel, KanjiData } from '../types/kanji';

/** Lookups over the baked kanji table. Built once at module load. */

const byId = new Map(ALL_KANJI.map((k) => [k.id, k]));
const byChar = new Map(ALL_KANJI.map((k) => [k.char, k]));

export const getKanjiById = (id: string): KanjiData | undefined => byId.get(id);
export const getKanjiByChar = (char: string): KanjiData | undefined => byChar.get(char);

export const kanjiOfLevel = (level: JlptLevel): KanjiData[] =>
  ALL_KANJI.filter((k) => k.level === level);

export { ALL_KANJI };
