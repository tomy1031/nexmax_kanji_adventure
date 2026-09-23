import { useCallback, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import PictureBook from '../picturebook/PictureBook';
import { KanjiWord, Readings } from '../../components/ui/Readings';
import { NexmaxSays, TopBar } from '../../components/ui/Chrome';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { kanjiRuby } from '../../lib/reading';
import { REPS_TO_OBTAIN, type KanjiData } from '../../types/kanji';
import RockSlash, { type RockSlashHandle } from './RockSlash';

/**
 * The writing drill: write the character, and it cuts a rock. Each rock
 * that splits gives one piece of kanji material; ten pieces and the kanji is
 * yours to forge with.
 *
 * The verdict on each rep is stated plainly — 「かんぺき」/「正かい」/「まだ 正かいでは
 * ない」 with the mistake count — because a learner who is told only
 * "よくできたね" never finds out which strokes they are getting wrong. Praise that
 * hides the result is worse than no praise.
 *
 * Layout follows public/img/design/森の漢字アドベンチャー_ui.png.
 */

interface KanjiDrillProps {
  kanji: KanjiData;
  /** Called once the tenth rep lands. */
  onObtained?: (kanji: KanjiData) => void;
  /** もどる. */
  onExit?: () => void;
  /** The button on the "obtained" card. Defaults to onExit. */
  onDone?: () => void;
  /** Label for the button on the "obtained" card. */
  nextLabel?: string;
  /** Rendered under the material slots (e.g. a way on for a replay). */
  extra?: ReactNode;
}

type Verdict = { kind: 'perfect' | 'clean' | 'close'; mistakes: number } | null;

/** Reps that show the model underneath before the learner is on their own. */
const SAMPLE_REPS = 3;

const VERDICT_TEXT: Record<'perfect' | 'clean' | 'close', { head: string; next: string }> = {
  perfect: { head: '正(せい)かい — かんぺき', next: '岩(いわ)が 割(わ)れた。この ちょうしで つづけよう。' },
  clean: { head: '正(せい)かい', next: '岩(いわ)が 割(わ)れた。つぎは まちがえずに 書(か)いてみよう。' },
  // Not a pass. Say so, then say what to do about it.
  close: { head: 'まだ 正(せい)かいでは ない', next: '岩(いわ)は 割(わ)れない。「書(か)きじゅん」を 見(み)てから もう一度(いちど)。' },
};

export const KanjiDrill = ({ kanji, onObtained, onExit, onDone, nextLabel = 'つぎへ', extra }: KanjiDrillProps) => {
  const size = useCanvasSize(300, 0.4, 72);
  const slashRef = useRef<RockSlashHandle>(null);

  const recordRep = useGameStore((s) => s.recordRep);
  const recordReview = useGameStore((s) => s.recordReview);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const reps = useGameStore((s) => s.progress[kanji.id]?.reps ?? 0);

  // The canvas starts blank on purpose — the learner writes from memory. But
  // on a character they have never seen, blank is a dead end, so the model is
  // shown for the first few reps and then taken away: trace it, then recall
  // it. The toggle stays available either way.
  const [sampleOverride, setSampleOverride] = useState<boolean | null>(null);
  const autoSample = reps < SAMPLE_REPS;
  const showSample = sampleOverride ?? autoSample;

  const [strokeMistakes, setStrokeMistakes] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [obtained, setObtained] = useState(false);
  /**
   * A kanji already owned is not collected again. Writing it is a review:
   * the first pass is recorded as one (and says so), and the rocks after
   * that are free practice that touches nothing — no ink, no daily count,
   * no change to the review schedule.
   */
  const [ownedAtStart] = useState(() => reps >= REPS_TO_OBTAIN);
  const [reviewed, setReviewed] = useState<'no' | 'card' | 'done'>('no');
  /** Which rock this is — a new one rolls in after each split. */
  const [rockNo, setRockNo] = useState(0);
  const pendingObtained = useRef(false);

  const ruby = kanjiRuby(kanji);

  const handleMistake = useCallback(() => setStrokeMistakes((m) => m + 1), []);

  const handleWritten = useCallback(
    (summary: { totalMistakes: number }) => {
      const mistakes = summary.totalMistakes;
      // Three or more slips in one character is not a pass: the rock holds,
      // and the rep does not advance the ten.
      const kind = mistakes === 0 ? 'perfect' : mistakes <= 2 ? 'clean' : 'close';
      setVerdict({ kind, mistakes });
      setStrokeMistakes(0);
      if (kind === 'close') return false;

      if (ownedAtStart) {
        if (reviewed === 'no') {
          recordReview(kanji.id, mistakes);
          setReviewed('card');
        }
        return true;
      }
      pendingObtained.current = recordRep(kanji.id, mistakes);
      return true;
    },
    [kanji, recordRep, recordReview, ownedAtStart, reviewed],
  );

  const handleSplit = useCallback(() => {
    if (pendingObtained.current) {
      pendingObtained.current = false;
      setObtained(true);
      onObtained?.(kanji);
      return;
    }
    setRockNo((n) => n + 1);
  }, [kanji, onObtained]);

  const done = Math.min(reps, REPS_TO_OBTAIN);

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-5">
      <PictureBook scene="mukashi_meadow" className="!fixed -z-10" />
      <TopBar onBack={onExit} />

      <div className="flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3">
        {/* いま書く字 ---------------------------------------------------- */}
        <div className="flex items-end justify-between gap-2">
          <div className="g-parchment flex flex-1 items-center gap-3 px-4 py-2.5">
            <span className="text-[44px] leading-[1.5] font-black">
              <KanjiWord kanji={kanji} showFurigana={showFurigana} />
            </span>
            <div className="min-w-0 text-sm leading-relaxed">
              <Readings kanji={kanji} size="sm" />
              <p className="truncate" style={{ color: 'var(--ink-2)' }}>
                meaning: <b>{kanji.meanings.slice(0, 2).join(' / ')}</b>
              </p>
            </div>
          </div>
          <NexmaxSays text="書(か)いて 岩(いわ)を 切(き)ろう！" size={70} />
        </div>

        {/* 岩と 書く面（木のわく） --------------------------------------- */}
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
              key={`${kanji.id}-${rockNo}`}
              ref={slashRef}
              char={kanji.char}
              material={ruby}
              size={size}
              seed={rockNo + kanji.strokes * 7}
              showSample={showSample}
              onMistake={handleMistake}
              onWritten={handleWritten}
              onSplit={handleSplit}
            />
          </div>

          {/* 足場 — 書く面の 横に 置く（指で 隠れない） ------------------- */}
          <div className="absolute top-3 -right-1 flex translate-x-1/2 flex-col gap-2">
            <button
              type="button"
              className="g-parchment flex h-14 w-14 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={() => slashRef.current?.animateStroke()}
            >
              <span aria-hidden className="text-lg">
                ✎
              </span>
              <RubyText showFurigana={showFurigana}>書(か)きじゅん</RubyText>
            </button>
            <button
              type="button"
              aria-pressed={showSample}
              className="g-parchment flex h-14 w-14 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={() => setSampleOverride(!showSample)}
            >
              <span aria-hidden className="text-lg">
                {showSample ? '◐' : '○'}
              </span>
              <RubyText showFurigana={showFurigana}>{showSample ? '手本(てほん) けす' : '手本(てほん) だす'}</RubyText>
            </button>
          </div>
        </div>

        {/* 判定 ------------------------------------------------------------ */}
        <div className="min-h-[64px]" aria-live="polite">
          <AnimatePresence mode="wait">
            {verdict ? (
              <motion.div
                key={`${verdict.kind}-${reps}-${rockNo}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="g-parchment px-4 py-1.5 text-center"
                style={{ borderColor: verdict.kind === 'close' ? 'var(--color-danger)' : 'var(--color-success)' }}
              >
                <p className="g-title text-base">
                  <RubyText showFurigana={showFurigana}>{VERDICT_TEXT[verdict.kind].head}</RubyText>
                  {verdict.mistakes > 0 && (
                    <span className="ml-2 text-sm font-normal" style={{ color: 'var(--ink-2)' }}>
                      まちがえた ところ {verdict.mistakes}
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>{VERDICT_TEXT[verdict.kind].next}</RubyText>
                </p>
              </motion.div>
            ) : (
              <motion.p key="hint" className="text-center text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  {reps === 0
                    ? '手本(てほん)の 上(うえ)を なぞると、線(せん)が 刀(かたな)に なる。'
                    : sampleOverride === null && reps === SAMPLE_REPS
                      ? 'ここからは 手本(てほん)なしで 書(か)いてみよう。'
                      : strokeMistakes > 0
                        ? `いま ${strokeMistakes} かい まちがえています`
                        : '書(か)ききると 岩(いわ)が 割(わ)れる。'}
                </RubyText>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 集めた かけら ------------------------------------------------ */}
        <div className="g-parchment mt-auto px-3 py-2.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-black">
              <span aria-hidden>🍃 </span>
              <RubyText showFurigana={showFurigana}>集(あつ)めた かけら</RubyText>
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full border border-[#8fb7d8] bg-[#e3f1fb]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7ed36b, #3e9b3a)' }}
                animate={{ width: `${(done / REPS_TO_OBTAIN) * 100}%` }}
              />
            </div>
            <span className="text-lg font-black tabular-nums" style={{ color: '#1b4f8a' }}>
              {done}
              <span className="text-sm">/{REPS_TO_OBTAIN}</span>
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1" role="img" aria-label={`${REPS_TO_OBTAIN}こ のうち ${done}こ`}>
            {Array.from({ length: REPS_TO_OBTAIN }, (_, i) => {
              const got = i < done;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={got ? { scale: [1.3, 1] } : { scale: 1 }}
                  className="relative flex aspect-[3/4] flex-col items-center justify-end rounded-md border pb-0.5 text-[15px] leading-none font-black"
                  style={{
                    background: got ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.55)',
                    borderColor: got ? '#f2b53a' : 'rgba(122,82,38,0.25)',
                    color: got ? '#4a3220' : 'rgba(122,82,38,0.3)',
                  }}
                >
                  {got ? <KanjiWord kanji={kanji} showFurigana={showFurigana} /> : <span className="mb-1 text-xs">♛</span>}
                </motion.div>
              );
            })}
          </div>
        </div>
        {extra}
      </div>

      {/* 入手 ------------------------------------------------------------ */}
      <AnimatePresence>
        {(obtained || reviewed === 'card') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6"
          >
            <motion.div
              initial={{ scale: 0.86, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="g-parchment w-full max-w-sm px-6 py-6 text-center"
            >
              <div className="g-btn-red mx-auto -mt-10 mb-3 inline-block rounded-xl px-4 py-1 text-sm font-black">
                <RubyText showFurigana={showFurigana}>{obtained ? '10こ 集(あつ)まった！' : 'ふくしゅう できた'}</RubyText>
              </div>
              <motion.div
                initial={{ rotate: -8, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="mx-auto flex h-40 w-32 flex-col items-center justify-center rounded-2xl text-[64px] leading-[1.4] font-black"
                style={{
                  background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)',
                  border: '4px solid #4f9a3c',
                  boxShadow: '0 0 30px rgba(255,210,90,0.9)',
                }}
              >
                <KanjiWord kanji={kanji} />
              </motion.div>
              <p className="g-title mt-4 text-lg">
                <RubyText showFurigana={showFurigana}>
                  {obtained ? `「${ruby}」を 手(て)に 入(い)れた！` : `「${ruby}」は もう 持(も)っている。`}
                </RubyText>
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  {obtained
                    ? 'この 字(じ)で 武器(ぶき)が 作(つく)れる。'
                    : 'ふくしゅうとして 1回(かい) 記録(きろく)した。さびた 武器(ぶき)も 直(なお)る。'}
                </RubyText>
              </p>
              <button type="button" className="g-btn g-btn-primary mt-5 w-full text-lg" onClick={onDone ?? onExit}>
                <RubyText showFurigana={showFurigana}>{nextLabel}</RubyText>
              </button>
              {!obtained && (
                <button
                  type="button"
                  className="g-btn g-btn-accent mt-2 w-full"
                  onClick={() => {
                    setReviewed('done');
                    setRockNo((n) => n + 1);
                  }}
                >
                  <RubyText showFurigana={showFurigana}>もっと 書(か)く（記録(きろく)しない）</RubyText>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanjiDrill;
