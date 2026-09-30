import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { toDataUrl } from '../picturebook/paper';
import { getCachedCharData } from '../../lib/strokeLoader';
import { medianPath, pathFromPoints, pointsOfPath } from '../../lib/strokeGeometry';
import * as sfx from '../../lib/sfx';

/**
 * 看板に 字を 灯す — writing a character onto an empty signboard (08 §3.6).
 *
 * モジクイ ate the letters off ナニワタウン's signs and left them blank. Each
 * stroke the learner writes comes on as a neon tube; when the whole character
 * is written the sign lights up, its reading hangs underneath, and it goes
 * down to join the street below the drill (NightStreet.tsx). Same contract as
 * RockSlash, so a drill can use either — the old arcs keep their rocks.
 *
 * No CSS or SVG filter anywhere (iPhone / WebKit, 2026-09-26): a tube's glow
 * is two wide translucent strokes under hanzi-writer's white-hot stroke, and
 * the lit sign's halo is a gradient that fades in. Nothing blinks.
 *
 * A write with three or more slips is not a pass (the drill's rule): the
 * tubes go dim with a sputter and the same sign waits for another try.
 */

export interface SignLightHandle {
  animateStroke: () => void;
}

interface SignLightProps {
  char: string;
  /** Furigana notation for the reading plate, e.g. "山(やま)". */
  material: string;
  size: number;
  showSample: boolean;
  /** Picks the sign's shape from write to write. */
  seed: number;
  onMistake?: () => void;
  /**
   * Called when the character is fully written. Return true if the write
   * passed (the sign lights), false if it did not.
   */
  onWritten: (summary: { totalMistakes: number }) => boolean;
  /** The lit sign has gone down to the street; the parent can move on. */
  onLit?: () => void;
  /** Stroke-matching strictness, passed to the writer (kana are looser). */
  leniency?: number;
}

interface Tube {
  id: number;
  d: string;
}

/**
 * The empty sign: a night-blue face in a brass frame, hung from two rods.
 * Plain face, no pattern — a pattern fights the model strokes. The face
 * covers the writer's whole character box (20 px in from each edge).
 */
const boardUrl = (seed: number) => {
  const shape = seed % 3;
  const face =
    shape === 1
      ? // corners cut off
        '<path d="M34 20 H266 L284 38 V272 L266 290 H34 L16 272 V38 Z"/>'
      : '<rect x="16" y="20" width="268" height="270" rx="16"/>';
  const crest =
    shape === 2
      ? '<path d="M118 22 Q150 -6 182 22 Z" fill="#c38a36" stroke="#7a5220" stroke-width="3"/><circle cx="150" cy="12" r="4" fill="#f6d488"/>'
      : '';
  const rivets = [
    [30, 34],
    [270, 34],
    [30, 276],
    [270, 276],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`)
    .join('');
  return toDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
       <defs>
         <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#282254"/><stop offset="1" stop-color="#120f2b"/></linearGradient>
         <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4cf7a"/><stop offset="0.5" stop-color="#c38a36"/><stop offset="1" stop-color="#7a5220"/></linearGradient>
       </defs>
       <g stroke="#8a6128" stroke-width="5" stroke-linecap="round"><line x1="72" y1="0" x2="72" y2="24"/><line x1="228" y1="0" x2="228" y2="24"/></g>
       ${crest}
       <g fill="url(#f)" stroke="url(#b)" stroke-width="8" stroke-linejoin="round">${face}</g>
       <g fill="none" stroke="#f6d488" stroke-opacity="0.45" stroke-width="1.5" transform="translate(150 155) scale(0.95) translate(-150 -155)">${face}</g>
       <g fill="#e8b860" stroke="#7a5220" stroke-width="1">${rivets}</g>
     </svg>`,
  );
};

