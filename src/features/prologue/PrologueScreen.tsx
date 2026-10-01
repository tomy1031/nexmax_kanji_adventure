import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import * as sfx from '../../lib/sfx';
import { PROLOGUE, PROLOGUE_ASK, PROLOGUE_EXITS, type PrologueVisual } from '../../data/scripts/prologue';

/**
 * プロローグ (08 §10.2): the world, the shadow, the fallen robot, and you —
 * told in English over moving pictures, before 0章「はじまりの 空港」.
 *
 * Only transforms and opacity move (constraints: iPhone/iPad). Glows are
 * static text-shadows and gradients on layers that are rasterised once and
 * then only moved.
 */

/** Letters of light: a character, where it floats, how fast. Furigana notation. */
const LETTERS: { ch: string; x: number; y: number; d: number; s: number }[] = [
  { ch: 'あ', x: 12, y: 18, d: 0.0, s: 34 },
  { ch: '日(ひ)', x: 78, y: 14, d: 0.4, s: 30 },
  { ch: 'カ', x: 30, y: 36, d: 0.8, s: 26 },
  { ch: '山(やま)', x: 62, y: 30, d: 0.2, s: 32 },
  { ch: 'う', x: 86, y: 44, d: 1.1, s: 24 },
  { ch: 'ネ', x: 8, y: 52, d: 0.6, s: 28 },
  { ch: '月(つき)', x: 46, y: 12, d: 1.4, s: 26 },
  { ch: 'き', x: 22, y: 64, d: 0.9, s: 30 },
  { ch: '木(き)', x: 70, y: 60, d: 0.3, s: 28 },
  { ch: 'ス', x: 52, y: 48, d: 1.7, s: 22 },
  { ch: 'お', x: 90, y: 24, d: 1.2, s: 22 },
  { ch: '水(みず)', x: 36, y: 22, d: 0.5, s: 24 },
  { ch: 'え', x: 58, y: 70, d: 1.0, s: 24 },
  { ch: 'ク', x: 16, y: 34, d: 1.5, s: 20 },
];

/** Where the shadow sits, in % of the screen; eaten letters fly to it. */
const SHADOW = { x: 50, y: 30 };

const GLOW = '0 0 6px #fff3b0, 0 0 18px rgba(255,210,90,0.9)';

