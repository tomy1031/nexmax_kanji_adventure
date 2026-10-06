import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import * as sfx from '../../lib/sfx';
import { PROLOGUE, PROLOGUE_ASK, PROLOGUE_EXITS, PROLOGUE_PICTURE, type PrologueVisual } from '../../data/scripts/prologue';
import { useBgm } from '../../lib/bgm';
import { preloadImages } from '../../lib/preload';
import { episodeArt } from '../../data/episodeArt';
import { useStill } from '../../hooks/useStill';

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

/**
 * Where the shadow's mouth is in the painted town (prologue_eaten), in % of
 * the screen; eaten letters fly to it.
 */
const SHADOW = { x: 50, y: 22 };

const GLOW = '0 0 6px #fff3b0, 0 0 18px rgba(255,210,90,0.9)';

const Letters = ({ eaten, still, few }: { eaten: boolean; still: boolean; few?: boolean }) => (
  <div className="rt-light pointer-events-none absolute inset-0" aria-hidden>
    {(few ? LETTERS.filter((_, i) => i % 2 === 0) : LETTERS).map((l, i) => (
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
            ? { duration: 1.4, delay: 0.5 + i * 0.05, ease: 'easeIn' }
            : { duration: 6, delay: l.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
        }
      >
        <RubyText showFurigana>{l.ch}</RubyText>
      </motion.span>
    ))}
  </div>
);

/** Fetch every picture up front, so no beat waits for its own. */
const preloadPictures = () => preloadImages([...new Set(Object.values(PROLOGUE_PICTURE))]);

const Picture = ({ src, still, dim }: { src: string; still: boolean; dim: number }) => (
  <motion.div
    className="absolute inset-0"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.9 }}
  >
    <motion.img
      src={assetPath(src)}
      alt=""
      aria-hidden
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ willChange: 'transform' }}
      initial={{ scale: still ? 1 : 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 9, ease: 'easeOut' }}
    />
    <motion.div className="absolute inset-0 bg-[#05061a]" initial={false} animate={{ opacity: dim }} transition={{ duration: 0.8 }} />
  </motion.div>
);

/** Nexmax thrown across the bay: a bright streak that runs down the painted star's path. */
const Streak = () => (
  <motion.div
    aria-hidden
    className="absolute top-0 left-0 h-2 w-44 origin-right rounded-full"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.8), #fff)', rotate: 28, willChange: 'transform, opacity' }}
    initial={{ x: '-30vw', y: '4vh', opacity: 0 }}
    animate={{ x: ['-30vw', '70vw'], y: ['4vh', '22vh'], opacity: [0, 1, 1, 0] }}
    transition={{ duration: 1.4, delay: 0.4, ease: 'easeIn' }}
  />
);

/** A hand of light writes あ: the lit letter is uncovered left to right. */
const Write = () => (
  <div className="absolute inset-0 flex items-center justify-center pb-[22dvh]" aria-hidden>
    <div className="relative text-[42vw] leading-none font-black sm:text-[200px]">
      <span style={{ color: 'rgba(255,255,255,0.1)' }}>あ</span>
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

/** What moves over the picture on each beat. */
const Overlay = ({ visual, still }: { visual: PrologueVisual; still: boolean }) => {
  switch (visual) {
    case 'letters':
      return <Letters eaten={false} still={still} />;
    case 'town':
      return <Letters eaten={false} still={still} few />;
    case 'wake':
      // The town's letters are pulled up into the shadow's mouth.
      return <Letters eaten still={still} />;
    case 'fall':
      return still ? null : <Streak />;
    case 'write':
      return <Write />;
    default:
      return null;
  }
};

export const PrologueScreen = () => {

  const navigate = useNavigate();
  const markSeen = useGameStore((s) => s.markTutorialSeen);
  const setLastArc = useGameStore((s) => s.setLastArc);
  const setStartPath = useGameStore((s) => s.setStartPath);
  // Watched again from はじめから or the map: carrying on is the main way out (08 §3.8).
  const [returning] = useState(() => {
    const st = useGameStore.getState();
    return st.tutorials.prologue || st.clearedStages.length > 0;
  });
  const still = useStill();
  const [beat, setBeat] = useState(0);
  const done = beat >= PROLOGUE.length;
  const current = PROLOGUE[Math.min(beat, PROLOGUE.length - 1)];
  // The shadow's beats get the uneasy waltz; the rest, the story's music.
  useBgm(!done && ['wake', 'eaten', 'guard', 'fall'].includes(current.visual) ? 'tension' : 'story');

  useEffect(preloadPictures, []);
  // Both answers to the question at the end lead straight into an episode.
  useEffect(() => preloadImages([...episodeArt('kana-1'), ...episodeArt('moji-1-1')]), []);

  useEffect(() => {
    if (current.visual === 'wake' || current.visual === 'fall') sfx.hurt();
    else if (current.visual === 'write') sfx.chime();
  }, [current.visual]);

  const go = (to: string, path?: 'kana' | 'town') => {
    markSeen('prologue');
    setLastArc('moji');
    // つづきから follows the choice (data/mojiFlow.ts nextUp); watching again changes nothing.
    if (path) setStartPath(path);
    navigate(to);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #26306e 0%, #111536 55%, #05060f 100%)' }}
      onClick={() => !done && setBeat((b) => b + 1)}
    >
      {/* The painted picture, then what moves over it. */}
      <AnimatePresence mode="sync">
        <Picture key={PROLOGUE_PICTURE[current.visual]} src={PROLOGUE_PICTURE[current.visual]} still={still} dim={done ? 0.45 : current.visual === 'write' ? 0.35 : 0} />
      </AnimatePresence>
      <AnimatePresence mode="sync">
        {!done && (
          <motion.div
            key={current.visual}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Overlay visual={current.visual} still={still} />
          </motion.div>
        )}
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
              {returning && (
                <button type="button" className="g-btn g-btn-primary w-full text-lg" onClick={() => go('/map/moji')}>
                  <RubyText showFurigana>つづきから あそぶ</RubyText>
                </button>
              )}
              <button
                type="button"
                className={`g-btn ${returning ? 'g-btn-ghost' : 'g-btn-primary text-lg'} w-full !flex-col !gap-0 leading-tight`}
                onClick={() => go(PROLOGUE_EXITS.kana, 'kana')}
              >
                <RubyText showFurigana>{PROLOGUE_ASK.kana.ja}</RubyText>
                <span className="text-xs font-bold opacity-90">{PROLOGUE_ASK.kana.en}</span>
              </button>
              <button
                type="button"
                className={`g-btn ${returning ? 'g-btn-ghost' : 'g-btn-accent text-base'} w-full !flex-col !gap-0 leading-tight`}
                onClick={() => go(PROLOGUE_EXITS.town, 'town')}
              >
                <RubyText showFurigana>{PROLOGUE_ASK.town.ja}</RubyText>
                <span className="text-xs font-bold opacity-90">{PROLOGUE_ASK.town.en}</span>
              </button>
              {!returning && (
                <button type="button" className="rt-light mx-auto text-sm leading-[2] font-bold text-white/75 underline" onClick={() => go('/map/moji')}>
                  <RubyText showFurigana>ステージせんたくを 見(み)る</RubyText>
                  <span className="ml-2 text-xs" lang="en">See the stages</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PrologueScreen;
