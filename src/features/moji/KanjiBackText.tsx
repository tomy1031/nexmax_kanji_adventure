import { useMemo } from 'react';
import { parseRuby } from '../../lib/ruby';

/**
 * 文字が 消えた 町 (08 §5.1「書いた 字が 世界に 戻る」): a line in furigana
 * notation, where a kanji the player has not written yet is gone from the
 * world and only its sound is left. It shows as its reading, faintly
 * underlined; once written, the kanji is back, with its reading on top.
 *
 * Authored one kanji at a time — 月(げつ)曜(よう)日(び) — so a word comes
 * back piece by piece: 月よう日, the way learners write it in class.
 */
export const KanjiBackText = ({ children, owned }: { children: string; owned: ReadonlySet<string> }) => {
  const segments = useMemo(() => parseRuby(children), [children]);
  return (
    <span>
      {segments.map((seg, i) => {
        if (!seg.reading) return <span key={i}>{seg.text}</span>;
        if ([...seg.text].every((c) => owned.has(c))) {
          return (
            <ruby key={i} className="kanji-back">
              {seg.text}
              <rp>(</rp>
              <rt>{seg.reading}</rt>
              <rp>)</rp>
            </ruby>
          );
        }
        return (
          <span key={i} className="kanji-lost">
            {seg.reading}
          </span>
        );
      })}
    </span>
  );
};

export default KanjiBackText;
