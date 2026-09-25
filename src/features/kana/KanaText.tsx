import { useMemo } from 'react';
import { revealKana } from '../../lib/kanaReveal';

/**
 * A kana line with romaji over what the learner cannot read yet (08 §3.4).
 * Same <ruby> as furigana: the romaji is the small help on top, never the text.
 */
export const KanaText = ({ children, known }: { children: string; known: ReadonlySet<string> }) => {
  const segments = useMemo(() => revealKana(children, known), [children, known]);
  return (
    <span>
      {segments.map((seg, i) =>
        seg.romaji !== undefined ? (
          <ruby key={i} className="kana-unread">
            {seg.text}
            <rp>(</rp>
            <rt lang="en">{seg.romaji}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
};

export default KanaText;
