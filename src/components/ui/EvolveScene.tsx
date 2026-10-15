import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { playJingle } from '../../lib/bgm';
import * as sfx from '../../lib/sfx';
import { LogoText } from './LogoText';
import { useQuiet } from '../../store/uiStore';

/**
 * ネクマックスの 進化 (docs/design/22 §3): the light of the written letters
 * gathers in his chest, the old form and the new one flicker in white faster
 * and faster, a flash — and he stands in his new form, the stars of his class
 * popping in one by one, his name plate lit. Then a few lines, tapped through.
 *
 * Used where the letters give him his strength back: ★1 → ★2 after the
 * hiragana boss, ★2 → ★3 at the start of 1章. With less motion (`still`) the
 * new form simply appears.
 */

export interface EvolveLine {
  /** What is said, drawn by `renderText` (furigana in 1章, kana with romaji in 0章). */
  text: string;
  /** The English under it, for a player who cannot read it yet. */
  en?: string;
}

interface Props {
  from: string;
  to: string;
  /** The class reached: that many stars pop in. */
  stars: number;
  /** The call over him, furigana notation (「★3 しんか！」). */
  title: string;
  /** His name plate, lit at the end; none while his name is still missing. */
  name?: string;
  /** The place behind (an image). */
  backdrop?: string;
  lines: EvolveLine[];
  renderText: (text: string) => ReactNode;
  showFurigana: boolean;
  still: boolean;
  onDone: () => void;
}

/** Each swap of the flicker, faster and faster (ms). */
const FLICKER = [420, 360, 300, 250, 200, 160, 130, 110, 90, 80, 70];
const GATHER_MS = 1300;

/** A white shape of a picture (the flicker's silhouettes). */
const white = 'brightness(0) invert(1) drop-shadow(0 0 18px rgba(255,236,170,0.95))';

