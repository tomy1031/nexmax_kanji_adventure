import { getKanjiByChar } from '../../lib/kanjiDb';
import { charRuby, primaryStem } from '../../lib/reading';
import { parseRuby } from '../../lib/ruby';
import type { SignSpot } from './SceneSigns';

/**
 * What a sign says over its letter: the reading the story gives it in that
 * place — the station calendar's 水 is すい (水曜日), not みず — else the
 * letter's usual one (2026-10-10「選択肢の読みと答えの読みが合わない…
 * そのような ずれが 他に ないか」).
 */
export const signReading = (spot: Pick<SignSpot, 'char' | 'reading'>): string | undefined => {
  if (spot.reading) return spot.reading;
  const k = getKanjiByChar(spot.char);
  return k ? primaryStem(k) : undefined;
};

/** The sign's letter with that reading over it, in furigana notation. */
export const signRuby = (spot: Pick<SignSpot, 'char' | 'reading'>): string =>
  spot.reading ? `${spot.char}(${spot.reading})` : charRuby(spot.char);

/**
 * Whether a big glyph says just what the scene's signs say — every letter a
 * sign there, read as the sign reads it — so the lit signs can stand for it.
 * 山(やま)田(だ), a name, is not the map's 田(た): that glyph is drawn.
 */
export const glyphIsSigns = (glyph: string, spots: readonly Pick<SignSpot, 'char' | 'reading'>[]): boolean => {
  let letters = 0;
  for (const seg of parseRuby(glyph)) {
    const chars = [...seg.text.replace(/\s/g, '')];
    if (seg.reading) {
      const spot = spots.find((s) => s.char === seg.text);
      if (chars.length !== 1 || !spot || signReading(spot) !== seg.reading) return false;
    } else if (!chars.every((c) => spots.some((s) => s.char === c))) return false;
    letters += chars.length;
  }
  return letters > 0;
};
