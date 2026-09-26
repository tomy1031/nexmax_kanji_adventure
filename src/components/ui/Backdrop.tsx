import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PictureBook from '../../features/picturebook/PictureBook';
import { RubyText } from './Ruby';
import { LogoText } from './LogoText';
import { useGameStore } from '../../store/gameStore';

/**
 * The world behind every menu screen: the moving picture book, soft light
 * falling from the top, specks of light drifting up, and a vignette that keeps
 * the panels on top readable. Menu screens used to sit on a flat cream colour;
 * the references (public/img/design/) always show the world behind the UI.
 */
export const Backdrop = ({
  scene = 'mukashi_meadow',
  fx = [],
  rays = true,
  motes = 14,
  dim = 0.18,
  fixed = false,
}: {
  scene?: string;
  fx?: readonly string[];
  rays?: boolean;
  motes?: number;
  dim?: number;
  /** Behind a scrolling menu screen: pinned to the viewport, under the content (.g-stage). */
  fixed?: boolean;
}) => {
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((st) => st.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);
  // Fixed positions per mount, so the specks do not jump on re-render.
  const specks = useMemo(
    () =>
      Array.from({ length: motes }, (_, i) => ({
        x: (i * 37 + 11) % 100,
        size: 3 + ((i * 7) % 5),
        delay: (i * 0.73) % 6,
        dur: 7 + ((i * 3) % 6),
      })),
    [motes],
  );

  return (
    <div className={`pointer-events-none inset-0 overflow-hidden ${fixed ? 'fixed -z-10' : 'absolute'}`} aria-hidden>
      <PictureBook scene={scene} fx={fx} />
      {rays && (
        <motion.div
          className="absolute -top-1/4 left-1/2 h-[90%] w-[160%] -translate-x-1/2"
          style={{
            background:
              'repeating-conic-gradient(from 0deg at 50% 0%, rgba(255,248,210,0.22) 0deg 6deg, rgba(255,248,210,0) 6deg 16deg)',
            maskImage: 'radial-gradient(ellipse 60% 70% at 50% 0%, #000 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 0%, #000 20%, transparent 75%)',
            // No mix-blend-mode: blending a moving layer with everything
            // under it is redone every frame on iPhone/iPad (2026-09-26).
            willChange: 'transform',
          }}
          animate={still ? undefined : { rotate: [-4, 4, -4] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {!still &&
        specks.map((s, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${s.x}%`,
              width: s.size,
              height: s.size,
              background: 'radial-gradient(circle, #fffbe0 0%, rgba(255,230,140,0.8) 45%, transparent 70%)',
              boxShadow: '0 0 8px rgba(255,236,160,0.9)',
              willChange: 'transform, opacity',
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: ['0dvh', '-95dvh'], opacity: [0, 1, 1, 0], x: [0, 12, -8, 6] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'linear' }}
          />
        ))}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 85% 70% at 50% 40%, transparent 55%, rgba(20,30,50,${dim + 0.22}) 100%), linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(20,30,50,${dim}) 100%)`,
        }}
      />
    </div>
  );
};

/**
 * The big title of a menu screen: logo lettering with a red ribbon under it,
 * as in the references (そうび / 漢字ドリル / 漢字を合成).
 */
export const RibbonTitle = ({ children, sub, size = 40 }: { children: string; sub?: string; size?: number }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  return (
    <motion.div
      initial={{ y: -14, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <h1 className="leading-[1.55] whitespace-nowrap" style={{ fontSize: size }}>
        <LogoText showFurigana={showFurigana}>{children}</LogoText>
      </h1>
      {sub && (
        <div className="g-ribbon -mt-1 text-[13px] leading-[1.9]">
          <RubyText showFurigana={showFurigana}>{sub}</RubyText>
        </div>
      )}
    </motion.div>
  );
};

export default Backdrop;
