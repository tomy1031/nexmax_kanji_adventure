import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NexmaxSays, TopBar } from '../../components/ui/Chrome';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useCompactHeight } from '../../hooks/useCompactHeight';
import { StarBurst } from '../../components/ui/StarBurst';
import * as sfx from '../../lib/sfx';
import { useGameStore } from '../../store/gameStore';
import { KANA_LENIENCY, KANA_REPS, KANA_SAMPLE_REPS, ROMAJI } from '../../data/kana';
import SignLight, { type SignLightHandle } from '../write/SignLight';
import { NightStreetBackdrop, SignStreet } from '../write/NightStreet';
import { TownBackdrop, TownShot } from '../write/TownBackdrop';
import { hasSign } from '../picturebook/hasSign';
import { streetOf } from '../../lib/signStreet';
import KanaText from './KanaText';
import { useKnownKana } from './useKnownKana';
import { useBgm } from '../../lib/bgm';

/**
 * かな編の 書き取り (08 §3.4). Written on the empty signboards of ナニワタウン
 * (08 §3.6), like the new route's kanji: each kana is written KANA_REPS times,
 * the first KANA_SAMPLE_REPS over the model, and every passing write lights
 * one of the three signs on its street. The same pass rule as kanji — three
 * or more slips and the sign does not light.
 *
 * Everything the learner reads here is kana with romaji on top, plus one
 * line of English: they cannot read the instructions yet.
 */

interface KanaDrillProps {
  /** The kana to write, in order. Ones already known are skipped. */
  kana: string[];
  onDone: () => void;
  onExit: () => void;
  /** The episode's town behind the drill, and where a kana that came back lights up (see KanjiDrill). */
  scene?: string;
}

type Verdict = { pass: boolean; mistakes: number } | null;