export const SignLight = forwardRef<SignLightHandle, SignLightProps>(
  ({ char, material, size, showSample, seed, onMistake, onWritten, onLit, leniency }, ref) => {
    const writerRef = useRef<KanjiWriterHandle>(null);
    const shake = useAnimationControls();
    const [tubes, setTubes] = useState<Tube[]>([]);
    const [dim, setDim] = useState(false);
    const [lit, setLit] = useState(false);
    /** Remounts the writer after a failed write so the same sign can be retried. */
    const [attempt, setAttempt] = useState(0);
    const nextId = useRef(0);
    /**
     * Slips made on this sign before the learner asked to see the stroke
     * order. hanzi-writer restarts its own count when the order is shown, so
     * without this, asking for the hint would wipe a failing write clean.
     */
    const carried = useRef(0);
    const slips = useRef(0);

    // Timers for lighting and retrying; cleared if the screen closes first.
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const url = useMemo(() => boardUrl(seed), [seed]);
    /** Tube glow widths, in step with hanzi-writer's stroke at this size. */
    const glow = size * 0.085;

    useImperativeHandle(ref, () => ({
      animateStroke: () => {
        // The quiz starts over from the first stroke, so the tubes go out too.
        carried.current = slips.current;
        setTubes([]);
        writerRef.current?.animateStroke();
      },
    }));

    const handleStroke = useCallback(
      (data: Record<string, unknown>) => {
        const strokeNum = typeof data.strokeNum === 'number' ? data.strokeNum : -1;
        // The tube follows the stroke's centre line from the stroke data;
        // without it (no data cached), the finger's own path.
        const median = getCachedCharData(char)?.medians?.[strokeNum];
        const drawn = data.drawnPath as { pathString?: string } | undefined;
        const pts = drawn?.pathString ? pointsOfPath(drawn.pathString) : [];
        const d = median ? medianPath(median, size) : pts.length >= 2 ? pathFromPoints(pts) : null;
        const [x0, y0] = pts[0] ?? [0, 0];
        const [x1, y1] = pts[pts.length - 1] ?? [0, 0];
        sfx.neon(Math.min(1, 0.3 + Math.hypot(x1 - x0, y1 - y0) / size));
        if (d) setTubes((t) => [...t, { id: nextId.current++, d }]);
      },
      [char, size],
    );

    const handleMistake = useCallback(() => {
      slips.current += 1;
      sfx.fizz();
      void shake.start({ x: [0, 3, -3, 0], transition: { duration: 0.18 } });
      onMistake?.();
    }, [shake, onMistake]);

    const handleComplete = useCallback(
      (summary: { totalMistakes: number }) => {
        const passed = onWritten({ totalMistakes: summary.totalMistakes + carried.current });
        carried.current = 0;
        slips.current = 0;
        if (passed) {
          later(() => {
            sfx.signOn();
            setLit(true);
          }, 180);
          later(() => sfx.chime(), 560);
          later(() => onLit?.(), 1500);
        } else {
          // Not a pass — the tubes will not hold. Let them go dark, then retry.
          sfx.fizz();
          setDim(true);
          void shake.start({ x: [0, 6, -6, 4, -4, 0], transition: { duration: 0.4 } });
          later(() => {
            setTubes([]);
            setDim(false);
            setAttempt((a) => a + 1);
          }, 900);
        }
      },
      [onWritten, onLit, shake],
    );

    return (
      <motion.div
        className="relative"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        // Lit: hold a beat, then shrink and go down to the street below.
        animate={lit ? { scale: [1, 1, 0.38], y: [0, 0, size * 0.6], opacity: [1, 1, 0] } : { scale: 1, y: 0, opacity: 1 }}
        transition={lit ? { duration: 1.25, times: [0, 0.6, 1], ease: 'easeIn', delay: 0.1 } : { duration: 0 }}
      >
        {/* 看板の まわりの あかり ----------------------------------------- */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-[14%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,190,90,0.55) 0%, rgba(255,150,60,0.22) 40%, transparent 68%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: lit ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />

        <motion.div className="absolute inset-0" animate={shake}>
          {/* 看板 */}
          <img src={url} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />

          {/* 灯った 面 */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-[8%] right-[6%] bottom-[4%] left-[6%] rounded-[5%]"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,205,120,0.34) 0%, rgba(255,160,70,0.12) 55%, transparent 85%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: lit ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          />

          {/* ネオン管 — two soft strokes under hanzi-writer's white core */}
          <svg className="pointer-events-none absolute inset-0" width={size} height={size} aria-hidden>
            <AnimatePresence>
              {tubes.map((t) => (
                <motion.g
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: dim ? 0.22 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dim ? 0.3 : 0.16 }}
                >
                  <path d={t.d} stroke="rgba(255,140,40,0.22)" strokeWidth={glow * 2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d={t.d} stroke="rgba(255,196,96,0.55)" strokeWidth={glow * 1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>

          {/* 書く面（透明） */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <KanjiWriterCanvas
              key={attempt}
              ref={writerRef}
              char={char}
              size={size}
              quizMode
              surface="neon"
              autoRestart={false}
              showSample={showSample && !lit}
              onCorrectStroke={handleStroke}
              onMistake={handleMistake}
              onComplete={handleComplete}
              leniency={leniency}
            />
          </div>
        </motion.div>

        {/* 読みの 札 — hangs under the lit sign */}
        <AnimatePresence>
          {lit && (
            <motion.div
              key="plate"
              className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-lg border-2 border-[#7a5220] px-3 text-center font-black whitespace-nowrap text-[#3b2208]"
              style={{
                bottom: -size * 0.1,
                fontSize: Math.max(14, size * 0.075),
                lineHeight: 1.9,
                background: 'linear-gradient(180deg, #f6d488 0%, #c38a36 100%)',
              }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.15 }}
            >
              <RubyText showFurigana>{material}</RubyText>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

SignLight.displayName = 'SignLight';

export default SignLight;
