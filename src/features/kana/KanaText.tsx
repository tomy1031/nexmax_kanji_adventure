import { useMemo } from 'react';
import { revealKana } from '../../lib/kanaReveal';

interface KanaTextProps {
  children: string;
  known: ReadonlySet<string>;
  /**
   * How a kana the learner has not written yet is shown.
   *  - `romaji`: the kana, faded, with romaji on top — for instructions the
   *    learner must understand (the drill, the map).
   *  - `mask`: a hole, □ — the story (2026-09-26): Nexmax can only say the
   *    letters that have come back, and the rest of his words are eaten.
   */
  mode?: 'romaji' | 'mask';
}

/** A kana line as far as the learner can read it (08 §3.4). */
export const KanaText = ({ children, known, mode = 'romaji' }: KanaTextProps) => {
  const segments = useMemo(() => revealKana(children, known), [children, known]);
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.romaji === undefined) return <span key={i}>{seg.text}</span>;
        if (mode === 'mask') {
          return (
            <span key={i} className="kana-eaten" aria-label={'□'.repeat([...seg.text].length)}>
              {[...seg.text].map((_, j) => (
                <span key={j} className="kana-hole" aria-hidden />
              ))}
            </span>
          );
        }
        return (
          <ruby key={i} className="kana-unread">
            {seg.text}
            <rp>(</rp>
            <rt lang="en">{seg.romaji}</rt>
            <rp>)</rp>
          </ruby>
        );
      })}
    </span>
  );
};

export default KanaText;