export const KanaDrill = ({ kana, onDone, onExit, scene }: KanaDrillProps) => {
  useBgm('story');
  // A short screen (a phone browser's bars): the signs move up beside the
  // kana and the page packs tighter, so nothing scrolls (see KanjiDrill).
  const compact = useCompactHeight();
  const size = useCanvasSize(300, compact ? 1 : 0.4, 88, compact ? 290 : 0);
  const slashRef = useRef<SignLightHandle>(null);
  const known = useKnownKana();
  const recordKanaRep = useGameStore((s) => s.recordKanaRep);
  const counts = useGameStore((s) => s.kana);

  // Fixed on arrival, so a kana that becomes known mid-drill is not dropped.
  const [queue] = useState(() => kana.filter((k) => (counts[k] ?? 0) < KANA_REPS));
  const [idx, setIdx] = useState(0);
  /** Which sign this is — a new one after each write that passes. */
  const [signNo, setSignNo] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [sampleOverride, setSampleOverride] = useState<boolean | null>(null);
  /** The kana that just came back, shown for a moment before the next. */
  const [returned, setReturned] = useState<string | null>(null);
  const finished = useRef(false);

  const current = queue[idx];
  const reps = current ? (counts[current] ?? 0) : 0;
  const showSample = sampleOverride ?? reps < KANA_SAMPLE_REPS;

  const handleWritten = useCallback(
    ({ totalMistakes }: { totalMistakes: number }) => {
      const pass = totalMistakes <= 2;
      setVerdict({ pass, mistakes: totalMistakes });
      if (pass) recordKanaRep(current);
      return pass;
    },
    [current, recordKanaRep],
  );

  /** Each write that lights the sign sends a glow over the town. */
  const [pulse, setPulse] = useState(0);
  /** A kana just came back: its sign in the town lights up before the card. */
  const [shot, setShot] = useState<string | null>(null);
  const endShot = useCallback(() => {
    setReturned(shot);
    setShot(null);
  }, [shot]);

  const handleLit = useCallback(() => {
    setPulse((p) => p + 1);
    setSampleOverride(null);
    setVerdict(null);
    if ((useGameStore.getState().kana[current] ?? 0) >= KANA_REPS) {
      sfx.star(0);
      // The town first, its sign lighting up — then the card.
      if (hasSign(scene, current)) setShot(current);
      else setReturned(current);
      return;
    }
    setSignNo((n) => n + 1);
  }, [current, scene]);

  const next = () => {
    setReturned(null);
    if (idx + 1 >= queue.length) {
      if (!finished.current) {
        finished.current = true;
        onDone();
      }
      return;
    }
    setIdx((i) => i + 1);
    setSignNo(0);
  };

  if (!current) {
    // Everything here is already known (a replay): nothing to write.
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <button type="button" className="g-btn g-btn-primary w-full max-w-sm text-lg" onClick={onDone}>
          <KanaText known={known}>つぎへ</KanaText>
        </button>
      </div>
    );
  }

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-[max(20px,env(safe-area-inset-bottom))]">
      {scene ? <TownBackdrop scene={scene} letters={kana} pulse={pulse} /> : <NightStreetBackdrop />}
      <AnimatePresence>{shot && scene && <TownShot scene={scene} char={shot} onDone={endShot} />}</AnimatePresence>
      <TopBar onBack={onExit} />

      <div className={`flex w-full max-w-md flex-1 flex-col px-3 ${compact ? 'gap-2 pt-2' : 'gap-3 pt-3'}`}>
        <div className="flex items-end justify-between gap-2">
          <div className={`g-parchment flex flex-1 items-center gap-4 px-4 ${compact ? 'py-1' : 'py-2.5'}`}>
            <span className={`leading-[1.2] font-black ${compact ? 'text-[42px]' : 'text-[52px]'}`}>{current}</span>
            <div className="text-sm leading-relaxed">
              <p className="text-2xl font-black" style={{ color: '#1b63b0' }} lang="en">
                {ROMAJI[current]}
              </p>
              <p style={{ color: 'var(--ink-2)' }}>
                {idx + 1} / {queue.length}
              </p>
            </div>
          </div>
          {compact ? (
            <div className="g-parchment flex shrink-0 items-center px-2 py-1.5">
              <SignStreet small street={streetOf(reps, [KANA_REPS])} glyph={current} label={`${KANA_REPS} signs, ${Math.min(reps, KANA_REPS)} lit`} />
            </div>
          ) : (
            <NexmaxSays text="かくと ひかる！" size={70} />
          )}
        </div>

        {/* Shifted left by half the side buttons' overhang (see KanjiDrill). */}
        <div
          className="relative -left-4 mx-auto flex items-center justify-center rounded-[22px] p-3"
          style={{
            background: 'linear-gradient(180deg, #c7964a 0%, #7a5220 100%)',
            border: '3px solid #4a3210',
            boxShadow: 'inset 0 2px 0 rgba(255,230,170,0.45), 0 10px 22px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="relative rounded-2xl"
            style={{ background: 'radial-gradient(ellipse at 50% 35%, #2f2860 0%, #17132f 70%, #0e0b22 100%)' }}
          >
            <SignLight
              key={`${current}-${signNo}`}
              ref={slashRef}
              char={current}
              material={current}
              size={size}
              seed={signNo + idx}
              showSample={showSample}
              onWritten={handleWritten}
              onLit={handleLit}
              leniency={KANA_LENIENCY}
            />
          </div>
          <div className="absolute top-3 -right-1 flex translate-x-1/2 flex-col gap-2">
            <button
              type="button"
              aria-label="stroke order"
              className="g-parchment flex h-14 w-14 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={() => slashRef.current?.animateStroke()}
            >
              <span aria-hidden className="text-lg">
                ✎
              </span>
              <KanaText known={known}>かきじゅん</KanaText>
            </button>
            <button
              type="button"
              aria-pressed={showSample}
              aria-label="model"
              className="g-parchment flex h-14 w-14 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={() => setSampleOverride(!showSample)}
            >
              <span aria-hidden className="text-lg">
                {showSample ? '◐' : '○'}
              </span>
              <KanaText known={known}>てほん</KanaText>
            </button>
          </div>
        </div>

        {/* One box that stays put (see KanjiDrill): no swap between two boxes. */}
        <div
          className={`g-parchment flex flex-col items-center justify-center px-4 text-center ${compact ? 'h-[56px]' : 'h-[64px]'}`}
          style={{ borderColor: verdict ? (verdict.pass ? 'var(--color-success)' : 'var(--color-danger)') : undefined }}
          aria-live="polite"
        >
          {verdict ? (
            <>
              <p className="g-title text-base">
                <KanaText known={known}>{verdict.pass ? 'せいかい' : 'まだ せいかいでは ない'}</KanaText>
              </p>
              <p className="text-xs font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
                {verdict.pass
                  ? 'Correct — the sign lights up.'
                  : `${verdict.mistakes} mistakes. Watch the stroke order (✎) and try again.`}
              </p>
            </>
          ) : (
            <p className="text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
              <KanaText known={known}>{showSample ? 'てほんを なぞって ください' : 'てほん なしで かいて ください'}</KanaText>
              <span className="block text-xs" lang="en">
                {showSample ? 'Trace the model.' : 'Now write it without the model.'}
              </span>
            </p>
          )}
        </div>

        {!compact && (
          <div className="g-parchment mt-auto px-3 py-2.5">
            <SignStreet
              street={streetOf(reps, [KANA_REPS])}
              glyph={current}
              label={`${KANA_REPS} signs, ${Math.min(reps, KANA_REPS)} lit`}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {returned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6"
          >
            <motion.div
              initial={{ scale: 0.86, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              className="g-parchment w-full max-w-sm px-6 py-6 text-center"
            >
              {/* The letter came back: the same burst of stars as a kanji's ★. */}
              <div className="relative">
                <StarBurst />
              </div>
              <motion.div
                initial={{ rotate: -8, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="mx-auto flex h-36 w-32 items-center justify-center rounded-2xl text-[72px] font-black"
                style={{
                  background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)',
                  border: '4px solid #4f9a3c',
                  boxShadow: '0 0 30px rgba(255,210,90,0.9)',
                }}
              >
                {returned}
              </motion.div>
              <p className="g-title mt-4 text-lg">
                <KanaText known={known}>{`「${returned}」が もどった！`}</KanaText>
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
                “{returned}” ({ROMAJI[returned]}) is back. It no longer needs romaji.
              </p>
              <button type="button" className="g-btn g-btn-primary mt-5 w-full text-lg" onClick={next}>
                <KanaText known={known}>つぎへ</KanaText>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanaDrill;