export const EvolveScene = ({ from, to, stars, title, name, backdrop, lines, renderText, showFurigana, still, onDone }: Props) => {
  // No 称号 popup over the moment (AchievementToast).
  useQuiet();
  /** gather → flicker → done (the new form shown, the lines). */
  const [stage, setStage] = useState<'gather' | 'flicker' | 'done'>(still ? 'done' : 'gather');
  /** During the flicker: which form's silhouette shows. */
  const [showNew, setShowNew] = useState(false);
  const [line, setLine] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (still) {
      sfx.fanfare();
      return;
    }
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    sfx.beam();
    at(GATHER_MS, () => setStage('flicker'));
    let t = GATHER_MS;
    FLICKER.forEach((ms, i) => {
      t += ms;
      at(t, () => {
        setShowNew(i % 2 === 0);
        sfx.neon(0.3, i);
      });
    });
    at(t + 200, () => {
      setStage('done');
      if (!playJingle()) sfx.fanfare();
    });
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, [still]);

  // The stars, one by one, once the new form stands.
  useEffect(() => {
    if (stage !== 'done') return;
    const list = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 350 + i * 260));
    return () => list.forEach(clearTimeout);
  }, [stage, stars]);

  /** A tap during the animation jumps to the end; after it, it moves through the lines. */
  const tap = () => {
    if (stage !== 'done') {
      timers.current.forEach(clearTimeout);
      setStage('done');
      return;
    }
    sfx.tap();
    if (line + 1 < lines.length) setLine(line + 1);
    else onDone();
  };

  const done = stage === 'done';
  const said = lines[line];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden bg-[#0b0820] text-[#f4f1ff]" onClick={tap} role="button" tabIndex={0} aria-label="つぎへ">
      {backdrop && <img src={assetPath(backdrop)} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-35" />}
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(255,214,120,0.28) 0%, rgba(20,14,50,0.82) 55%, #07051a 100%)' }} />

      {/* the rays behind him once he has changed */}
      {done && !still && (
        <motion.div
          aria-hidden
          className="absolute top-[40%] left-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'repeating-conic-gradient(rgba(255,226,140,0.22) 0deg 8deg, transparent 8deg 22deg)', maskImage: 'radial-gradient(circle, black 10%, transparent 60%)' }}
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: 60 }}
          transition={{ opacity: { duration: 0.6 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
        />
      )}

      {/* the motes of light gathering into him */}
      {stage === 'gather' && (
        <div aria-hidden className="absolute inset-0">
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute top-[40%] left-1/2 block h-3 w-3 rounded-full bg-[#ffe7a0]"
                style={{ boxShadow: '0 0 12px #ffd36a' }}
                initial={{ x: Math.cos(a) * 220, y: Math.sin(a) * 300, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: [0, 1, 0.2] }}
                transition={{ duration: GATHER_MS / 1000, delay: (i % 6) * 0.08, ease: 'easeIn' }}
              />
            );
          })}
        </div>
      )}

      <div className="relative mt-[max(44px,env(safe-area-inset-top))] h-[min(46dvh,400px)] w-full max-w-md">
        <div className="absolute inset-x-0 top-0 flex h-full items-end justify-center">
          {stage === 'gather' && (
            <motion.img
              src={assetPath(from)}
              alt=""
              className="h-full w-auto object-contain"
              animate={{ filter: ['brightness(1)', 'brightness(1.6) drop-shadow(0 0 20px #ffd36a)'] }}
              transition={{ duration: GATHER_MS / 1000 }}
            />
          )}
          {stage === 'flicker' && <img src={assetPath(showNew ? to : from)} alt="" className="h-full w-auto object-contain" style={{ filter: white }} />}
          {done && (
            <motion.img
              src={assetPath(to)}
              alt=""
              className="h-full w-auto object-contain drop-shadow-[0_10px_30px_rgba(255,211,106,0.55)]"
              initial={still ? false : { scale: 1.25, filter: white }}
              animate={{ scale: 1, filter: 'brightness(1)' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          )}
        </div>
      </div>

      {/* the flash */}
      <AnimatePresence>
        {done && !still && (
          <motion.div key="flash" aria-hidden className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} />
        )}
      </AnimatePresence>

      {done && (
        <div className="relative mt-2 flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5" aria-label={`★${stars}`}>
            {Array.from({ length: stars }, (_, i) => (
              <motion.span
                key={i}
                className="text-4xl leading-none text-[#ffd36a]"
                style={{ textShadow: '0 0 14px #ffb21f, 0 2px 0 #8a4b12' }}
                initial={still ? false : { scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.35 + i * 0.26, type: 'spring', stiffness: 420, damping: 12 }}
              >
                ★
              </motion.span>
            ))}
          </div>
          <motion.div
            style={{ fontSize: 34, lineHeight: 1.5 }}
            initial={still ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + stars * 0.26, type: 'spring', stiffness: 300, damping: 14 }}
          >
            <LogoText showFurigana={showFurigana} shine={!still}>
              {title}
            </LogoText>
          </motion.div>
          {name && (
            <motion.p
              className="g-plate-brass rounded-xl px-5 py-1 text-xl font-black tracking-widest"
              initial={still ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, boxShadow: ['0 0 0 rgba(255,211,106,0)', '0 0 26px rgba(255,211,106,0.9)', '0 0 10px rgba(255,211,106,0.5)'] }}
              transition={{ delay: 0.5 + stars * 0.26, duration: 1.2 }}
            >
              {name}
            </motion.p>
          )}
        </div>
      )}

      {done && said && (
        <motion.div
          key={line}
          className="g-novel-night absolute inset-x-3 bottom-[max(16px,env(safe-area-inset-bottom))] mx-auto max-w-md rounded-2xl px-4 py-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: line === 0 && !still ? 1 + stars * 0.26 : 0 }}
        >
          <p className="text-lg leading-[2] font-bold">{renderText(said.text)}</p>
          {said.en && (
            <p lang="en" className="mt-0.5 text-xs font-bold opacity-75">
              {said.en}
            </p>
          )}
          <p className="mt-1 text-right text-xs font-bold opacity-70">▼</p>
        </motion.div>
      )}
    </div>
  );
};

export default EvolveScene;
