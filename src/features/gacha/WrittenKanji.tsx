import { useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { getCachedCharData, loadCharData, type CharData } from '../../lib/strokeLoader';

/**
 * A character writing itself, stroke by stroke in stroke order, in ink
 * (docs/design/17 §2.3) — the same stroke data the writing drill uses.
 *
 * Each stroke is its own outline used as a clip, with a thick line drawn
 * along its centre inside it: the way hanzi-writer animates, but as plain SVG
 * so the gacha can time it and nothing else in the app is touched. The ink
 * stays crisp: no glow on the character (2026-10-02「漢字 自体が 光で 太字に
 * 表示されるのは よくない」) and no filter (iPhone).
 */

/** Stroke data is a 1024 box, y −124..900 pointing up: flip it into 0..1024. */
const FLIP = 'matrix(1 0 0 -1 0 900)';
/** How long a stroke the length of the box takes, and the pause between strokes. */
const PER_BOX = 0.42;
const GAP = 0.07;

const lengthOf = (median: number[][]): number =>
  median.reduce((n, p, i) => (i ? n + Math.hypot(p[0] - median[i - 1][0], p[1] - median[i - 1][1]) : 0), 0);

const pathOf = (median: number[][]): string => median.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

export const WrittenKanji = ({
  char,
  size,
  still,
  ink = '#2a1d12',
  onStroke,
  onDone,
}: {
  char: string;
  size: number;
  still: boolean;
  ink?: string;
  onStroke?: (i: number) => void;
  onDone?: () => void;
}) => {
  const uid = useId().replace(/:/g, '');
  // undefined: still loading. null: no data (then the character is shown as text).
  const [data, setData] = useState<CharData | null | undefined>(() => getCachedCharData(char));
  useEffect(() => {
    if (data !== undefined) return;
    let cancelled = false;
    loadCharData(char).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [char, data]);

  // Nothing to animate (no data, or さげる うごき): it is written at once.
  const instant = data === null || (data !== undefined && still);
  useEffect(() => {
    if (!instant) return;
    const t = setTimeout(() => onDone?.(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instant]);

  if (data === undefined) return <div style={{ width: size, height: size }} aria-hidden />;
  if (data === null)
    return (
      <div className="flex items-center justify-center font-black" style={{ width: size, height: size, fontSize: size * 0.78, lineHeight: 1, color: ink }} aria-hidden>
        {char}
      </div>
    );

  // Each stroke starts when the one before it has finished, and a beat more.
  const timing = data.medians.reduce<{ delay: number; duration: number }[]>((acc, m) => {
    const prev = acc[acc.length - 1];
    const delay = prev ? prev.delay + prev.duration + GAP : 0;
    return [...acc, { delay, duration: Math.max(0.14, (lengthOf(m) / 1024) * PER_BOX) }];
  }, []);
  const last = data.strokes.length - 1;

  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden>
      <defs>
        {data.strokes.map((d, i) => (
          <clipPath key={i} id={`${uid}-s${i}`}>
            <path d={d} transform={FLIP} />
          </clipPath>
        ))}
      </defs>
      {data.strokes.map((d, i) =>
        still ? (
          <path key={i} d={d} transform={FLIP} fill={ink} />
        ) : (
          <g key={i} clipPath={`url(#${uid}-s${i})`}>
            <motion.path
              d={pathOf(data.medians[i])}
              transform={FLIP}
              fill="none"
              stroke={ink}
              strokeWidth={200}
              strokeLinecap="round"
              strokeLinejoin="round"
              // Hidden until its turn: a round cap on a zero-length line is still a dot.
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ pathLength: { ...timing[i], ease: 'easeInOut' }, opacity: { delay: timing[i].delay, duration: 0.01 } }}
              onAnimationComplete={() => {
                onStroke?.(i);
                if (i === last) onDone?.();
              }}
            />
          </g>
        ),
      )}
    </svg>
  );
};

export default WrittenKanji;

/**
 * A name of one or two characters (data/charKanji.ts), written one after the
 * other, top to bottom like a name on a slip.
 */
export const WrittenWord = ({ word, size, still, ink, onDone }: { word: string; size: number; still: boolean; ink?: string; onDone?: () => void }) => {
  const chars = [...word];
  const [at, setAt] = useState(0);
  // Two characters share the height of one big one.
  const each = chars.length > 1 ? Math.round(size * 0.62) : size;
  return (
    <div className="flex flex-col items-center" style={{ gap: chars.length > 1 ? size * 0.02 : 0 }}>
      {chars.map((c, i) =>
        i <= at ? (
          <WrittenKanji key={c + i} char={c} size={each} still={still} ink={ink} onDone={() => (i < chars.length - 1 ? setAt(i + 1) : onDone?.())} />
        ) : (
          <div key={c + i} style={{ width: each, height: each }} aria-hidden />
        ),
      )}
    </div>
  );
};
