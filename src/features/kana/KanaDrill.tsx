import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { NexmaxSays, TopBar } from '../../components/ui/Chrome';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { KANA_LENIENCY, KANA_REPS, KANA_SAMPLE_REPS, ROMAJI } from '../../data/kana';
import RockSlash, { type RockSlashHandle } from '../write/RockSlash';
import KanaText from './KanaText';
import { useKnownKana } from './useKnownKana';

/**
 * かな編の 書き取り (08 §3.4). The kanji drill's rock and blade, for kana:
 * each kana is written KANA_REPS times, the first KANA_SAMPLE_REPS over the
 * model. The same pass rule as kanji — three or more slips and the rock
 * holds.
 *
 * Everything the learner reads here is kana with romaji on top, plus one
 * line of English: they cannot read the instructions yet.
 */

interface KanaDrillProps {
  /** The kana to write, in order. Ones already known are skipped. */
  kana: string[];
  onDone: () => void;
  onExit: () => void;
}

type Verdict = { pass: boolean; mistakes: number } | null;

export const KanaDrill = ({ kana, onDone, onExit }: KanaDrillProps) => {
  const size = useCanvasSize(300, 0.4, 72);
  const slashRef = useRef<RockSlashHandle>(null);
  const known = useKnownKana();
  const recordKanaRep = useGameStore((s) => s.recordKanaRep);
  const counts = useGameStore((s) => s.kana);

  // Fixed on arrival, so a kana that becomes known mid-drill is not dropped.
  const [queue] = useState(() => kana.filter((k) => (counts[k] ?? 0) < KANA_REPS));
  const [idx, setIdx] = useState(0);
  const [rockNo, setRockNo] = useState(0);
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

  const handleSplit = useCallback(() => {
    setSampleOverride(null);
    setVerdict(null);
    if ((useGameStore.getState().kana[current] ?? 0) >= KANA_REPS) {
      setReturned(current);
      return;
    }
    setRockNo((n) => n + 1);
  }, [current]);

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
    setRockNo(0);
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
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-5">
      <PictureBook scene="mukashi_meadow" className="!fixed -z-10" still />
      <TopBar onBack={onExit} />

      <div className="flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3">
        <div className="flex items-end justify-between gap-2">
          <div className="g-parchment flex flex-1 items-center gap-4 px-4 py-2.5">
            <span className="text-[52px] leading-[1.2] font-black">{current}</span>
            <div className="text-sm leading-relaxed">
              <p className="text-2xl font-black" style={{ color: '#1b63b0' }} lang="en">
                {ROMAJI[current]}
              </p>
              <p style={{ color: 'var(--ink-2)' }}>
                {idx + 1} / {queue.length}
              </p>
            </div>
          </div>
          <NexmaxSays text="かいて いわを きろう！" size={70} />
        </div>

        <div
          className="relative mx-auto flex items-center justify-center rounded-[22px] p-3"
          style={{
            background: 'linear-gradient(180deg, #a8703a 0%, #7d4b1c 100%)',
            border: '3px solid #5b3412',
            boxShadow: 'inset 0 2px 0 rgba(255,220,170,0.35), 0 10px 22px rgba(40,20,0,0.35)',
          }}
        >
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ background: 'radial-gradient(ellipse at 50% 90%, #9ccf6a 0%, #cfeaf5 60%, #e8f6fb 100%)' }}
          >
            <RockSlash
              key={`${current}-${rockNo}`}
              ref={slashRef}
              char={current}
              material={current}
              size={size}
              seed={rockNo + idx * 7}
              showSample={showSample}
              onWritten={handleWritten}
              onSplit={handleSplit}
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

        <div className="min-h-[64px] text-center" aria-live="polite">
          {verdict ? (
            <div
              className="g-parchment px-4 py-1.5"
              style={{ borderColor: verdict.pass ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              <p className="g-title text-base">
                <KanaText known={known}>{verdict.pass ? 'せいかい' : 'まだ せいかいでは ない'}</KanaText>
              </p>
              <p className="text-xs font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
                {verdict.pass
                  ? 'Correct — the rock splits.'
                  : `${verdict.mistakes} mistakes. Watch the stroke order (✎) and try again.`}
              </p>
            </div>
          ) : (
            <p className="g-parchment px-4 py-1.5 text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
              <KanaText known={known}>{showSample ? 'てほんを なぞろう' : 'てほん なしで かこう'}</KanaText>
              <span className="block text-xs" lang="en">
                {showSample ? 'Trace the model.' : 'Now write it without the model.'}
              </span>
            </p>
          )}
        </div>

        <div className="g-parchment mt-auto flex items-center justify-center gap-2 px-3 py-2.5">
          {Array.from({ length: KANA_REPS }, (_, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={i < reps ? { scale: [1.3, 1] } : { scale: 1 }}
              className="flex h-12 w-10 items-center justify-center rounded-md border text-2xl font-black"
              style={{
                background: i < reps ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.55)',
                borderColor: i < reps ? '#f2b53a' : 'rgba(122,82,38,0.25)',
                color: i < reps ? '#4a3220' : 'rgba(122,82,38,0.3)',
              }}
            >
              {i < reps ? current : '・'}
            </motion.span>
          ))}
        </div>
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
