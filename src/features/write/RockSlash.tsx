import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { rock as rockShape, svgDoc, toDataUrl } from '../picturebook/paper';

/**
 * 字の 刃 — writing a character to cut a rock.
 *
 * Each stroke the learner writes is a blade: it flashes across the rock,
 * leaves a glowing cut, and the rock shakes. When the whole character is
 * written the rock splits in two and a piece of *kanji material* comes out
 * of it. Ten pieces make the character yours — the ten-rep rule, made
 * visible.
 *
 * A write with three or more slips is not a pass (the drill's rule), and
 * here that means what it looks like: the rock does not split. The cuts fade
 * and the same rock waits for another try.
 */

export interface RockSlashHandle {
  animateStroke: () => void;
}

interface RockSlashProps {
  char: string;
  /** Furigana notation for the material that comes out, e.g. "山(やま)". */
  material: string;
  size: number;
  showSample: boolean;
  /** Changes the rock's shape from rep to rep. */
  seed: number;
  onMistake?: () => void;
  /**
   * Called when the character is fully written. Return true if the write
   * passed (the rock splits), false if it did not.
   */
  onWritten: (summary: { totalMistakes: number }) => boolean;
  /** The split animation has finished; the parent can move on. */
  onSplit?: () => void;
}

interface Cut {
  id: number;
  d: string;
}

/** hanzi-writer reports the drawn path in canvas pixels as "M x y L x y …". */
const pathPoints = (pathString: string): [number, number][] => {
  const nums = pathString.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
};

const toD = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

const ROCK_COLORS = ['#8f8a86', '#9a8f84', '#86898f', '#958d7f'];

const rockUrl = (seed: number) =>
  toDataUrl(
    svgDoc(
      `${rockShape(150, 170, 118, seed, ROCK_COLORS[seed % ROCK_COLORS.length])}
       <g filter="url(#rough)" fill="#6f9a45" opacity="0.9">
         <ellipse cx="${70 + (seed % 5) * 8}" cy="92" rx="26" ry="9"/><ellipse cx="228" cy="${96 + (seed % 3) * 6}" rx="18" ry="7"/>
       </g>`,
      seed,
      300,
      300,
    ),
  );

