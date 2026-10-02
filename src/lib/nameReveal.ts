import { revealKana } from './kanaReveal';
import { stripRuby } from './ruby';

const KANJI = /[一-鿿々]/;

/**
 * Whether a name can be shown yet (2026-10-02「キャラクターの 名前が 変わったり、
 * 表示前は 極端に 名前が 出ないのが 困る 演出」): every letter it is written
 * with has come back — a kanji owned (★1), a kana written enough (small
 * ッ and voiced kana count as their base, as everywhere in かな編).
 * A name without letters to wait for is always shown. The letters may be
 * written in furigana notation (山(やま)田(だ)), like every kanji in the source.
 */
export const nameRevealed = (nameChars: string | undefined, knownKana: ReadonlySet<string>, ownedKanji: ReadonlySet<string>): boolean =>
  !nameChars ||
  [...stripRuby(nameChars)].every((c) => (KANJI.test(c) ? ownedKanji.has(c) : revealKana(c, knownKana).every((seg) => seg.romaji === undefined)));
