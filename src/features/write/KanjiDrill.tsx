import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { REPS_TO_OBTAIN, type KanjiData } from '../../types/kanji';

/**
 * The writing drill: ten clean-enough reps and the kanji is yours to forge with.
 *
 * The verdict on each rep is stated plainly — 「かんぺき」/「できた」/「おしい」 with
 * the mistake count — because a learner who is told only "よくできたね" never finds
 * out which strokes they are getting wrong. Praise that hides the result is
 * worse than no praise.
 */

interface KanjiDrillProps {
  kanji: KanjiData;
  /** Called once the tenth rep lands. */
  onObtained?: (kanji: KanjiData) => void;
  onExit?: () => void;
}

type Verdict = { kind: 'perfect' | 'clean' | 'close'; mistakes: number } | null;

/** Reps that show the model underneath before the learner is on their own. */
const SAMPLE_REPS = 3;

const VERDICT_TEXT: Record<'perfect' | 'clean' | 'close', { head: string; next: string }> = {
  perfect: { head: '正(せい)かい — かんぺき', next: 'この ちょうしで つづけよう。' },
  clean: { head: '正(せい)かい', next: 'つぎは まちがえずに 書(か)いてみよう。' },
  // Not a pass. Say so, then say what to do about it.
  close: { head: 'まだ 正(せい)かいでは ない', next: '「書(か)きじゅん」を 見(み)てから もう一度(いちど)。' },
};

export const KanjiDrill = ({ kanji, onObtained, onExit }: KanjiDrillProps) => {
  const size = useCanvasSize(300, 0.38);
  const writerRef = useRef<KanjiWriterHandle>(null);

  const recordRep = useGameStore((s) => s.recordRep);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const reps = useGameStore((s) => s.progress[kanji.id]?.reps ?? 0);

  // The quiz canvas is deliberately blank — the learner writes from memory.
  // But on a character they have never seen, blank is not a challenge, it is
  // a dead end. So the model is shown for the first few reps and then taken
  // away: trace it, then recall it. The toggle stays available either way.
  const [sampleOverride, setSampleOverride] = useState<boolean | null>(null);
  const autoSample = reps < SAMPLE_REPS;
  const showSample = sampleOverride ?? autoSample;

  const [strokeMistakes, setStrokeMistakes] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [obtained, setObtained] = useState(false);

  const handleMistake = useCallback(() => setStrokeMistakes((m) => m + 1), []);

  const handleComplete = useCallback(
    (summary: { totalMistakes: number }) => {
      const mistakes = summary.totalMistakes;
      // Three or more slips in one character is not a pass: the rep still
      // counts as practice but does not advance the ten.
      const kind = mistakes === 0 ? 'perfect' : mistakes <= 2 ? 'clean' : 'close';
      setVerdict({ kind, mistakes });
      setStrokeMistakes(0);

      if (kind === 'close') return;

      const justObtained = recordRep(kanji.id, mistakes);
      if (justObtained) {
        setObtained(true);
        onObtained?.(kanji);
      }
    },
    [kanji, recordRep, onObtained],
  );

  const remaining = Math.max(0, REPS_TO_OBTAIN - reps);

  return (
    <div className="flex min-h-dvh flex-col items-center gap-4 px-4 pt-3 pb-6">
      {/* 見出し ---------------------------------------------------------- */}
      <header className="flex w-full max-w-md items-center justify-between">
        <button type="button" className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm" onClick={onExit}>
          もどる
        </button>
        <div className="g-chip g-chip-gold">
          <span className="tabular-nums">
            {reps} / {REPS_TO_OBTAIN}
          </span>
          <span className="text-xs">書(か)いた</span>
        </div>
      </header>

      {/* いま書く字 ------------------------------------------------------ */}
      <div className="text-center">
        <p className="g-eyebrow">この 字(じ)を {REPS_TO_OBTAIN} 回(かい) 書(か)くと 手(て)に入(はい)る</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            {`${kanji.char}(${kanji.kun[0]?.replace(/\(.*\)/, '') || kanji.on[0] || ''})`}
          </RubyText>
          <span className="ml-2 opacity-70">{kanji.meanings.join(' / ')}</span>
        </p>
      </div>

      {/* 進みぐあい: 10個の点。色だけに頼らず、数も出す。 ----------------- */}
      <div className="flex gap-1.5" role="img" aria-label={`${REPS_TO_OBTAIN}回のうち${reps}回`}>
        {Array.from({ length: REPS_TO_OBTAIN }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full transition-colors"
            style={{
              background: i < reps ? 'var(--color-gold)' : 'var(--line)',
              outline: i < reps ? '1px solid var(--color-gold-2)' : 'none',
            }}
          />
        ))}
      </div>

      {/* なぞり書き ------------------------------------------------------ */}
      <KanjiWriterCanvas
        ref={writerRef}
        char={kanji.char}
        size={size}
        quizMode
        showSample={showSample}
        onMistake={handleMistake}
        onComplete={handleComplete}
      />

      {/* 判定 ------------------------------------------------------------ */}
      <div className="h-16 w-full max-w-md">
        <AnimatePresence mode="wait">
          {verdict && (
            <motion.div
              key={`${verdict.kind}-${reps}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="g-panel px-4 py-2 text-center"
              style={{
                borderColor: verdict.kind === 'close' ? 'var(--color-danger)' : 'var(--color-success)',
              }}
              aria-live="polite"
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
          )}
        </AnimatePresence>
      </div>

      {/* 足場 — 指で隠れない位置に置く（書く面より下） -------------------- */}
      <div className="mt-auto flex w-full max-w-md gap-2">
        <button
          type="button"
          className="g-btn g-btn-ghost flex-1"
          onClick={() => writerRef.current?.animateStroke()}
        >
          書(か)きじゅんを 見(み)る
        </button>
        <button
          type="button"
          className="g-btn g-btn-ghost flex-1"
          aria-pressed={showSample}
          onClick={() => setSampleOverride(!showSample)}
        >
          手本(てほん) {showSample ? 'けす' : 'だす'}
        </button>
      </div>

      {sampleOverride === null && reps === SAMPLE_REPS && (
        <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            ここからは 手本(てほん)なしで 書(か)いてみよう。
          </RubyText>
        </p>
      )}

      {strokeMistakes > 0 && (
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          いま {strokeMistakes} かい まちがえています
        </p>
      )}

      {/* 入手 ------------------------------------------------------------ */}
      <AnimatePresence>
        {obtained && (
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
              className="g-panel-solid w-full max-w-sm px-6 py-7 text-center"
            >
              <p className="g-eyebrow">合格(ごうかく)</p>
              <p className="my-3 text-7xl font-black" style={{ color: 'var(--ink)' }}>
                {kanji.char}
              </p>
              <p className="g-title text-lg">
                <RubyText showFurigana={showFurigana}>
                  {`${kanji.char} を 手(て)に 入(い)れた！`}
                </RubyText>
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  この 字(じ)で 武器(ぶき)が 作(つく)れる。
                </RubyText>
              </p>
              <button type="button" className="g-btn g-btn-primary mt-5 w-full" onClick={onExit}>
                つぎへ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {remaining > 0 && !obtained && (
        <p className="sr-only" aria-live="polite">
          あと {remaining} 回
        </p>
      )}
    </div>
  );
};

export default KanjiDrill;
