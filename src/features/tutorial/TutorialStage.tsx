import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { assetPath } from '../../lib/assetPath';
import NovelScene from '../novel/NovelScene';
import { TUTORIAL_CAST, TUTORIAL_INTRO, TUTORIAL_OUTRO } from '../../data/scripts/tutorial';

/**
 * 0話 — はじめの一歩.
 *
 * Three or four minutes whose only job is to land one idea: **writing a
 * character does something**. Not "writing earns points" — the character the
 * learner writes is the thing that moves the stone out of the road.
 *
 * Everything else the game has (the forge, gems, elements, the gacha, versus)
 * is deliberately absent here. The first build opened six systems on the
 * first clear and asked for 90 reps before any of them; this asks for three
 * reps of a one-stroke character and shows the result immediately.
 *
 * Design: docs/design/06_チュートリアルの理解設計.md
 */

const CHAR = '一';
const REPS = 3;

type Phase = 'intro' | 'write' | 'broken' | 'outro';

export const TutorialStage = () => {
  const navigate = useNavigate();
  const size = useCanvasSize(280, 0.34);
  const writerRef = useRef<KanjiWriterHandle>(null);

  const showFurigana = useGameStore((s) => s.settings.furigana);
  const recordRep = useGameStore((s) => s.recordRep);
  const markSeen = useGameStore((s) => s.markTutorialSeen);

  const [phase, setPhase] = useState<Phase>('intro');
  const [done, setDone] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  /** Only used to decide when to point at the flashing stroke hint. */
  const [, setMistakes] = useState(0);

  const kanji = getKanjiByChar(CHAR);

  useEffect(() => {
    void preloadCharData([CHAR]);
  }, []);

  /**
   * The very first attempt plays the stroke order first. A learner who has
   * never traced on a phone does not know where to start, and a blank square
   * is not a challenge at that point — it is a dead end.
   */
  useEffect(() => {
    if (phase !== 'write' || done !== 0) return;
    const t = setTimeout(() => writerRef.current?.animateStroke(), 700);
    return () => clearTimeout(t);
  }, [phase, done]);

  const handleMistake = useCallback(() => {
    setMistakes((m) => {
      const next = m + 1;
      if (next === 2) setNote('line が 光(ひか)ります。そこを なぞって。');
      return next;
    });
  }, []);

  const handleComplete = useCallback(() => {
    setMistakes(0);
    // The reps count toward the real progress record — the tutorial is part
    // of the game, not a sandbox that throws its work away.
    if (kanji) recordRep(kanji.id, 0);

    setDone((d) => {
      const next = d + 1;
      if (next >= REPS) {
        setNote(null);
        setTimeout(() => setPhase('broken'), 400);
      } else {
        setNote('そう！ その 向(む)き。');
      }
      return next;
    });
  }, [kanji, recordRep]);

  const finish = () => {
    markSeen('intro');
    navigate('/stage/mukashi-1');
  };

  if (!kanji) return null;

  // --- お話 ---------------------------------------------------------------
  if (phase === 'intro') {
    return (
      <NovelScene script={TUTORIAL_INTRO} cast={TUTORIAL_CAST} onFinish={() => setPhase('write')} />
    );
  }

  if (phase === 'outro') {
    return <NovelScene script={TUTORIAL_OUTRO} cast={TUTORIAL_CAST} onFinish={finish} />;
  }

  // --- 石が割れる ---------------------------------------------------------
  if (phase === 'broken') {
    return (
      <div className="g-stage relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <img
          src={assetPath('img/bg/mukashi_village.webp')}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          style={{ filter: 'blur(5px)', transform: 'scale(1.06)' }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* The character the learner just wrote becomes the crack itself. */}
          <div className="relative flex h-40 w-40 items-center justify-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="absolute text-8xl font-black"
              style={{ color: 'var(--color-gold)' }}
            >
              {CHAR}
            </motion.span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="absolute h-1.5 w-40 origin-center rounded-full"
              style={{ background: 'var(--color-gold)' }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="g-title text-xl"
          >
            <RubyText showFurigana={showFurigana}>石(いし)が 割(わ)れた！</RubyText>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="g-panel-solid max-w-sm p-4 text-sm"
          >
            <RubyText showFurigana={showFurigana}>
              字(じ)は 力(ちから)。書(か)ける 字(じ)が ふえると、行(い)ける ところが ふえる。
            </RubyText>
          </motion.p>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            type="button"
            className="g-btn g-btn-primary w-full max-w-sm text-lg"
            onClick={() => setPhase('outro')}
          >
            <RubyText showFurigana={showFurigana}>つぎへ</RubyText>
          </motion.button>
        </div>
      </div>
    );
  }

  // --- 書く ---------------------------------------------------------------
  const showSample = done < REPS - 1; // the last rep is from memory

  return (
    <div className="g-stage flex min-h-dvh flex-col items-center px-4 pt-4 pb-6">
      <p className="g-eyebrow">
        <RubyText showFurigana={showFurigana}>石(いし)に 字(じ)を 書(か)く</RubyText>
      </p>

      <div className="mt-2 mb-3 flex gap-2" role="img" aria-label={`${REPS}回のうち${done}回`}>
        {Array.from({ length: REPS }, (_, i) => (
          <span
            key={i}
            className="h-3 w-8 rounded-full transition-colors"
            style={{ background: i < done ? 'var(--color-gold)' : 'var(--line)' }}
          />
        ))}
      </div>

      <p className="mb-3 text-center text-sm" style={{ color: 'var(--ink-2)' }}>
        <RubyText showFurigana={showFurigana}>
          {done === 0
            ? '書(か)きじゅんを 見(み)てね。'
            : showSample
              ? '手本(てほん)の 上(うえ)を なぞって。'
              : '今度(こんど)は 手本(てほん)なしで 書(か)いてみよう。'}
        </RubyText>
      </p>

      <KanjiWriterCanvas
        ref={writerRef}
        char={CHAR}
        size={size}
        quizMode
        showSample={showSample}
        onMistake={handleMistake}
        onComplete={handleComplete}
      />

      <div className="mt-3 h-12 text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {note && (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="g-title text-base"
            >
              <RubyText showFurigana={showFurigana}>{note}</RubyText>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="g-btn g-btn-ghost mt-auto w-full max-w-sm"
        onClick={() => writerRef.current?.animateStroke()}
      >
        <RubyText showFurigana={showFurigana}>もう一度(いちど) 書(か)きじゅんを 見(み)る</RubyText>
      </button>
    </div>
  );
};

export default TutorialStage;