const Letters = ({ eaten, still }: { eaten: boolean; still: boolean }) => (
  <div className="rt-light pointer-events-none absolute inset-0" aria-hidden>
    {LETTERS.map((l, i) => (
      <motion.span
        key={l.ch}
        className="absolute font-black"
        style={{ left: `${l.x}%`, top: `${l.y}%`, fontSize: l.s, color: '#fff8d6', textShadow: GLOW, willChange: 'transform, opacity' }}
        initial={{ opacity: 0, y: 20 }}
        animate={
          eaten
            ? { opacity: [1, 1, 0], x: `${SHADOW.x - l.x}vw`, y: `${SHADOW.y - l.y}vh`, scale: 0.2, rotate: 180 }
            : still
              ? { opacity: 1, y: 0 }
              : { opacity: [0, 1, 1, 0.7, 1], y: [20, 0, -14, -6, 0] }
        }
        transition={
          eaten
            ? { duration: 1.4, delay: i * 0.05, ease: 'easeIn' }
            : { duration: 6, delay: l.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
        }
      >
        <RubyText showFurigana>{l.ch}</RubyText>
      </motion.span>
    ))}
  </div>
);

/** The town's signs: lit, or eaten to holes. */
const SIGNS: { lit: string; x: number; y: number }[] = [
  { lit: '駅(えき)', x: 14, y: 30 },
  { lit: 'やまだ', x: 62, y: 38 },
  { lit: '12:00', x: 38, y: 18 },
];

const Town = ({ eaten }: { eaten: boolean }) => (
  <div className="absolute inset-0" aria-hidden>
    <PictureBook scene="gendai_city" still />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,12,40,0.82) 0%, rgba(20,24,70,0.55) 60%, rgba(10,10,30,0.8) 100%)' }} />
    {SIGNS.map((s, i) => (
      <motion.div
        key={s.lit}
        className="absolute rounded-lg border-2 px-3 py-1 text-2xl leading-[1.5] font-black"
        style={{
          left: `${s.x}%`,
          top: `${s.y}%`,
          background: eaten ? 'rgba(20,20,30,0.85)' : 'rgba(255,248,214,0.95)',
          borderColor: eaten ? '#444' : '#ffd86a',
          color: eaten ? '#666' : '#3a2a10',
          boxShadow: eaten ? 'none' : '0 0 22px rgba(255,210,90,0.8)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 + i * 0.2 }}
      >
        {eaten ? '□□' : <RubyText showFurigana>{s.lit}</RubyText>}
      </motion.div>
    ))}
  </div>
);

const Shadow = ({ big, still }: { big: boolean; still: boolean }) => (
  <motion.div
    aria-hidden
    className="pointer-events-none absolute aspect-square w-[80vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2"
    style={{ left: `${SHADOW.x}%`, top: `${SHADOW.y}%` }}
    initial={{ scale: 0.2, opacity: 0 }}
    animate={{ scale: big ? 1 : 0.6, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 60, damping: 12 }}
  >
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{ background: 'radial-gradient(circle, #000 0%, #07051a 38%, rgba(30,10,60,0.6) 58%, transparent 72%)', willChange: 'transform' }}
      animate={still ? undefined : { scale: [1, 1.06, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Eyes: they open, then blink. */}
    {[38, 62].map((x) => (
      <motion.span
        key={x}
        className="absolute top-[42%] h-[9%] w-[12%] -translate-x-1/2 rounded-[50%]"
        style={{ left: `${x}%`, background: 'radial-gradient(ellipse, #fff7c0 0%, #ffcf3a 55%, #ff7a1a 100%)', willChange: 'transform' }}
        initial={{ scaleY: 0 }}
        animate={still ? { scaleY: 1 } : { scaleY: [0, 1, 1, 0.1, 1] }}
        transition={{ duration: 3.2, times: [0, 0.15, 0.8, 0.85, 0.9], repeat: Infinity, delay: 0.4 }}
      />
    ))}
  </motion.div>
);

const Nexmax = ({ falling, still }: { falling: boolean; still: boolean }) => (
  <>
    <motion.img
      src={assetPath(falling ? 'img/chara/cut/book.webp' : 'img/chara/cut/build.webp')}
      alt=""
      aria-hidden
      className="absolute bottom-[26%] left-[8%] h-[30dvh] w-auto"
      style={{ willChange: 'transform' }}
      initial={{ x: -120, opacity: 0 }}
      animate={
        falling
          ? { x: ['0vw', '20vw', '70vw'], y: ['0vh', '-30vh', '60vh'], rotate: [0, 200, 720], scale: [1, 0.6, 0.1], opacity: [1, 1, 0] }
          : { x: 0, opacity: 1, y: still ? 0 : [0, -6, 0] }
      }
      transition={falling ? { duration: 1.6, ease: 'easeIn' } : { x: { type: 'spring', stiffness: 120, damping: 14 }, y: { duration: 2, repeat: Infinity } }}
    />
    {falling && (
      // The falling star: a bright head and a tail, crossing once toward the airport.
      <motion.div
        aria-hidden
        className="absolute top-0 left-0 h-2 w-40 origin-right rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.8), #fff)', rotate: 35, willChange: 'transform' }}
        initial={{ x: '70vw', y: '-10vh', opacity: 0 }}
        animate={{ x: ['70vw', '10vw'], y: ['-10vh', '85vh'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.5, delay: 1.3, ease: 'easeIn' }}
      />
    )}
  </>
);

/** A hand of light writes あ: the lit letter is uncovered left to right. */
const Write = () => (
  <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
    <div className="relative text-[42vw] leading-none font-black sm:text-[200px]">
      <span style={{ color: 'rgba(255,255,255,0.08)' }}>あ</span>
      <motion.span
        className="absolute inset-0"
        style={{ color: '#fff8d6', textShadow: GLOW }}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
      >
        あ
      </motion.span>
      <motion.span
        className="absolute top-1/2 text-5xl"
        style={{ willChange: 'transform' }}
        initial={{ x: '-10%', opacity: 0 }}
        animate={{ x: ['0%', '360%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
      >
        ✍️
      </motion.span>
    </div>
  </div>
);

const Stage = ({ visual, still }: { visual: PrologueVisual; still: boolean }) => {
  switch (visual) {
    case 'letters':
      return <Letters eaten={false} still={still} />;
    case 'town':
      return (
        <>
          <Town eaten={false} />
          <Letters eaten={false} still={still} />
        </>
      );
    case 'wake':
      return (
        <>
          <Town eaten={false} />
          <Letters eaten still={still} />
          <Shadow big={false} still={still} />
        </>
      );
    case 'eaten':
      return (
        <>
          <Town eaten />
          <Shadow big still={still} />
        </>
      );
    case 'guard':
    case 'fall':
      return (
        <>
          <Shadow big still={still} />
          <Nexmax falling={visual === 'fall'} still={still} />
        </>
      );
    case 'write':
      return <Write />;
  }
};

export const PrologueScreen = () => {
  const navigate = useNavigate();
  const markSeen = useGameStore((s) => s.markTutorialSeen);
  const setLastArc = useGameStore((s) => s.setLastArc);
  const reduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(useReducedMotion() || reduced);
  const [beat, setBeat] = useState(0);
  const done = beat >= PROLOGUE.length;
  const current = PROLOGUE[Math.min(beat, PROLOGUE.length - 1)];

  useEffect(() => {
    if (current.visual === 'wake' || current.visual === 'fall') sfx.hurt();
    else if (current.visual === 'write') sfx.chime();
  }, [current.visual]);

  const go = (to: string) => {
    markSeen('prologue');
    setLastArc('moji');
    navigate(to);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #26306e 0%, #111536 55%, #05060f 100%)' }}
      onClick={() => !done && setBeat((b) => b + 1)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current.visual}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: done ? 0.35 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Stage visual={current.visual} still={still} />
        </motion.div>
      </AnimatePresence>

      {!done && (
        <button
          type="button"
          className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 z-20 rounded-full border border-white/40 bg-black/40 px-4 py-1.5 text-sm font-bold text-white"
          onClick={(e) => {
            e.stopPropagation();
            setBeat(PROLOGUE.length);
          }}
          lang="en"
        >
          Skip ▶▶
        </button>
      )}

      {/* Narration --------------------------------------------------------- */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 px-5 pt-16 pb-[max(28px,env(safe-area-inset-bottom))]"
        style={{ background: 'linear-gradient(180deg, rgba(5,6,20,0) 0%, rgba(5,6,20,0.8) 35%, rgba(5,6,20,0.92) 100%)' }}
      >
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={beat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-md"
            >
              {/* 日本語 above, English under it (2026-09-27「日本語も 表示」). */}
              <p
                className="text-center text-[19px] leading-[2.1] font-black text-[#fff8d6] rt-light"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}
                lang="ja"
              >
                <RubyText showFurigana>{current.ja}</RubyText>
              </p>
              <p
                className="mt-1 text-center text-[17px] leading-snug font-bold text-white/90"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                lang="en"
              >
                {current.text}
              </p>
              <p className="mt-3 text-center text-xs font-bold text-white/60" lang="en">
                tap to continue ▼ <span className="ml-2 tabular-nums">{beat + 1}/{PROLOGUE.length}</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto flex max-w-md flex-col gap-3"
            >
              <p className="text-center text-xl leading-[2.1] font-black text-[#fff8d6] rt-light" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }} lang="ja">
                <RubyText showFurigana>{PROLOGUE_ASK.ja}</RubyText>
              </p>
              <p
                className="-mt-2 text-center text-lg font-bold text-white/90"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
              >
                {PROLOGUE_ASK.en}
              </p>
              <p className="text-center text-3xl font-black tracking-[0.3em] text-[#fff8d6]" style={{ textShadow: GLOW }} aria-hidden>
                あいう アイウ
              </p>
              <button type="button" className="g-btn g-btn-primary w-full !flex-col !gap-0 text-lg leading-tight" onClick={() => go(PROLOGUE_EXITS.kana)}>
                <RubyText showFurigana>{PROLOGUE_ASK.kana.ja}</RubyText>
                <span className="text-xs font-bold opacity-90">{PROLOGUE_ASK.kana.en}</span>
              </button>
              <button type="button" className="g-btn g-btn-accent w-full !flex-col !gap-0 text-base leading-tight" onClick={() => go(PROLOGUE_EXITS.town)}>
                <RubyText showFurigana>{PROLOGUE_ASK.town.ja}</RubyText>
                <span className="text-xs font-bold opacity-90">{PROLOGUE_ASK.town.en}</span>
              </button>
              <button type="button" className="mx-auto text-sm font-bold text-white/70 underline" onClick={() => go('/map/moji')}>
                See the chapter map
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PrologueScreen;
