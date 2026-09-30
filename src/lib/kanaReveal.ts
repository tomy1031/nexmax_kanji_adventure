import { ROMAJI, baseKana, isKana } from '../data/kana';

/**
 * かな編: a line of kana, with romaji over the kana the learner has not
 * written yet. Writing a kana takes its romaji away — the letter has come
 * back (08 §3.4, §5.1).
 *
 * The text is always Japanese; romaji is only ever the small help on top,
 * as furigana is for kanji.
 */

export interface KanaSegment {
  text: string;
  /** Set when the learner cannot read this yet. */
  romaji?: string;
}

const SMALL_Y = new Set(['ゃ', 'ゅ', 'ょ', 'ャ', 'ュ', 'ョ']);
const SOKUON = new Set(['っ', 'ッ']);

/** き + ゃ -> kya, し + ゃ -> sha, じ + ょ -> jo. */
const youon = (head: string, small: string): string => {
  const h = ROMAJI[head];
  const s = ROMAJI[small];
  if (/^(sh|ch|j)i$/.test(h)) return h.slice(0, -1) + s.slice(1);
  return h.slice(0, -1) + s;
};

export const revealKana = (text: string, known: ReadonlySet<string>): KanaSegment[] => {
  const chars = [...text];
  const units: { text: string; romaji: string; kana: boolean }[] = [];

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (!isKana(c)) {
      units.push({ text: c, romaji: '', kana: false });
      continue;
    }
    const next = chars[i + 1];
    if (next && SMALL_Y.has(next) && /i$/.test(ROMAJI[c])) {
      units.push({ text: c + next, romaji: youon(c, next), kana: true });
      i++;
    } else if (SOKUON.has(c)) {
      // The doubled consonant belongs to what follows: っか -> k(ka).
      const after = next && isKana(next) ? ROMAJI[next] : '';
      units.push({ text: c, romaji: after.charAt(0), kana: true });
    } else {
      units.push({ text: c, romaji: ROMAJI[c], kana: true });
    }
  }

  const readable = (u: { text: string }) => [...u.text].every((ch) => known.has(baseKana(ch) ?? ch));

  // Merge neighbours with the same state so the ruby reads as words, not letters.
  const out: KanaSegment[] = [];
  for (const u of units) {
    const hidden = u.kana && !readable(u);
    const last = out[out.length - 1];
    if (hidden) {
      if (last?.romaji !== undefined) {
        last.text += u.text;
        last.romaji += u.romaji;
      } else out.push({ text: u.text, romaji: u.romaji });
    } else if (last && last.romaji === undefined) last.text += u.text;
    else out.push({ text: u.text });
  }
  return out;
};
