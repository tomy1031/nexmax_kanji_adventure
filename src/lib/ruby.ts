/**
 * Furigana notation.
 *
 * Every string the learner reads is authored with its readings inline:
 *
 *   "村(むら)の 人(ひと)たちが 生命草(せいめいそう)を まっている。"
 *
 * `parseRuby` turns that into segments a React component renders as <ruby>.
 * Authoring the reading next to the word — rather than looking it up from a
 * dictionary at render time — means a wrong reading is visible in the source
 * and fixable by whoever wrote the line.
 *
 * Escape a literal parenthesis after kanji by doubling it: 「漢字((かっこ)」.
 */

export interface RubySegment {
  text: string;
  /** Reading to set above `text`, if any. */
  reading?: string;
}

// A run of kanji (plus 々) — or a run of digits, for 「2(ふた)つ」 — immediately
// followed by a parenthesised reading. Both ASCII and full-width parens are
// accepted, because both get typed. Digits and kanji are separate runs, so
// 「10回(かい)」 puts かい over 回 only.
const RUBY_RE = /([一-龯々]+|[0-9０-９]+)[（(]([^）)]+)[）)]/g;

export const parseRuby = (source: string): RubySegment[] => {
  const segments: RubySegment[] = [];
  let last = 0;

  for (const m of source.matchAll(RUBY_RE)) {
    const [whole, base, reading] = m;
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: source.slice(last, start) });
    segments.push({ text: base, reading });
    last = start + whole.length;
  }

  if (last < source.length) segments.push({ text: source.slice(last) });
  return segments;
};

/** The sentence with all furigana annotations removed. */
export const stripRuby = (source: string): string => source.replace(RUBY_RE, '$1');

/** The sentence as it would be read aloud — every annotated word in kana. */
export const toKana = (source: string): string => source.replace(RUBY_RE, '$2');

/**
 * Every kanji character that appears in the text. Used to check that a line
 * only uses characters the learner has already met, and to warm stroke data.
 */
export const kanjiIn = (source: string): string[] => {
  const stripped = stripRuby(source);
  return [...new Set(stripped.match(/[一-龯]/g) ?? [])];
};

/**
 * Kanji in the text that carry no reading. These are the ones that will reach
 * the learner bare, so the content check treats them as errors.
 */
export const unreadKanji = (source: string): string[] => {
  const withoutRuby = source.replace(RUBY_RE, '');
  return [...new Set(withoutRuby.match(/[一-龯]/g) ?? [])];
};