export const RockSlash = forwardRef<RockSlashHandle, RockSlashProps>(
  ({ char, material, size, showSample, seed, onMistake, onWritten, onSplit }, ref) => {
    const writerRef = useRef<KanjiWriterHandle>(null);
    const shake = useAnimationControls();
    const [cuts, setCuts] = useState<Cut[]>([]);
    const [flash, setFlash] = useState<Cut | null>(null);
    const [split, setSplit] = useState(false);
    /** Remounts the writer after a failed write so the same rock can be retried. */
    const [attempt, setAttempt] = useState(0);
    const nextId = useRef(0);
    /**
     * Slips made on this rock before the learner asked to see the stroke
     * order. hanzi-writer restarts its own count when the order is shown, so
     * without this, asking for the hint would wipe a failing write clean.
     */
    const carried = useRef(0);
    const slips = useRef(0);

    // Timers for the split and the retry; cleared if the screen closes first.
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const url = useMemo(() => rockUrl(seed), [seed]);

    useImperativeHandle(ref, () => ({
      animateStroke: () => {
        // The quiz starts over from the first stroke, so the cuts on the
        // rock start over too.
        carried.current = slips.current;
        setCuts([]);
        writerRef.current?.animateStroke();
      },
    }));

    const handleStroke = useCallback(
      (data: Record<string, unknown>) => {
        const drawn = data.drawnPath as { pathString?: string } | undefined;
        const pts = drawn?.pathString ? pathPoints(drawn.pathString) : [];
        if (pts.length < 2) return;
        // Stretch the blade a little past both ends, so it reads as a swing.
        const [x0, y0] = pts[0];
        const [x1, y1] = pts[pts.length - 1];
        const ext: [number, number][] = [
          [x0 - (x1 - x0) * 0.18, y0 - (y1 - y0) * 0.18],
          ...pts,
          [x1 + (x1 - x0) * 0.18, y1 + (y1 - y0) * 0.18],
        ];
        const cut = { id: nextId.current++, d: toD(ext) };
        setFlash(cut);
        setCuts((c) => [...c, { ...cut, d: toD(pts) }]);
        void shake.start({ x: [0, -5, 4, -2, 0], rotate: [0, -1, 1, 0], transition: { duration: 0.28 } });
      },
      [shake],
    );

    const handleMistake = useCallback(() => {
      slips.current += 1;
      // A glancing blow: a small clank, no cut.
      void shake.start({ x: [0, 3, -3, 0], transition: { duration: 0.18 } });
      onMistake?.();
    }, [shake, onMistake]);

    const handleComplete = useCallback(
      (summary: { totalMistakes: number }) => {
        const passed = onWritten({ totalMistakes: summary.totalMistakes + carried.current });
        carried.current = 0;
        slips.current = 0;
        if (passed) {
          later(() => setSplit(true), 180);
          later(() => onSplit?.(), 1500);
        } else {
          // Not a pass — the rock holds. Let the cuts fade, then try again.
          void shake.start({ x: [0, 6, -6, 4, -4, 0], transition: { duration: 0.4 } });
          later(() => {
            setCuts([]);
            setAttempt((a) => a + 1);
          }, 900);
        }
      },
      [onWritten, onSplit, shake],
    );

    // Jagged split line, as clip-paths for the two halves.
    const left = 'polygon(0 0, 52% 0, 46% 22%, 55% 41%, 45% 60%, 54% 79%, 48% 100%, 0 100%)';
    const right = 'polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 54% 79%, 45% 60%, 55% 41%, 46% 22%)';

    return (
      <div className="relative" style={{ width: size, height: size }}>
        {/* 岩 ------------------------------------------------------------ */}
        <motion.div className="absolute inset-0" animate={shake}>
          {(['left', 'right'] as const).map((side) => (
            <motion.img
              key={side}
              src={url}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full select-none"
              style={{ clipPath: side === 'left' ? left : right }}
              animate={
                split
                  ? {
                      x: side === 'left' ? -size * 0.32 : size * 0.32,
                      y: size * 0.12,
                      rotate: side === 'left' ? -14 : 14,
                      opacity: 0,
                    }
                  : { x: 0, y: 0, rotate: 0, opacity: 1 }
              }
              transition={{ duration: split ? 0.8 : 0, ease: 'easeOut', opacity: { delay: 0.45, duration: 0.4 } }}
            />
          ))}

          {/* 切りあと（のこる） --------------------------------------- */}
          <svg className="pointer-events-none absolute inset-0" width={size} height={size} aria-hidden>
            {!split &&
              cuts.map((c) => (
                <path key={c.id} d={c.d} stroke="#3a2a1c" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.55} />
              ))}
          </svg>
        </motion.div>

        {/* 刃のひらめき ------------------------------------------------- */}
        <svg className="pointer-events-none absolute inset-0 z-20" width={size} height={size} aria-hidden>
          <AnimatePresence>
            {flash && (
              <motion.g key={flash.id} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.18, duration: 0.3 }}>
                <motion.path
                  d={flash.d}
                  stroke="#ffe27a"
                  strokeWidth={14}
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: 'blur(4px)' }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.14 }}
                />
                <motion.path
                  d={flash.d}
                  stroke="#ffffff"
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.14 }}
                />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* 書く面（透明） ------------------------------------------------ */}
        {!split && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <KanjiWriterCanvas
              key={attempt}
              ref={writerRef}
              char={char}
              size={size}
              quizMode
              surface="rock"
              autoRestart={false}
              showSample={showSample}
              onCorrectStroke={handleStroke}
              onMistake={handleMistake}
              onComplete={handleComplete}
            />
          </div>
        )}

        {/* 割れて 出てくる マテリアル ------------------------------------ */}
        <AnimatePresence>
          {split && (
            <>
              <motion.div
                key="burst"
                className="pointer-events-none absolute inset-0 z-20 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,240,180,0.95) 0%, rgba(255,210,90,0.5) 35%, transparent 70%)' }}
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
              <motion.div
                key="material"
                className="pointer-events-none absolute top-1/2 left-1/2 z-30 flex flex-col items-center justify-center rounded-2xl text-center"
                style={{
                  width: size * 0.42,
                  height: size * 0.48,
                  marginLeft: -size * 0.21,
                  marginTop: -size * 0.24,
                  background: 'linear-gradient(160deg, #fffbe8 0%, #ffe7a3 100%)',
                  border: '3px solid #f2b53a',
                  boxShadow: '0 0 24px rgba(255,200,80,0.9), inset 0 0 12px rgba(255,255,255,0.8)',
                  color: '#4a3220',
                }}
                initial={{ scale: 0, rotate: -12, y: 10 }}
                animate={{ scale: [0, 1.15, 1, 1, 0.35], rotate: [-12, 4, 0, 0, 0], y: [10, -6, 0, 0, size * 0.62], opacity: [1, 1, 1, 1, 0] }}
                transition={{ duration: 1.3, times: [0, 0.25, 0.4, 0.72, 1], ease: 'easeOut' }}
              >
                <span className="text-[11px] font-black" style={{ color: '#b0741a' }}>
                  <RubyText showFurigana>{'かけら'}</RubyText>
                </span>
                <span className="font-black" style={{ fontSize: size * 0.2, lineHeight: 1.6 }}>
                  <RubyText showFurigana>{material}</RubyText>
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

RockSlash.displayName = 'RockSlash';

export default RockSlash;
