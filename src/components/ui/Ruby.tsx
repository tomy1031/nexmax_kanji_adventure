import { useMemo } from 'react';
import { parseRuby } from '../../lib/ruby';

interface RubyTextProps {
  /** Text in furigana notation, e.g. "高(たか)い 木(き)". */
  children: string;
  /** When false the readings are dropped and only the base text renders. */
  showFurigana?: boolean;
  className?: string;
}

/**
 * Renders furigana-annotated text.
 *
 * `<ruby>` is used rather than a stack of spans so that the reading stays
 * attached to its word when the line wraps, and so copy/select and screen
 * readers get the base text rather than an interleaved mess.
 */
export const RubyText = ({ children, showFurigana = true, className }: RubyTextProps) => {
  const segments = useMemo(() => parseRuby(children), [children]);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.reading && showFurigana ? (
          <ruby key={i}>
            {seg.text}
            {/* rp gives browsers without ruby support readable parentheses */}
            <rp>(</rp>
            <rt>{seg.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
};

export default RubyText;
